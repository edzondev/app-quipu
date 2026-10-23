package expo.modules.quipunotificationlistener

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class AmountCentsTest {
  @Test
  fun readsCentsFromPeruvianBankTexts() {
    assertEquals(
      4_590,
      NotificationExtractor.readAmountCents(
        "BCP: Compraste S/ 45.90 en PLAZA VEA MIRAFLORES con tu tarjeta de débito.",
      ),
    )
    assertEquals(
      125_000,
      NotificationExtractor.readAmountCents("Consumo aprobado por S/ 1,250.00 en SODIMAC."),
    )
    assertEquals(
      8_990,
      NotificationExtractor.readAmountCents("Interbank: Compra por S/ 89.90 en WONG."),
    )
    assertEquals(
      348_050,
      NotificationExtractor.readAmountCents("Cargo en tu cuenta S/ 3,480.50. Comercio: RIPLEY."),
    )
    assertEquals(
      15_000,
      NotificationExtractor.readAmountCents("BBVA: Pagaste S/ 150.00 con tu tarjeta Visa."),
    )
    assertEquals(
      1_250_075,
      NotificationExtractor.readAmountCents("BBVA: Operación realizada S/ 12,500.75 en MAESTRO."),
    )
    assertEquals(
      2_000,
      NotificationExtractor.readAmountCents("Yapeaste S/ 20 a María López"),
    )
    assertEquals(
      3_550,
      NotificationExtractor.readAmountCents("Yape: Pagaste S/ 35.50 en RAPPI."),
    )
  }

  @Test
  fun leavesAmountEmptyWhenTheTextHasNone() {
    assertNull(
      NotificationExtractor.readAmountCents(
        "Tu clave digital fue actualizada. Si no fuiste tú, escríbenos desde el app.",
      ),
    )
  }
}
