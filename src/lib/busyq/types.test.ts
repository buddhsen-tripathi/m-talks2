import { describe, expect, it } from "vitest";
import { z } from "zod";
import { answerKey, invoices, payments, priceList } from "./fixtures/index.ts";
import { fail, Invoice, ok, PriceRow, toolResultSchema } from "./types.ts";

describe("fixtures", () => {
	it("parse against the shared schemas", () => {
		expect(priceList).toHaveLength(3);
		expect(invoices.map((i) => i.id)).toEqual([
			"inv-clean",
			"inv-overcharge",
			"inv-variant",
		]);
		expect(payments).toHaveLength(3);
		expect(answerKey).toHaveLength(4);
	});
});

describe("schemas", () => {
	it("reject float amounts and malformed decimals", () => {
		const line = invoices[0].lines[0];
		const bad = { ...invoices[0], lines: [{ ...line, unitPrice: 0.85 }] };
		expect(Invoice.safeParse(bad).success).toBe(false);
		const commas = { ...invoices[0], statedTotal: "1,200.00" };
		expect(Invoice.safeParse(commas).success).toBe(false);
	});

	it("require packUnit and packSize together", () => {
		const { packSize: _omit, ...row } = priceList[0];
		expect(PriceRow.safeParse(row).success).toBe(false);
	});
});

describe("ToolResult", () => {
	const schema = toolResultSchema(z.object({ count: z.number() }));

	it("round-trips ok and error results", () => {
		expect(schema.parse(ok({ count: 2 }))).toEqual({
			ok: true,
			data: { count: 2 },
		});
		const err = fail("price_not_found", "No agreed price for SYSCO Foods", {
			vendor: "SYSCO Foods",
		});
		expect(schema.parse(err)).toEqual(err);
	});

	it("rejects unknown error codes", () => {
		expect(
			schema.safeParse({ ok: false, error: { code: "oops", message: "x" } })
				.success,
		).toBe(false);
	});
});
