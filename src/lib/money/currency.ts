const CURRENCY_PATTERN = /^[A-Z]{3}$/;
const exponentCache = new Map<string, number>();

export function isCurrencyCode(code: string): boolean {
	return CURRENCY_PATTERN.test(code);
}

/**
 * Number of minor-unit digits for an ISO 4217 currency
 * (USD/INR/EUR → 2, JPY → 0, BHD/KWD → 3), from the runtime's ICU data.
 */
export function minorUnitDigits(currency: string): number {
	const cached = exponentCache.get(currency);
	if (cached !== undefined) return cached;
	if (!isCurrencyCode(currency)) {
		throw new RangeError(`Not an ISO 4217 currency code: "${currency}"`);
	}
	const digits = new Intl.NumberFormat("en", {
		style: "currency",
		currency,
	}).resolvedOptions().maximumFractionDigits;
	if (digits === undefined) {
		throw new RangeError(`Unknown minor units for ${currency}`);
	}
	exponentCache.set(currency, digits);
	return digits;
}
