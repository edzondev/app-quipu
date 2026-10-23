package expo.modules.quipunotificationlistener

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class BankNoticeTest {
  @Test
  fun aNonBankALoadingStoreOrQuipuIsNotRead() {
    val sources = setOf("pe.com.interbank.mobilebanking")
    assertTrue(mayReadBankNotification("pe.com.interbank.mobilebanking", "com.quipu.finance", true, sources))
    assertFalse(mayReadBankNotification("com.whatsapp", "com.quipu.finance", true, sources))
    assertFalse(mayReadBankNotification("pe.com.interbank.mobilebanking", "com.quipu.finance", false, sources))
    assertFalse(mayReadBankNotification("com.quipu.finance", "com.quipu.finance", true, setOf("com.quipu.finance")))
  }

  @Test
  fun noticeCopyNamesTheBankAmountAndMerchant() {
    assertEquals("Interbank", noticeBankName("pe.com.interbank.mobilebanking"))
    assertEquals("Detectamos un gasto en Interbank", expenseNoticeTitle("Interbank"))
    assertEquals("S/ 45.90 en Tambo+", expenseNoticeBody(4_590, "Tambo+"))
    assertEquals("S/ 45.90", expenseNoticeBody(4_590, null))
    assertEquals("No encontramos el monto. Tócalo para completarlo.", expenseNoticeBody(null, "Tambo+"))
  }

  @Test
  fun dismissDeletesTheEntry() {
    DetectedNotices.put(DetectedNotice("n|1", "pe.com.interbank.mobilebanking", 10, 4_590, "Tambo+"))
    assertTrue(DetectedNotices.dismiss("n|1"))
    assertFalse(DetectedNotices.dismiss("n|1"))
  }
}
