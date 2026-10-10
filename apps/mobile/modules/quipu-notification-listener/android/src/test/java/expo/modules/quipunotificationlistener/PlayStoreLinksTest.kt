package expo.modules.quipunotificationlistener

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class PlayStoreLinksTest {
  @Test
  fun httpsLink() {
    val parsed = PlayStoreLinks.parse(
      "https://play.google.com/store/apps/details?id=com.bcp.bank.bcp",
    )
    assertEquals("com.bcp.bank.bcp", (parsed as PlayStoreLink.Id).packageId)
  }

  @Test
  fun httpAndWwwKeepOnlyTheId() {
    val parsed = PlayStoreLinks.parse(
      "http://www.play.google.com/store/apps/details?id=com.bcp.bank.bcp&hl=es&gl=pe",
    )
    assertEquals("com.bcp.bank.bcp", (parsed as PlayStoreLink.Id).packageId)
  }

  @Test
  fun ignoresHlAndOtherParams() {
    val parsed = PlayStoreLinks.parse(
      "https://play.google.com/store/apps/details?hl=es&id=pe.com.interbank.mobilebanking&gl=pe",
    )
    assertEquals("pe.com.interbank.mobilebanking", (parsed as PlayStoreLink.Id).packageId)
  }

  @Test
  fun marketLink() {
    val parsed = PlayStoreLinks.parse("market://details?id=com.bbva.nxt_peru&hl=es")
    assertEquals("com.bbva.nxt_peru", (parsed as PlayStoreLink.Id).packageId)
  }

  @Test
  fun trimsSpacesAroundALink() {
    val parsed = PlayStoreLinks.parse(
      "  https://play.google.com/store/apps/details?id=com.bcp.innovacxion.yapeapp  ",
    )
    assertEquals("com.bcp.innovacxion.yapeapp", (parsed as PlayStoreLink.Id).packageId)
  }

  @Test
  fun trimsSpacesAroundABareId() {
    val parsed = PlayStoreLinks.parse("  pe.com.scotiabank.blpm.android.client  ")
    assertEquals(
      "pe.com.scotiabank.blpm.android.client",
      (parsed as PlayStoreLink.Id).packageId,
    )
  }

  @Test
  fun bareId() {
    val parsed = PlayStoreLinks.parse("com.cmac.cajamovilaqp")
    assertEquals("com.cmac.cajamovilaqp", (parsed as PlayStoreLink.Id).packageId)
  }

  @Test
  fun brokenIddParamIsRejected() {
    val parsed = PlayStoreLinks.parse(
      "https://play.google.com/store/apps/details?idd=com.bcp.bank.bcp",
    )
    assertTrue(parsed is PlayStoreLink.Invalid)
  }

  @Test
  fun randomTextIsRejected() {
    val parsed = PlayStoreLinks.parse("no es un link de Play")
    assertTrue(parsed is PlayStoreLink.Invalid)
  }

  @Test
  fun otherHostIsRejected() {
    val parsed = PlayStoreLinks.parse(
      "https://example.com/store/apps/details?id=com.bcp.bank.bcp",
    )
    assertTrue(parsed is PlayStoreLink.Invalid)
  }
}
