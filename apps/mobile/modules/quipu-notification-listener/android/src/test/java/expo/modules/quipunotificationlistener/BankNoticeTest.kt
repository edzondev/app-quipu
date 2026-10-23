package expo.modules.quipunotificationlistener

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class BankNoticeTest {
  @Test
  fun mayReadBankNotificationRequiresALoadedChosenBank() {
    val sources = setOf("pe.com.interbank.mobilebanking")
    assertTrue(
      mayReadBankNotification("pe.com.interbank.mobilebanking", "com.quipu.finance", true, sources),
    )
    assertFalse(mayReadBankNotification("com.whatsapp", "com.quipu.finance", true, sources))
    assertFalse(
      mayReadBankNotification("pe.com.interbank.mobilebanking", "com.quipu.finance", false, sources),
    )
    assertFalse(
      mayReadBankNotification("com.quipu.finance", "com.quipu.finance", true, setOf("com.quipu.finance")),
    )
  }

  @Test
  fun readBankNotificationDoesNotReadANonBank() {
    var read = false
    val value = readBankNotification(
      "com.whatsapp",
      "com.quipu.finance",
      true,
      setOf("pe.com.interbank.mobilebanking"),
    ) {
      read = true
      error("content was read")
    }
    assertFalse(read)
    assertNull(value)
  }

  @Test
  fun readBankNotificationDoesNotReadWhileSourcesLoad() {
    var read = false
    val value = readBankNotification(
      "pe.com.interbank.mobilebanking",
      "com.quipu.finance",
      false,
      setOf("pe.com.interbank.mobilebanking"),
    ) {
      read = true
      "secret"
    }
    assertFalse(read)
    assertNull(value)
  }

  @Test
  fun readBankNotificationDoesNotReadQuipu() {
    var read = false
    readBankNotification(
      "com.quipu.finance",
      "com.quipu.finance",
      true,
      setOf("com.quipu.finance"),
    ) {
      read = true
      "secret"
    }
    assertFalse(read)
  }

  @Test
  fun expenseNoticeTitleNamesTheBank() {
    assertEquals("Detectamos un gasto en Interbank", expenseNoticeTitle("Interbank"))
  }

  @Test
  fun expenseNoticeBodyUsesAmountAndMerchant() {
    assertEquals("S/ 45.90 en Tambo+", expenseNoticeBody(4_590, "Tambo+"))
    assertEquals("S/ 45.90", expenseNoticeBody(4_590, null))
    assertEquals("S/ 45.90", expenseNoticeBody(4_590, "  "))
    assertEquals("S/ 1,250.00", expenseNoticeBody(125_000, null))
    assertEquals(
      "No encontramos el monto. Tócalo para completarlo.",
      expenseNoticeBody(null, "Tambo+"),
    )
  }

  @Test
  fun noticeBankNameUsesTheCatalog() {
    assertEquals("Interbank", noticeBankName("pe.com.interbank.mobilebanking"))
    assertEquals("com.other.bank", noticeBankName("com.other.bank"))
  }

  @Test
  fun noticeQueryCarriesOnlyParsedFields() {
    val notice = DetectedNotice("n|1", "pe.com.interbank.mobilebanking", 10, 4_590, "Tambo+")
    assertEquals(
      mapOf("id" to "n|1", "bank" to "Interbank", "at" to "10", "cents" to "4590", "merchant" to "Tambo+"),
      noticeQuery(notice, "Interbank"),
    )
    val empty = notice.copy(amountCents = null, merchant = null)
    assertEquals(mapOf("id" to "n|1", "bank" to "Interbank", "at" to "10"), noticeQuery(empty, "Interbank"))
  }

  @Test
  fun dismissDeletesTheEntry() {
    val notice = DetectedNotice("n|1", "pe.com.interbank.mobilebanking", 10, 4_590, "Tambo+")
    DetectedNotices.put(notice)
    assertTrue(DetectedNotices.dismiss("n|1"))
    assertFalse(DetectedNotices.dismiss("n|1"))
  }
}
