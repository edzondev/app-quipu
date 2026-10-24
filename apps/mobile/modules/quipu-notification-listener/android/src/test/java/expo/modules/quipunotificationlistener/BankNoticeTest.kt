package expo.modules.quipunotificationlistener

import org.junit.Assert.assertEquals
import org.junit.Test

class BankNoticeTest {
  @Test
  fun listedReadyBankIsRead() {
    assertEquals(NoticeGate.Read, noticeGate("pe.com.interbank.mobilebanking", "com.quipu.finance", true, true, false))
  }

  @Test
  fun emptyPackageIsFiltered() {
    assertEquals(NoticeGate.Filter, noticeGate("", "com.quipu.finance", true, true, false))
  }

  @Test
  fun unlistedPackageIsFiltered() {
    assertEquals(NoticeGate.Filter, noticeGate("com.whatsapp", "com.quipu.finance", true, false, false))
  }

  @Test
  fun notReadyDropsBeforeContent() {
    assertEquals(NoticeGate.Drop, noticeGate("pe.com.interbank.mobilebanking", "com.quipu.finance", false, true, false))
  }

  @Test
  fun ownPackageIsDroppedWhenListed() {
    assertEquals(NoticeGate.Drop, noticeGate("com.quipu.finance", "com.quipu.finance", true, true, false))
  }


  @Test
  fun pausedDropsAListedBankBeforeContent() {
    assertEquals(NoticeGate.Drop, noticeGate("pe.com.interbank.mobilebanking", "com.quipu.finance", true, true, true))
  }

  @Test
  fun cancelAllClearsTheTray() {
    var calls = 0
    cancelPostedNotices { calls += 1 }
    assertEquals(1, calls)
    cancelPostedNotices { throw IllegalStateException("tray") }
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
