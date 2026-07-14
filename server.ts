import express from "express";
import path from "path";
import { ai, DEFAULT_MODEL, verifyWithAI, safeParseJSON } from "./src/ai/client";
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

// ---------- LOCAL FALLBACK TEST GENERATOR (Graces rate/quota limits) ----------
function getFallbackTest(message: string, isTheory: boolean) {
  const msg = message.toLowerCase();
  let category = "electricity";
  if (msg.includes("mechanic") || msg.includes("newton") || msg.includes("force")) {
    category = "mechanics";
  } else if (msg.includes("quadratic")) {
    category = "quadratic";
  } else if (msg.includes("linear")) {
    category = "linear";
  } else if (msg.includes("mole") || msg.includes("molar") || msg.includes("chemistry")) {
    category = "mole";
  }

  const reply = "⚠️ **Gemini API busy (Free Tier quota reached). Switched to Local Offline Practice Engine!**\\n\\nTo ensure your learning is uninterrupted, we have generated a high-quality practice test locally on your selected topic.";

  if (isTheory) {
    const questions: Record<string, any[]> = {
      electricity: [
        { qid: 1, question: "A lamp of resistance $15\\Omega$ is connected to a $120V$ power line. Show the formula and step-by-step calculations for the current flowing through it.", mark: "5 marks" },
        { qid: 2, question: "State Ohm's law. Calculate the voltage drop across a $100\\Omega$ resistor when the current is $0.2A$.", mark: "5 marks" }
      ],
      mechanics: [
        { qid: 1, question: "State Newton's Second Law. An object of mass $12kg$ accelerates at $1.5m/s^2$. Calculate the net force.", mark: "5 marks" },
        { qid: 2, question: "A force of $20N$ is applied to a mass of $4kg$. Determine its acceleration and list correct units.", mark: "5 marks" }
      ],
      quadratic: [
        { qid: 1, question: "Solve $x^2 - 7x + 12 = 0$ using the quadratic formula. Write down all steps and roots.", mark: "5 marks" },
        { qid: 2, question: "Solve $2x^2 + 5x - 3 = 0$. Show your factorization or quadratic steps.", mark: "5 marks" }
      ],
      linear: [
        { qid: 1, question: "Solve the equation $4(x - 3) = 16$. Write out each algebraic step.", mark: "5 marks" },
        { qid: 2, question: "Solve the simultaneous equations: $2x + y = 7$ and $x - y = 2$.", mark: "5 marks" }
      ],
      mole: [
        { qid: 1, question: "An amount of $90g$ of Glucose ($C_6H_{12}O_6$, Molar Mass = $180g/mol$) is dissolved in water. Find the number of moles.", mark: "5 marks" },
        { qid: 2, question: "Find the mass of $0.25$ moles of Sodium Hydroxide ($NaOH$, Molar Mass = $40g/mol$).", mark: "5 marks" }
      ]
    };

    const qList = questions[category] || questions.electricity;
    const testData: Record<string, any> = {};
    qList.forEach((q, i) => {
      testData[String(i + 1)] = q;
    });

    return {
      type: "theory_quiz",
      reply,
      testData
    };
  } else {
    const questions: Record<string, any[]> = {
      electricity: [
        { qid: 1, question: "An electrical heater of resistance $12\\Omega$ is connected to a $240V$ supply. What is the current flowing through it?", options: ["$10A$", "$20A$", "$15A$", "$30A$"], correct: "B", topic: "Electricity" },
        { qid: 2, question: "What voltage is required to pass a current of $3A$ through a $5\\Omega$ resistor?", options: ["$1.5V$", "$10V$", "$15V$", "$25V$"], correct: "C", topic: "Electricity" },
        { qid: 3, question: "An electrical lamp has a resistance of $8\\Omega$ when burning. If the voltage is $24V$, find the current.", options: ["$2A$", "$3A$", "$4A$", "$6A$"], correct: "B", topic: "Electricity" },
        { qid: 4, question: "Calculate the resistance of a toaster that draws $5A$ of current from a $120V$ outlet.", options: ["$12\\Omega$", "$24\\Omega$", "$48\\Omega$", "$60\\Omega$"], correct: "B", topic: "Electricity" },
        { qid: 5, question: "A battery has a voltage of $9V$ and is connected to a lightbulb drawing $0.5A$ of current. What is the resistance of the bulb?", options: ["$4.5\\Omega$", "$9\\Omega$", "$18\\Omega$", "$36\\Omega$"], correct: "C", topic: "Electricity" }
      ],
      mechanics: [
        { qid: 1, question: "A net force of $50N$ acts on a mass of $10kg$. Calculate the acceleration.", options: ["$2m/s^2$", "$5m/s^2$", "$10m/s^2$", "$500m/s^2$"], correct: "B", topic: "Mechanics" },
        { qid: 2, question: "An object has a mass of $8kg$ and accelerates at $4m/s^2$. What is the magnitude of the net force acting on it?", options: ["$2N$", "$12N$", "$32N$", "$64N$"], correct: "C", topic: "Mechanics" },
        { qid: 3, question: "What mass is accelerated at $3m/s^2$ by a net force of $15N$?", options: ["$5kg$", "$45kg$", "$0.2kg$", "$10kg$"], correct: "A", topic: "Mechanics" },
        { qid: 4, question: "A car of mass $1200kg$ accelerates from rest at $2m/s^2$. Find the net force acting on the car.", options: ["$600N$", "$1200N$", "$2400N$", "$4800N$"], correct: "C", topic: "Mechanics" },
        { qid: 5, question: "A force of $100N$ causes an object to accelerate at $20m/s^2$. Determine the mass of the object.", options: ["$0.2kg$", "$5kg$", "$50kg$", "$2000kg$"], correct: "B", topic: "Mechanics" }
      ],
      quadratic: [
        { qid: 1, question: "Find the roots of the quadratic equation $x^2 - 5x + 6 = 0$.", options: ["$x = 1, 6$", "$x = 2, 3$", "$x = -2, -3$", "$x = -5, 6$"], correct: "B", topic: "Quadratic Equations" },
        { qid: 2, question: "Solve the equation $x^2 - 9 = 0$.", options: ["$x = 3, -3$", "$x = 9, -9$", "$x = 0, 9$", "$x = 4.5, -4.5$"], correct: "A", topic: "Quadratic Equations" },
        { qid: 3, question: "Solve the quadratic equation $x^2 - 4x + 4 = 0$.", options: ["$x = 2, -2$", "$x = 2$ (double root)", "$x = 4$ (double root)", "$x = -4, -4$"], correct: "B", topic: "Quadratic Equations" },
        { qid: 4, question: "Find the roots of the equation $2x^2 - 8x = 0$.", options: ["$x = 0, 4$", "$x = 2, 8$", "$x = 0, 2$", "$x = 0, -4$"], correct: "A", topic: "Quadratic Equations" },
        { qid: 5, question: "Solve the quadratic equation $x^2 + 3x - 10 = 0$.", options: ["$x = 2, -5$", "$x = -2, 5$", "$x = 2, 5$", "$x = -2, -5$"], correct: "A", topic: "Quadratic Equations" }
      ],
      linear: [
        { qid: 1, question: "Solve for $x$ in the equation $3x + 7 = 22$.", options: ["$x = 3$", "$x = 5$", "$x = 7$", "$x = 9$"], correct: "B", topic: "Linear Algebra" },
        { qid: 2, question: "Find the value of $y$ if $2y - 12 = 4$.", options: ["$y = 4$", "$y = 6$", "$y = 8$", "$y = 10$"], correct: "C", topic: "Linear Algebra" },
        { qid: 3, question: "In the linear equation $5x - 3 = 2x + 9$, solve for $x$.", options: ["$x = 2$", "$x = 4$", "$x = 6$", "$x = 8$"], correct: "B", topic: "Linear Algebra" },
        { qid: 4, question: "Solve the simple linear system for $x$: $x + y = 10$ and $x - y = 4$.", options: ["$x = 5$", "$x = 6$", "$x = 7$", "$x = 8$"], correct: "C", topic: "Linear Algebra" },
        { qid: 5, question: "If $4x = 12$, what is the value of $x + 5$?", options: ["$8$", "$10$", "$12$", "$15$"], correct: "A", topic: "Linear Algebra" }
      ],
      mole: [
        { qid: 1, question: "How many moles are in $36g$ of water ($H_2O$)? (Molar mass of $H_2O = 18g/mol$).", options: ["$1 mol$", "$2 mol$", "$3 mol$", "$4 mol$"], correct: "B", topic: "Chemistry" },
        { qid: 2, question: "Calculate the mass of $0.5 mol$ of Carbon dioxide ($CO_2$). (Molar mass of $CO_2 = 44g/mol$).", options: ["$11g$", "$22g$", "$44g$", "$88g$"], correct: "B", topic: "Chemistry" },
        { qid: 3, question: "How many moles are present in $58.5g$ of Sodium Chloride ($NaCl$)? (Molar mass of $NaCl = 58.5g/mol$).", options: ["$0.5 mol$", "$1 mol$", "$1.5 mol$", "$2 mol$"], correct: "B", topic: "Chemistry" },
        { qid: 4, question: "Find the molar mass of an element if $3.0 moles$ of it have a mass of $72g$.", options: ["$12g/mol$", "$24g/mol$", "$36g/mol$", "$48g/mol$"], correct: "B", topic: "Chemistry" },
        { qid: 5, question: "What is the mass of $2.5 mol$ of Helium ($He$)? (Molar mass of $He = 4g/mol$).", options: ["$5g$", "$10g$", "$15g$", "$20g$"], correct: "B", topic: "Chemistry" }
      ]
    };

    const qList = questions[category] || questions.electricity;
    const testData: Record<string, any> = {};
    qList.forEach((q, i) => {
      testData[String(i + 1)] = q;
    });

    return {
      type: "quiz",
      reply,
      testData
    };
  }
}

// ---------- API ROUTES ----------

/**
 * Endpoint for text-based educational chat and question generation
 */
app.post("/api/chat", async (req: express.Request, res: express.Response) => {
  const { message, history = [], memory = {} } = req.body || {};
  if (!message) {
    return res.status(400).json({ error: "Missing message payload" });
  }

  const isObj = /Type:\s*Objectives/i.test(message);
  const isTh = /Type:\s*Theory/i.test(message);

  if (!process.env.GEMINI_API_KEY) {
    if (isObj || isTh) {
      return res.status(200).json(getFallbackTest(message, isTh));
    }
    const solverResult = solveQuestionLocally(message);
    if (solverResult.solved && solverResult.explanation) {
      return res.status(200).json({
        type: "chat",
        reply: `⚠️ **Gemini API Key missing.** Switched to **Local Solver Engine** for your calculation:\n\n${solverResult.explanation}`
      });
    }
    return res.status(200).json({ type: "chat", reply: "Server misconfiguration: GEMINI_API_KEY is missing." });
  }

  // OPTIMIZATION: Stream standard chat responses for ultra-fast, sub-second initial load times
  if (!isObj && !isTh) {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");

    let studentProfilePrompt = "";
    if (memory && typeof memory === "object") {
      const name = memory.studentName || "T-boy";
      const classLevel = memory.classLevel || "High School / SSS";
      const age = memory.age || 17;
      const gender = memory.gender || "Male";
      const assimilation = memory.assimilation || "Bite-Sized & Step-by-Step";
      const level = Math.floor((memory.solved || 0) / 10) + 1;

      studentProfilePrompt = `\n\nYou are teaching a student with the following profile:
- **Student Name**: ${name}
- **Academic Class/Level**: ${classLevel} (calculated Level ${level})
- **Age**: ${age} years old
- **Gender**: ${gender}
- **Explanation Style**: ${assimilation}

CRITICAL ADAPTATION DIRECTIONS:
1. Address the student by name ("${name}") occasionally when providing encouragement.
2. Adapt your explanation complexity, length, and depth to their grade ("${classLevel}"). If Junior High School, keep steps very basic, avoiding complex calculus or terminology, and use simple relatable examples. If Undergraduate or Postgraduate, write with rigorous proofs, advanced formulas, and professional scientific phrasing.
3. Align your tutoring speed with their Explanation Style ("${assimilation}"):
   - If "Bite-Sized & Step-by-Step", output one logical micro-step at a time and ask if they are ready for the next one.
   - If "Visual Analogies & Examples", explain formulas using real-world objects, physics mechanics, and intuitive mental models first.
   - If "Formula-Dense & Rigorous", skip simple math steps and focus on high-level mathematical formulas and proofs.`;
    }

    const systemInstruction = `You are MR.AI, a highly expert and supportive professional tutor in Mathematics, Further Mathematics, Chemistry, and Physics calculations.
Guidelines:
1. Always format mathematical formulas using clean standard TeX inside $...$ (e.g. $y = mx + c$, $x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$).
2. Speak clearly, direct to the point, and friendly.
3. Be supportive. If the user's pace in memory is 'slow', teach in smaller, bite-sized step-by-step increments.${studentProfilePrompt}`;

    try {
      const contents = [
        ...history.map((h: any) => ({
          role: h.role === "assistant" ? "model" : h.role,
          parts: [{ text: h.content }],
        })),
        { role: "user", parts: [{ text: message }] },
      ];

      // 1. ATTEMPT GROQ STREAMING FIRST (IF API KEY AVAILABLE)
      if (process.env.GROQ_API_KEY) {
        try {
          const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "llama-3.3-70b-specdec",
              messages: [
                { role: "system", content: systemInstruction },
                ...history.map((h: any) => ({
                  role: h.role === "model" || h.role === "assistant" ? "assistant" : "user",
                  content: h.content,
                })),
                { role: "user", content: message },
              ],
              stream: true,
            }),
          });

          if (groqResponse.ok && groqResponse.body) {
            const reader = (groqResponse.body as any).getReader();
            const decoder = new TextDecoder();
            let buffer = "";
            let done = false;
            while (!done) {
              const { value, done: readerDone } = await reader.read();
              done = readerDone;
              if (value) {
                buffer += decoder.decode(value, { stream: !done });
                const lines = buffer.split("\n");
                buffer = lines.pop() || "";
                for (const line of lines) {
                  const cleanLine = line.trim();
                  if (!cleanLine || cleanLine === "data: [DONE]") continue;
                  if (cleanLine.startsWith("data: ")) {
                    try {
                      const json = JSON.parse(cleanLine.substring(6));
                      const text = json.choices?.[0]?.delta?.content;
                      if (text) {
                        res.write(text);
                      }
                    } catch (e) {
                      // ignore parse errors on single lines
                    }
                  }
                }
              }
            }
            res.end();
            return;
          } else {
            console.warn(`Groq streaming request failed with status ${groqResponse.status}. Falling back to Gemini...`);
          }
        } catch (groqErr) {
          console.warn("Groq streaming connection failed, falling back to Gemini:", groqErr);
        }
      }

      // 2. MULTI-MODEL GEMINI FALLBACK CASCADE
      const geminiModels = [DEFAULT_MODEL, "gemini-1.5-pro", "gemini-2.5-flash", "gemini-3.1-flash-lite"];
      let responseStream;
      let lastErr;

      for (const modelName of geminiModels) {
        try {
          responseStream = await ai.models.generateContentStream({
            model: modelName,
            contents,
            config: {
              systemInstruction,
            },
          });
          break; // Successfully connected
        } catch (streamErr) {
          lastErr = streamErr;
          console.warn(`Gemini stream model ${modelName} failed, cycling to next fallback...`, streamErr);
        }
      }

      if (!responseStream) {
        throw lastErr || new Error("All Gemini streaming models exhausted.");
      }

      for await (const chunk of responseStream) {
        if (chunk.text) {
          res.write(chunk.text);
        }
      }
      res.end();
      return;
    } catch (err) {
      console.error("Chat streaming API error:", err);
      const solverResult = solveQuestionLocally(message);
      if (solverResult.solved && solverResult.explanation) {
        res.write(`⚠️ **Gemini API quota/limit reached.**\n\nMR.AI's **Local Calculation Solver Engine** has successfully parsed and solved your question:\n\n${solverResult.explanation}`);
      } else {
        res.write("⚠️ **Gemini API free tier quota limit reached (20 requests/day).**\n\nTo ensure your study session is uninterrupted, MR.AI has loaded the **Local Calculation Solver Engine**!\n\nYou can solve equations like $3x + 7 = 22$ or $x^2 - 5x + 6 = 0$ directly in the chat, or select any of the **Curriculum Topics** to master concepts.");
      }
      res.end();
      return;
    }
  }

  // Quiz generation remains structured JSON
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
      "correct": "B",
      "topic": "Electricity"
    }
  }
}
IMPORTANT: Make sure every option is wrapped in $...$ and contains mathematical symbols. Put the actual calculation values in the options, and you MUST provide the correct option letter ("A", "B", "C", or "D") in the "correct" field of each question in the generated JSON. All math must be in standard TeX format wrapped in $...$.`
    : `You are MR.AI theory question setter. Topic: "${message}". Create theory questions. 
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
}`;

  try {
    const contents = [
      ...history.map((h: any) => ({
        role: h.role === "assistant" ? "model" : h.role,
        parts: [{ text: h.content }],
      })),
      { role: "user", parts: [{ text: message }] },
    ];

    let responseText = "";
    if (process.env.GROQ_API_KEY) {
      try {
        const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-specdec",
            messages: [
              { role: "system", content: systemInstruction },
              ...history.map((h: any) => ({
                role: h.role === "model" || h.role === "assistant" ? "assistant" : "user",
                content: h.content,
              })),
              { role: "user", content: message },
            ],
            response_format: { type: "json_object" },
          }),
        });
        if (groqResponse.ok) {
          const json = await groqResponse.json();
          responseText = json.choices?.[0]?.message?.content || "";
        } else {
          console.warn(`Groq quiz request failed with status ${groqResponse.status}. Trying Gemini...`);
        }
      } catch (groqErr) {
        console.warn("Groq quiz generation failed, trying Gemini:", groqErr);
      }
    }

    if (!responseText) {
      const geminiModels = [DEFAULT_MODEL, "gemini-1.5-pro", "gemini-2.5-flash", "gemini-3.1-flash-lite"];
      let lastErr;
      for (const modelName of geminiModels) {
        try {
          const resObj = await ai.models.generateContent({
            model: modelName,
            contents,
            config: {
              systemInstruction,
              responseMimeType: "application/json",
            },
          });
          responseText = resObj.text || "{}";
          break;
        } catch (genErr) {
          lastErr = genErr;
          console.warn(`Gemini quiz model ${modelName} failed, trying next fallback...`, genErr);
        }
      }
      if (!responseText) {
        throw lastErr || new Error("All Gemini models failed for quiz generation.");
      }
    }

    const p = safeParseJSON(responseText);

    // If a quiz or test is generated, run the local Solver Engine correction loop to verify correctness
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

          // 2. Fallback correction: use solver result if found, otherwise trust the LLM-generated 'correct' field, defaulted to "A" if missing
          if (correctLetter) {
            q.correct = correctLetter;
          } else {
            // Default to generated correct answer or option A
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

    // If they requested a quiz or a test, provide the pre-curated high-quality offline version!
    return res.status(200).json(getFallbackTest(message, isTh));
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

    const geminiModels = [DEFAULT_MODEL, "gemini-1.5-pro", "gemini-2.5-flash", "gemini-3.1-flash-lite"];
    let response;
    let lastErr;

    for (const modelName of geminiModels) {
      try {
        response = await ai.models.generateContent({
          model: modelName,
          contents,
          config: {
            systemInstruction: SYSTEM_PROMPT,
            responseMimeType: "application/json",
          },
        });
        break; // Succeeded!
      } catch (visErr) {
        lastErr = visErr;
        console.warn(`Gemini vision model ${modelName} failed, trying next fallback...`, visErr);
      }
    }

    if (!response) {
      throw lastErr || new Error("All Gemini vision models exhausted.");
    }

    const contentText = response.text || "{}";
    const parsed = safeParseJSON(contentText);
    return res.status(200).json(parsed);
  } catch (err) {
    console.error("Vision API error:", err);
    return res.status(200).json({
      type: "chat",
      reply: "⚠️ **Gemini API free tier quota limit reached (20 requests/day) or invalid image format.**\\n\\nOCR image scanning is temporarily offline. To continue studying without interruption, please type your calculation question (e.g. $3x + 10 = 25$) directly into the chat, or click any of the **Curriculum Topics** on the left to practice!",
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
