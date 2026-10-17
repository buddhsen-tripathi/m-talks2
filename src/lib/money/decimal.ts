import BigConstructor, { type Big } from "big.js";

/**
 * Decimal arithmetic for quantities, unit prices and line amounts.
 *
 * Strict mode: constructing from a JS number or calling `valueOf()` throws, so
 * a float can never silently enter (or leave) a money calculation. Build values
 * from strings and read them back with `toFixed()` / `toString()`.
 */
export const Decimal = BigConstructor();
Decimal.strict = true;
// Division precision (decimal places); multiplication and addition are exact.
Decimal.DP = 20;
Decimal.RM = BigConstructor.roundHalfUp;

export type { Big };

/** Canonical decimal string: optional minus, digits, optional fraction. */
export const DECIMAL_PATTERN = /^-?\d+(\.\d+)?$/;

export function isDecimalString(value: string): boolean {
	return DECIMAL_PATTERN.test(value);
}

/** Parse a decimal string, rejecting anything that isn't plain digits. */
export function dec(value: string | Big): Big {
	if (typeof value !== "string") return value;
	if (!isDecimalString(value)) {
		throw new TypeError(`Not a decimal string: "${value}"`);
	}
	return new Decimal(value);
}

/** Exact sum of decimal values. */
export function sum(values: readonly (string | Big)[]): Big {
	return values.reduce<Big>((acc, v) => acc.plus(dec(v)), new Decimal("0"));
}
