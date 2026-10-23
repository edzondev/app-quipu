package expo.modules.quipunotificationlistener

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Test

class AmountCentsTest {
  @Test
  fun readsSolesWithNbspOrThousandsAndRejectsTwoAmounts() {
    assertEquals(4_590, NotificationExtractor.readAmountCents("Compraste S/ 45.90 en Tambo+"))
    assertEquals(125_000, NotificationExtractor.readAmountCents("Consumo por S/ 1,250.00"))
    assertEquals(4_590, NotificationExtractor.readAmountCents("S/. 45.90"))
    assertEquals(4_590, NotificationExtractor.readAmountCents("S/\u00A045.90"))
    assertEquals(4_590, NotificationExtractor.readAmountCents("Saldo S/ 45.90. Otro S/ 45.90"))
    assertNull(NotificationExtractor.readAmountCents("Saldo S/ 1,000.00. Compraste S/ 45.90"))
    assertEquals("Tambo+", NotificationExtractor.readMerchant("Consumo de S/ 45.90 en Tambo+"))
    assertNull(NotificationExtractor.readMerchant("Cargo en tu cuenta S/ 45.90"))
  }

  @Test
  fun merchantKeepsEveryWord() {
    assertEquals("PLAZA VEA", NotificationExtractor.readMerchant("Consumo de S/ 45.90 en PLAZA VEA"))
    assertEquals("PLAZA VEA SAN ISIDRO", NotificationExtractor.readMerchant("Consumo de S/ 45.90 en PLAZA VEA SAN ISIDRO"))
  }

  @Test
  fun merchantStopsBeforeTheCardPhrase() {
    assertEquals(
      "TAMBO+",
      NotificationExtractor.readMerchant("Consumo de S/ 45.90 en TAMBO+ con tu tarjeta terminada en 1290."),
    )
  }

  @Test
  fun merchantStopsAtTheSentence() {
    assertEquals(
      "Yape",
      NotificationExtractor.readMerchant("Consumo de S/ 45.90 en Yape. Si no reconoces esta operación llama al 311-9000"),
    )
  }

  @Test
  fun merchantDoesNotCrossANewline() {
    assertNull(NotificationExtractor.readMerchant("Consumo de S/ 45.90\nen PLAZA VEA"))
  }

  @Test
  fun merchantCapsAt120Characters() {
    val name = "A".repeat(130)
    assertEquals("A".repeat(120), NotificationExtractor.readMerchant("Consumo de S/ 45.90 en $name"))
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
    assertEquals(4_590, notice.amountCents)
    assertEquals("Tambo+", notice.merchant)
    assertFalse(notice.toString().contains("SECRETO-TITULO"))
  }
}
