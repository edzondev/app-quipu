package expo.modules.quipunotificationlistener

import android.util.Log
import java.io.BufferedInputStream
import java.io.BufferedOutputStream
import java.io.DataInputStream
import java.io.DataOutputStream
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.io.IOException
import java.util.concurrent.CountDownLatch
import java.util.concurrent.Executor
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean

/** Chosen bank packages and seen notice ids. Notification title and text are not stored. */
internal class NotificationStore(
  private val file: File,
  private val io: Executor = defaultExecutor(),
  private val onError: (phase: String, error: Exception) -> Unit = { _, _ -> },
) {
  private val lock = Any()
  private val readyLatch = CountDownLatch(1)
  private val saveQueued = AtomicBoolean(false)

  @Volatile
  private var ready = false

  @Volatile
  private var sources: Set<String> = emptySet()

  private val recentOrder = ArrayDeque<String>()
  private val recentSet = HashSet<String>()
  private var paused = false
  private val preload = ArrayDeque<Command>()
  private var startRequested = false

  private var filteredOut: Long = 0
  private var matched: Long = 0
  private var deduped: Long = 0

  fun start() {
    synchronized(lock) {
      if (startRequested) return
      startRequested = true
    }
    io.execute {
      try {
        loadAndMerge()
      } catch (e: Exception) {
        onError("load", e)
        synchronized(lock) {
          ready = true
        }
      } finally {
        readyLatch.countDown()
      }
    }
  }

  fun awaitReady() {
    readyLatch.await(READY_TIMEOUT_SECONDS, TimeUnit.SECONDS)
  }

  fun isReady(): Boolean = ready

  fun noteFiltered() {
    synchronized(lock) {
      filteredOut += 1
    }
  }

  fun addSource(packageName: String): Boolean {
    if (!isValidPackageName(packageName)) return false
    var saved = false
    val accepted = synchronized(lock) {
      if (!ready) {
        preload.addLast(Command.Add(packageName))
        return true
      }
      val already = packageName in sources
      saved = applyAdd(packageName)
      already || saved
    }
    if (saved) scheduleSave()
    return accepted
  }

  fun removeSource(packageName: String): Boolean {
    val removed = synchronized(lock) {
      if (!ready) {
        preload.addLast(Command.Remove(packageName))
        return true
      }
      applyRemove(packageName)
    }
    if (removed) scheduleSave()
    return removed
  }

  fun sources(): List<String> {
    return synchronized(lock) { sources.toList().sorted() }
  }

  /** First time this notice id is seen for a bank that is still chosen, remember it. */
  fun claim(id: String, packageName: String): Boolean {
    if (id.isEmpty()) return false
    synchronized(lock) {
      if (paused || packageName !in sources) return false
      if (!remember(id)) {
        deduped += 1
        return false
      }
      matched += 1
    }
    scheduleSave()
    return true
  }

  fun diagnostics(): StoreDiagnostics {
    return synchronized(lock) {
      StoreDiagnostics(
        loaded = ready,
        sourceCount = sources.size,
        recentIdCount = recentSet.size,
        filteredOut = filteredOut,
        matched = matched,
        deduped = deduped,
      )
    }
  }

  fun isPaused(): Boolean = synchronized(lock) { paused }

  /** Persists whether detection is paused. Chosen banks stay. */
  fun setPaused(value: Boolean) {
    synchronized(lock) {
      if (!ready) return
      paused = value
    }
    scheduleSave()
  }

  /** Drops chosen banks and seen notice ids. Detection stays on for the next user. */
  fun clear() {
    synchronized(lock) {
      if (!ready) return
      sources = emptySet()
      recentOrder.clear()
      recentSet.clear()
      paused = false
    }
    scheduleSave()
  }

  /** Waits until previously scheduled disk writes have finished. */
  fun flush() {
    val done = CountDownLatch(1)
    io.execute { done.countDown() }
    done.await(READY_TIMEOUT_SECONDS, TimeUnit.SECONDS)
  }

  private fun loadAndMerge() {
    val loaded = readSnapshot(file, onError)
    var dirty = loaded.rewrite
    synchronized(lock) {
      sources = loaded.snapshot.sources.toSet()
      paused = loaded.snapshot.paused
      recentOrder.clear()
      recentSet.clear()
      for (id in loaded.snapshot.recentIds) {
        remember(id)
      }
      while (preload.isNotEmpty()) {
        when (val command = preload.removeFirst()) {
          is Command.Add -> if (applyAdd(command.packageName)) dirty = true
          is Command.Remove -> if (applyRemove(command.packageName)) dirty = true
        }
      }
      ready = true
    }
    if (dirty) scheduleSave()
  }

  private fun applyAdd(packageName: String): Boolean {
    if (!isValidPackageName(packageName)) return false
    if (packageName in sources) return false
    if (sources.size >= MAX_SOURCES) return false
    sources = sources + packageName
    return true
  }

  private fun applyRemove(packageName: String): Boolean {
    if (packageName !in sources) return false
    sources = sources - packageName
    return true
  }

  private fun remember(id: String): Boolean {
    if (!recentSet.add(id)) return false
    recentOrder.addLast(id)
    while (recentOrder.size > MAX_RECENT) {
      val oldest = recentOrder.removeFirst()
      recentSet.remove(oldest)
    }
    return true
  }

  private fun scheduleSave() {
    if (!saveQueued.compareAndSet(false, true)) return
    io.execute {
      saveQueued.set(false)
      val snapshot = synchronized(lock) { snapshot() }
      writeAtomically(file, snapshot, onError)
    }
  }

  private fun snapshot(): Snapshot {
    return Snapshot(
      sources = sources.toList().sorted(),
      recentIds = recentOrder.toList(),
      paused = paused,
    )
  }

  companion object {
    const val MAX_RECENT = 256
    const val MAX_SOURCES = 20
    private const val READY_TIMEOUT_SECONDS = 5L
    private const val DIRECTORY = "quipu-notification-listener"
    private const val FILE_NAME = "state.bin"
    private const val TAG = "QuipuNotificationListener"

    private val gate = Any()

    @Volatile
    private var shared: NotificationStore? = null

    fun shared(baseDir: File): NotificationStore {
      shared?.let { return it }
      return synchronized(gate) {
        shared ?: NotificationStore(
          File(File(baseDir, DIRECTORY), FILE_NAME),
          onError = ::logFailure,
        ).also { shared = it }
      }
    }

    fun defaultExecutor(): Executor {
      return Executors.newSingleThreadExecutor { runnable ->
        Thread(runnable, "quipu-notification-listener").apply { isDaemon = true }
      }
    }

    fun isValidPackageName(packageName: String): Boolean = PackageIds.isValid(packageName)

    /** Logs the phase and the exception class only. Never message text or notification content. */
    private fun logFailure(phase: String, error: Exception) {
      Log.w(TAG, "$phase failed: ${error.javaClass.simpleName}")
    }
  }
}

internal data class StoreDiagnostics(
  val loaded: Boolean,
  val sourceCount: Int,
  val recentIdCount: Int,
  val filteredOut: Long,
  val matched: Long,
  val deduped: Long,
)

private sealed interface Command {
  data class Add(val packageName: String) : Command
  data class Remove(val packageName: String) : Command
}

private data class Snapshot(
  val sources: List<String>,
  val recentIds: List<String>,
  val paused: Boolean,
) {
  companion object {
    fun empty() = Snapshot(emptyList(), emptyList(), false)
  }
}

private class LoadedFile(val snapshot: Snapshot, val rewrite: Boolean)

private const val MAGIC = 0x51504E31
private const val VERSION = 3
private const val VERSION_WITHOUT_PAUSE = 2
private const val MAX_STORED_SOURCES = NotificationStore.MAX_SOURCES
private const val MAX_STORED_RECENT = NotificationStore.MAX_RECENT

private fun readSnapshot(file: File, onError: (String, Exception) -> Unit): LoadedFile {
  if (!file.isFile) return LoadedFile(Snapshot.empty(), false)
  return try {
    DataInputStream(BufferedInputStream(FileInputStream(file))).use { input ->
      val magic = input.readInt()
      val version = input.readInt()
      if (magic != MAGIC || (version != VERSION && version != VERSION_WITHOUT_PAUSE)) {
        return LoadedFile(Snapshot.empty(), true)
      }
      val sources = readStrings(input, MAX_STORED_SOURCES)
      val recentIds = readStrings(input, MAX_STORED_RECENT)
      val paused = if (version == VERSION) input.readBoolean() else false
      LoadedFile(Snapshot(sources, recentIds, paused), false)
    }
  } catch (e: Exception) {
    onError("read", e)
    LoadedFile(Snapshot.empty(), false)
  }
}

private fun readStrings(input: DataInputStream, max: Int): List<String> {
  val count = readCount(input, max)
  val values = ArrayList<String>(count)
  repeat(count) {
    val value = input.readUTF()
    if (value.isNotEmpty()) values.add(value)
  }
  return values
}

private fun readCount(input: DataInputStream, max: Int): Int {
  val count = input.readInt()
  if (count !in 0..max) throw IOException("count out of range")
  return count
}

private fun writeAtomically(
  file: File,
  snapshot: Snapshot,
  onError: (String, Exception) -> Unit,
) {
  val parent = file.parentFile ?: return
  if (!parent.exists() && !parent.mkdirs()) {
    onError("write", IOException("cannot create state directory"))
    return
  }
  val tmp = File(parent, file.name + ".tmp")
  try {
    FileOutputStream(tmp).use { output ->
      val buffered = BufferedOutputStream(output)
      val data = DataOutputStream(buffered)
      try {
        data.writeInt(MAGIC)
        data.writeInt(VERSION)
        writeStrings(data, snapshot.sources)
        writeStrings(data, snapshot.recentIds)
        data.writeBoolean(snapshot.paused)
        data.flush()
        buffered.flush()
        output.fd.sync()
      } finally {
        data.close()
      }
    }
    if (!tmp.renameTo(file)) {
      tmp.copyTo(file, overwrite = true)
      if (!tmp.delete()) {
        tmp.deleteOnExit()
      }
    }
  } catch (e: Exception) {
    onError("write", e)
    if (tmp.exists() && !tmp.delete()) {
      tmp.deleteOnExit()
    }
  }
}

private fun writeStrings(data: DataOutputStream, values: List<String>) {
  data.writeInt(values.size)
  for (value in values) {
    data.writeUTF(value)
  }
}
