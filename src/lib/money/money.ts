import { minorUnitDigits } from "./currency.ts";
import { type Big, Decimal, dec } from "./decimal.ts";
import { BIG_ROUNDING, type RoundingMode } from "./rounding.ts";

/**
 * An exact amount: integer minor units (cents, paise) plus its currency.
 * This is the shape amounts are stored and compared in.
 */
export interface Money {
	minor: number;
	currency: string;
}

function assertMinor(minor: number): void {
	if (!Number.isSafeInteger(minor)) {
		throw new RangeError(`Minor units must be a safe integer, got ${minor}`);
	}
}

function assertSameCurrency(a: Money, b: Money): void {
	if (a.currency !== b.currency) {
		throw new TypeError(`Currency mismatch: ${a.currency} vs ${b.currency}`);
	}
}

/** Round a decimal major-unit amount to minor units. The one place rounding happens. */
export function toMinor(
	amount: string | Big,
	currency: string,
	mode: RoundingMode = "half-up",
): Money {
	const digits = minorUnitDigits(currency);
	const scaled = dec(amount).times(new Decimal("10").pow(digits));
	// `|| 0` folds -0 (from rounding a tiny negative) into 0.
	const minor = Number(scaled.round(0, BIG_ROUNDING[mode]).toFixed(0)) || 0;
	assertMinor(minor);
	return { minor, currency };
}

/** Major-unit decimal for display or further calculation (exact). */
export function toMajor(money: Money): Big {
	assertMinor(money.minor);
	const digits = minorUnitDigits(money.currency);
	return new Decimal(String(money.minor)).div(new Decimal("10").pow(digits));
}

/** Exact `quantity × unitPrice`, unrounded. Round with `toMinor` when the rule says so. */
export function lineAmount(
	quantity: string | Big,
	unitPrice: string | Big,
): Big {
	return dec(quantity).times(dec(unitPrice));
}

export function zero(currency: string): Money {
	return { minor: 0, currency };
}

export function addMoney(a: Money, b: Money): Money {
	assertSameCurrency(a, b);
	const minor = a.minor + b.minor;
	assertMinor(minor);
	return { minor, currency: a.currency };
}

export function subtractMoney(a: Money, b: Money): Money {
	assertSameCurrency(a, b);
	const minor = a.minor - b.minor;
	assertMinor(minor);
	return { minor, currency: a.currency };
}

export function sumMoney(values: readonly Money[], currency: string): Money {
	return values.reduce((acc, v) => addMoney(acc, v), zero(currency));
}

export function compareMoney(a: Money, b: Money): -1 | 0 | 1 {
	assertSameCurrency(a, b);
	return a.minor === b.minor ? 0 : a.minor < b.minor ? -1 : 1;
}

/** Locale-formatted amount, e.g. `$72.00`, `₹1,20,000.00`. */
export function formatMoney(money: Money, locale = "en-US"): string {
	const digits = minorUnitDigits(money.currency);
	// Format the exact decimal string; Intl accepts numeric strings without float conversion.
	return new Intl.NumberFormat(locale, {
		style: "currency",
		currency: money.currency,
		minimumFractionDigits: digits,
		maximumFractionDigits: digits,
	}).format(toMajor(money).toFixed(digits) as unknown as number);
}
