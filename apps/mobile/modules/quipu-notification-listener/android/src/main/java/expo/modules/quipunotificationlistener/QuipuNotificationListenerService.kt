package expo.modules.quipunotificationlistener

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log
import androidx.core.app.NotificationCompat

/**
 * System entry point. This is not the Expo module: it does not touch JS, and it does
 * not keep an Activity, a React context, or the [StatusBarNotification].
 *
 * [onNotificationPosted] runs on the main thread. Quipu's own package is ignored
 * first, so a notice this app posts cannot be queued again. Then the package is
 * compared to the registered set. Anything else — extras, text, dedupe — happens
 * only after that check. While the
 * on-disk set is still loading, the event is copied into a memory buffer instead of
 * being dropped, then filtered when the load finishes.
 */
class QuipuNotificationListenerService : NotificationListenerService() {
  override fun onCreate() {
    super.onCreate()
    startStore()
    logDebug("listener created")
  }

  override fun onListenerConnected() {
    startStore()
    logDebug("listener connected")
  }

  override fun onListenerDisconnected() {
    logDebug("listener disconnected")
  }

  override fun onDestroy() {
    logDebug("listener destroyed")
    super.onDestroy()
  }

  override fun onNotificationPosted(sbn: StatusBarNotification) {
    try {
      val packageName = sbn.packageName ?: return
      if (packageName == this.packageName) return
      val store = currentStore()
      if (store.isReady() && !store.isSource(packageName)) {
        store.noteFiltered()
        return
      }
      val pending = NotificationExtractor.extract(readRaw(sbn)) ?: return
      store.offer(pending)
    } catch (e: Exception) {
      logFailure("onNotificationPosted", e)
    }
  }

  private fun startStore() {
    try {
      currentStore()
    } catch (e: Exception) {
      logFailure("start", e)
    }
  }

  private fun currentStore(): NotificationStore {
    noticeContext = applicationContext
    return NotificationStore.shared(applicationContext.noBackupFilesDir).also { it.start() }
  }

  private fun readRaw(sbn: StatusBarNotification): RawNotification {
    val notification = sbn.notification
    val extras = notification?.extras
    return RawNotification(
      packageName = sbn.packageName ?: "",
      key = sbn.key ?: "",
      postTime = sbn.postTime,
      title = NotificationExtractor.readExtra { extras?.charSequence(Notification.EXTRA_TITLE) },
      text = NotificationExtractor.readExtra { extras?.charSequence(Notification.EXTRA_TEXT) },
      subText = NotificationExtractor.readExtra { extras?.charSequence(Notification.EXTRA_SUB_TEXT) },
      bigText = NotificationExtractor.readExtra { extras?.charSequence(Notification.EXTRA_BIG_TEXT) },
      isGroupSummary = notification != null &&
        (notification.flags and Notification.FLAG_GROUP_SUMMARY) != 0,
    )
  }

  // Exception class only: the message of an exception can carry notification text.
  private fun logFailure(where: String, error: Exception) {
    Log.w(TAG, "$where failed: ${error.javaClass.simpleName}")
  }

  private fun logDebug(message: String) {
    val debuggable = (applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE) != 0
    if (debuggable) {
      Log.d(TAG, message)
    }
  }

  private companion object {
    const val TAG = "QuipuNotificationListener"
  }
}

private fun Bundle.charSequence(key: String): CharSequence? {
  return getCharSequence(key)
}

// expo.scheme in apps/mobile/app.json
private const val SCHEME = "quipu"
private const val CHANNEL_ID = "quipu"

@Volatile
private var noticeContext: Context? = null

internal fun postDetectedExpenseNotice(item: PendingNotification) {
  val context = noticeContext ?: return
  try {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
      context.checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS) !=
      PackageManager.PERMISSION_GRANTED
    ) {
      return
    }
    val manager = context.getSystemService(NotificationManager::class.java) ?: return
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      manager.createNotificationChannel(
        NotificationChannel(CHANNEL_ID, "Quipu", NotificationManager.IMPORTANCE_DEFAULT),
      )
    }
    val icon = context.applicationInfo.icon
    if (icon == 0) return
    val uri = Uri.Builder()
      .scheme(SCHEME)
      .authority("detected-expense")
      .appendPath(item.id)
      .build()
    val intent = Intent(Intent.ACTION_VIEW, uri)
      .setPackage(context.packageName)
      .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
    val pending = PendingIntent.getActivity(
      context,
      item.id.hashCode(),
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
    val builder = NotificationCompat.Builder(context, CHANNEL_ID)
      .setSmallIcon(icon)
      .setContentTitle("Detectamos un gasto en ${appLabel(context, item.packageName)}")
      .setAutoCancel(true)
      .setContentIntent(pending)
      .setPriority(NotificationCompat.PRIORITY_DEFAULT)
    val cents = item.amountCents
    if (cents != null) builder.setContentText(amountText(cents))
    manager.notify(item.id.hashCode(), builder.build())
  } catch (e: Exception) {
    Log.w("QuipuNotificationListener", "notice failed: ${e.javaClass.simpleName}")
  }
}

private fun appLabel(context: Context, packageName: String): String {
  return try {
    context.packageManager
      .getApplicationInfo(packageName, 0)
      .loadLabel(context.packageManager)
      .toString()
      .ifBlank { packageName }
  } catch (_: PackageManager.NameNotFoundException) {
    packageName
  }
}

private fun amountText(cents: Int): String {
  val whole = cents / 100
  val fraction = (cents % 100).toString().padStart(2, '0')
  val grouped = whole.toString().reversed().chunked(3).joinToString(",").reversed()
  return "S/ $grouped.$fraction"
}
