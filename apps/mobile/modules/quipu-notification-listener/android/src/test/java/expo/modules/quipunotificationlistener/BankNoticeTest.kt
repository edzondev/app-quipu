package expo.modules.quipunotificationlistener

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class BankNoticeTest {
  @Test
  fun aNonBankALoadingStoreOrQuipuIsNotRead() {
    assertTrue(mayReadBankNotification("pe.com.interbank.mobilebanking", "com.quipu.finance", true, true))
    assertFalse(mayReadBankNotification("com.whatsapp", "com.quipu.finance", true, false))
    assertFalse(mayReadBankNotification("pe.com.interbank.mobilebanking", "com.quipu.finance", false, true))
    assertFalse(mayReadBankNotification("com.quipu.finance", "com.quipu.finance", true, true))
  }

  @Test
  fun noticeCopyNamesTheBankAmountAndMerchant() {
    assertEquals("Interbank", noticeBankName("pe.com.interbank.mobilebanking"))
    assertEquals("Detectamos un gasto en Interbank", expenseNoticeTitle("Interbank"))
    assertEquals("S/ 45.90 en Tambo+", expenseNoticeBody(4_590, "Tambo+"))
    assertEquals("S/ 45.90", expenseNoticeBody(4_590, null))
    assertEquals("No encontramos el monto. Tócalo para completarlo.", expenseNoticeBody(null, "Tambo+"))
  }
}
