package expo.modules.quipunotificationlistener

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Test

class AmountCentsTest {
  @Test
  fun readsCentsFromPeruvianBankTexts() {
    assertEquals(4_590, NotificationExtractor.readAmountCents("Compraste S/ 45.90 en Tambo+"))
    assertEquals(125_000, NotificationExtractor.readAmountCents("Consumo por S/ 1,250.00 en SODIMAC."))
    assertEquals(4_590, NotificationExtractor.readAmountCents("S/. 45.90"))
    assertEquals(4_590, NotificationExtractor.readAmountCents("S/\u00A045.90"))
    assertEquals(4_590, NotificationExtractor.readAmountCents("Saldo S/ 45.90. Otro S/ 45.90"))
  }

  @Test
  fun leavesAmountEmptyWhenTwoAmountsDiffer() {
    assertNull(NotificationExtractor.readAmountCents("Saldo S/ 1,000.00. Compraste S/ 45.90"))
  }

  @Test
  fun leavesAmountEmptyWhenTheTextHasNone() {
    assertNull(NotificationExtractor.readAmountCents("Tu clave digital fue actualizada."))
  }

  @Test
  fun ignoresAThousandsGapThatUsesNbsp() {
    assertNull(NotificationExtractor.readAmountCents("S/ 1\u00A0250.00"))
  }

  @Test
  fun readMerchantTakesTheNameAfterTheAmount() {
    assertEquals("Tambo+", NotificationExtractor.readMerchant("Consumo de S/ 45.90 en Tambo+"))
    assertEquals(
      "Tambo+",
      NotificationExtractor.readMerchant("Consumo de S/ 45.90 en Tambo+ con tu tarjeta"),
    )
    assertNull(NotificationExtractor.readMerchant("Pagaste S/ 45.90"))
    assertNull(NotificationExtractor.readMerchant("Cargo en tu cuenta S/ 45.90"))
  }

  @Test
  fun detectedNoticeDropsRawTitleAndText() {
    val notice = NotificationExtractor.detectedNotice(
      RawNotification(
        packageName = "pe.com.interbank.mobilebanking",
        key = "slot",
        postTime = 10,
        title = "SECRETO-TITULO",
        text = "Consumo de S/ 45.90 en Tambo+",
        subText = null,
        bigText = null,
        isGroupSummary = false,
      ),
    ) ?: error("expected a notice")
    assertEquals("slot|10", notice.id)
    assertEquals(4_590, notice.amountCents)
    assertEquals("Tambo+", notice.merchant)
    assertFalse(notice.toString().contains("SECRETO-TITULO"))
  }
}
