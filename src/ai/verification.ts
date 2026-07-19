import { SolverResult } from "../types";

/**
 * Fallback verification system:
 * - Cross-check answers using multiple methods
 * - Request re-verification if answers don't match
 * - Use confidence scoring to flag uncertain answers
 */

export interface VerificationResult {
  answer: number | null;
  confidence: number; // 0-1
  verificationMethod: string;
  crossChecked: boolean;
  discrepancies: string[];
}

/**
 * Cross-check two solver methods
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
        verificationMethod: 'cross-verified (method 1 & 2)',
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
          verificationMethod: 'cross-verified (minor variance)',
          crossChecked: true,
          discrepancies: [`Method 1: ${val1}, Method 2: ${val2} (${percentDiff.toFixed(2)}% difference)`]
        };
      } else {
        discrepancies.push(`Method 1: ${val1}, Method 2: ${val2} (${percentDiff.toFixed(2)}% difference)`);
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
      confidence: 0.75, // Lower confidence with single method
      verificationMethod: 'method 1 only',
      crossChecked: false,
      discrepancies: ['Method 2 could not verify']
    };
  }

  if (method2Result.solved && !method1Result.solved) {
    const val2 = Array.isArray(method2Result.value) 
      ? method2Result.value[0] 
      : method2Result.value;
    return {
      answer: val2 as number,
      confidence: 0.75,
      verificationMethod: 'method 2 only',
      crossChecked: false,
      discrepancies: ['Method 1 could not verify']
    };
  }

  // Neither solved
  return {
    answer: null,
    confidence: 0,
    verificationMethod: 'none',
    crossChecked: false,
    discrepancies: ['Both methods failed to solve']
  };
}

/**
 * Flag answers for manual review based on confidence
 */
export function shouldFlagForReview(confidence: number, hasWarnings: boolean): boolean {
  // Flag if confidence < 75% OR has warnings and confidence < 85%
  return confidence < 0.75 || (hasWarnings && confidence < 0.85);
}

/**
 * Generate confidence-based response hint
 */
export function getConfidenceMessage(confidence: number): string {
  if (confidence >= 0.95) return "✅ High confidence answer";
  if (confidence >= 0.85) return "✓ Good confidence";
  if (confidence >= 0.75) return "⚠️ Moderate confidence (verify if possible)";
  if (confidence >= 0.65) return "⚠️ Low confidence (consider alternative methods)";
  return "❌ Very low confidence (recommend manual review)";
}
