package expo.modules.quipunotificationlistener

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class NotificationExtractorTest {
  @Test
  fun registeredSetMatchesOnlyListedPackages() {
    val sources = setOf("com.bank.one", "com.bank.two")
    assertTrue(NotificationExtractor.isRegistered("com.bank.one", sources))
    assertTrue(NotificationExtractor.isRegistered("com.bank.two", sources))
    assertFalse(NotificationExtractor.isRegistered("com.bank.three", sources))
    assertFalse(NotificationExtractor.isRegistered("com.bank", sources))
  }

  @Test
  fun idIncludesKeyAndPostTime() {
    val first = extract(key = "0|com.bank.one|7|tag|0", postTime = 10)
    val sameSlotLater = extract(key = "0|com.bank.one|7|tag|0", postTime = 11)
    val otherPackageSameInteger = extract(key = "0|com.bank.two|7|tag|0", postTime = 10)

    assertEquals("0|com.bank.one|7|tag|0|10", first.id)
    assertFalse(first.id == "7")
    assertTrue(first.id != sameSlotLater.id)
    assertTrue(first.id != otherPackageSameInteger.id)
  }

  @Test
  fun keepsTitleWhenTextIsEmpty() {
    val pending = extract(title = "Pago", text = "  ")
    assertEquals("Pago", pending.title)
    assertEquals("", pending.text)
    assertNull(pending.subText)
    assertNull(pending.bigText)
  }

  @Test
  fun dropsEmptyContentAndGroupSummaries() {
    assertNull(
      NotificationExtractor.extract(
        raw(title = " ", text = "", subText = null, bigText = "  "),
      ),
    )
    assertNull(
      NotificationExtractor.extract(
        raw(title = null, text = null, subText = null, bigText = null),
      ),
    )
    assertNull(
      NotificationExtractor.extract(
        raw(title = "resumen", text = "3 mensajes", isGroupSummary = true),
      ),
    )
  }

  @Test
  fun missingExtrasBecomeEmptyFieldsAndStillKeepRealText() {
    val pending = extract(title = null, text = "S/ 12.50", subText = null, bigText = null)
    assertEquals("", pending.title)
    assertEquals("S/ 12.50", pending.text)
    assertNull(pending.subText)
  }

  @Test
  fun malformedExtraIsIgnored() {
    assertNull(NotificationExtractor.readExtra { throw ClassCastException("bad parcel") })
    assertEquals("hola", NotificationExtractor.readExtra { "hola" })
  }

  @Test
  fun keepsSubTextAndBigTextAndTruncates() {
    val longText = "a".repeat(NotificationExtractor.MAX_TEXT_CHARS + 25)
    val pending = extract(title = "T", text = longText, subText = " sub ", bigText = " big ")
    assertEquals(NotificationExtractor.MAX_TEXT_CHARS, pending.text.length)
    assertEquals("sub", pending.subText)
    assertEquals("big", pending.bigText)
  }

  @Test
  fun dropsBlankKeyOrPackage() {
    assertNull(NotificationExtractor.extract(raw(packageName = " ", key = "k")))
    assertNull(NotificationExtractor.extract(raw(packageName = "com.bank", key = " ")))
  }

  private fun extract(
    packageName: String = "com.bank.one",
    key: String = "0|com.bank.one|1|null|0",
    postTime: Long = 1_700_000_000_000,
    title: String? = "Pago",
    text: String? = "S/ 10.00",
    subText: String? = null,
    bigText: String? = null,
  ): PendingNotification {
    return NotificationExtractor.extract(
      raw(packageName, key, postTime, title, text, subText, bigText, false),
    ) ?: error("expected a notification")
  }

  private fun raw(
    packageName: String = "com.bank.one",
    key: String = "0|com.bank.one|1|null|0",
    postTime: Long = 1_700_000_000_000,
    title: String? = "Pago",
    text: String? = "S/ 10.00",
    subText: String? = null,
    bigText: String? = null,
    isGroupSummary: Boolean = false,
  ): RawNotification {
    return RawNotification(
      packageName = packageName,
      key = key,
      postTime = postTime,
      title = title,
      text = text,
      subText = subText,
      bigText = bigText,
      isGroupSummary = isGroupSummary,
    )
  }
}
