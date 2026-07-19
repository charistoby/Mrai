import { SolverResult } from "../types";
import { solveLinear, solveQuadratic } from "./algebra";
import { solvePhysics } from "./physics";
import { solveChemistry } from "./chemistry";
import { solveBiology } from "./biology";
import { solveGeography } from "./geography";
import { solveLiterature } from "./literature";
import { solveGovernment } from "./government";
import { solveHistory } from "./history";
import { solveEnglishLanguage } from "./english-language";
import { solveCommerce } from "./commerce";
import { solveICT } from "./ict";
import { solveEconomics } from "./economics";

/**
 * Unified entry point to solve an academic question locally.
 * If solved, returns the solution and an explanation.
 * Covers ALL SSS curriculum subjects with comprehensive topic coverage.
 * Attempts solvers in order: STEM → Humanities → ICT → Economics
 */
export function solveQuestionLocally(question: string): SolverResult {
  // ========== STEM SUBJECTS ==========
  // 1. Physics (Mechanics, Waves, Electricity, Optics, Thermodynamics)
  const physRes = solvePhysics(question);
  if (physRes.solved) return physRes;

  // 2. Chemistry (Atomic structure, Bonding, Stoichiometry, Organic, Kinetics, Equilibrium)
  const chemRes = solveChemistry(question);
  if (chemRes.solved) return chemRes;

  // 3. Mathematics (Algebra - Linear & Quadratic equations)
  const quadRes = solveQuadratic(question);
  if (quadRes.solved) return quadRes;

  const linRes = solveLinear(question);
  if (linRes.solved) return linRes;

  // 4. Biology (Cell, Genetics, Ecology, Photosynthesis, Respiration, Evolution, Reproduction)
  const bioRes = solveBiology(question);
  if (bioRes.solved) return bioRes;

  // ========== HUMANITIES & SOCIAL SCIENCES ==========
  // 5. Geography (Scale, Density, Coordinates, Biomes, Climate, Landforms)
  const geoRes = solveGeography(question);
  if (geoRes.solved) return geoRes;

  // 6. Literature (Poetic devices, Themes, Characters, Plot structure, Literary analysis)
  const litRes = solveLiterature(question);
  if (litRes.solved) return litRes;

  // 7. Government/Civics (Taxation, Rights, Economics, GDP, Political systems)
  const govRes = solveGovernment(question);
  if (govRes.solved) return govRes;

  // 8. History (Chronology, Cause-Effect, Sources, Context, Historical analysis)
  const histRes = solveHistory(question);
  if (histRes.solved) return histRes;

  // 9. English Language (Grammar, Tenses, Composition, Mechanics, Syntax)
  const engRes = solveEnglishLanguage(question);
  if (engRes.solved) return engRes;

  // 10. Commerce (Profit/Loss, Discount, Interest, Break-even, Business math)
  const commRes = solveCommerce(question);
  if (commRes.solved) return commRes;

  // ========== TECHNICAL SUBJECTS ==========
  // 11. ICT (Hardware, Software, Programming, Networks, Security, Web dev)
  const ictRes = solveICT(question);
  if (ictRes.solved) return ictRes;

  // ========== ADVANCED SOCIAL SCIENCES ==========
  // 12. Economics (Micro, Macro, Trade, Development, Markets, Policy)
  const ecoRes = solveEconomics(question);
  if (ecoRes.solved) return ecoRes;

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
