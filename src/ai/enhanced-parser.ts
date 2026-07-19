/**
 * Enhanced Parser: Extract all numerical & unit information from questions
 * Handles: decimals, scientific notation, written numbers, unit conversions
 */

export interface ExtractedValue {
  value: number;
  unit: string | null;
  confidence: number; // 0-1
}

export interface ParsedQuestion {
  numbers: ExtractedValue[];
  operationKeywords: string[];
  questionType: string; // 'calculation', 'conceptual', 'comparison', etc.
  difficulty: 'easy' | 'medium' | 'hard';
  confidence: number;
}

// Word-to-number mapping
const WORD_NUMBERS: { [key: string]: number } = {
  'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
  'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
  'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
  'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50, 'sixty': 60,
  'seventy': 70, 'eighty': 80, 'ninety': 90, 'hundred': 100, 'thousand': 1000
};

// Unit conversion table
const UNIT_CONVERSIONS: { [key: string]: { [key: string]: number } } = {
  'length': {
    'mm': 0.001, 'cm': 0.01, 'm': 1, 'km': 1000,
    'inch': 0.0254, 'foot': 0.3048, 'mile': 1609.34
  },
  'mass': {
    'g': 1, 'kg': 1000, 'mg': 0.001, 'lb': 453.592, 'oz': 28.3495
  },
  'time': {
    'ms': 0.001, 's': 1, 'min': 60, 'hour': 3600, 'day': 86400, 'week': 604800
  },
  'temperature': {
    'c': 1, 'f': 0.5556, 'k': 1 // relative scales
  },
  'volume': {
    'ml': 0.001, 'l': 1, 'gallon': 3.78541
  }
};

/**
 * Convert word numbers to digits (e.g., "five" -> 5)
 */
export function parseWordNumbers(text: string): string {
  let result = text.toLowerCase();
  for (const [word, num] of Object.entries(WORD_NUMBERS)) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    result = result.replace(regex, num.toString());
  }
  return result;
}

/**
 * Extract all numbers with potential units from text
 */
export function extractNumbers(text: string): ExtractedValue[] {
  const processed = parseWordNumbers(text);
  const extracted: ExtractedValue[] = [];

  // Pattern: number followed by optional unit (e.g., 45kg, 3.14m/s², 5×10²)
  const numberPattern = /([-+]?\d+\.?\d*(?:[eE][-+]?\d+)?)\s*([a-zA-Z/°²³⁻\^]*)/g;
  let match;

  while ((match = numberPattern.exec(processed)) !== null) {
    const value = parseFloat(match[1]);
    const rawUnit = match[2].trim();
    const unit = normalizeUnit(rawUnit);
    
    if (!isNaN(value)) {
      extracted.push({
        value,
        unit,
        confidence: unit ? 0.95 : 0.85 // Higher confidence with unit
      });
    }
  }

  return extracted;
}

/**
 * Normalize unit strings (e.g., "kg" -> "kilogram", "m/s2" -> "m/s²")
 */
export function normalizeUnit(unit: string): string | null {
  if (!unit) return null;
  
  const normalized = unit
    .toLowerCase()
    .replace(/\^2/g, '²')
    .replace(/\^3/g, '³')
    .replace(/\/s2/g, '/s²')
    .replace(/per second/, '/s')
    .trim();

  return normalized || null;
}

/**
 * Convert between units (e.g., 5 km -> 5000 m)
 */
export function convertUnit(value: number, fromUnit: string, toUnit: string): number | null {
  const normalized_from = normalizeUnit(fromUnit);
  const normalized_to = normalizeUnit(toUnit);

  for (const [category, conversions] of Object.entries(UNIT_CONVERSIONS)) {
    if (normalized_from in conversions && normalized_to in conversions) {
      const baseValue = value * conversions[normalized_from];
      return baseValue / conversions[normalized_to];
    }
  }

  return null; // Incompatible units
}

/**
 * Parse entire question into structured format
 */
export function parseQuestion(question: string): ParsedQuestion {
  const lq = question.toLowerCase();
  const numbers = extractNumbers(question);
  
  // Identify operation keywords
  const operationKeywords: string[] = [];
  const opPatterns: { [key: string]: string[] } = {
    'solve': ['solve', 'find', 'calculate', 'compute', 'determine'],
    'compare': ['compare', 'which', 'greater', 'smaller', 'more', 'less'],
    'prove': ['prove', 'show', 'demonstrate', 'verify', 'justify'],
    'explain': ['explain', 'describe', 'state', 'discuss', 'analyze']
  };

  for (const [op, keywords] of Object.entries(opPatterns)) {
    if (keywords.some(kw => lq.includes(kw))) {
      operationKeywords.push(op);
    }
  }

  // Determine question type
  let questionType = 'conceptual';
  if (numbers.length > 0) questionType = 'calculation';
  if (operationKeywords.includes('compare')) questionType = 'comparison';
  if (operationKeywords.includes('prove')) questionType = 'proof';

  // Estimate difficulty
  let difficulty: 'easy' | 'medium' | 'hard' = 'easy';
  if (numbers.length > 2) difficulty = 'medium';
  if (lq.includes('prove') || lq.includes('derive')) difficulty = 'hard';

  // Calculate overall confidence
  const avgNumberConfidence = numbers.length > 0 
    ? numbers.reduce((a, b) => a + b.confidence, 0) / numbers.length 
    : 1;
  
  const confidence = Math.min(0.98, avgNumberConfidence * (operationKeywords.length > 0 ? 0.95 : 0.85));

  return {
    numbers,
    operationKeywords,
    questionType,
    difficulty,
    confidence
  };
}
