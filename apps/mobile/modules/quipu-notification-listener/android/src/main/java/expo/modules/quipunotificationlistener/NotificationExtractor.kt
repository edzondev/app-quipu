package expo.modules.quipunotificationlistener

/**
 * Pure extraction. No Android types, so JVM tests can cover it without Robolectric.
 *
 * The id is `key|postTime`, not the notification id. Apps reuse that integer to update
 * or replace a notification, and two packages can post the same integer. The status-bar
 * key already includes the package, tag, id, and user. postTime distinguishes a new
 * posting of that slot from one that was already consumed.
 */
internal object NotificationExtractor {
  const val ID_SEPARATOR = "|"
  const val MAX_TEXT_CHARS = 500

  private const val MAX_KEY_CHARS = 107
  private val AMOUNT = Regex("S/\\.?(?:[\\s\u00A0])*(\\d+(?:,\\d{3})*(?:\\.\\d{1,2})?)")
  private val MERCHANT = Regex("(?i)\\s+en\\s+(\\S+)")

  fun notificationId(key: String, postTime: Long): String {
    return key + ID_SEPARATOR + postTime
  }

  /**
   * Reads one extras value. A bad parcel throws; the listener must ignore that field.
   */
  fun readExtra(read: () -> CharSequence?): String? {
    return try {
      read()?.toString()
    } catch (_: Throwable) {
      null
    }
  }

  fun extract(raw: RawNotification): PendingNotification? {
    if (raw.isGroupSummary) return null
    val key = truncate(raw.key.trim(), MAX_KEY_CHARS)
    val packageName = raw.packageName.trim()
    if (packageName.isEmpty() || key.isEmpty()) return null

    val title = normalize(raw.title)
    val text = normalize(raw.text)
    val subText = normalize(raw.subText)
    val bigText = normalize(raw.bigText)
    if (title.isEmpty() && text.isEmpty() && subText.isEmpty() && bigText.isEmpty()) {
      return null
    }

    return PendingNotification(
      id = notificationId(key, raw.postTime),
      packageName = packageName,
      postedAt = raw.postTime,
      title = title,
      text = text,
      subText = subText.ifEmpty { null },
      bigText = bigText.ifEmpty { null },
    )
  }

  fun detectedNotice(raw: RawNotification): DetectedNotice? {
    val pending = extract(raw) ?: return null
    val blob = listOfNotNull(pending.title, pending.text, pending.subText, pending.bigText)
      .joinToString("\n")
    return DetectedNotice(
      id = pending.id,
      packageName = pending.packageName,
      postedAt = pending.postedAt,
      amountCents = readAmountCents(blob),
      merchant = readMerchant(blob),
    )
  }

  fun readAmountCents(bankText: String): Int? {
    var found: Int? = null
    for (match in AMOUNT.findAll(bankText)) {
      val cents = toCents(match.groupValues[1]) ?: return null
      if (found != null && cents != found) return null
      found = cents
    }
    return found
  }

  fun readMerchant(bankText: String): String? {
    val amount = AMOUNT.find(bankText) ?: return null
    val name = MERCHANT.find(bankText.substring(amount.range.last + 1))?.groupValues?.get(1) ?: return null
    return name.trim('.', '!', ',').takeIf { it.isNotEmpty() }
  }

  private fun toCents(token: String): Int? {
    val dot = token.indexOf('.')
    val whole = (if (dot >= 0) token.substring(0, dot) else token).replace(",", "")
    val fractionDigits = if (dot >= 0) token.substring(dot + 1) else ""
    val soles = whole.toLongOrNull() ?: return null
    val fraction = when (fractionDigits.length) {
      0 -> 0
      1 -> fractionDigits.toInt() * 10
      2 -> fractionDigits.toInt()
      else -> return null
    }
    val cents = soles * 100 + fraction
    if (cents > Int.MAX_VALUE) return null
    return cents.toInt()
  }

  private fun normalize(value: String?): String {
    if (value == null) return ""
    return truncate(value.trim(), MAX_TEXT_CHARS)
  }

  private fun truncate(value: String, maxChars: Int): String {
    if (value.length <= maxChars) return value
    return value.substring(0, maxChars)
  }
}

internal data class RawNotification(
  val packageName: String,
  val key: String,
  val postTime: Long,
  val title: String?,
  val text: String?,
  val subText: String?,
  val bigText: String?,
  val isGroupSummary: Boolean,
)

internal data class PendingNotification(
  val id: String,
  val packageName: String,
  val postedAt: Long,
  val title: String,
  val text: String,
  val subText: String?,
  val bigText: String?,
)
