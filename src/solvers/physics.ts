import { SolverResult } from "../types";

// Helper extractors
const getNum = (re: RegExp, s: string): number | null => {
  const m = s.match(re);
  return m ? parseFloat(m[1]) : null;
};

export const getV = (q: string): number | null => 
  getNum(/V\s*=\s*(\d+\.?\d*)/i, q) ?? getNum(/(\d+\.?\d*)\s*V\b/i, q);

export const getI = (q: string): number | null => {
  const explicit = getNum(/I\s*=\s*(\d+\.?\d*)/i, q);
  if (explicit !== null) return explicit;

  const withUnit = getNum(/(\d+\.?\d*)\s*A\b(?!.*using)/i, q);
  if (withUnit !== null) return withUnit;

  // Search for last occurrence of current
  const allAmps = [...q.matchAll(/(\d+\.?\d*)\s*A\b/gi)];
  return allAmps.length ? parseFloat(allAmps[allAmps.length - 1][1]) : null;
};

export const getR = (q: string): number | null => 
  getNum(/R\s*=\s*(\d+\.?\d*)/i, q) ?? getNum(/(\d+\.?\d*)\s*(?:Ω|ohm|ohms)/i, q);

/**
 * Solves standard physics calculation problems, such as circuit parameters or mechanics.
 */
export function solvePhysics(q: string): SolverResult {
  const lq = q.toLowerCase();
  
  // 1. Ohm's Law Solver (V = I * R)
  const V = getV(q);
  const I = getI(q);
  const R = getR(q);

  if (lq.includes("find r") || lq.includes("calculate resistance") || lq.includes("resistance r")) {
    if (V !== null && I !== null && I !== 0) {
      const val = V / I;
      return {
        solved: true,
        value: Number(val.toFixed(3)),
        explanation: `Using Ohm's Law: R = V / I. Given Voltage V = ${V}V and Current I = ${I}A. Resistance R = ${V} / ${I} = ${val.toFixed(2)} Ω.`
      };
    }
  }

  if (lq.includes("find v") || lq.includes("calculate voltage") || lq.includes("voltage v")) {
    if (I !== null && R !== null) {
      const val = I * R;
      return {
        solved: true,
        value: Number(val.toFixed(3)),
        explanation: `Using Ohm's Law: V = I * R. Given Current I = ${I}A and Resistance R = ${R}Ω. Voltage V = ${I} * ${R} = ${val.toFixed(2)} V.`
      };
    }
  }

  if (lq.includes("find i") || lq.includes("calculate current") || lq.includes("current i")) {
    if (V !== null && R !== null && R !== 0) {
      const val = V / R;
      return {
        solved: true,
        value: Number(val.toFixed(3)),
        explanation: `Using Ohm's Law: I = V / R. Given Voltage V = ${V}V and Resistance R = ${R}Ω. Current I = ${V} / ${R} = ${val.toFixed(3)} A.`
      };
    }
  }

  // 2. Newton's Second Law (F = m * a)
  const mMatch = lq.match(/(?:mass\s*m?\s*=\s*|mass\s+of\s+)(\d+\.?\d*)\s*(?:kg|kilograms)/i);
  const aMatch = lq.match(/(?:acceleration\s*a?\s*=\s*|acceleration\s+of\s+)(\d+\.?\d*)\s*(?:m\/s\^2|m\/s²)/i);
  const fMatch = lq.match(/(?:force\s*f?\s*=\s*|force\s+of\s+)(\d+\.?\d*)\s*(?:n|newtons)/i);

  const mass = mMatch ? parseFloat(mMatch[1]) : null;
  const acceleration = aMatch ? parseFloat(aMatch[1]) : null;
  const force = fMatch ? parseFloat(fMatch[1]) : null;

  if (lq.includes("force") || lq.includes("find f") || lq.includes("calculate force")) {
    if (mass !== null && acceleration !== null) {
      const val = mass * acceleration;
      return {
        solved: true,
        value: Number(val.toFixed(3)),
        explanation: `Using Newton's Second Law: F = m * a. Given mass m = ${mass} kg and acceleration a = ${acceleration} m/s². Force F = ${mass} * ${acceleration} = ${val.toFixed(2)} N.`
      };
    }
  }

  if (lq.includes("acceleration") || lq.includes("find a") || lq.includes("calculate acceleration")) {
    if (force !== null && mass !== null && mass !== 0) {
      const val = force / mass;
      return {
        solved: true,
        value: Number(val.toFixed(3)),
        explanation: `Using Newton's Second Law: a = F / m. Given Force F = ${force} N and mass m = ${mass} kg. Acceleration a = ${force} / ${mass} = ${val.toFixed(2)} m/s².`
      };
    }
  }

  return { solved: false };
}
