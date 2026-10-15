package expo.modules.quipunotificationlistener

import org.junit.Assert.assertEquals
import org.junit.Test

class IconRasterTest {
  @Test
  fun zeroOrNegativeIntrinsicFillsTheSquare() {
    assertEquals(IconRaster.Box(0, 0, 96, 96), IconRaster.bounds(0, 0))
    assertEquals(IconRaster.Box(0, 0, 96, 96), IconRaster.bounds(-1, -1))
    assertEquals(IconRaster.Box(0, 0, 96, 96), IconRaster.bounds(-5, 200))
  }

  @Test
  fun positiveIntrinsicFitsInsideTheSquare() {
    assertEquals(IconRaster.Box(0, 0, 96, 96), IconRaster.bounds(192, 192))
    assertEquals(IconRaster.Box(0, 24, 96, 72), IconRaster.bounds(192, 96))
  }
}
