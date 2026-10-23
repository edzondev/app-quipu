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

/**
 * System entry point. This is not the Expo module: it does not touch JS, and it does
 * not keep an Activity, a React context, or the [StatusBarNotification].
 *
 * [onNotificationPosted] compares the posting package with Quipu and the chosen banks
 * before it reads extras. While the on-disk set is still loading, the event is dropped.
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
      when (noticeGate(packageName, this.packageName, store.isReady(), packageName in store.sources())) {
        NoticeGate.Drop -> return
        NoticeGate.Filter -> {
          store.noteFiltered()
          return
        }
        NoticeGate.Read -> Unit
      }
      val notice = NotificationExtractor.detectedNotice(readRaw(sbn)) ?: return
      if (!store.claim(notice.id)) return
      postNotice(this, notice, noticeBankName(notice.packageName))
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

private fun Bundle.charSequence(key: String): CharSequence? = getCharSequence(key)

private const val SCHEME = "quipu"
private const val CHANNEL_ID = "quipu"

private fun postNotice(context: Context, notice: DetectedNotice, bank: String) {
  try {
    if (Build.VERSION.SDK_INT >= 33 &&
      context.checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS) !=
      PackageManager.PERMISSION_GRANTED
    ) return
    val manager = context.getSystemService(NotificationManager::class.java) ?: return
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      manager.createNotificationChannel(
        NotificationChannel(CHANNEL_ID, "Quipu", NotificationManager.IMPORTANCE_DEFAULT),
      )
    }
    val icon = context.applicationInfo.icon
    if (icon == 0) return
    val flags = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    val open = Intent(Intent.ACTION_VIEW, noticeUri(notice, bank))
      .setPackage(context.packageName)
      .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
    val noticeId = postedNoticeId(notice.id)
    val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      Notification.Builder(context, CHANNEL_ID)
    } else {
      @Suppress("DEPRECATION")
      Notification.Builder(context)
    }
    manager.notify(noticeId, builder.setSmallIcon(icon)
      .setContentTitle(expenseNoticeTitle(bank))
      .setContentText(expenseNoticeBody(notice.amountCents, notice.merchant))
      .setAutoCancel(true)
      .setContentIntent(PendingIntent.getActivity(context, noticeId, open, flags))
      .build())
  } catch (e: Exception) {
    Log.w("QuipuNotificationListener", "notice failed: ${e.javaClass.simpleName}")
  }
}

private fun postedNoticeId(id: String): Int = id.hashCode()

internal fun cancelPostedNotices(context: Context, ids: List<String>) {
  if (ids.isEmpty()) return
  try {
    val manager = context.getSystemService(NotificationManager::class.java) ?: return
    for (id in ids) manager.cancel(postedNoticeId(id))
  } catch (e: Exception) {
    Log.w("QuipuNotificationListener", "notice cancel failed: ${e.javaClass.simpleName}")
  }
}

private fun noticeUri(notice: DetectedNotice, bank: String): Uri {
  val uri = Uri.Builder().scheme(SCHEME).authority("detected-expense")
    .appendQueryParameter("id", notice.id)
    .appendQueryParameter("bank", bank)
    .appendQueryParameter("at", notice.postedAt.toString())
  notice.amountCents?.let { uri.appendQueryParameter("cents", it.toString()) }
  val merchant = notice.merchant?.trim().orEmpty()
  if (merchant.isNotEmpty()) uri.appendQueryParameter("merchant", merchant)
  return uri.build()
}
