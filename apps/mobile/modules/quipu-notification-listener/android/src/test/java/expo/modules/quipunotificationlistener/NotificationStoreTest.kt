package expo.modules.quipunotificationlistener

import java.io.DataOutputStream
import java.io.File
import java.io.FileOutputStream
import java.nio.file.Files
import java.util.concurrent.ConcurrentLinkedQueue
import java.util.concurrent.Executor
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class NotificationStoreTest {
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
    store.flush()

    val reloaded = reload(file)
    assertEquals(NotificationStore.MAX_SOURCES, reloaded.sources().size)
    assertFalse(reloaded.sources().contains("com.bank.overflow"))
  }

  @Test
  fun removeSourceIsPersisted() {
    val (file, store) = startedStore()
    store.addSource("com.bank.one")
    assertTrue(store.removeSource("com.bank.one"))
    store.flush()
    assertTrue(reload(file).sources().isEmpty())
  }

  @Test
  fun claimRemembersTheIdWithoutWritingText() {
    val (file, store) = startedStore()
    store.addSource("com.bank.one")
    assertTrue(store.claim("k|1", "com.bank.one"))
    assertFalse(store.claim("k|1", "com.bank.one"))
    assertEquals(1L, store.diagnostics().deduped)
    store.flush()

    assertFalse(reload(file).claim("k|1", "com.bank.one"))
  }

  @Test
  fun claimRefusesABankThatIsNoLongerChosen() {
    val (_, store) = startedStore()
    store.addSource("com.bank.one")
    assertTrue(store.removeSource("com.bank.one"))
    assertFalse(store.claim("k|2", "com.bank.one"))
    store.addSource("com.bank.one")
    assertTrue(store.claim("k|2", "com.bank.one"))
  }

  @Test
  fun oldFileIsOverwrittenWithoutTitleOrText() {
    val file = File(Files.createTempDirectory("quipu-nl").toFile(), "state.bin")
    DataOutputStream(FileOutputStream(file)).use { output ->
      output.writeInt(0x51504E31)
      output.writeInt(1)
      output.writeInt(1)
      output.writeUTF("com.bank.one")
      output.writeInt(0)
      output.writeUTF("SECRETO-TITULO")
      output.writeUTF("SECRETO-TEXTO")
    }
    val store = NotificationStore(file)
    store.start()
    store.awaitReady()
    store.flush()

    assertTrue(store.sources().isEmpty())
    val bytes = file.readBytes().decodeToString()
    assertFalse(bytes.contains("SECRETO-TITULO"))
    assertFalse(bytes.contains("SECRETO-TEXTO"))
  }

  @Test
  fun corruptOrMissingFileStartsEmpty() {
    val dir = Files.createTempDirectory("quipu-nl").toFile()
    val missing = File(dir, "state.bin")
    val missingStore = NotificationStore(missing)
    missingStore.start()
    missingStore.awaitReady()
    assertTrue(missingStore.sources().isEmpty())

    val garbage = File(dir, "garbage.bin")
    garbage.writeBytes(byteArrayOf(0, 1, 2, 3, 4, 5, 6, 7))
    val garbageStore = NotificationStore(garbage)
    garbageStore.start()
    garbageStore.awaitReady()
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
  }

  @Test
  fun reportsATruncatedFileAndStartsEmpty() {
    val file = File(Files.createTempDirectory("quipu-nl").toFile(), "state.bin")
    DataOutputStream(FileOutputStream(file)).use { output ->
      output.writeInt(0x51504E31)
      output.writeInt(2)
      output.writeInt(3)
    }
    val errors = mutableListOf<String>()
    val store = NotificationStore(file, onError = { phase, _ -> errors.add(phase) })
    store.start()
    store.awaitReady()
    assertEquals(listOf("read"), errors)
    assertTrue(store.sources().isEmpty())
  }

  @Test
  fun addBeforeLoadIsPersisted() {
    val (file, store) = newStore()
    assertFalse(store.isReady())
    store.addSource("com.bank.one")
    assertFalse(store.claim("early|1", "com.bank.one"))
    store.start()
    store.awaitReady()
    store.flush()
    assertEquals(listOf("com.bank.one"), reload(file).sources())
  }

  @Test
  fun diskWriteRunsOnTheExecutorNotTheCaller() {
    val executor = QueueExecutor()
    val (file, store) = newStore(executor)
    store.addSource("com.bank.one")
    store.start()
    assertFalse(file.exists())
    assertFalse(store.isReady())

    executor.drain()
    assertTrue(store.isReady())
    assertTrue(file.isFile)
    assertFalse(File(file.parentFile, "state.bin.tmp").exists())
    assertEquals(listOf("com.bank.one"), store.sources())
  }

  @Test
  fun signOutKeepsBanksDropsTheNoticeAndThePauseSurvivesReload() {
    val (file, store) = startedStore()
    store.addSource("com.bank.one")
    store.setPaused(true)
    store.flush()

    val paused = reload(file)
    assertEquals(listOf("com.bank.one"), paused.sources())
    assertTrue(paused.isPaused())
    assertEquals(
      NoticeGate.Drop,
      noticeGate("com.bank.one", "com.quipu.finance", true, true, paused.isPaused()),
    )

    paused.setPaused(false)
    paused.flush()
    val signedIn = reload(file)
    assertEquals(listOf("com.bank.one"), signedIn.sources())
    assertFalse(signedIn.isPaused())
    assertEquals(
      NoticeGate.Read,
      noticeGate("com.bank.one", "com.quipu.finance", true, "com.bank.one" in signedIn.sources(), signedIn.isPaused()),
    )
  }

  @Test
  fun accountDeletionLeavesNoBanksAfterReload() {
    val (file, store) = startedStore()
    store.addSource("com.bank.one")
    assertTrue(store.claim("k|1", "com.bank.one"))
    store.setPaused(true)
    store.flush()
    store.clear()
    store.flush()

    val again = reload(file)
    assertTrue(again.sources().isEmpty())
    assertFalse(again.isPaused())
    assertEquals(0, again.diagnostics().recentIdCount)
    again.addSource("com.bank.one")
    assertTrue(again.claim("k|1", "com.bank.one"))
  }

  @Test
  fun clearWithBanksButNoNoticesStillEmptiesTheFile() {
    val (file, store) = startedStore()
    store.addSource("com.bank.one")
    store.flush()
    store.clear()
    store.flush()
    assertTrue(reload(file).sources().isEmpty())
  }

  @Test
  fun versionTwoFileKeepsBanksAndStaysUnpaused() {
    val file = File(Files.createTempDirectory("quipu-nl").toFile(), "state.bin")
    DataOutputStream(FileOutputStream(file)).use { output ->
      output.writeInt(0x51504E31)
      output.writeInt(2)
      output.writeInt(1)
      output.writeUTF("com.bank.one")
      output.writeInt(0)
    }
    val store = NotificationStore(file)
    store.start()
    store.awaitReady()
    assertEquals(listOf("com.bank.one"), store.sources())
    assertFalse(store.isPaused())
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
