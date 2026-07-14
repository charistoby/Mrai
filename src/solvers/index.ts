import { SolverResult } from "../types";
import { solveLinear, solveQuadratic } from "./algebra";
import { solvePhysics } from "./physics";
import { solveChemistry } from "./chemistry";

/**
 * Unified entry point to solve an academic question locally.
 * If solved, returns the solution and an explanation.
 */
export function solveQuestionLocally(question: string): SolverResult {
  // 1. Try Physics (Ohm's law, F=ma, etc.)
  const physRes = solvePhysics(question);
  if (physRes.solved) return physRes;

  // 2. Try Chemistry (moles n = m/M, etc.)
  const chemRes = solveChemistry(question);
  if (chemRes.solved) return chemRes;

  // 3. Try Quadratic Solver
  const quadRes = solveQuadratic(question);
  if (quadRes.solved) return quadRes;

  // 4. Try Linear Solver
  const linRes = solveLinear(question);
  if (linRes.solved) return linRes;

  return { solved: false };
}

/**
 * Given a set of multiple choice options and a correct answer value (single or list),
 * finds the correct option letter (A, B, C, D).
 */
export function findOptionLetter(options: string[], trueValue: any): string | null {
  if (trueValue == null) return null;
  const targetValues = Array.isArray(trueValue) ? trueValue : [trueValue];
  
  for (const tv of targetValues) {
    for (let i = 0; i < options.length; i++) {
      // Clean up formatting to compare raw numbers
      const cleanedOption = options[i].replace(/\$/g, "").replace(/\\/g, "").replace(/,/g, " ");
      const numbersInOption = cleanedOption.match(/-?\d+\.?\d*/g);
      if (!numbersInOption) continue;
      
      for (const numStr of numbersInOption) {
        if (Math.abs(parseFloat(numStr) - tv) < 0.01) {
          return String.fromCharCode(65 + i); // e.g., 'A', 'B', 'C', 'D'
        }
      }
    }
  }
  return null;
}
