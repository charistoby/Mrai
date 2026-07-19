import { SolverResult } from "../types";
import { parseQuestion, ParsedQuestion } from "./enhanced-parser";
import { validateAnswer, ValidationResult } from "./validator";
import { crossVerifyAnswer, VerificationResult, shouldFlagForReview } from "./verification";
import { mlScorer, TrainingExample } from "./ml-confidence-scorer";

/**
 * Internal accuracy tracking (NOT shown to users)
 */
export interface InternalAccuracyMetrics {
  confidence: number; // 0-1 (internal only)
  verificationMethod: string; // internal tracking
  validation: ValidationResult | null; // internal tracking
  shouldReview: boolean; // internal flag for teacher dashboard
  parsedQuestion: ParsedQuestion; // internal analysis
  discrepancies: string[]; // internal notes
}

/**
 * User-facing result (clean, no confidence metrics)
 */
export interface EnhancedSolverResult extends SolverResult {
  // Public fields - same as SolverResult
  solved: boolean;
  value: number | number[] | null;
  explanation: string;
  
  // Internal-only (NOT exposed to frontend)
  _metrics?: InternalAccuracyMetrics; // Prefixed with _ to indicate internal
}

/**
 * Wrapper function to enhance solver result with accuracy features
 * Returns clean user-facing result, keeps metrics internal
 */
export async function enhanceSolverResult(
  question: string,
  solverResult: SolverResult,
  solverMethod: string,
  method2Result?: SolverResult
): Promise<EnhancedSolverResult> {
  // Parse question for better understanding
  const parsedQuestion = parseQuestion(question);

  // Initialize metrics (internal only)
  const metrics: InternalAccuracyMetrics = {
    confidence: 0.5,
    verificationMethod: 'none',
    validation: null,
    shouldReview: false,
    parsedQuestion,
    discrepancies: []
  };

  // Create user-facing result (clean)
  const result: EnhancedSolverResult = {
    solved: solverResult.solved,
    value: solverResult.value,
    explanation: solverResult.explanation,
    _metrics: metrics // Internal only
  };

  if (!solverResult.solved) {
    metrics.confidence = 0;
    return result;
  }

  // Cross-verify if second method provided
  if (method2Result) {
    const verification = await crossVerifyAnswer(question, solverResult, method2Result);
    metrics.confidence = verification.confidence;
    metrics.verificationMethod = verification.verificationMethod;
    metrics.discrepancies = verification.discrepancies;
  } else {
    metrics.confidence = Math.min(0.85, parsedQuestion.confidence);
    metrics.verificationMethod = solverMethod;
  }

  // Validate answer for domain-specific issues (internal)
  const answerValue = Array.isArray(solverResult.value) 
    ? solverResult.value[0] 
    : solverResult.value;
  
  if (typeof answerValue === 'number' && isFinite(answerValue)) {
    const validation = validateAnswer(question, answerValue);
    metrics.validation = validation;
    metrics.discrepancies.push(...validation.warnings);
    
    // Adjust confidence based on validation (internal)
    if (!validation.isValid) {
      metrics.confidence *= 0.7;
    } else {
      metrics.confidence = Math.max(metrics.confidence, validation.confidence * 0.9);
    }
  }

  // Apply ML-based confidence adjustment (internal)
  const category = parsedQuestion.questionType;
  const adjustedConfidence = mlScorer.calculateAdjustedConfidence(
    solverMethod,
    metrics.confidence,
    category
  );
  metrics.confidence = adjustedConfidence;

  // Determine if should flag for review (internal, for teacher dashboard)
  metrics.shouldReview = shouldFlagForReview(metrics.confidence, metrics.discrepancies.length > 0);

  // IMPORTANT: Do NOT modify explanation or add confidence messages
  // Keep user-facing result clean and simple
  result._metrics = metrics;

  return result;
}

/**
 * Record answer result for ML training (internal)
 */
export function recordAnswerResult(
  question: string,
  solverMethod: string,
  providedAnswer: number,
  correctAnswer: number
): void {
  const example: TrainingExample = {
    question,
    solverMethod,
    providedAnswer,
    correctAnswer,
    isCorrect: Math.abs(providedAnswer - correctAnswer) < 0.01,
    timestamp: Date.now()
  };

  mlScorer.addTrainingExample(example);
}

/**
 * Get solver performance metrics (internal - for admin/teacher dashboard only)
 */
export function getSolverMetrics(solverMethod: string) {
  return mlScorer.getDetailedAnalysis(solverMethod);
}

/**
 * Get all solvers ranked by performance (internal - for analytics)
 */
export function getSystemAnalytics() {
  return {
    allSolvers: mlScorer.getRankedSolvers(),
    topPerformers: mlScorer.getRankedSolvers().slice(0, 5)
  };
}

/**
 * Export training data for backup (internal)
 */
export function exportSystemMetrics(): string {
  return mlScorer.exportTrainingData();
}

/**
 * Import training data from backup (internal)
 */
export function importSystemMetrics(data: string): void {
  mlScorer.importTrainingData(data);
}
