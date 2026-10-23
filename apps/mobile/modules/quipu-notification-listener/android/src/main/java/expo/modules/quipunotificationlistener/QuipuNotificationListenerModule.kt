package expo.modules.quipunotificationlistener

import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.provider.Settings
import android.util.Log
import androidx.core.app.NotificationManagerCompat
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

private const val TAG = "QuipuNotificationListener"

class QuipuNotificationListenerModule : Module() {
  @Volatile
  private var boundStore: NotificationStore? = null

  override fun definition() = ModuleDefinition {
    Name("QuipuNotificationListener")

    OnCreate {
      bind()
    }

    OnDestroy {
      boundStore = null
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

    AsyncFunction("addSource") { input: String ->
      val store = bind() ?: return@AsyncFunction AddSource.INVALID_LINK
      store.awaitReady()
      val sources = store.sources()
      val decision = AddSource.resolve(
        input,
        sources.toSet(),
        sources.size >= NotificationStore.MAX_SOURCES,
      ) { packageId -> isPackageInstalled(packageId) }
      if (AddSource.persists(decision.code)) {
        val packageId = decision.packageId ?: return@AsyncFunction AddSource.INVALID_LINK
        val saved = store.addSource(packageId)
        store.flush()
        if (!saved) return@AsyncFunction AddSource.LIMIT_REACHED
      }
      decision.code
    }

    AsyncFunction("getInstalledBanks") {
      val context = applicationContext() ?: return@AsyncFunction emptyList<Map<String, Any?>>()
      InstalledBanks.list(context.packageManager)
    }

    Function("parsePlayStoreLink") { text: String ->
      PlayStoreLinks.toPayload(text)
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

    Function("dismissNotice") { id: String ->
      DetectedNotices.dismiss(id)
      null
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
        "recentIdCount" to stats.recentIdCount,
        "filteredOut" to stats.filteredOut,
        "matched" to stats.matched,
        "deduped" to stats.deduped,
      )
    }
  }

  private fun bind(): NotificationStore? {
    boundStore?.let { return it }
    val store = storeOrNull() ?: return null
    boundStore = store
    return store
  }

  private fun storeOrNull(): NotificationStore? {
    val context = applicationContext() ?: return null
    return try {
      NotificationStore.shared(context.noBackupFilesDir).also { it.start() }
    } catch (e: Exception) {
      Log.w(TAG, "store start failed: ${e.javaClass.simpleName}")
      null
    }
  }

  private fun applicationContext(): Context? = appContext.reactContext?.applicationContext

  private fun isPackageInstalled(packageId: String): Boolean {
    val context = applicationContext() ?: return false
    return try {
      context.packageManager.getPackageInfo(packageId, 0)
      true
    } catch (_: PackageManager.NameNotFoundException) {
      false
    }
  }
}

private fun isDebuggable(context: Context): Boolean {
  return (context.applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE) != 0
}

private fun isAccessEnabled(context: Context): Boolean {
  return try {
    NotificationManagerCompat.getEnabledListenerPackages(context).contains(context.packageName)
  } catch (e: SecurityException) {
    Log.w(TAG, "access check failed: ${e.javaClass.simpleName}")
    false
  }
}

private fun openAccessSettings(context: Context) {
  try {
    val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
      .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    context.startActivity(intent)
  } catch (e: ActivityNotFoundException) {
    Log.w(TAG, "settings screen missing: ${e.javaClass.simpleName}")
  }
}
