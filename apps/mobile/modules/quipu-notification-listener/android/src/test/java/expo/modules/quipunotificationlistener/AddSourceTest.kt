package expo.modules.quipunotificationlistener

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class AddSourceTest {
  private val bcp = "com.bcp.bank.bcp"
  private val other = "com.other.wallet"

  @Test
  fun addedWhenCatalogBankIsInstalled() {
    val decision = AddSource.resolve(bcp, emptySet(), atCapacity = false) { true }
    assertEquals(AddSource.ADDED, decision.code)
    assertEquals(bcp, decision.packageId)
    assertTrue(AddSource.persists(decision.code))
  }

  @Test
  fun invalidLink() {
    val decision = AddSource.resolve("texto suelto", emptySet(), atCapacity = false) { true }
    assertEquals(AddSource.INVALID_LINK, decision.code)
    assertFalse(AddSource.persists(decision.code))
  }

  @Test
  fun alreadyAdded() {
    val decision = AddSource.resolve("  $bcp  ", setOf(bcp), atCapacity = true) { false }
    assertEquals(AddSource.ALREADY_ADDED, decision.code)
    assertFalse(AddSource.persists(decision.code))
  }

  @Test
  fun notInstalledDoesNotSave() {
    val decision = AddSource.resolve(
      "https://play.google.com/store/apps/details?id=$bcp&hl=es",
      emptySet(),
      atCapacity = false,
    ) { false }
    assertEquals(AddSource.NOT_INSTALLED, decision.code)
    assertEquals(bcp, decision.packageId)
    assertFalse(AddSource.persists(decision.code))
  }

  @Test
  fun addedUnverifiedSavesAnIdOutsideTheCatalog() {
    val decision = AddSource.resolve("market://details?id=$other", emptySet(), atCapacity = false) { false }
    assertEquals(AddSource.ADDED_UNVERIFIED, decision.code)
    assertEquals(other, decision.packageId)
    assertTrue(AddSource.persists(decision.code))
  }

  @Test
  fun limitReachedDoesNotSave() {
    val decision = AddSource.resolve(other, emptySet(), atCapacity = true) { true }
    assertEquals(AddSource.LIMIT_REACHED, decision.code)
    assertFalse(AddSource.persists(decision.code))
  }
}
