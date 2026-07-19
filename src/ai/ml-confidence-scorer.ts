/**
 * Machine Learning based confidence scoring:
 * - Learn from past correct/incorrect answers
 * - Adjust confidence dynamically based on patterns
 * - Track solver performance metrics
 */

export interface TrainingExample {
  question: string;
  solverMethod: string;
  providedAnswer: number;
  correctAnswer: number;
  isCorrect: boolean;
  timestamp: number;
}

export interface SolverMetrics {
  methodName: string;
  totalAttempts: number;
  correctAnswers: number;
  accuracy: number; // 0-1
  avgConfidence: number; // 0-1
  recentAccuracy: number; // Last 20 attempts
  categoryAccuracy: { [category: string]: number }; // Accuracy per subject
}

/**
 * ML Confidence Calculator - adjusts base confidence based on learned patterns
 */
export class MLConfidenceScorer {
  private trainingData: TrainingExample[] = [];
  private solverMetrics: Map<string, SolverMetrics> = new Map();
  private categoryMetrics: Map<string, number> = new Map();

  /**
   * Add training example (solver's prediction vs actual correct answer)
   */
  addTrainingExample(example: TrainingExample): void {
    this.trainingData.push(example);
    this.updateMetrics(example);
  }

  /**
   * Update solver metrics based on training example
   */
  private updateMetrics(example: TrainingExample): void {
    const key = example.solverMethod;
    
    if (!this.solverMetrics.has(key)) {
      this.solverMetrics.set(key, {
        methodName: key,
        totalAttempts: 0,
        correctAnswers: 0,
        accuracy: 0,
        avgConfidence: 0,
        recentAccuracy: 0,
        categoryAccuracy: {}
      });
    }

    const metrics = this.solverMetrics.get(key)!;
    metrics.totalAttempts++;
    if (example.isCorrect) metrics.correctAnswers++;
    metrics.accuracy = metrics.correctAnswers / metrics.totalAttempts;

    // Keep only last 20 for recent accuracy
    const recentExamples = this.trainingData
      .filter(ex => ex.solverMethod === key)
      .slice(-20);
    metrics.recentAccuracy = recentExamples.filter(ex => ex.isCorrect).length / recentExamples.length;
  }

  /**
   * Calculate adjusted confidence based on solver's historical performance
   */
  calculateAdjustedConfidence(solverMethod: string, baseConfidence: number, category?: string): number {
    const metrics = this.solverMetrics.get(solverMethod);
    if (!metrics || metrics.totalAttempts < 5) {
      // Not enough data, use base confidence
      return baseConfidence;
    }

    // Weight: 40% base confidence, 40% recent accuracy, 20% overall accuracy
    const recentWeight = 0.4;
    const overallWeight = 0.2;
    const baseWeight = 0.4;

    let categoryAccuracy = 0.8; // Default if no category data
    if (category && metrics.categoryAccuracy[category]) {
      categoryAccuracy = metrics.categoryAccuracy[category];
    }

    const adjustedConfidence =
      (baseWeight * baseConfidence) +
      (recentWeight * metrics.recentAccuracy) +
      (overallWeight * metrics.accuracy);

    return Math.min(0.98, Math.max(0.1, adjustedConfidence)); // Clamp 0.1-0.98
  }

  /**
   * Get solver performance metrics
   */
  getMetrics(solverMethod: string): SolverMetrics | null {
    return this.solverMetrics.get(solverMethod) || null;
  }

  /**
   * Get all solvers ranked by accuracy
   */
  getRankedSolvers(): SolverMetrics[] {
    return Array.from(this.solverMetrics.values())
      .sort((a, b) => b.accuracy - a.accuracy);
  }

  /**
   * Export training data (for persistence)
   */
  exportTrainingData(): string {
    return JSON.stringify({
      trainingData: this.trainingData,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Import training data (from persistence)
   */
  importTrainingData(data: string): void {
    try {
      const parsed = JSON.parse(data);
      this.trainingData = parsed.trainingData || [];
      this.trainingData.forEach(ex => this.updateMetrics(ex));
    } catch (error) {
      console.error('Failed to import training data:', error);
    }
  }

  /**
   * Get detailed analysis of solver performance
   */
  getDetailedAnalysis(solverMethod: string): {
    method: string;
    totalAttempts: number;
    successRate: string;
    recentSuccessRate: string;
    strongCategories: string[];
    weakCategories: string[];
    recommendation: string;
  } | null {
    const metrics = this.solverMetrics.get(solverMethod);
    if (!metrics) return null;

    // Find strong and weak categories
    const categoryEntries = Object.entries(metrics.categoryAccuracy)
      .sort((a, b) => b[1] - a[1]);
    const strongCategories = categoryEntries.slice(0, 3).map(e => e[0]);
    const weakCategories = categoryEntries.slice(-3).map(e => e[0]);

    // Generate recommendation
    let recommendation = '';
    if (metrics.accuracy >= 0.95) {
      recommendation = 'Excellent! Use with high confidence.';
    } else if (metrics.accuracy >= 0.85) {
      recommendation = 'Good. Suitable for most questions, cross-verify for edge cases.';
    } else if (metrics.accuracy >= 0.75) {
      recommendation = 'Fair. Use with caution, consider secondary verification.';
    } else {
      recommendation = 'Poor performance. Avoid or improve before use.';
    }

    return {
      method: solverMethod,
      totalAttempts: metrics.totalAttempts,
      successRate: `${(metrics.accuracy * 100).toFixed(1)}%`,
      recentSuccessRate: `${(metrics.recentAccuracy * 100).toFixed(1)}%`,
      strongCategories,
      weakCategories,
      recommendation
    };
  }
}

// Global instance
export const mlScorer = new MLConfidenceScorer();
