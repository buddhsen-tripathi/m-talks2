import BigConstructor from "big.js";

/**
 * Rounding modes used by tax and money rules.
 * - `half-up`: commercial rounding (0.5 → away from zero). The default.
 * - `half-even`: banker's rounding (0.5 → nearest even digit).
 * - `down`: truncate toward zero.
 * - `up`: away from zero.
 */
export type RoundingMode = "half-up" | "half-even" | "down" | "up";

export const BIG_ROUNDING: Record<RoundingMode, 0 | 1 | 2 | 3> = {
	down: BigConstructor.roundDown,
	"half-up": BigConstructor.roundHalfUp,
	"half-even": BigConstructor.roundHalfEven,
	up: BigConstructor.roundUp,
};
