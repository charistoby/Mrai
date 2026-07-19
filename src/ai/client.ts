import { GoogleGenAI } from "@google/genai";

if (!process.env.GEMINI_API_KEY) {
  console.warn("WARNING: GEMINI_API_KEY environment variable is not set!");
}

export const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

export const DEFAULT_MODEL = "gemini-3.5-flash";

/**
 * Safely parses JSON strings returned by the LLM. 
 * Handles markdown code fences, leading/trailing whitespace, and text fragments outside the JSON block.
 * Uses a highly resilient custom state machine to repair unescaped control characters, LaTeX backslashes,
 * and truncated JSON objects.
 */
export function safeParseJSON(text: string): any {
  if (!text) return {};
  let cleaned = text.trim();
  
  // Try direct parse first
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    // Attempt standard cleanups
  }

  // Handle markdown blocks
  let target = cleaned.replace(/^```json/i, "").replace(/^```/, "").replace(/```$/, "").trim();
  try {
    return JSON.parse(target);
  } catch (err) {
    // Attempt matching outermost brackets
  }

  const startIdx = target.indexOf("{");
  const endIdx = target.lastIndexOf("}");
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    target = target.substring(startIdx, endIdx + 1);
  } else if (startIdx !== -1) {
    // It has a starting brace but no ending brace (truncated). Let's take from starting brace.
    target = target.substring(startIdx);
  }

  // State-machine-based JSON repair
  try {
    let repaired = "";
    let inString = false;
    let escape = false;
    
    for (let i = 0; i < target.length; i++) {
      const char = target[i];
      
      if (inString) {
        if (escape) {
          // Check if it's a valid standard JSON escape character: ", \, n, r, t, b, f, u
          if (["\"" , "\\", "n", "r", "t", "b", "f"].includes(char)) {
            repaired += "\\" + char;
          } else if (char === "u") {
            const next4 = target.slice(i + 1, i + 5);
            if (/^[0-9a-fA-F]{4}$/.test(next4)) {
              repaired += "\\u";
            } else {
              repaired += "\\\\u";
            }
          } else {
            // Treat as a literal backslash for LaTeX commands (e.g., \frac, \beta, \Omega)
            repaired += "\\\\" + char;
          }
          escape = false;
        } else if (char === "\\") {
          escape = true;
        } else if (char === "\"") {
          inString = false;
          repaired += "\"";
        } else if (char === "\n") {
          // Replace raw unescaped newline inside string with escaped newline
          repaired += "\\n";
        } else if (char === "\r") {
          repaired += "\\r";
        } else if (char === "\t") {
          repaired += "\\t";
        } else {
          repaired += char;
        }
      } else {
        if (char === "\"") {
          inString = true;
          repaired += "\"";
        } else {
          repaired += char;
        }
      }
    }
    
    // Handle unfinished escape or unclosed string
    if (escape) {
      repaired += "\\\\";
    }
    if (inString) {
      repaired += "\"";
    }
    
    // Balance braces and brackets for truncated inputs
    let braceCount = 0;
    let bracketCount = 0;
    let inRepString = false;
    let repEscape = false;
    
    for (let i = 0; i < repaired.length; i++) {
      const char = repaired[i];
      if (inRepString) {
        if (repEscape) {
          repEscape = false;
        } else if (char === "\\") {
          repEscape = true;
        } else if (char === "\"") {
          inRepString = false;
        }
      } else {
        if (char === "\"") {
          inRepString = true;
        } else if (char === "{") {
          braceCount++;
        } else if (char === "}") {
          braceCount--;
        } else if (char === "[") {
          bracketCount++;
        } else if (char === "]") {
          bracketCount--;
        }
      }
    }
    
    // Append missing closing symbols
    while (bracketCount > 0) {
      repaired += "]";
      bracketCount--;
    }
    while (braceCount > 0) {
      repaired += "}";
      braceCount--;
    }
    
    return JSON.parse(repaired);
  } catch (err) {
    throw new Error(`Robust JSON repair & parsing failed. Error: ${err}. Source: ${target.slice(0, 150)}...`);
  }
}

/**
 * High-accuracy fallback verifier for math & calculation options using Gemini.
 */
export async function verifyWithAI(question: string, options: string[]): Promise<string | null> {
  try {
    const prompt = `Solve this academic calculation question step-by-step to find the exact numerical answer:
Question: "${question}"
Options: ${options.map((opt, idx) => `${String.fromCharCode(65 + idx)}. ${opt}`).join(" | ")}

You must respond with valid JSON containing:
1. "answer": The exact numerical or algebraic solution.
2. "letter": A single uppercase letter ("A", "B", "C", or "D") matching the correct option.
3. "explanation": A very brief 1-sentence math explanation of how you reached this.

JSON Response:`;

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        systemInstruction: "You are a precise scientific calculator and educational verifier. You output ONLY valid raw JSON with no markdown formatting.",
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "{}";
    const data = safeParseJSON(text);
    
    if (data && typeof data.letter === "string") {
      const letter = data.letter.toUpperCase().trim();
      if (["A", "B", "C", "D"].includes(letter)) {
        return letter;
      }
    }
    return null;
  } catch (err) {
    console.error("verifyWithAI fallback error:", err);
    return null;
  }
}