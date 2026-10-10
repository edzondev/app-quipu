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
  private const val MAX_KEY_CHARS = 300

  fun isRegistered(packageName: String, sources: Set<String>): Boolean {
    return packageName in sources
  }

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
