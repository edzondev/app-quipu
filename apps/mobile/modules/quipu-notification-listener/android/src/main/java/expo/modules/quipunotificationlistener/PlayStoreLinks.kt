package expo.modules.quipunotificationlistener

import java.net.URLDecoder

internal sealed class PlayStoreLink {
  data class Id(val packageId: String) : PlayStoreLink()
  data class Invalid(val error: String) : PlayStoreLink()
}

internal object PlayStoreLinks {
  private val PLAY = Regex(
    "https?://(?:www\\.)?play\\.google\\.com/store/apps/details\\?([^#\\s]+)",
    RegexOption.IGNORE_CASE,
  )
  private val MARKET = Regex(
    "market://details\\?([^#\\s]+)",
    RegexOption.IGNORE_CASE,
  )

  fun parse(raw: String): PlayStoreLink {
    val text = raw.trim()
    val play = PLAY.find(text)
    val market = MARKET.find(text)
    val link = when {
      play == null -> market
      market == null -> play
      play.range.first <= market.range.first -> play
      else -> market
    }
    if (link != null) {
      val packageId = queryId(link.groupValues[1])
      if (packageId != null && PackageIds.isValid(packageId)) return PlayStoreLink.Id(packageId)
      return PlayStoreLink.Invalid("invalid_link")
    }
    if (PackageIds.isValid(text)) return PlayStoreLink.Id(text)
    return PlayStoreLink.Invalid("invalid_link")
  }

  fun toPayload(raw: String): Map<String, String> {
    return when (val parsed = parse(raw)) {
      is PlayStoreLink.Id -> mapOf("packageId" to parsed.packageId)
      is PlayStoreLink.Invalid -> mapOf("error" to parsed.error)
    }
  }

  private fun queryId(query: String): String? {
    for (part in query.split('&')) {
      val eq = part.indexOf('=')
      if (eq <= 0 || part.substring(0, eq) != "id") continue
      return decode(part.substring(eq + 1))?.takeIf { it.isNotEmpty() }
    }
    return null
  }

  private fun decode(raw: String): String? {
    return try {
      URLDecoder.decode(raw, "UTF-8")
    } catch (_: Exception) {
      null
    }
  }
}
