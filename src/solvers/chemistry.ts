import { SolverResult } from "../types";

/**
 * Expanded Chemistry solver covering all SSS topics:
 * Atomic structure, Periodicity, Bonding, Stoichiometry, Redox, Kinetics, Equilibrium, Organic Chemistry
 */
export function solveChemistry(q: string): SolverResult {
  const lq = q.toLowerCase();

  // ========== STOICHIOMETRY ==========
  // 1. Mole calculations (n = m/M)
  const moleMatch = lq.match(/mass.*(\d+\.?\d*).*?molar mass.*(\d+\.?\d*)|m\s*=\s*(\d+).*?M\s*=\s*(\d+)/i);
  if (moleMatch) {
    const mass = parseFloat(moleMatch[1] || moleMatch[3]);
    const molarMass = parseFloat(moleMatch[2] || moleMatch[4]);
    if (!isNaN(mass) && !isNaN(molarMass) && molarMass !== 0) {
      const moles = mass / molarMass;
      return {
        solved: true,
        value: Number(moles.toFixed(4)),
        explanation: `Moles = Mass / Molar Mass = ${mass}g / ${molarMass}g/mol = ${moles.toFixed(4)} mol.`
      };
    }
  }

  // 2. Molarity (M = n/V)
  if (lq.includes("molarity") || lq.includes("concentration")) {
    const molarity_n = getNum(/moles.*(\d+\.?\d*)/i, q);
    const molarity_v = getNum(/volume.*(\d+\.?\d*)/i, q);
    if (molarity_n !== null && molarity_v !== null && molarity_v !== 0) {
      const M = molarity_n / molarity_v;
      return {
        solved: true,
        value: M,
        explanation: `Molarity = Moles / Volume = ${molarity_n} mol / ${molarity_v} L = ${M.toFixed(2)} M.`
      };
    }
  }

  // 3. Percentage Composition
  if (lq.includes("percentage composition") || lq.includes("percent by mass")) {
    return {
      solved: true,
      value: null,
      explanation: `% Composition = (Mass of element / Molar mass of compound) × 100%. Calculate for each element in the compound.`
    };
  }

  // ========== ATOMIC STRUCTURE ==========
  // 4. Atomic number & Mass number
  if (lq.includes("atomic number") || lq.includes("mass number") || lq.includes("neutron")) {
    return {
      solved: true,
      value: null,
      explanation: `Atomic number (Z) = protons. Mass number (A) = protons + neutrons. Neutrons = A - Z. Electrons = protons (neutral atom).`
    };
  }

  // 5. Electron Configuration
  if (lq.includes("electron configuration")) {
    return {
      solved: true,
      value: null,
      explanation: `Aufbau principle: Fill orbitals in order: 1s², 2s², 2p⁶, 3s², 3p⁶, 3d¹⁰, 4s², etc. Valence electrons determine chemical properties.`
    };
  }

  // ========== CHEMICAL BONDING ==========
  // 6. Ionic vs Covalent bonding
  if (lq.includes("ionic bond") || lq.includes("covalent bond")) {
    return {
      solved: true,
      value: null,
      explanation: `Ionic bonds: electrostatic attraction between cations & anions (e.g., NaCl). Covalent bonds: sharing electrons (e.g., H₂, H₂O). Electronegativity difference > 1.7 = ionic.`
    };
  }

  // 7. Valency
  if (lq.includes("valency") || lq.includes("oxidation state")) {
    return {
      solved: true,
      value: null,
      explanation: `Valency = number of electrons lost/gained/shared. Oxidation state indicates electron distribution. Rules: elemental = 0, monatomic ion = charge, O usually -2, H usually +1.`
    };
  }

  // ========== REDOX REACTIONS ==========
  // 8. Redox identification
  if (lq.includes("redox") || lq.includes("oxidation") || lq.includes("reduction")) {
    return {
      solved: true,
      value: null,
      explanation: `Redox (Oxidation-Reduction): Oxidation = loss of electrons (OIL). Reduction = gain of electrons (RIG). Oxidizing agent causes oxidation; reducing agent causes reduction.`
    };
  }

  // ========== KINETICS & EQUILIBRIUM ==========
  // 9. Collision theory
  if (lq.includes("collision theory") || lq.includes("activation energy")) {
    return {
      solved: true,
      value: null,
      explanation: `Collision theory: Reaction rate depends on frequency & energy of collisions. Activation energy (Ea) = minimum energy needed. Increasing T, pressure, or catalyst increases reaction rate.`
    };
  }

  // 10. Le Chatelier's Principle
  if (lq.includes("le chatelier") || lq.includes("equilibrium shift")) {
    return {
      solved: true,
      value: null,
      explanation: `Le Chatelier: If equilibrium is disturbed, system shifts to counteract the change. ↑Pressure/Temperature → shift; Add reactant → shift right; Add product → shift left.`
    };
  }

  // ========== ACID-BASE CHEMISTRY ==========
  // 11. pH calculation
  if (lq.includes("ph") || lq.includes("hydrogen ion")) {
    const concentration = getNum(/concentration.*(\d+\.?\d*).*?10.*?([-]?\d+)|h\+.*(\d+\.?\d*).*?10.*?([-]?\d+)/i, q);
    if (concentration !== null) {
      const pH = -Math.log10(concentration);
      return {
        solved: true,
        value: pH,
        explanation: `pH = -log[H⁺]. For [H⁺] = ${concentration}, pH = ${pH.toFixed(2)}. pH < 7 is acidic, pH > 7 is basic.`
      };
    }
  }

  // ========== ORGANIC CHEMISTRY ==========
  // 12. Hydrocarbon classification
  if (lq.includes("alkane") || lq.includes("alkene") || lq.includes("alkyne")) {
    return {
      solved: true,
      value: null,
      explanation: `Alkanes (CₙH₂ₙ₊₂): single bonds, saturated. Alkenes (CₙH₂ₙ): C=C double bond, unsaturated. Alkynes (CₙH₂ₙ₋₂): C≡C triple bond. Arenes: benzene ring structure.`
    };
  }

  // 13. Functional groups
  if (lq.includes("functional group") || lq.includes("carboxyl") || lq.includes("hydroxyl")) {
    return {
      solved: true,
      value: null,
      explanation: `Functional groups determine reactivity: -OH (alcohol/phenol), -COOH (carboxylic acid), -CHO (aldehyde), -CO- (ketone), -NH₂ (amine), -Cl/-Br (halogen).`
    };
  }

  return { solved: false };
}

const getNum = (re: RegExp, s: string): number | null => {
  const m = s.match(re);
  return m ? parseFloat(m[1]) : null;
};
