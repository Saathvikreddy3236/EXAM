export function formatCurrency(amount, currency = 'USD') {
  const numericAmount = Number(amount || 0);

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(numericAmount);
  } catch (_error) {
    return `${currency} ${numericAmount.toFixed(2)}`;
  }
}
