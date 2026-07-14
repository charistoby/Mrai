import { SolverResult } from "../types";

/**
 * Solves a simple linear algebraic equation (e.g., 2x + 5 = 15).
 */
export function solveLinear(q: string): SolverResult {
  try {
    const s = q.replace(/\$/g, "").replace(/Solve\s*/i, "");
    const m = s.match(/([^\n=]+?)\s*=\s*(-?\d+\.?\d*)/);
    if (!m) return { solved: false };

    const left = m[1].trim();
    const right = parseFloat(m[2]);
    if (isNaN(right)) return { solved: false };

    const ev = (x: number) => {
      const e = left
        .replace(/(\d)\s*x/g, "$1*x")
        .replace(/x/g, `(${x})`)
        .replace(/÷/g, "/")
        .replace(/×/g, "*");
      return Function('"use strict";return (' + e + ")")();
    };

    const b0 = ev(0);
    const b1 = ev(1);
    const a = b1 - b0;
    
    if (Math.abs(a) < 1e-9) {
      return { solved: false };
    }
    
    const x = (right - b0) / a;
    const finalVal = Math.abs(x - Math.round(x)) < 1e-6 ? Math.round(x) : Number(x.toFixed(4));
    
    return {
      solved: true,
      value: finalVal,
      explanation: `Solving linear equation ${left} = ${right}. Simplifying gives coefficient of x as ${a.toFixed(2)} and constant difference as ${(right - b0).toFixed(2)}. x = ${finalVal}`
    };
  } catch {
    return { solved: false };
  }
}

/**
 * Solves quadratic equations in standard form: ax^2 + bx + c = 0.
 */
export function solveQuadratic(q: string): SolverResult {
  try {
    const s = q.replace(/\$/g, "").toLowerCase().replace(/\s/g, "");
    // Matches ax^2 + bx + c = 0 or ax^2 - bx - c = 0 etc.
    const m = s.match(/([+-]?\d*\.?\d*)x\^2([+-]\d*\.?\d*)x([+-]\d+\.?\d*)=0/);
    if (!m) return { solved: false };

    const aStr = m[1];
    const bStr = m[2];
    const cStr = m[3];

    const a = parseFloat(aStr === "" || aStr === "+" ? "1" : aStr === "-" ? "-1" : aStr);
    const b = parseFloat(bStr === "" || bStr === "+" ? "1" : bStr === "-" ? "-1" : bStr);
    const c = parseFloat(cStr);

    if (isNaN(a) || isNaN(b) || isNaN(c)) return { solved: false };

    const D = b * b - 4 * a * c;
    if (D < 0) {
      return {
        solved: true,
        value: null,
        explanation: `Discriminant (b² - 4ac) is negative (${D}), meaning there are no real roots (only complex/imaginary ones).`
      };
    }

    const root1 = (-b + Math.sqrt(D)) / (2 * a);
    const root2 = (-b - Math.sqrt(D)) / (2 * a);

    const r1 = Math.abs(root1 - Math.round(root1)) < 1e-6 ? Math.round(root1) : Number(root1.toFixed(3));
    const r2 = Math.abs(root2 - Math.round(root2)) < 1e-6 ? Math.round(root2) : Number(root2.toFixed(3));

    return {
      solved: true,
      value: [r1, r2],
      explanation: `For ${a}x² + (${b})x + (${c}) = 0, Discriminant D = ${D}. Solutions are x₁ = ${r1}, x₂ = ${r2}.`
    };
  } catch {
    return { solved: false };
  }
}
