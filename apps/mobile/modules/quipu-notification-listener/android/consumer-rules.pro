# The listener is started by name from the merged manifest. R8 would otherwise
# treat it as unused because no Java/Kotlin code references the class.
-keep class expo.modules.quipunotificationlistener.QuipuNotificationListenerService { *; }
