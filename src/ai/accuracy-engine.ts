import { SolverResult } from "../types";
import { parseQuestion, ParsedQuestion } from "./enhanced-parser";
import { validateAnswer, ValidationResult } from "./validator";
import { crossVerifyAnswer, VerificationResult, shouldFlagForReview, getConfidenceMessage } from "./verification";
import { mlScorer, TrainingExample } from "./ml-confidence-scorer";

/**
 * Enhanced answer with full accuracy tracking
 */
export interface EnhancedSolverResult extends SolverResult {
  confidence: number; // 0-1
  verificationMethod: string;
  validation: ValidationResult | null;
  warnings: string[];
  shouldReview: boolean;
  confidenceMessage: string;
  metadata?: {
    parsingConfidence: number;
    parsedQuestion: ParsedQuestion;
  };
}

/**
 * Wrapper function to enhance any solver result with accuracy features
 */
export async function enhanceSolverResult(
  question: string,
  solverResult: SolverResult,
  solverMethod: string,
  method2Result?: SolverResult
): Promise<EnhancedSolverResult> {
  // Parse question for better understanding
  const parsedQuestion = parseQuestion(question);

  // Initialize enhanced result
  const enhanced: EnhancedSolverResult = {
    ...solverResult,
    confidence: 0.5,
    verificationMethod: 'none',
    validation: null,
    warnings: [],
    shouldReview: false,
    confidenceMessage: '',
    metadata: {
      parsingConfidence: parsedQuestion.confidence,
      parsedQuestion
    }
  };

  if (!solverResult.solved) {
    enhanced.confidence = 0;
    enhanced.confidenceMessage = '❌ Could not solve';
    return enhanced;
  }

  // Cross-verify if second method provided
  let verification: VerificationResult | null = null;
  if (method2Result) {
    verification = await crossVerifyAnswer(question, solverResult, method2Result);
    enhanced.confidence = verification.confidence;
    enhanced.verificationMethod = verification.verificationMethod;
    enhanced.warnings = verification.discrepancies;
  } else {
    enhanced.confidence = Math.min(0.85, parsedQuestion.confidence);
    enhanced.verificationMethod = solverMethod;
  }

  // Validate answer for domain-specific issues
  const answerValue = Array.isArray(solverResult.value) 
    ? solverResult.value[0] 
    : solverResult.value;
  
  if (typeof answerValue === 'number' && isFinite(answerValue)) {
    const validation = validateAnswer(question, answerValue);
    enhanced.validation = validation;
    enhanced.warnings.push(...validation.warnings);
    enhanced.warnings.push(...validation.suggestions);
    
    // Adjust confidence based on validation
    if (!validation.isValid) {
      enhanced.confidence *= 0.7; // Reduce confidence if validation fails
    } else {
      enhanced.confidence = Math.max(enhanced.confidence, validation.confidence * 0.9);
    }
  }

  // Apply ML-based confidence adjustment
  const category = parsedQuestion.questionType;
  const adjustedConfidence = mlScorer.calculateAdjustedConfidence(
    solverMethod,
    enhanced.confidence,
    category
  );
  enhanced.confidence = adjustedConfidence;

  // Determine if should flag for review
  enhanced.shouldReview = shouldFlagForReview(enhanced.confidence, enhanced.warnings.length > 0);

  // Generate confidence message
  enhanced.confidenceMessage = getConfidenceMessage(enhanced.confidence);

  return enhanced;
}

/**
 * Record answer result for ML training
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
 * Get solver performance analytics
 */
export function getSolverAnalytics(solverMethod: string) {
  return mlScorer.getDetailedAnalysis(solverMethod);
}

/**
 * Get all solvers ranked by performance
 */
export function getRankedSolvers() {
  return mlScorer.getRankedSolvers();
}
