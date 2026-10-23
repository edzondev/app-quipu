package expo.modules.quipunotificationlistener

import android.util.Log

internal data class DetectedNotice(
  val id: String,
  val packageName: String,
  val postedAt: Long,
  val amountCents: Int?,
  val merchant: String?,
)

internal enum class NoticeGate { Read, Drop, Filter }

internal fun noticeGate(
  packageName: String,
  ownPackage: String,
  ready: Boolean,
  listed: Boolean,
  paused: Boolean,
): NoticeGate {
  if (paused || !ready || packageName == ownPackage) return NoticeGate.Drop
  if (packageName.isEmpty() || !listed) return NoticeGate.Filter
  return NoticeGate.Read
}

internal fun cancelPostedNotices(cancelAll: () -> Unit) {
  try {
    cancelAll()
  } catch (e: Exception) {
    Log.w("QuipuNotificationListener", "notice cancel failed: ${e.javaClass.simpleName}")
  }
}

internal fun noticeBankName(packageName: String): String =
  BankCatalog.banks.firstOrNull { it.packageId == packageName }?.name ?: packageName

internal fun expenseNoticeTitle(bank: String): String = "Detectamos un gasto en $bank"

internal fun expenseNoticeBody(amountCents: Int?, merchant: String?): String {
  if (amountCents == null) return "No encontramos el monto. Tócalo para completarlo."
  val amount = "S/ ${amountCents / 100}.${(amountCents % 100).toString().padStart(2, '0')}"
  val name = merchant?.trim().orEmpty()
  return if (name.isEmpty()) amount else "$amount en $name"
}
