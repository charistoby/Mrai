import { SolverResult } from "../types";

/**
 * Expanded Biology solver covering all SSS topics:
 * Cell Biology, Genetics, Ecology, Photosynthesis, Respiration, Evolution, Homeostasis, Reproduction
 */
export function solveBiology(q: string): SolverResult {
  const lq = q.toLowerCase();

  // ========== CELL BIOLOGY ==========
  // 1. Cell organelles & functions
  if (lq.includes("mitochondria") || lq.includes("chloroplast") || lq.includes("nucleus")) {
    return {
      solved: true,
      value: null,
      explanation: `Mitochondria: powerhouse, ATP production. Chloroplast: photosynthesis (plants). Nucleus: DNA storage, gene regulation. Ribosome: protein synthesis.`
    };
  }

  // 2. Osmosis & Diffusion
  if (lq.includes("osmosis") || lq.includes("diffusion") || lq.includes("hypertonic")) {
    return {
      solved: true,
      value: null,
      explanation: `Diffusion: movement from high to low concentration. Osmosis: water movement through semipermeable membrane. Hypertonic: high solute concentration (cell shrivels). Hypotonic: low solute (cell swells).`
    };
  }

  // ========== GENETICS ==========
  // 3. Punnett Square & Mendelian ratios
  if (lq.includes("punnett") || lq.includes("genotype") || lq.includes("phenotype")) {
    return {
      solved: true,
      value: null,
      explanation: `Monohybrid cross (Aa × Aa): 1 AA : 2 Aa : 1 aa (genotypic 1:2:1, phenotypic 3:1). Dihybrid: 9:3:3:1 ratio.`
    };
  }

  // 4. Gene expression & Protein synthesis
  if (lq.includes("dna") || lq.includes("rna") || lq.includes("protein synthesis")) {
    return {
      solved: true,
      value: null,
      explanation: `Central dogma: DNA → (transcription) → mRNA → (translation) → Protein. Codons: triplet sequences coding amino acids. Start (AUG), Stop (UAA, UAG, UGA).`
    };
  }

  // 5. Mutation types
  if (lq.includes("mutation")) {
    return {
      solved: true,
      value: null,
      explanation: `Mutations: Point (base substitution), Insertion/Deletion (frameshift), Inversion (reversal), Duplication (repetition). Can be beneficial, harmful, or neutral.`
    };
  }

  // ========== ECOLOGY ==========
  // 6. Population dynamics
  const popMatch = lq.match(/population.*(\d+\.?\d*).*?growth rate.*(\d+\.?\d*)|birth rate.*(\d+).*?death rate.*(\d+)/i);
  if (popMatch) {
    const popValue = parseFloat(popMatch[1] || popMatch[3]);
    const growthRate = parseFloat(popMatch[2] || popMatch[4]);
    if (!isNaN(popValue) && !isNaN(growthRate)) {
      return {
        solved: true,
        value: popValue * growthRate,
        explanation: `Population change = Birth rate - Death rate. Net growth = initial population × growth rate.`
      };
    }
  }

  // 7. Food chains & Energy transfer
  if (lq.includes("food chain") || lq.includes("food web") || lq.includes("energy transfer")) {
    return {
      solved: true,
      value: null,
      explanation: `Food chain: producer → herbivore → carnivore → decomposer. Energy transfer: ~10% to next trophic level (90% lost as heat). Pyramids: energy, biomass, numbers.`
    };
  }

  // 8. Biomes & Habitats
  if (lq.includes("biome") || lq.includes("habitat")) {
    return {
      solved: true,
      value: null,
      explanation: `Biomes: Tropical rainforest (high biodiversity), Savanna (grassland), Desert, Temperate forest, Tundra. Each has distinct climate, flora, fauna.`
    };
  }

  // ========== PHOTOSYNTHESIS & RESPIRATION ==========
  // 9. Photosynthesis (Light & Dark reactions)
  if (lq.includes("photosynthesis") || lq.includes("light dependent") || lq.includes("light independent")) {
    return {
      solved: true,
      value: null,
      explanation: `Light reactions: H₂O → O₂ + ATP + NADPH (in thylakoid). Dark reactions (Calvin cycle): CO₂ + ATP + NADPH → glucose (in stroma). Overall: 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂.`
    };
  }

  // 10. Cellular respiration (Aerobic & Anaerobic)
  if (lq.includes("respiration") || lq.includes("glycolysis") || lq.includes("krebs cycle")) {
    return {
      solved: true,
      value: null,
      explanation: `Aerobic: Glycolysis (2 pyruvate) → Krebs cycle → ETC = ~32 ATP. Anaerobic: Glycolysis → Lactate/Ethanol = 2 ATP. Overall: C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + energy.`
    };
  }

  // ========== HOMEOSTASIS & REGULATION ==========
  // 11. Homeostasis mechanisms
  if (lq.includes("homeostasis") || lq.includes("negative feedback") || lq.includes("positive feedback")) {
    return {
      solved: true,
      value: null,
      explanation: `Homeostasis: maintain stable internal conditions. Negative feedback: counteracts change (e.g., insulin regulation). Positive feedback: amplifies change (e.g., blood clotting).`
    };
  }

  // 12. Thermoregulation
  if (lq.includes("thermoregulation") || lq.includes("ectotherm") || lq.includes("endotherm")) {
    return {
      solved: true,
      value: null,
      explanation: `Endotherm (mammals, birds): maintain body temperature via metabolism. Ectotherm (reptiles, fish): regulate via environment. Thermoregulation: sweating, shivering, vasodilation, vasoconstriction.`
    };
  }

  // ========== REPRODUCTION & DEVELOPMENT ==========
  // 13. Meiosis vs Mitosis
  if (lq.includes("meiosis") || lq.includes("mitosis") || lq.includes("haploid") || lq.includes("diploid")) {
    return {
      solved: true,
      value: null,
      explanation: `Mitosis: parent → 2 identical diploid (2n) cells (body growth). Meiosis: diploid → 4 unique haploid (n) gametes (sexual reproduction). Meiosis I: homologous separation; Meiosis II: sister chromatid separation.`
    };
  }

  // 14. Enzyme kinetics
  if (lq.includes("enzyme") && (lq.includes("km") || lq.includes("vmax") || lq.includes("substrate"))) {
    return {
      solved: true,
      value: null,
      explanation: `Enzymes: biological catalysts. Km (Michaelis constant) = substrate concentration at ½ Vmax (lower = higher affinity). Vmax = max velocity at enzyme saturation. Temperature & pH affect enzyme activity.`
    };
  }

  return { solved: false };
}
