/**
 * Small, hand-written fixtures so rules, UI and agent work can start before
 * generated data exists. Validated against the shared schemas on import.
 */
import { z } from "zod";
import { AnswerKeyRow, Invoice, Payment, PriceRow } from "../types.ts";

export const priceList = z.array(PriceRow).parse([
	{
		vendor: "Sysco",
		item: "Chicken breast",
		unit: "lb",
		unitPrice: "2.10",
		currency: "USD",
		packUnit: "case",
		packSize: "40",
	},
	{
		vendor: "Sysco",
		item: "Yellow onions",
		unit: "lb",
		unitPrice: "0.85",
		currency: "USD",
		packUnit: "bag",
		packSize: "50",
	},
	{
		vendor: "Restaurant Depot",
		item: "Canola oil",
		unit: "gal",
		unitPrice: "6.40",
		currency: "USD",
	},
]);

export const invoices = z.array(Invoice).parse([
	{
		// Clean: everything matches.
		id: "inv-clean",
		vendor: "Sysco",
		invoiceNumber: "SY-1001",
		issueDate: "2026-09-01",
		dueDate: "2026-10-01",
		currency: "USD",
		lines: [
			{
				lineNo: 1,
				item: "Yellow onions",
				quantity: "100",
				unit: "lb",
				unitPrice: "0.85",
				amount: "85.00",
			},
		],
		statedTotal: "85.00",
	},
	{
		// Overcharge: agreed 2.10/lb, billed 2.16/lb on 1,200 lb → $72.00.
		id: "inv-overcharge",
		vendor: "Sysco",
		invoiceNumber: "SY-1002",
		issueDate: "2026-09-08",
		dueDate: "2026-10-08",
		currency: "USD",
		lines: [
			{
				lineNo: 1,
				item: "Chicken breast",
				quantity: "1200",
				unit: "lb",
				unitPrice: "2.16",
				amount: "2592.00",
			},
		],
		statedTotal: "2592.00",
	},
	{
		// v1 failure: vendor name variant and pack unit. v2 resolves to Sysco / lb.
		id: "inv-variant",
		vendor: "SYSCO Foods",
		invoiceNumber: "SY-1003",
		issueDate: "2026-09-15",
		dueDate: "2026-10-15",
		currency: "USD",
		lines: [
			{
				lineNo: 1,
				item: "Chicken breast",
				quantity: "30",
				unit: "case",
				unitPrice: "86.40",
				amount: "2592.00",
			},
		],
		statedTotal: "2592.00",
	},
]);

export const payments = z.array(Payment).parse([
	{
		id: "pay-1",
		vendor: "Sysco",
		invoiceNumber: "SY-1001",
		amount: "85.00",
		currency: "USD",
		paidOn: "2026-09-20",
		reference: "ACH-5501",
	},
	{
		// Duplicate of pay-1.
		id: "pay-2",
		vendor: "Sysco",
		invoiceNumber: "SY-1001",
		amount: "85.00",
		currency: "USD",
		paidOn: "2026-09-21",
		reference: "ACH-5502",
	},
	{
		// No matching invoice.
		id: "pay-3",
		vendor: "Restaurant Depot",
		invoiceNumber: null,
		amount: "310.00",
		currency: "USD",
		paidOn: "2026-09-22",
		reference: "CHK-118",
	},
]);

export const answerKey = z.array(AnswerKeyRow).parse([
	{
		kind: "overcharge",
		invoiceId: "inv-overcharge",
		lineNo: 1,
		paymentId: null,
		expectedImpactMinor: 7200,
		currency: "USD",
	},
	{
		// 30 cases × 40 lb × (2.16 − 2.10) = $72.00, found only once units convert.
		kind: "overcharge",
		invoiceId: "inv-variant",
		lineNo: 1,
		paymentId: null,
		expectedImpactMinor: 7200,
		currency: "USD",
	},
	{
		kind: "duplicate_payment",
		invoiceId: "inv-clean",
		lineNo: null,
		paymentId: "pay-2",
		expectedImpactMinor: 8500,
		currency: "USD",
	},
	{
		kind: "orphan_payment",
		invoiceId: null,
		lineNo: null,
		paymentId: "pay-3",
		expectedImpactMinor: 31000,
		currency: "USD",
	},
]);
