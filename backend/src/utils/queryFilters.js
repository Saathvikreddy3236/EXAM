import { ApiError } from "./http.js";
import { toBaseCurrency } from "./currency.js";

export function parseListParam(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => String(item).split(",")).map((item) => item.trim()).filter(Boolean);
  }

  return String(value).split(",").map((item) => item.trim()).filter(Boolean);
}

export function parseNumericListParam(value) {
  return parseListParam(value).map((item) => Number(item)).filter((item) => Number.isFinite(item));
}

export function normalizeExpenseFilters(query = {}) {
  const filters = {
    categoryIds: parseNumericListParam(query.categoryIds || query.categories),
    modeIds: parseNumericListParam(query.modeIds || query.paymentModes),
    startDate: query.startDate ? String(query.startDate) : "",
    endDate: query.endDate ? String(query.endDate) : "",
    minAmount: query.minAmount !== undefined && query.minAmount !== "" ? Number(query.minAmount) : null,
    maxAmount: query.maxAmount !== undefined && query.maxAmount !== "" ? Number(query.maxAmount) : null,
    search: query.search ? String(query.search).trim() : "",
  };

  const today = new Date().toLocaleDateString("en-CA");
  if (filters.startDate && filters.startDate > today) {
    throw new ApiError(400, "Start date cannot be in the future.");
  }
  if (filters.endDate && filters.endDate > today) {
    throw new ApiError(400, "End date cannot be in the future.");
  }
  if (filters.startDate && filters.endDate && filters.startDate > filters.endDate) {
    throw new ApiError(400, "Start date cannot be later than end date.");
  }
  if (filters.minAmount !== null && (!Number.isFinite(filters.minAmount) || filters.minAmount < 0)) {
    throw new ApiError(400, "Minimum amount must be a valid non-negative number.");
  }
  if (filters.maxAmount !== null && (!Number.isFinite(filters.maxAmount) || filters.maxAmount < 0)) {
    throw new ApiError(400, "Maximum amount must be a valid non-negative number.");
  }
  if (filters.minAmount !== null && filters.maxAmount !== null && filters.minAmount > filters.maxAmount) {
    throw new ApiError(400, "Minimum amount cannot be greater than maximum amount.");
  }

  return filters;
}

export function normalizeSortParams(query = {}, allowed = ["date", "amount"]) {
  const rawSortBy = String(query.sortBy || "date").toLowerCase();
  const rawSortOrder = String(query.sortOrder || "desc").toLowerCase();

  return {
    sortBy: allowed.includes(rawSortBy) ? rawSortBy : "date",
    sortOrder: rawSortOrder === "asc" ? "asc" : "desc",
  };
}

export function convertFilterAmountsToBase(filters, currency) {
  return {
    ...filters,
    minAmount: filters.minAmount !== null && filters.minAmount !== undefined ? toBaseCurrency(filters.minAmount, currency) : null,
    maxAmount: filters.maxAmount !== null && filters.maxAmount !== undefined ? toBaseCurrency(filters.maxAmount, currency) : null,
  };
}
