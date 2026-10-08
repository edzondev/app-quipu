package expo.modules.quipunotificationlistener

import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.provider.Settings
import androidx.core.app.NotificationManagerCompat
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class QuipuNotificationListenerModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("QuipuNotificationListener")

    Events("onNotification")

    OnCreate {
      bind()
    }

    OnDestroy {
      storeOrNull()?.setListener(null)
    }

    Function("isNotificationAccessEnabled") {
      val context = applicationContext() ?: return@Function false
      isAccessEnabled(context)
    }

    Function("openNotificationAccessSettings") {
      val context = applicationContext() ?: return@Function null
      openAccessSettings(context)
      null
    }

    AsyncFunction("addSource") { packageName: String ->
      val store = bind() ?: return@AsyncFunction false
      store.awaitReady()
      val added = store.addSource(packageName)
      store.flush()
      added
    }

    AsyncFunction("removeSource") { packageName: String ->
      val store = bind() ?: return@AsyncFunction false
      store.awaitReady()
      val removed = store.removeSource(packageName)
      store.flush()
      removed
    }

    AsyncFunction("getSources") {
      val store = bind() ?: return@AsyncFunction emptyList<String>()
      store.awaitReady()
      store.sources()
    }

    AsyncFunction("getPendingNotifications") {
      val store = bind() ?: return@AsyncFunction emptyList<Map<String, Any?>>()
      store.awaitReady()
      store.pending().map { it.toPayload() }
    }

    AsyncFunction("consumeNotification") { id: String ->
      val store = bind() ?: return@AsyncFunction false
      store.awaitReady()
      val consumed = store.consume(id)
      store.flush()
      consumed
    }

    AsyncFunction("clearPendingNotifications") {
      val store = bind() ?: return@AsyncFunction Unit
      store.awaitReady()
      store.clear()
      store.flush()
    }

    AsyncFunction("getDiagnostics") {
      val context = applicationContext() ?: return@AsyncFunction null
      if (!isDebuggable(context)) return@AsyncFunction null
      val store = bind() ?: return@AsyncFunction null
      store.awaitReady()
      val stats = store.diagnostics()
      mapOf(
        "accessEnabled" to isAccessEnabled(context),
        "loaded" to stats.loaded,
        "sourceCount" to stats.sourceCount,
        "pendingCount" to stats.pendingCount,
        "recentIdCount" to stats.recentIdCount,
        "filteredOut" to stats.filteredOut,
        "matched" to stats.matched,
        "enqueued" to stats.enqueued,
        "deduped" to stats.deduped,
        "consumed" to stats.consumed,
      )
    }
  }

  private fun bind(): NotificationStore? {
    val store = storeOrNull() ?: return null
    store.setListener { item ->
      try {
        sendEvent("onNotification", item.toPayload())
      } catch (_: Throwable) {
      }
    }
    return store
  }

  private fun storeOrNull(): NotificationStore? {
    val context = applicationContext() ?: return null
    return try {
      NotificationStore.shared(context.filesDir).also { it.start() }
    } catch (_: Throwable) {
      null
    }
  }

  private fun applicationContext(): Context? {
    return try {
      appContext.reactContext?.applicationContext
    } catch (_: Throwable) {
      null
    }
  }
}

private fun isDebuggable(context: Context): Boolean {
  return (context.applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE) != 0
}

private fun isAccessEnabled(context: Context): Boolean {
  return try {
    NotificationManagerCompat.getEnabledListenerPackages(context).contains(context.packageName)
  } catch (_: Throwable) {
    false
  }
}

private fun openAccessSettings(context: Context) {
  try {
    val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
      .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    context.startActivity(intent)
  } catch (_: Throwable) {
  }
}

private fun PendingNotification.toPayload(): Map<String, Any?> {
  val payload = linkedMapOf<String, Any?>(
    "id" to id,
    "packageName" to packageName,
    "postedAt" to postedAt,
    "title" to title,
    "text" to text,
  )
  if (subText != null) payload["subText"] = subText
  if (bigText != null) payload["bigText"] = bigText
  return payload
}
