package expo.modules.quipunotificationlistener

import java.io.DataOutputStream
import java.io.File
import java.io.FileOutputStream
import java.nio.file.Files
import java.util.concurrent.ConcurrentLinkedQueue
import java.util.concurrent.Executor
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class NotificationStoreTest {
  @Test
  fun filtersToRegisteredPackages() {
    val (file, store) = startedStore()
    assertTrue(store.addSource("com.bank.one"))
    assertTrue(store.addSource("com.bank.two"))
    store.offer(item("com.bank.one", "a", 1))
    store.offer(item("com.other.app", "b", 2))
    store.offer(item("com.bank.two", "c", 3))
    store.flush()

    assertEquals(listOf("com.bank.one", "com.bank.two"), packages(store))
    assertEquals(listOf("a|1", "c|3"), store.pending().map { it.id })
    assertEquals(1L, store.diagnostics().filteredOut)
    assertTrue(file.isFile)
  }

  @Test
  fun duplicateIdDoesNotReenterAndConsumeKeepsTheId() {
    val (file, store) = startedStore()
    store.addSource("com.bank.one")
    val first = item("com.bank.one", "slot", 10)
    store.offer(first)
    store.offer(first)
    assertEquals(1, store.pending().size)
    assertEquals(1L, store.diagnostics().deduped)

    assertTrue(store.consume(first.id))
    assertTrue(store.pending().isEmpty())
    store.offer(first)
    assertTrue(store.pending().isEmpty())
    assertEquals(2L, store.diagnostics().deduped)
    store.flush()

    val reloaded = reload(file)
    reloaded.offer(first)
    assertTrue(reloaded.pending().isEmpty())
    assertEquals(1L, reloaded.diagnostics().deduped)
  }

  @Test
  fun sameIntegerIdFromTwoPackagesBothStay() {
    val (_, store) = startedStore()
    store.addSource("com.bank.one")
    store.addSource("com.bank.two")
    store.offer(item("com.bank.one", "0|com.bank.one|7|null|0", 10))
    store.offer(item("com.bank.two", "0|com.bank.two|7|null|0", 10))
    assertEquals(2, store.pending().size)
  }

  @Test
  fun queueDropsOldestAtTheCap() {
    val (_, store) = startedStore()
    store.addSource("com.bank.one")
    repeat(NotificationStore.MAX_QUEUE + 1) { index ->
      store.offer(item("com.bank.one", "k$index", index.toLong()))
    }
    val pending = store.pending()
    assertEquals(NotificationStore.MAX_QUEUE, pending.size)
    assertFalse(pending.any { it.id == "k0|0" })
    assertEquals("k${NotificationStore.MAX_QUEUE}|${NotificationStore.MAX_QUEUE}", pending.last().id)
  }

  @Test
  fun recentIdCacheForgetsOnlyPastTheBound() {
    val (_, store) = startedStore()
    store.addSource("com.bank.one")
    repeat(NotificationStore.MAX_RECENT + 1) { index ->
      store.offer(item("com.bank.one", "r$index", index.toLong()))
    }
    store.clear()
    store.offer(item("com.bank.one", "r0", 0))
    assertEquals(listOf("r0|0"), store.pending().map { it.id })
    val newest = NotificationStore.MAX_RECENT.toLong()
    store.offer(item("com.bank.one", "r$newest", newest))
    assertEquals(listOf("r0|0"), store.pending().map { it.id })
  }

  @Test
  fun clearRemovesPendingButNotTheId() {
    val (_, store) = startedStore()
    store.addSource("com.bank.one")
    val pending = item("com.bank.one", "k", 1)
    store.offer(pending)
    store.clear()
    assertTrue(store.pending().isEmpty())
    store.offer(pending)
    assertTrue(store.pending().isEmpty())
    assertTrue(store.diagnostics().deduped >= 1L)
  }

  @Test
  fun rejectsInvalidPackagesAndCapsSources() {
    val (file, store) = startedStore()
    assertFalse(store.addSource("not a package"))
    assertFalse(store.addSource("com"))
    assertFalse(store.addSource(""))
    assertFalse(store.addSource(".com.bank"))
    assertTrue(store.addSource("com.bank.one"))
    repeat(NotificationStore.MAX_SOURCES - 1) { index ->
      assertTrue(store.addSource("com.bank.n$index"))
    }
    assertFalse(store.addSource("com.bank.overflow"))
    assertEquals(NotificationStore.MAX_SOURCES, store.sources().size)
    assertTrue(store.addSource("com.bank.one"))
    store.flush()

    val reloaded = reload(file)
    assertEquals(NotificationStore.MAX_SOURCES, reloaded.sources().size)
    assertFalse(reloaded.sources().contains("com.bank.overflow"))
  }

  @Test
  fun removeSourceIsPersistedAndDoesNotDeleteQueuedItems() {
    val (file, store) = startedStore()
    store.addSource("com.bank.one")
    store.offer(item("com.bank.one", "k", 1))
    assertTrue(store.removeSource("com.bank.one"))
    store.offer(item("com.bank.one", "later", 2))
    store.flush()

    assertEquals(listOf("k|1"), store.pending().map { it.id })
    val reloaded = reload(file)
    assertTrue(reloaded.sources().isEmpty())
    assertEquals(listOf("k|1"), reloaded.pending().map { it.id })
  }

  @Test
  fun roundTripsOptionalTextAcrossReload() {
    val (file, store) = startedStore()
    store.addSource("com.bank.one")
    store.offer(item("com.bank.one", "k", 4, subText = "Yape", bigText = "Pagaste S/ 20"))
    store.flush()

    val reloaded = reload(file)
    val pending = reloaded.pending().single()
    assertEquals("Yape", pending.subText)
    assertEquals("Pagaste S/ 20", pending.bigText)
    assertEquals(4L, pending.postedAt)
  }

  @Test
  fun corruptOrMissingFileStartsEmpty() {
    val dir = Files.createTempDirectory("quipu-nl").toFile()
    val missing = File(dir, "state.bin")
    val missingStore = NotificationStore(missing)
    missingStore.start()
    missingStore.awaitReady()
    assertTrue(missingStore.sources().isEmpty())
    assertTrue(missingStore.pending().isEmpty())

    val garbage = File(dir, "garbage.bin")
    garbage.writeBytes(byteArrayOf(0, 1, 2, 3, 4, 5, 6, 7))
    val garbageStore = NotificationStore(garbage)
    garbageStore.start()
    garbageStore.awaitReady()
    assertTrue(garbageStore.pending().isEmpty())
    garbageStore.addSource("com.bank.one")
    garbageStore.flush()
    assertEquals(listOf("com.bank.one"), reload(garbage).sources())

    val wrongVersion = File(dir, "version.bin")
    DataOutputStream(FileOutputStream(wrongVersion)).use { output ->
      output.writeInt(0x51504E31)
      output.writeInt(99)
    }
    val versionStore = NotificationStore(wrongVersion)
    versionStore.start()
    versionStore.awaitReady()
    assertTrue(versionStore.sources().isEmpty())
    assertTrue(versionStore.pending().isEmpty())
  }

  @Test
  fun reportsATruncatedFileAndStartsEmpty() {
    val file = File(Files.createTempDirectory("quipu-nl").toFile(), "state.bin")
    DataOutputStream(FileOutputStream(file)).use { output ->
      output.writeInt(0x51504E31)
      output.writeInt(1)
      output.writeInt(3)
    }
    val errors = mutableListOf<String>()
    val store = NotificationStore(file, onError = { phase, _ -> errors.add(phase) })
    store.start()
    store.awaitReady()
    assertEquals(listOf("read"), errors)
    assertTrue(store.sources().isEmpty())
    assertTrue(store.pending().isEmpty())
  }

  @Test
  fun aFailingListenerIsReportedAndDoesNotBreakTheQueue() {
    val errors = mutableListOf<String>()
    val file = File(Files.createTempDirectory("quipu-nl").toFile(), "state.bin")
    val store = NotificationStore(file, onError = { phase, _ -> errors.add(phase) })
    store.start()
    store.awaitReady()
    store.addSource("com.bank.one")
    store.setListener { error("js runtime is gone") }
    store.offer(item("com.bank.one", "k", 1))
    assertEquals(listOf("deliver"), errors)
    assertEquals(listOf("k|1"), store.pending().map { it.id })
  }

  @Test
  fun buffersEventsUntilTheFileIsLoadedThenMerges() {
    val (file, store) = newStore()
    assertFalse(store.isReady())
    store.addSource("com.bank.one")
    store.offer(item("com.bank.one", "early", 1, title = "antes"))
    store.offer(item("com.other.app", "noise", 2))
    store.offer(item("com.bank.one", "early", 1, title = "antes"))
    assertFalse(file.exists())

    store.start()
    store.awaitReady()
    store.flush()

    assertEquals(listOf("com.bank.one"), store.sources())
    assertEquals(listOf("early|1"), store.pending().map { it.id })
    assertEquals("antes", store.pending().single().title)
    assertEquals(1L, store.diagnostics().deduped)
    assertEquals(1L, store.diagnostics().filteredOut)

    val reloaded = NotificationStore(file)
    reloaded.offer(item("com.bank.one", "while-closed", 8))
    reloaded.offer(item("com.messages", "ignore", 9))
    reloaded.start()
    reloaded.awaitReady()
    assertEquals(listOf("early|1", "while-closed|8"), reloaded.pending().map { it.id })
  }

  @Test
  fun preloadBufferDropsOldestOfferPastTheCap() {
    val (_, store) = newStore()
    store.addSource("com.bank.one")
    repeat(NotificationStore.MAX_PRELOAD + 1) { index ->
      store.offer(item("com.bank.one", "p$index", index.toLong()))
    }
    store.start()
    store.awaitReady()
    val ids = store.pending().map { it.id }
    assertFalse(ids.contains("p0|0"))
    assertTrue(ids.contains("p${NotificationStore.MAX_PRELOAD}|${NotificationStore.MAX_PRELOAD}"))
  }

  @Test
  fun diskWriteRunsOnTheExecutorNotTheCaller() {
    val executor = QueueExecutor()
    val (file, store) = newStore(executor)
    store.addSource("com.bank.one")
    store.offer(item("com.bank.one", "k", 1))
    store.start()
    assertFalse(file.exists())
    assertFalse(store.isReady())

    executor.drain()
    assertTrue(store.isReady())
    assertTrue(file.isFile)
    assertFalse(File(file.parentFile, "state.bin.tmp").exists())
    assertEquals(listOf("k|1"), store.pending().map { it.id })
  }

  private fun startedStore(): Pair<File, NotificationStore> {
    val (file, store) = newStore()
    store.start()
    store.awaitReady()
    return file to store
  }

  private fun newStore(executor: Executor? = null): Pair<File, NotificationStore> {
    val dir = Files.createTempDirectory("quipu-nl").toFile()
    val file = File(dir, "state.bin")
    val store = if (executor == null) NotificationStore(file) else NotificationStore(file, executor)
    return file to store
  }

  private fun reload(file: File): NotificationStore {
    val store = NotificationStore(file)
    store.start()
    store.awaitReady()
    return store
  }

  private fun packages(store: NotificationStore): List<String> {
    return store.pending().map { it.packageName }
  }

  private fun item(
    packageName: String,
    key: String,
    postTime: Long,
    title: String = "Pago",
    text: String = "S/ 10",
    subText: String? = null,
    bigText: String? = null,
  ): PendingNotification {
    return NotificationExtractor.extract(
      RawNotification(
        packageName = packageName,
        key = key,
        postTime = postTime,
        title = title,
        text = text,
        subText = subText,
        bigText = bigText,
        isGroupSummary = false,
      ),
    ) ?: error("expected a notification")
  }
}

private class QueueExecutor : Executor {
  private val tasks = ConcurrentLinkedQueue<Runnable>()

  override fun execute(command: Runnable) {
    tasks.add(command)
  }

  fun drain() {
    while (true) {
      val task = tasks.poll() ?: return
      task.run()
    }
  }
}
