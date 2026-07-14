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
    const cleaned = text.replace(/^```json/, "").replace(/```$/, "").trim();
    const data = JSON.parse(cleaned);
    
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
