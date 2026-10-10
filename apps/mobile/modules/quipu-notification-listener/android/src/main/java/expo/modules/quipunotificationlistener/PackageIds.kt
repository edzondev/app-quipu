package expo.modules.quipunotificationlistener

/**
 * Same package-id rule the store already used. Kept free of Android so the
 * Play Store parser can share it in a plain JVM test.
 */
internal object PackageIds {
  private val PACKAGE_NAME = Regex("^[A-Za-z][A-Za-z0-9_]*(\\.[A-Za-z][A-Za-z0-9_]*)+$")

  fun isValid(packageName: String): Boolean {
    if (packageName.length !in 3..200) return false
    return PACKAGE_NAME.matches(packageName)
  }
}
