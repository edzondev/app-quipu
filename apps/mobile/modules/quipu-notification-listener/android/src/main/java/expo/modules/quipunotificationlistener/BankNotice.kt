package expo.modules.quipunotificationlistener

internal data class DetectedNotice(
  val id: String,
  val packageName: String,
  val postedAt: Long,
  val amountCents: Int?,
  val merchant: String?,
)

internal fun mayReadBankNotification(
  packageName: String,
  ownPackage: String,
  ready: Boolean,
  sources: Set<String>,
): Boolean = packageName.isNotEmpty() && packageName != ownPackage && ready && packageName in sources

internal fun noticeBankName(packageName: String): String =
  BankCatalog.banks.firstOrNull { it.packageId == packageName }?.name ?: packageName

internal fun expenseNoticeTitle(bank: String): String = "Detectamos un gasto en $bank"

internal fun expenseNoticeBody(amountCents: Int?, merchant: String?): String {
  if (amountCents == null) return "No encontramos el monto. Tócalo para completarlo."
  val amount = "S/ ${amountCents / 100}.${(amountCents % 100).toString().padStart(2, '0')}"
  val name = merchant?.trim().orEmpty()
  return if (name.isEmpty()) amount else "$amount en $name"
}

internal object DetectedNotices {
  const val EXTRA_ID = "id"
  private val items = LinkedHashMap<String, DetectedNotice>()

  fun put(notice: DetectedNotice) {
    synchronized(items) { items[notice.id] = notice }
  }

  fun dismiss(id: String): Boolean = synchronized(items) { items.remove(id) != null }
}
