package expo.modules.quipunotificationlistener

internal data class DetectedNotice(
  val id: String,
  val packageName: String,
  val postedAt: Long,
  val amountCents: Int?,
  val merchant: String?,
)

/** Own package, a package that is not a chosen bank, or a store that is still loading: do not read. */
internal fun mayReadBankNotification(
  packageName: String,
  ownPackage: String,
  ready: Boolean,
  sources: Set<String>,
): Boolean {
  if (packageName.isEmpty() || packageName == ownPackage || !ready) return false
  return packageName in sources
}

internal fun <T> readBankNotification(
  packageName: String,
  ownPackage: String,
  ready: Boolean,
  sources: Set<String>,
  read: () -> T,
): T? {
  if (!mayReadBankNotification(packageName, ownPackage, ready, sources)) return null
  return read()
}

internal fun noticeBankName(packageName: String): String {
  return BankCatalog.banks.firstOrNull { it.packageId == packageName }?.name ?: packageName
}

internal fun expenseNoticeTitle(bank: String): String = "Detectamos un gasto en $bank"

internal fun expenseNoticeBody(amountCents: Int?, merchant: String?): String {
  if (amountCents == null) return "No encontramos el monto. Tócalo para completarlo."
  val amount = formatSoles(amountCents)
  val name = merchant?.trim().orEmpty()
  if (name.isEmpty()) return amount
  return "$amount en $name"
}

internal fun noticeQuery(notice: DetectedNotice, bank: String): Map<String, String> {
  val query = linkedMapOf(
    "id" to notice.id,
    "bank" to bank,
    "at" to notice.postedAt.toString(),
  )
  val cents = notice.amountCents
  if (cents != null) query["cents"] = cents.toString()
  val merchant = notice.merchant?.trim().orEmpty()
  if (merchant.isNotEmpty()) query["merchant"] = merchant
  return query
}

/** In-memory only. The tap intent carries the fields; this map exists so dismiss can drop the entry. */
internal object DetectedNotices {
  const val EXTRA_ID = "id"

  private val lock = Any()
  private val items = LinkedHashMap<String, DetectedNotice>()

  fun put(notice: DetectedNotice) {
    synchronized(lock) { items[notice.id] = notice }
  }

  fun dismiss(id: String): Boolean {
    return synchronized(lock) { items.remove(id) != null }
  }
}

private fun formatSoles(cents: Int): String {
  val whole = cents / 100
  val fraction = (cents % 100).toString().padStart(2, '0')
  val grouped = whole.toString().reversed().chunked(3).joinToString(",").reversed()
  return "S/ $grouped.$fraction"
}
