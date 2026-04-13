const BASE_CURRENCY = "USD";
const supportedCurrencies = ["INR", "USD", "EUR", "GBP"];

// Rates are expressed as target-units per 1 USD.
const defaultRates = {
  USD: 1,
  INR: 83.25,
  EUR: 0.92,
  GBP: 0.79,
};

function loadRates() {
  if (!process.env.CURRENCY_RATES_JSON) {
    return defaultRates;
  }

  try {
    const parsed = JSON.parse(process.env.CURRENCY_RATES_JSON);
    return { ...defaultRates, ...parsed };
  } catch (_error) {
    return defaultRates;
  }
}

const rates = loadRates();

export function isSupportedCurrency(currency) {
  return supportedCurrencies.includes(currency);
}

export function normalizeCurrency(currency) {
  return isSupportedCurrency(currency) ? currency : BASE_CURRENCY;
}

export function roundMoney(amount) {
  return Number(Number(amount || 0).toFixed(2));
}

export function toBaseCurrency(amount, fromCurrency) {
  const normalizedFrom = normalizeCurrency(fromCurrency);
  return roundMoney(Number(amount) / rates[normalizedFrom]);
}

export function fromBaseCurrency(amount, toCurrency) {
  const normalizedTo = normalizeCurrency(toCurrency);
  return roundMoney(Number(amount) * rates[normalizedTo]);
}

export function convertCurrency(amount, fromCurrency, toCurrency) {
  if (normalizeCurrency(fromCurrency) === normalizeCurrency(toCurrency)) {
    return roundMoney(amount);
  }

  return fromBaseCurrency(toBaseCurrency(amount, fromCurrency), toCurrency);
}

export function getBaseCurrency() {
  return BASE_CURRENCY;
}
