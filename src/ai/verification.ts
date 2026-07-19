/**
 * Verification engine: Internal-only cross-checking
 * Results stay internal, not exposed to users
 */

import { SolverResult } from "../types";

export interface VerificationResult {
  answer: number | null;
  confidence: number; // Internal only
  verificationMethod: string; // Internal tracking
  crossChecked: boolean; // Internal flag
  discrepancies: string[]; // Internal notes
}

/**
 * Cross-check two solver methods (internal)
 */
export async function crossVerifyAnswer(
  question: string,
  method1Result: SolverResult,
  method2Result: SolverResult
): Promise<VerificationResult> {
  const discrepancies: string[] = [];

  // Both methods agree
  if (method1Result.solved && method2Result.solved) {
    const val1 = Array.isArray(method1Result.value) 
      ? method1Result.value[0] 
      : method1Result.value;
    const val2 = Array.isArray(method2Result.value) 
      ? method2Result.value[0] 
      : method2Result.value;

    if (val1 === val2) {
      return {
        answer: val1 as number,
        confidence: 0.95, // High confidence when both agree
        verificationMethod: 'cross-verified',
        crossChecked: true,
        discrepancies: []
      };
    } else if (typeof val1 === 'number' && typeof val2 === 'number') {
      // Small difference acceptable (within 1%)
      const percentDiff = Math.abs((val1 - val2) / val1) * 100;
      if (percentDiff < 1) {
        return {
          answer: (val1 + val2) / 2,
          confidence: 0.90,
          verificationMethod: 'cross-verified-minor-variance',
          crossChecked: true,
          discrepancies: [`Minor variance: ${percentDiff.toFixed(2)}%`]
        };
      } else {
        discrepancies.push(`Variance detected: ${percentDiff.toFixed(2)}%`);
      }
    }
  }

  // Only one method solved
  if (method1Result.solved && !method2Result.solved) {
    const val1 = Array.isArray(method1Result.value) 
      ? method1Result.value[0] 
      : method1Result.value;
    return {
      answer: val1 as number,
      confidence: 0.75,
      verificationMethod: 'primary-method',
      crossChecked: false,
      discrepancies: ['Secondary method unavailable']
    };
  }

  if (method2Result.solved && !method1Result.solved) {
    const val2 = Array.isArray(method2Result.value) 
      ? method2Result.value[0] 
      : method2Result.value;
    return {
      answer: val2 as number,
      confidence: 0.75,
      verificationMethod: 'secondary-method',
      crossChecked: false,
      discrepancies: ['Primary method unavailable']
    };
  }

  // Neither solved
  return {
    answer: null,
    confidence: 0,
    verificationMethod: 'none',
    crossChecked: false,
    discrepancies: ['Unable to verify']
  };
}

/**
 * Internal function: flag for admin/teacher review
 */
export function shouldFlagForReview(confidence: number, hasWarnings: boolean): boolean {
  // Flag if confidence < 75% OR has warnings and confidence < 85%
  return confidence < 0.75 || (hasWarnings && confidence < 0.85);
}
