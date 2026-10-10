package expo.modules.quipunotificationlistener

import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.drawable.BitmapDrawable
import android.util.Base64
import java.io.ByteArrayOutputStream

internal object InstalledBanks {
  private const val MAX_ICON_EDGE = 192
  private const val MAX_ICON_BYTES = 24 * 1024

  fun list(packageManager: PackageManager): List<Map<String, Any?>> {
    return BankCatalog.banks.map { bank -> row(packageManager, bank) }
  }

  private fun row(packageManager: PackageManager, bank: Bank): Map<String, Any?> {
    val info = try {
      packageManager.getPackageInfo(bank.packageId, 0)
    } catch (_: PackageManager.NameNotFoundException) {
      null
    }
    val payload = linkedMapOf<String, Any?>(
      "name" to bank.name,
      "packageId" to bank.packageId,
      "installed" to (info != null),
    )
    val appInfo = info?.applicationInfo ?: return payload
    val label = appInfo.loadLabel(packageManager)?.toString()
    if (!label.isNullOrEmpty()) payload["label"] = label
    val icon = cheapIcon(appInfo, packageManager)
    if (icon != null) payload["icon"] = icon
    return payload
  }

  private fun cheapIcon(appInfo: ApplicationInfo, packageManager: PackageManager): String? {
    return try {
      val drawable = appInfo.loadIcon(packageManager)
      if (drawable !is BitmapDrawable) return null
      val bitmap = drawable.bitmap ?: return null
      if (bitmap.width <= 0 || bitmap.height <= 0) return null
      if (bitmap.width > MAX_ICON_EDGE || bitmap.height > MAX_ICON_EDGE) return null
      val bytes = ByteArrayOutputStream()
      if (!bitmap.compress(Bitmap.CompressFormat.PNG, 100, bytes)) return null
      if (bytes.size() > MAX_ICON_BYTES) return null
      Base64.encodeToString(bytes.toByteArray(), Base64.NO_WRAP)
    } catch (_: Exception) {
      null
    }
  }
}
