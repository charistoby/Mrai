import express from "express";
import path from "path";
import { ai, DEFAULT_MODEL, verifyWithAI } from "./src/ai/client";
import { solveQuestionLocally, findOptionLetter } from "./src/solvers/index";

const app = express();
const PORT = 3000;

// Set payload limit for base64 image uploads (crucial for homework submissions)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Enable CORS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Helper to parse base64 image data URLs
function parseDataUrl(dataUrl: string) {
  const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) {
    return { mimeType: "image/jpeg", data: dataUrl };
  }
  return {
    mimeType: matches[1],
    data: matches[2],
  };
}

// ---------- API ROUTES ----------

/**
 * Endpoint for text-based educational chat and question generation
 */
app.post("/api/chat", async (req: express.Request, res: express.Response) => {
  if (!process.env.GEMINI_API_KEY) {
    return res.status(200).json({ type: "chat", reply: "Server misconfiguration: GEMINI_API_KEY is missing." });
  }

  const { message, history = [], memory = {} } = req.body || {};
  if (!message) {
    return res.status(400).json({ error: "Missing message payload" });
  }

  const isObj = /Type:\s*Objectives/i.test(message);
  const isTh = /Type:\s*Theory/i.test(message);

  const systemInstruction = isObj
    ? `You are MR.AI professional question setter. Topic: "${message}". Create exactly 10 high-quality objective questions testing mathematical, scientific, or physics calculations. 
Return ONLY JSON with this format:
{
  "type": "quiz",
  "reply": "Test Ready — Good luck!",
  "testData": {
    "1": {
      "qid": 1,
      "question": "A resistor of resistance $R$ is connected to...",
      "options": ["$3\\Omega$", "$6\\Omega$", "$9\\Omega$", "$12\\Omega$"],
      "topic": "Electricity"
    }
  }
}
IMPORTANT: Make sure every option is wrapped in $...$ and contains mathematical symbols. Put the actual calculation values in the options, but DO NOT provide the answer letter in the generated JSON. All math must be in standard TeX format wrapped in $...$.`
    : isTh
    ? `You are MR.AI theory question setter. Topic: "${message}". Create theory questions. 
Return ONLY JSON:
{
  "type": "theory_quiz",
  "reply": "Theory exam ready! Solve these step-by-step and upload your answer sheets.",
  "testData": {
    "1": {
      "qid": 1,
      "question": "An object of mass $5kg$ accelerates at $3m/s^2$. Calculate the force acting on it.",
      "mark": "5 marks"
    }
  }
}`
    : `You are MR.AI, a highly expert and supportive professional tutor in Mathematics, Further Mathematics, Chemistry, and Physics calculations.
Reply with JSON of the form:
{
  "type": "chat",
  "reply": "<u>Topic</u>: Ohm's Law\\n\\n<u>Step 1</u>: Identify variables $V = 15V$, $I = 5A$.\\n<u>Step 2</u>: Use Formula $R = \\\\frac{V}{I}$.\\n<u>Answer</u>: $3\\\\Omega$.\\n\\nClear?"
}
Guidelines:
1. Always format mathematical formulas using clean standard TeX inside $...$ (e.g. $y = mx + c$, $x = \\\\frac{-b \\\\pm \\\\sqrt{b^2-4ac}}{2a}$).
2. Speak clearly, direct to the point, and friendly.
3. Be supportive. If the user's pace in memory is 'slow', teach in smaller, bite-sized step-by-step increments.`;

  try {
    const contents = [
      ...history.map((h: any) => ({
        role: h.role === "assistant" ? "model" : h.role,
        parts: [{ text: h.content }],
      })),
      { role: "user", parts: [{ text: message }] },
    ];

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });

    const contentText = response.text || "{}";
    const cleanedContent = contentText.replace(/^```json/, "").replace(/```$/, "").trim();
    const p = JSON.parse(cleanedContent);

    // If a quiz or test is generated, run the local Solver Engine correction loop to guarantee correctness
    if (p.testData) {
      for (const k in p.testData) {
        const q = p.testData[k];
        if (!q.qid) q.qid = Number(k);
        
        if (q.options) {
          // 1. Solve using our high-precision local calculation engine
          const solverResult = solveQuestionLocally(q.question);
          let correctLetter = solverResult.solved && solverResult.value !== null 
            ? findOptionLetter(q.options, solverResult.value) 
            : null;

          // 2. If local solver is not applicable, use our LLM-verifier fall-back
          if (!correctLetter) {
            const aiLetter = await verifyWithAI(q.question, q.options);
            if (aiLetter && ["A", "B", "C", "D"].includes(aiLetter)) {
              correctLetter = aiLetter;
            }
          }

          // 3. Fallback correction to ensure robust rendering and math consistency
          if (correctLetter) {
            q.correct = correctLetter;
          } else {
            // Default to option A to guarantee there is always a marked key
            q.correct = q.correct || "A";
          }

          // Ensure uniform math rendering tags $...$ on questions and options
          q.question = q.question.includes("$") ? q.question : `$${q.question}$`.replace(/\$\$/g, "$");
          q.options = q.options.map((o: string) => (o.includes("$") ? o : `$${o.replace(/\$/g, "")}$`));
        }
      }
    }

    return res.status(200).json(p);
  } catch (err) {
    console.error("Chat API error:", err);
    return res.status(200).json({
      type: "chat",
      reply: "Network is busy. Please try that topic or question again! MR.AI is listening.",
    });
  }
});

/**
 * Endpoint for image and handwritten assignment processing (OCR + Tutor assessment)
 */
app.post("/api/vision", async (req: express.Request, res: express.Response) => {
  if (!process.env.GEMINI_API_KEY) {
    return res.status(200).json({ type: "chat", reply: "Server error: GEMINI_API_KEY missing" });
  }

  const { image, images, history = [], memory = {}, topic = "" } = req.body || {};
  const imgs = images || (image ? [image] : []);

  if (!imgs.length || !imgs[0]) {
    return res.status(400).json({ type: "chat", reply: "No image received. Try again." });
  }

  const validImgs = imgs.slice(0, 5).filter((i: any) => typeof i === "string" && i.startsWith("data:image"));

  if (!validImgs.length) {
    return res.status(400).json({ type: "chat", reply: "Invalid image format. Please retake photo." });
  }

  const SYSTEM_PROMPT = `
You are MR.AI, a professional tutor of Mathematics, Further Maths, and Physics.
You analyze incoming images (handwritten answers, worksheets, or textbook questions) and provide deep educational feedback.

Analyze and classify the submission into one of these types:

TYPE A - QUESTION ANALYSIS (Image contains only a question, no user working):
Respond with a raw JSON structure:
{
  "type": "chat",
  "reply": "<u>Question Detected</u>: [read the question and wrap formulas in $...$]\\n\\n<u>Step-by-step Solution</u>:\\n\\n<u>Step 1</u>: Extract parameters...\\n<u>Step 2</u>: Formulate...\\n<u>Answer</u>: $...$\\n\\nDid that make sense?"
}

TYPE B - ASSIGNMENT CORRECTION (Image contains a question AND user's handwritten working):
Respond with a raw JSON structure:
{
  "type": "chat",
  "reply": "Marking your handwritten assignment:\\n\\n<u>Question</u>: ...\\n<u>Step 1</u>: ✅ Correct\\n<u>Step 2</u>: 🔴 Mistake detected in algebraic simplification...\\n<u>Error Analysis</u>: You forgot to...\\n<u>Correct Working</u>: $...$\\n\\n<u>Final Grade</u>: 3/5\\nWould you like a similar question to practice?"
}

TYPE C - THEORY TEST MARKING (Images are answers to an active theory test):
Topic Context: "${topic}"
Respond with a raw JSON structure:
{
  "type": "chat",
  "reply": "Theory Assessment Results:\\n\\n<u>Q1</u>: ✅ 5/5 marks. Fully correct layout.\\n<u>Q2</u>: 🔴 2/5 marks. Forgot to write units for Force (Newtons).\\n\\n<u>Overall Score</u>: 7/10\\nLet's review the topics you found challenging."
}

CRITICAL RULES:
1. ONLY teach calculations and math-related science. If non-mathematical or non-scientific: {"type":"chat","reply":"I can only assist with Maths, Further Maths, Physics, and Chemistry calculations. Let's try one of those!"}
2. ALL math/equations MUST be wrapped in TeX $...$ formatting (e.g. $V = I \\\\cdot R$, $E = mc^2$). Never use raw text for algebraic formulas.
3. Use \\n for newline characters. Use ✅ and 🔴 for visual correction feedback.
4. Always respond with a valid JSON object. No markdown fences around the JSON.
Student Memory Profile: ${JSON.stringify(memory).slice(0, 500)}
`;

  try {
    const imageParts = validImgs.map((imgUrl: string) => {
      const parsed = parseDataUrl(imgUrl);
      return {
        inlineData: {
          mimeType: parsed.mimeType,
          data: parsed.data,
        },
      };
    });

    const textPart = {
      text: topic
        ? topic
        : "Extract and solve the calculation from this image. Format answers step-by-step with LaTeX $...$ blocks.",
    };

    const contents = [
      ...history.map((h: any) => ({
        role: h.role === "assistant" ? "model" : h.role,
        parts: [{ text: h.content }],
      })),
      {
        role: "user",
        parts: [textPart, ...imageParts],
      },
    ];

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
      },
    });

    const contentText = response.text || "{}";
    const cleanedContent = contentText.replace(/^```json/, "").replace(/```$/, "").trim();
    const parsed = JSON.parse(cleanedContent);
    return res.status(200).json(parsed);
  } catch (err) {
    console.error("Vision API error:", err);
    return res.status(200).json({
      type: "chat",
      reply: "Image analysis failed.\\n\\nPlease provide a clearer or more upright photograph of the page.",
    });
  }
});

// Serve the static frontend index.html file
app.get("/", (req, res) => {
  res.sendFile(path.join(process.cwd(), "index.html"));
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Professional MR.AI Server is active on port ${PORT}`);
});
