package expo.modules.quipunotificationlistener

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/** Swiping the notice away drops the in-memory entry and saves nothing. */
class NoticeDismissedReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val id = intent.getStringExtra(DetectedNotices.EXTRA_ID) ?: return
    DetectedNotices.dismiss(id)
  }
}
