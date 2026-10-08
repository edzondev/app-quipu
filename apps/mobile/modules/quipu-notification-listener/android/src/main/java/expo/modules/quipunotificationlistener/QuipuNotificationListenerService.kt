package expo.modules.quipunotificationlistener

import android.app.Notification
import android.content.pm.ApplicationInfo
import android.os.Bundle
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log

/**
 * System entry point. This is not the Expo module: it does not touch JS, and it does
 * not keep an Activity, a React context, or the [StatusBarNotification].
 *
 * [onNotificationPosted] runs on the main thread. The first thing it does with the
 * notification is compare [StatusBarNotification.getPackageName] to the registered set.
 * Anything else — extras, text, dedupe — happens only after that check. While the
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
      val store = currentStore()
      if (store.isReady() && !store.isSource(packageName)) {
        store.noteFiltered()
        return
      }
      val pending = NotificationExtractor.extract(readRaw(sbn)) ?: return
      store.offer(pending)
    } catch (_: Throwable) {
    }
  }

  private fun startStore() {
    try {
      currentStore()
    } catch (_: Throwable) {
    }
  }

  private fun currentStore(): NotificationStore {
    val filesDir = applicationContext.filesDir
    return NotificationStore.shared(filesDir).also { it.start() }
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
