package expo.modules.quipunotificationlistener

internal data class Bank(
  val name: String,
  val packageId: String,
)

/** Fixed Peru bank apps. Ids were checked against the Play Store listing. */
internal object BankCatalog {
  val banks: List<Bank> = listOf(
    Bank("Banca Móvil BCP", "com.bcp.bank.bcp"),
    Bank("Yape", "com.bcp.innovacxion.yapeapp"),
    Bank("Interbank APP", "pe.com.interbank.mobilebanking"),
    Bank("Scotiabank Perú", "pe.com.scotiabank.blpm.android.client"),
    Bank("BBVA Perú | Banca Móvil", "com.bbva.nxt_peru"),
    Bank("Banco de la Nación", "pe.com.bn.app.bancodelanacion"),
    Bank("Nueva BanBif App", "pe.com.banbif.pnappmobile"),
    Bank("APP Banco Pichincha Perú", "pe.pichincha.bm"),
    Bank("Caja Arequipa Móvil", "com.cmac.cajamovilaqp"),
  )

  fun contains(packageId: String): Boolean = banks.any { it.packageId == packageId }
}
