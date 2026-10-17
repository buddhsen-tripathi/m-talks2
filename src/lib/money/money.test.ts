import { describe, expect, it } from "vitest";
import {
	addMoney,
	compareMoney,
	Decimal,
	dec,
	formatMoney,
	lineAmount,
	minorUnitDigits,
	subtractMoney,
	sum,
	sumMoney,
	toMajor,
	toMinor,
} from "./index.ts";

describe("worked example", () => {
	it("agreed $2.10/lb, billed $2.16/lb × 1,200 lb → $72.00", () => {
		const billed = lineAmount("1200", "2.16");
		const agreed = lineAmount("1200", "2.10");
		const impact = toMinor(billed.minus(agreed), "USD");
		expect(impact).toEqual({ minor: 7200, currency: "USD" });
		expect(formatMoney(impact)).toBe("$72.00");
	});
});

describe("decimal", () => {
	it("is exact where floats are not", () => {
		expect(dec("0.1").plus(dec("0.2")).toString()).toBe("0.3");
		expect(sum(["0.10", "0.20", "0.30"]).toFixed(2)).toBe("0.60");
	});

	it("refuses JS numbers so floats can't leak in or out", () => {
		expect(() => new Decimal(0.1 as unknown as string)).toThrow();
		expect(() => +dec("1.5")).toThrow();
	});

	it("rejects malformed decimal strings", () => {
		for (const bad of ["", "1e5", "1,200", " 2.10", ".5", "abc"]) {
			expect(() => dec(bad)).toThrow(TypeError);
		}
	});
});

describe("toMinor", () => {
	it("rounds half-up by default", () => {
		expect(toMinor("2.345", "USD").minor).toBe(235);
		expect(toMinor("-2.345", "USD").minor).toBe(-235);
	});

	it("never returns negative zero", () => {
		expect(Object.is(toMinor("-0.001", "USD").minor, 0)).toBe(true);
	});

	it("supports the other rounding modes", () => {
		expect(toMinor("2.345", "USD", "half-even").minor).toBe(234);
		expect(toMinor("2.355", "USD", "half-even").minor).toBe(236);
		expect(toMinor("2.349", "USD", "down").minor).toBe(234);
		expect(toMinor("2.341", "USD", "up").minor).toBe(235);
	});

	it("uses each currency's minor units", () => {
		expect(minorUnitDigits("USD")).toBe(2);
		expect(minorUnitDigits("JPY")).toBe(0);
		expect(minorUnitDigits("BHD")).toBe(3);
		expect(toMinor("1234.5", "JPY").minor).toBe(1235);
		expect(toMinor("1.2345", "BHD").minor).toBe(1235);
	});

	it("rejects bad currency codes", () => {
		expect(() => toMinor("1", "usd")).toThrow(RangeError);
	});

	it("rejects amounts beyond safe integers", () => {
		expect(() => toMinor("100000000000000000", "USD")).toThrow(RangeError);
	});
});

describe("Money arithmetic", () => {
	const a = { minor: 7200, currency: "USD" };
	const b = { minor: 8500, currency: "USD" };

	it("adds, subtracts, sums and compares in minor units", () => {
		expect(addMoney(a, b).minor).toBe(15700);
		expect(subtractMoney(a, b).minor).toBe(-1300);
		expect(sumMoney([a, b, a], "USD").minor).toBe(22900);
		expect(compareMoney(a, b)).toBe(-1);
		expect(toMajor(b).toFixed(2)).toBe("85.00");
	});

	it("refuses to mix currencies", () => {
		expect(() => addMoney(a, { minor: 1, currency: "EUR" })).toThrow(TypeError);
	});

	it("formats by locale", () => {
		expect(formatMoney({ minor: 12000000, currency: "INR" }, "en-IN")).toBe(
			"₹1,20,000.00",
		);
		expect(formatMoney({ minor: -1300, currency: "USD" })).toBe("-$13.00");
	});
});
