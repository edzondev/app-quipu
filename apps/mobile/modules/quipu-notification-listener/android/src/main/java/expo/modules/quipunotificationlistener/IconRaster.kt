package expo.modules.quipunotificationlistener

import kotlin.math.min

/** Where to draw an app icon inside a fixed square. No Android types. */
internal object IconRaster {
  const val EDGE = 96

  data class Box(val left: Int, val top: Int, val right: Int, val bottom: Int)

  fun bounds(intrinsicWidth: Int, intrinsicHeight: Int): Box {
    if (intrinsicWidth <= 0 || intrinsicHeight <= 0) {
      return Box(0, 0, EDGE, EDGE)
    }
    val scale = min(EDGE.toFloat() / intrinsicWidth, EDGE.toFloat() / intrinsicHeight)
    val width = (intrinsicWidth * scale).toInt().coerceIn(1, EDGE)
    val height = (intrinsicHeight * scale).toInt().coerceIn(1, EDGE)
    val left = (EDGE - width) / 2
    val top = (EDGE - height) / 2
    return Box(left, top, left + width, top + height)
  }
}
