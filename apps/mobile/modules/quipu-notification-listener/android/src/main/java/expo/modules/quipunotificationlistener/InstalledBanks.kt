package expo.modules.quipunotificationlistener

import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Canvas
import android.util.Base64
import java.io.ByteArrayOutputStream

internal object InstalledBanks {
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
      val drawable = appInfo.loadIcon(packageManager)?.mutate() ?: return null
      val box = IconRaster.bounds(drawable.intrinsicWidth, drawable.intrinsicHeight)
      val bitmap = Bitmap.createBitmap(IconRaster.EDGE, IconRaster.EDGE, Bitmap.Config.ARGB_8888)
      drawable.setBounds(box.left, box.top, box.right, box.bottom)
      drawable.draw(Canvas(bitmap))
      val bytes = ByteArrayOutputStream()
      if (!bitmap.compress(Bitmap.CompressFormat.PNG, 100, bytes)) return null
      Base64.encodeToString(bytes.toByteArray(), Base64.NO_WRAP)
    } catch (_: Exception) {
      null
    }
  }
}
