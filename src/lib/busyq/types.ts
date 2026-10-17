/**
 * BusyQ data contract. The data generator, rules engine, persistence, agent
 * tools and review UI all build against these schemas, so change them in a
 * small PR of their own.
 *
 * Amounts in source documents (invoices, payments, price list) are decimal
 * strings exactly as printed. Computed amounts (impact) are integer minor
 * units. JS numbers are never used for money.
 */
import { z } from "zod";
import { DECIMAL_PATTERN, isCurrencyCode } from "#/lib/money/index.ts";

// ── Primitives ───────────────────────────────────────────────────────

export const DecimalString = z
	.string()
	.regex(DECIMAL_PATTERN, "Expected a decimal string like 2.16");
export const PositiveDecimalString = DecimalString.refine(
	(v) => !v.startsWith("-") && /[1-9]/.test(v),
	"Expected a positive decimal",
);
export const CurrencyCode = z
	.string()
	.refine(isCurrencyCode, "Expected an ISO 4217 code like USD");
export const IsoDate = z.iso.date();
/** Integer minor units (cents). Safe-integer only. */
export const MinorUnits = z.number().int().safe();

export const AgentVersion = z.enum(["v1", "v2"]);
export type AgentVersion = z.infer<typeof AgentVersion>;

// ── Price list (agreed prices) ───────────────────────────────────────

/**
 * One agreed price. `unitPrice` is per `unit`. When a vendor also sells the
 * item by pack, `packUnit` + `packSize` say how many `unit`s one pack holds
 * (e.g. unit "lb", packUnit "case", packSize "40" → 1 case = 40 lb).
 */
export const PriceRow = z
	.object({
		vendor: z.string().min(1),
		item: z.string().min(1),
		unit: z.string().min(1),
		unitPrice: PositiveDecimalString,
		currency: CurrencyCode,
		packUnit: z.string().min(1).optional(),
		packSize: PositiveDecimalString.optional(),
	})
	.refine((r) => (r.packUnit === undefined) === (r.packSize === undefined), {
		message: "packUnit and packSize go together",
		path: ["packSize"],
	});
export type PriceRow = z.infer<typeof PriceRow>;

// ── Invoices ─────────────────────────────────────────────────────────

export const InvoiceLine = z.object({
	lineNo: z.number().int().positive(),
	item: z.string().min(1),
	quantity: PositiveDecimalString,
	unit: z.string().min(1),
	unitPrice: DecimalString,
	/** Line amount as printed on the invoice (may be wrong; that's what we check). */
	amount: DecimalString,
});
export type InvoiceLine = z.infer<typeof InvoiceLine>;

export const Invoice = z.object({
	id: z.string().min(1),
	/** Vendor name as printed; may not match the price list exactly. */
	vendor: z.string().min(1),
	invoiceNumber: z.string().min(1),
	issueDate: IsoDate,
	dueDate: IsoDate.optional(),
	currency: CurrencyCode,
	lines: z.array(InvoiceLine).min(1),
	/** Total as printed on the invoice. */
	statedTotal: DecimalString,
});
export type Invoice = z.infer<typeof Invoice>;

// ── Payments ─────────────────────────────────────────────────────────

export const Payment = z.object({
	id: z.string().min(1),
	vendor: z.string().min(1),
	/** Null when the payment can't be tied to any invoice. */
	invoiceNumber: z.string().min(1).nullable(),
	amount: PositiveDecimalString,
	currency: CurrencyCode,
	paidOn: IsoDate,
	reference: z.string().min(1),
});
export type Payment = z.infer<typeof Payment>;

// ── Findings ─────────────────────────────────────────────────────────

export const FindingKind = z.enum([
	/** Billed unit price above the agreed price. */
	"overcharge",
	/** The same line billed twice on one invoice. */
	"duplicate_line",
	/** Lines don't add up to the stated total. */
	"wrong_total",
	/** The same invoice paid more than once. */
	"duplicate_payment",
	/** A payment with no matching invoice. */
	"orphan_payment",
]);
export type FindingKind = z.infer<typeof FindingKind>;

/** A money problem detected by code. `impactMinor` is what the owner can recover. */
export const Finding = z.object({
	kind: FindingKind,
	invoiceId: z.string().min(1).nullable(),
	lineNo: z.number().int().positive().nullable(),
	paymentId: z.string().min(1).nullable(),
	/** What it should have been (e.g. agreed unit price), as a decimal string. */
	expected: DecimalString.nullable(),
	/** What was billed or paid, as a decimal string. */
	actual: DecimalString.nullable(),
	impactMinor: MinorUnits,
	currency: CurrencyCode,
	/** Short, code-generated description. Not model output. */
	detail: z.string().min(1),
});
export type Finding = z.infer<typeof Finding>;

/** One planted mistake, for scoring a run (`data/answer_key.csv`). */
export const AnswerKeyRow = z.object({
	kind: FindingKind,
	invoiceId: z.string().min(1).nullable(),
	lineNo: z.number().int().positive().nullable(),
	paymentId: z.string().min(1).nullable(),
	expectedImpactMinor: MinorUnits,
	currency: CurrencyCode,
});
export type AnswerKeyRow = z.infer<typeof AnswerKeyRow>;

// ── Tool results ─────────────────────────────────────────────────────

export const ToolErrorCode = z.enum([
	/** Referenced record doesn't exist. */
	"not_found",
	/** No agreed price for this vendor/item (the v1 failure). */
	"price_not_found",
	/** Billed unit can't be converted to the agreed unit. */
	"unit_mismatch",
	/** Arguments failed validation. */
	"invalid_input",
	/** Unexpected failure inside the tool. */
	"internal",
]);
export type ToolErrorCode = z.infer<typeof ToolErrorCode>;

export const ToolError = z.object({
	code: ToolErrorCode,
	message: z.string().min(1),
	details: z.record(z.string(), z.unknown()).optional(),
});
export type ToolError = z.infer<typeof ToolError>;

/** Tools never throw into the agent loop; they return one of these. */
export type ToolResult<T> =
	| { ok: true; data: T }
	| { ok: false; error: ToolError };

export function toolResultSchema<T extends z.ZodType>(data: T) {
	return z.discriminatedUnion("ok", [
		z.object({ ok: z.literal(true), data }),
		z.object({ ok: z.literal(false), error: ToolError }),
	]);
}

export const ok = <T>(data: T): ToolResult<T> => ({ ok: true, data });
export const fail = (
	code: ToolErrorCode,
	message: string,
	details?: Record<string, unknown>,
): ToolResult<never> => ({
	ok: false,
	error: details ? { code, message, details } : { code, message },
});
