import { SolverResult } from "../types";
import { ExtractedValue } from "./enhanced-parser";

/**
 * Validation engine: check if answers are physically/mathematically reasonable
 */

export interface ValidationResult {
  isValid: boolean;
  confidence: number;
  warnings: string[];
  suggestions: string[];
}

/**
 * Physics validators
 */
export function validatePhysicsAnswer(question: string, answer: number, unit: string): ValidationResult {
  const warnings: string[] = [];
  const suggestions: string[] = [];
  let confidence = 1.0;
  const lq = question.toLowerCase();

  // Velocity check: should be reasonable (< speed of light)
  if (lq.includes('velocity') || lq.includes('speed')) {
    const speedOfLight = 3e8; // m/s
    if (answer < 0) {
      warnings.push('Speed/velocity cannot be negative');
      confidence -= 0.3;
    }
    if (answer > speedOfLight) {
      warnings.push('Answer exceeds speed of light');
      confidence -= 0.25;
    }
  }

  // Mass check: should be positive
  if (lq.includes('mass')) {
    if (answer <= 0) {
      warnings.push('Mass must be positive');
      confidence -= 0.4;
    }
    if (answer > 1e10) {
      warnings.push('Mass seems unrealistically large');
      confidence -= 0.1;
    }
  }

  // Temperature check
  if (lq.includes('temperature')) {
    if (unit && (unit.includes('c') || unit.includes('°'))) {
      if (answer < -273.15) {
        warnings.push('Temperature below absolute zero (-273.15°C)');
        confidence -= 0.4;
      }
    }
  }

  // Force check: should be positive in most contexts
  if (lq.includes('force')) {
    if (answer < 0) {
      warnings.push('Force magnitude should be positive');
      confidence -= 0.2;
    }
  }

  return {
    isValid: confidence > 0.5,
    confidence: Math.max(0, confidence),
    warnings,
    suggestions
  };
}

/**
 * Chemistry validators
 */
export function validateChemistryAnswer(question: string, answer: number, unit: string): ValidationResult {
  const warnings: string[] = [];
  const suggestions: string[] = [];
  let confidence = 1.0;
  const lq = question.toLowerCase();

  // Moles check: typically positive and reasonable range
  if (lq.includes('mole')) {
    if (answer < 0) {
      warnings.push('Moles cannot be negative');
      confidence -= 0.4;
    }
    if (answer > 1000) {
      warnings.push('Unusually large number of moles');
      confidence -= 0.1;
    }
  }

  // pH check: should be 0-14 (typically)
  if (lq.includes('ph')) {
    if (answer < 0 || answer > 14) {
      warnings.push('pH should typically be between 0-14');
      confidence -= 0.25;
    }
  }

  // Molarity check: positive, reasonable range
  if (lq.includes('molarity') || lq.includes('concentration')) {
    if (answer < 0) {
      warnings.push('Concentration cannot be negative');
      confidence -= 0.4;
    }
    if (answer > 100) {
      warnings.push('Concentration seems unusually high');
      confidence -= 0.1;
    }
  }

  return {
    isValid: confidence > 0.5,
    confidence: Math.max(0, confidence),
    warnings,
    suggestions
  };
}

/**
 * Economics validators
 */
export function validateEconomicsAnswer(question: string, answer: number, unit: string): ValidationResult {
  const warnings: string[] = [];
  const suggestions: string[] = [];
  let confidence = 1.0;
  const lq = question.toLowerCase();

  // Price/cost should be positive
  if (lq.includes('price') || lq.includes('cost')) {
    if (answer < 0) {
      warnings.push('Price/Cost cannot be negative');
      confidence -= 0.4;
    }
  }

  // GDP should be large positive number
  if (lq.includes('gdp')) {
    if (answer < 0) {
      warnings.push('GDP cannot be negative');
      confidence -= 0.4;
    }
    if (answer < 1000) {
      suggestions.push('GDP is typically measured in millions/billions/trillions');
      confidence -= 0.15;
    }
  }

  // Unemployment rate: 0-100%
  if (lq.includes('unemployment')) {
    if (answer < 0 || answer > 100) {
      warnings.push('Unemployment rate should be 0-100%');
      confidence -= 0.3;
    }
  }

  // Profit margin: typically -50 to 100%
  if (lq.includes('profit margin')) {
    if (answer < -50 || answer > 100) {
      warnings.push('Profit margin typically -50% to 100%');
      confidence -= 0.15;
    }
  }

  return {
    isValid: confidence > 0.5,
    confidence: Math.max(0, confidence),
    warnings,
    suggestions
  };
}

/**
 * General mathematical validation
 */
export function validateMathematicalAnswer(question: string, answer: number): ValidationResult {
  const warnings: string[] = [];
  const suggestions: string[] = [];
  let confidence = 1.0;
  const lq = question.toLowerCase();

  // Check for NaN/Infinity
  if (!isFinite(answer)) {
    warnings.push('Answer is not a valid number (NaN or Infinity)');
    confidence = 0;
  }

  // Probability: 0-1
  if (lq.includes('probability')) {
    if (answer < 0 || answer > 1) {
      warnings.push('Probability should be between 0 and 1');
      confidence -= 0.3;
    }
  }

  // Percentage: 0-100
  if (lq.includes('percent')) {
    if (answer < 0 || answer > 100) {
      warnings.push('Percentage should be between 0 and 100');
      confidence -= 0.2;
    }
  }

  // Check for unrealistic precision (more than 10 decimal places)
  if (answer.toString().split('.')[1]?.length > 10) {
    suggestions.push('Answer has unusually high precision; consider rounding');
    confidence -= 0.05;
  }

  return {
    isValid: confidence > 0.5,
    confidence: Math.max(0, confidence),
    warnings,
    suggestions
  };
}

/**
 * Universal validator - routes to correct validator based on question domain
 */
export function validateAnswer(question: string, answer: number, unit?: string): ValidationResult {
  const lq = question.toLowerCase();
  unit = unit || '';

  // Route to appropriate validator
  if (lq.match(/physics|velocity|acceleration|force|pressure|energy/)) {
    return validatePhysicsAnswer(question, answer, unit);
  }
  if (lq.match(/chemistry|mole|molarity|ph|reaction|compound/)) {
    return validateChemistryAnswer(question, answer, unit);
  }
  if (lq.match(/economics|gdp|inflation|profit|unemployment/)) {
    return validateEconomicsAnswer(question, answer, unit);
  }
  
  // Default mathematical validation
  return validateMathematicalAnswer(question, answer);
}
