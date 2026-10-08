package expo.modules.quipunotificationlistener

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

/**
 * Queue, dedupe, registered packages, and the one on-disk file.
 *
 * The file is loaded on [io], never inside the notification callback. Until that load
 * finishes, mutations are buffered in memory and then merged. Disk writes also run only
 * on [io], as a full snapshot: temp file, fsync, rename.
 *
 * SharedPreferences and org.json are not used. Both need Android (or Robolectric) to
 * round-trip in a unit test. Room, DataStore, and MMKV are extra dependencies and more
 * machinery than a bounded queue needs.
 */
internal class NotificationStore(
  private val file: File,
  private val io: Executor = defaultExecutor(),
) {
  private val lock = Any()
  private val readyLatch = CountDownLatch(1)
  private val saveQueued = AtomicBoolean(false)

  @Volatile
  private var ready = false

  @Volatile
  private var sources: Set<String> = emptySet()

  private val queue = ArrayDeque<PendingNotification>()
  private val recentOrder = ArrayDeque<String>()
  private val recentSet = HashSet<String>()
  private val preload = ArrayDeque<Command>()
  private var startRequested = false

  @Volatile
  private var listener: ((PendingNotification) -> Unit)? = null

  private var filteredOut: Long = 0
  private var matched: Long = 0
  private var enqueued: Long = 0
  private var deduped: Long = 0
  private var consumed: Long = 0

  fun start() {
    synchronized(lock) {
      if (startRequested) return
      startRequested = true
    }
    io.execute {
      try {
        loadAndMerge()
      } catch (_: Throwable) {
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

  fun isSource(packageName: String): Boolean {
    return NotificationExtractor.isRegistered(packageName, sources)
  }

  fun setListener(listener: ((PendingNotification) -> Unit)?) {
    this.listener = listener
  }

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

  fun offer(item: PendingNotification) {
    val emit = synchronized(lock) {
      if (!ready) {
        bufferOffer(item)
        return
      }
      applyOffer(item)
    }
    if (emit != null) {
      deliver(emit)
      scheduleSave()
    }
  }

  fun pending(): List<PendingNotification> {
    return synchronized(lock) { queue.toList() }
  }

  fun consume(id: String): Boolean {
    if (id.isEmpty()) return false
    val changed = synchronized(lock) {
      if (!ready) {
        preload.addLast(Command.Consume(id))
        return true
      }
      applyConsume(id)
    }
    if (changed) scheduleSave()
    return changed
  }

  fun clear() {
    val changed = synchronized(lock) {
      if (!ready) {
        preload.addLast(Command.Clear)
        return
      }
      applyClear()
    }
    if (changed) scheduleSave()
  }

  fun diagnostics(): StoreDiagnostics {
    return synchronized(lock) {
      StoreDiagnostics(
        loaded = ready,
        sourceCount = sources.size,
        pendingCount = queue.size,
        recentIdCount = recentSet.size,
        filteredOut = filteredOut,
        matched = matched,
        enqueued = enqueued,
        deduped = deduped,
        consumed = consumed,
      )
    }
  }

  /** Waits until previously scheduled disk writes have finished. */
  fun flush() {
    val done = CountDownLatch(1)
    io.execute { done.countDown() }
    done.await(READY_TIMEOUT_SECONDS, TimeUnit.SECONDS)
  }

  private fun loadAndMerge() {
    val loaded = readSnapshot(file)
    val toEmit = ArrayList<PendingNotification>()
    var dirty = false
    synchronized(lock) {
      sources = loaded.sources.toSet()
      queue.clear()
      queue.addAll(loaded.queue)
      recentOrder.clear()
      recentSet.clear()
      for (id in loaded.recentIds) {
        remember(id)
      }
      for (item in queue) {
        if (item.id !in recentSet) remember(item.id)
      }
      while (preload.isNotEmpty()) {
        when (val command = preload.removeFirst()) {
          is Command.Add -> if (applyAdd(command.packageName)) dirty = true
          is Command.Remove -> if (applyRemove(command.packageName)) dirty = true
          is Command.Offer -> {
            val added = applyOffer(command.item)
            if (added != null) {
              dirty = true
              toEmit.add(added)
            }
          }
          is Command.Consume -> if (applyConsume(command.id)) dirty = true
          is Command.Clear -> if (applyClear()) dirty = true
        }
      }
      ready = true
    }
    for (item in toEmit) {
      deliver(item)
    }
    // Queue the snapshot before waking waiters. Otherwise flush() can run
    // before this save is even scheduled and a reload sees a missing file.
    if (dirty) scheduleSave()
  }

  private fun bufferOffer(item: PendingNotification) {
    var offers = 0
    for (command in preload) {
      if (command is Command.Offer) offers += 1
    }
    if (offers >= MAX_PRELOAD) {
      val index = preload.indexOfFirst { it is Command.Offer }
      if (index >= 0) preload.removeAt(index)
    }
    preload.addLast(Command.Offer(item))
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

  private fun applyOffer(item: PendingNotification): PendingNotification? {
    if (!NotificationExtractor.isRegistered(item.packageName, sources)) {
      filteredOut += 1
      return null
    }
    matched += 1
    if (item.id in recentSet) {
      deduped += 1
      return null
    }
    remember(item.id)
    while (queue.size >= MAX_QUEUE) {
      queue.removeFirst()
    }
    queue.addLast(item)
    enqueued += 1
    return item
  }

  private fun applyConsume(id: String): Boolean {
    val removed = queue.removeAll { it.id == id }
    if (!removed) return false
    remember(id)
    consumed += 1
    return true
  }

  private fun applyClear(): Boolean {
    if (queue.isEmpty()) return false
    consumed += queue.size.toLong()
    queue.clear()
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

  private fun deliver(item: PendingNotification) {
    val current = listener ?: return
    try {
      current(item)
    } catch (_: Throwable) {
    }
  }

  private fun scheduleSave() {
    if (!saveQueued.compareAndSet(false, true)) return
    io.execute {
      saveQueued.set(false)
      val snapshot = synchronized(lock) { snapshot() }
      writeAtomically(file, snapshot)
    }
  }

  private fun snapshot(): Snapshot {
    return Snapshot(
      sources = sources.toList().sorted(),
      recentIds = recentOrder.toList(),
      queue = queue.toList(),
    )
  }

  companion object {
    const val MAX_QUEUE = 100
    const val MAX_RECENT = 256
    const val MAX_SOURCES = 20
    const val MAX_PRELOAD = 100
    private const val READY_TIMEOUT_SECONDS = 5L
    private const val DIRECTORY = "quipu-notification-listener"
    private const val FILE_NAME = "state.bin"

    private val gate = Any()

    @Volatile
    private var shared: NotificationStore? = null

    fun shared(filesDir: File): NotificationStore {
      shared?.let { return it }
      return synchronized(gate) {
        shared ?: NotificationStore(File(File(filesDir, DIRECTORY), FILE_NAME)).also { shared = it }
      }
    }

    fun defaultExecutor(): Executor {
      return Executors.newSingleThreadExecutor { runnable ->
        Thread(runnable, "quipu-notification-listener").apply { isDaemon = true }
      }
    }

    fun isValidPackageName(packageName: String): Boolean {
      if (packageName.length !in 3..200) return false
      return PACKAGE_NAME.matches(packageName)
    }

    private val PACKAGE_NAME = Regex("^[A-Za-z][A-Za-z0-9_]*(\\.[A-Za-z][A-Za-z0-9_]*)+$")
  }
}

internal data class StoreDiagnostics(
  val loaded: Boolean,
  val sourceCount: Int,
  val pendingCount: Int,
  val recentIdCount: Int,
  val filteredOut: Long,
  val matched: Long,
  val enqueued: Long,
  val deduped: Long,
  val consumed: Long,
)

private sealed interface Command {
  data class Add(val packageName: String) : Command
  data class Remove(val packageName: String) : Command
  data class Offer(val item: PendingNotification) : Command
  data class Consume(val id: String) : Command
  data object Clear : Command
}

private data class Snapshot(
  val sources: List<String>,
  val recentIds: List<String>,
  val queue: List<PendingNotification>,
) {
  companion object {
    fun empty() = Snapshot(emptyList(), emptyList(), emptyList())
  }
}

private const val MAGIC = 0x51504E31
private const val VERSION = 1
private const val MAX_STORED_SOURCES = NotificationStore.MAX_SOURCES
private const val MAX_STORED_RECENT = NotificationStore.MAX_RECENT
private const val MAX_STORED_QUEUE = NotificationStore.MAX_QUEUE

private fun readSnapshot(file: File): Snapshot {
  if (!file.isFile) return Snapshot.empty()
  return try {
    DataInputStream(BufferedInputStream(FileInputStream(file))).use { input ->
      val magic = input.readInt()
      val version = input.readInt()
      if (magic != MAGIC || version != VERSION) return Snapshot.empty()
      val sources = readStrings(input, MAX_STORED_SOURCES)
      val recentIds = readStrings(input, MAX_STORED_RECENT)
      val count = readCount(input, MAX_STORED_QUEUE)
      val queue = ArrayList<PendingNotification>(count)
      repeat(count) {
        val id = input.readUTF()
        val packageName = input.readUTF()
        val postedAt = input.readLong()
        val title = input.readUTF()
        val text = input.readUTF()
        val subText = readOptional(input)
        val bigText = readOptional(input)
        if (id.isNotEmpty() && packageName.isNotEmpty()) {
          queue.add(
            PendingNotification(
              id = id,
              packageName = packageName,
              postedAt = postedAt,
              title = title,
              text = text,
              subText = subText,
              bigText = bigText,
            ),
          )
        }
      }
      Snapshot(sources, recentIds, queue)
    }
  } catch (_: Throwable) {
    Snapshot.empty()
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

private fun readOptional(input: DataInputStream): String? {
  if (!input.readBoolean()) return null
  val value = input.readUTF()
  return value.ifEmpty { null }
}

private fun readCount(input: DataInputStream, max: Int): Int {
  val count = input.readInt()
  if (count !in 0..max) throw IOException("count out of range")
  return count
}

private fun writeAtomically(file: File, snapshot: Snapshot) {
  val parent = file.parentFile ?: return
  if (!parent.exists() && !parent.mkdirs()) return
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
        data.writeInt(snapshot.queue.size)
        for (item in snapshot.queue) {
          data.writeUTF(item.id)
          data.writeUTF(item.packageName)
          data.writeLong(item.postedAt)
          data.writeUTF(item.title)
          data.writeUTF(item.text)
          writeOptional(data, item.subText)
          writeOptional(data, item.bigText)
        }
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
  } catch (_: Throwable) {
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

private fun writeOptional(data: DataOutputStream, value: String?) {
  if (value == null) {
    data.writeBoolean(false)
  } else {
    data.writeBoolean(true)
    data.writeUTF(value)
  }
}
