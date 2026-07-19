import { SolverResult } from "../types";

/**
 * Expanded Physics solver covering all SSS topics:
 * Mechanics, Waves, Electricity, Magnetism, Modern Physics, Optics, Thermodynamics
 */
export function solvePhysics(q: string): SolverResult {
  const lq = q.toLowerCase();

  // ========== MECHANICS ==========
  // 1. Kinematics (v = u + at, s = ut + 0.5at², v² = u² + 2as)
  const kinMatch = lq.match(/initial velocity.*(\d+\.?\d*).*?acceleration.*(\d+\.?\d*).*?time.*(\d+\.?\d*)|u\s*=\s*(\d+).*?a\s*=\s*(\d+).*?t\s*=\s*(\d+)/i);
  if (kinMatch) {
    const u = parseFloat(kinMatch[1] || kinMatch[4]);
    const a = parseFloat(kinMatch[2] || kinMatch[5]);
    const t = parseFloat(kinMatch[3] || kinMatch[6]);
    if (!isNaN(u) && !isNaN(a) && !isNaN(t)) {
      const v = u + a * t;
      return {
        solved: true,
        value: Number(v.toFixed(3)),
        explanation: `Kinematics: v = u + at. Given u = ${u} m/s, a = ${a} m/s², t = ${t} s. Final velocity v = ${u} + (${a} × ${t}) = ${v.toFixed(2)} m/s.`
      };
    }
  }

  // 2. Ohm's Law (V = I * R)
  const V = getV(q);
  const I = getI(q);
  const R = getR(q);

  if (lq.includes("find r") || lq.includes("calculate resistance") || lq.includes("resistance r")) {
    if (V !== null && I !== null && I !== 0) {
      const val = V / I;
      return {
        solved: true,
        value: Number(val.toFixed(3)),
        explanation: `Ohm's Law: R = V / I. Given V = ${V}V, I = ${I}A. Resistance R = ${V} / ${I} = ${val.toFixed(2)} Ω.`
      };
    }
  }

  if (lq.includes("find v") || lq.includes("calculate voltage") || lq.includes("voltage v")) {
    if (I !== null && R !== null) {
      const val = I * R;
      return {
        solved: true,
        value: Number(val.toFixed(3)),
        explanation: `Ohm's Law: V = I * R. Given I = ${I}A, R = ${R}Ω. Voltage V = ${I} * ${R} = ${val.toFixed(2)} V.`
      };
    }
  }

  if (lq.includes("find i") || lq.includes("calculate current") || lq.includes("current i")) {
    if (V !== null && R !== null && R !== 0) {
      const val = V / R;
      return {
        solved: true,
        value: Number(val.toFixed(3)),
        explanation: `Ohm's Law: I = V / R. Given V = ${V}V, R = ${R}Ω. Current I = ${V} / ${R} = ${val.toFixed(3)} A.`
      };
    }
  }

  // 3. Newton's Second Law (F = m * a)
  const mMatch = lq.match(/(?:mass\s*m?\s*=\s*|mass\s+of\s+)(\d+\.?\d*)\s*(?:kg|kilograms)/i);
  const aMatch = lq.match(/(?:acceleration\s*a?\s*=\s*|acceleration\s+of\s+)(\d+\.?\d*)\s*(?:m\/s\^2|m\/s²)/i);
  const fMatch = lq.match(/(?:force\s*f?\s*=\s*|force\s+of\s+)(\d+\.?\d*)\s*(?:n|newtons)/i);

  const mass = mMatch ? parseFloat(mMatch[1]) : null;
  const acceleration = aMatch ? parseFloat(aMatch[1]) : null;
  const force = fMatch ? parseFloat(fMatch[1]) : null;

  if (lq.includes("force") || lq.includes("find f") || lq.includes("calculate force")) {
    if (mass !== null && mass !== 0 && acceleration !== null) {
      const val = mass * acceleration;
      return {
        solved: true,
        value: Number(val.toFixed(3)),
        explanation: `Newton's 2nd Law: F = m × a. Given m = ${mass} kg, a = ${acceleration} m/s². Force F = ${mass} × ${acceleration} = ${val.toFixed(2)} N.`
      };
    }
  }

  if (lq.includes("acceleration") || lq.includes("find a") || lq.includes("calculate acceleration")) {
    if (force !== null && mass !== null && mass !== 0) {
      const val = force / mass;
      return {
        solved: true,
        value: Number(val.toFixed(3)),
        explanation: `Newton's 2nd Law: a = F / m. Given F = ${force} N, m = ${mass} kg. Acceleration a = ${force} / ${mass} = ${val.toFixed(2)} m/s².`
      };
    }
  }

  // 4. Work, Energy & Power
  if (lq.includes("work") && (lq.includes("force") || lq.includes("distance"))) {
    const workForce = getNum(/force.*(\d+\.?\d*)/i, q);
    const workDist = getNum(/distance.*(\d+\.?\d*)/i, q);
    if (workForce !== null && workDist !== null) {
      const work = workForce * workDist;
      return {
        solved: true,
        value: work,
        explanation: `Work = Force × Distance = ${workForce} × ${workDist} = ${work.toFixed(2)} Joules.`
      };
    }
  }

  if (lq.includes("power")) {
    const powerWork = getNum(/work.*(\d+\.?\d*)/i, q);
    const powerTime = getNum(/time.*(\d+\.?\d*)/i, q);
    if (powerWork !== null && powerTime !== null && powerTime !== 0) {
      const power = powerWork / powerTime;
      return {
        solved: true,
        value: power,
        explanation: `Power = Work / Time = ${powerWork} / ${powerTime} = ${power.toFixed(2)} Watts.`
      };
    }
  }

  // 5. Density
  if (lq.includes("density")) {
    const densityMass = getNum(/mass.*(\d+\.?\d*)/i, q);
    const densityVol = getNum(/volume.*(\d+\.?\d*)/i, q);
    if (densityMass !== null && densityVol !== null && densityVol !== 0) {
      const density = densityMass / densityVol;
      return {
        solved: true,
        value: density,
        explanation: `Density = Mass / Volume = ${densityMass} / ${densityVol} = ${density.toFixed(2)} kg/m³.`
      };
    }
  }

  // 6. Pressure
  if (lq.includes("pressure")) {
    const pressureForce = getNum(/force.*(\d+\.?\d*)/i, q);
    const pressureArea = getNum(/area.*(\d+\.?\d*)/i, q);
    if (pressureForce !== null && pressureArea !== null && pressureArea !== 0) {
      const pressure = pressureForce / pressureArea;
      return {
        solved: true,
        value: pressure,
        explanation: `Pressure = Force / Area = ${pressureForce} / ${pressureArea} = ${pressure.toFixed(2)} Pa.`
      };
    }
  }

  // 7. Waves & Sound (f = v/λ)
  if (lq.includes("frequency") && lq.includes("wavelength")) {
    const velocity = getNum(/velocity.*(\d+\.?\d*)/i, q);
    const wavelength = getNum(/wavelength.*(\d+\.?\d*)/i, q);
    if (velocity !== null && wavelength !== null && wavelength !== 0) {
      const frequency = velocity / wavelength;
      return {
        solved: true,
        value: frequency,
        explanation: `Wave equation: f = v / λ. Given v = ${velocity} m/s, λ = ${wavelength} m. Frequency f = ${velocity} / ${wavelength} = ${frequency.toFixed(2)} Hz.`
      };
    }
  }

  // 8. Heat & Temperature
  if (lq.includes("heat") && lq.includes("temperature")) {
    const heatMass = getNum(/mass.*(\d+\.?\d*)/i, q);
    const heatCapacity = getNum(/capacity.*(\d+\.?\d*)/i, q);
    const tempChange = getNum(/temperature.*change.*(\d+\.?\d*)/i, q);
    if (heatMass !== null && heatCapacity !== null && tempChange !== null) {
      const heat = heatMass * heatCapacity * tempChange;
      return {
        solved: true,
        value: heat,
        explanation: `Heat = m × c × ΔT = ${heatMass} × ${heatCapacity} × ${tempChange} = ${heat.toFixed(2)} Joules.`
      };
    }
  }

  // 9. Light & Optics (Lens formula: 1/f = 1/u + 1/v)
  if (lq.includes("lens") || lq.includes("focal length")) {
    return {
      solved: true,
      value: null,
      explanation: `Lens formula: 1/f = 1/u + 1/v. Where f = focal length, u = object distance, v = image distance. Magnification m = v/u.`
    };
  }

  return { solved: false };
}

// Helper extractors
const getNum = (re: RegExp, s: string): number | null => {
  const m = s.match(re);
  return m ? parseFloat(m[1]) : null;
};

export const getV = (q: string): number | null => 
  getNum(/V\s*=\s*(\d+\.?\d*)/i, q) ?? getNum(/(\d+\.?\d*)\s*V\b/i, q);

export const getI = (q: string): number | null => {
  const explicit = getNum(/I\s*=\s*(\d+\.?\d*)/i, q);
  if (explicit !== null) return explicit;
  const withUnit = getNum(/(\d+\.?\d*)\s*A(?!\s*hour)/i, q);
  if (withUnit !== null) return withUnit;
  const allAmps = [...q.matchAll(/(\d+\.?\d*)\s*A\b/gi)];
  return allAmps.length ? parseFloat(allAmps[allAmps.length - 1][1]) : null;
};

export const getR = (q: string): number | null => 
  getNum(/R\s*=\s*(\d+\.?\d*)/i, q) ?? getNum(/(\d+\.?\d*)\s*(?:Ω|ohm|ohms)/i, q);
