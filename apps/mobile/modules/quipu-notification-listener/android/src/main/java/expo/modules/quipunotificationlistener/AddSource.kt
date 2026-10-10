package expo.modules.quipunotificationlistener

internal data class AddSourceDecision(
  val code: String,
  val packageId: String?,
)

internal object AddSource {
  const val ADDED = "added"
  const val INVALID_LINK = "invalid_link"
  const val ALREADY_ADDED = "already_added"
  const val NOT_INSTALLED = "not_installed"
  const val ADDED_UNVERIFIED = "added_unverified"
  const val LIMIT_REACHED = "limit_reached"

  fun persists(code: String): Boolean = code == ADDED || code == ADDED_UNVERIFIED

  fun resolve(
    text: String,
    existing: Set<String>,
    atCapacity: Boolean,
    isInstalled: (String) -> Boolean,
  ): AddSourceDecision {
    val parsed = PlayStoreLinks.parse(text)
    if (parsed is PlayStoreLink.Invalid) return AddSourceDecision(INVALID_LINK, null)
    val packageId = (parsed as PlayStoreLink.Id).packageId
    if (packageId in existing) return AddSourceDecision(ALREADY_ADDED, packageId)
    val inCatalog = BankCatalog.contains(packageId)
    if (inCatalog && !isInstalled(packageId)) return AddSourceDecision(NOT_INSTALLED, packageId)
    if (atCapacity) return AddSourceDecision(LIMIT_REACHED, packageId)
    if (inCatalog) return AddSourceDecision(ADDED, packageId)
    return AddSourceDecision(ADDED_UNVERIFIED, packageId)
  }
}
