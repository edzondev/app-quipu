export function formatCurrency(
  amount: number,
  currency: { locale: string; code: string },
): string {
  return new Intl.NumberFormat(currency.locale, {
    style: "currency",
    currency: currency.code,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}
