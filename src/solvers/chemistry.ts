import { SolverResult } from "../types";

/**
 * Solves standard chemistry calculation problems such as mole calculations (n = m / M).
 */
export function solveChemistry(q: string): SolverResult {
  const lq = q.toLowerCase();
  
  // Extract mass (m) and molar mass (M)
  const mMatch = q.match(/(?:mass\s*m?\s*=\s*|mass\s+of\s+)(\d+\.?\d*)\s*(?:g|grams)/i);
  const MMatch = q.match(/(?:molar\s*mass\s*M?\s*=\s*|molar\s+mass\s+of\s+)(\d+\.?\d*)/i) || q.match(/M\s*=\s*(\d+\.?\d*)/i);

  const mass = mMatch ? parseFloat(mMatch[1]) : null;
  const molarMass = MMatch ? parseFloat(MMatch[1]) : null;

  if (lq.includes("moles") || lq.includes("find n") || lq.includes("calculate moles") || lq.includes("number of moles")) {
    if (mass !== null && molarMass !== null && molarMass !== 0) {
      const val = mass / molarMass;
      return {
        solved: true,
        value: Number(val.toFixed(4)),
        explanation: `Using the Mole Formula: n = m / M. Given mass m = ${mass} g and molar mass M = ${molarMass} g/mol. Number of moles n = ${mass} / ${molarMass} = ${val.toFixed(4)} mol.`
      };
    }
  }

  if (lq.includes("mass") || lq.includes("find m") || lq.includes("calculate mass")) {
    // Check if moles (n) is given
    const nMatch = q.match(/(?:moles\s*n?\s*=\s*|moles\s+of\s+)(\d+\.?\d*)/i) || q.match(/n\s*=\s*(\d+\.?\d*)/i);
    const moles = nMatch ? parseFloat(nMatch[1]) : null;

    if (moles !== null && molarMass !== null) {
      const val = moles * molarMass;
      return {
        solved: true,
        value: Number(val.toFixed(3)),
        explanation: `Using the Mole Formula: m = n * M. Given moles n = ${moles} mol and molar mass M = ${molarMass} g/mol. Mass m = ${moles} * ${molarMass} = ${val.toFixed(2)} g.`
      };
    }
  }

  return { solved: false };
}
