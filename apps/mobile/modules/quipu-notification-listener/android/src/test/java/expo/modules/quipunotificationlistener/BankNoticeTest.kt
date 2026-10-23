package expo.modules.quipunotificationlistener

import org.junit.Assert.assertEquals
import org.junit.Test

class BankNoticeTest {
  @Test
  fun ownPackageIsDroppedAndOnlyAListedBankIsRead() {
    assertEquals(NoticeGate.Read, noticeGate("pe.com.interbank.mobilebanking", "com.quipu.finance", true, true))
    assertEquals(NoticeGate.Filter, noticeGate("com.whatsapp", "com.quipu.finance", true, false))
    assertEquals(NoticeGate.Drop, noticeGate("pe.com.interbank.mobilebanking", "com.quipu.finance", false, true))
    assertEquals(NoticeGate.Drop, noticeGate("com.quipu.finance", "com.quipu.finance", true, true))
    assertEquals(NoticeGate.Drop, noticeGate("com.quipu.finance", "com.quipu.finance", true, false))
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
