package expo.modules.quipunotificationlistener

import java.io.File
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Test

class ManifestQueriesTest {
  @Test
  fun manifestListsEachCatalogPackageAndNotQueryAll() {
    val manifest = locateModuleManifest().readText()
    assertFalse(manifest.contains("QUERY_ALL_PACKAGES"))
    val declared = Regex("""<package\s+android:name="([^"]+)"\s*/>""")
      .findAll(manifest)
      .map { it.groupValues[1] }
      .toList()
    assertEquals(BankCatalog.banks.map { it.packageId }, declared)
  }
}

internal fun locateModuleManifest(): File {
  val relative = "apps/mobile/modules/quipu-notification-listener/android/src/main/AndroidManifest.xml"
  var dir = File(System.getProperty("user.dir") ?: ".").absoluteFile
  val seen = HashSet<String>()
  while (seen.add(dir.path)) {
    val candidates = listOf(
      File(dir, relative),
      File(dir, "modules/quipu-notification-listener/android/src/main/AndroidManifest.xml"),
      File(dir, "src/main/AndroidManifest.xml"),
    )
    for (candidate in candidates) {
      if (candidate.isFile && candidate.readText().contains("QuipuNotificationListenerService")) {
        return candidate
      }
    }
    dir = dir.parentFile ?: break
  }
  error("AndroidManifest.xml del módulo no encontrado desde ${System.getProperty("user.dir")}")
}
