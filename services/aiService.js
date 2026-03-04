const axios = require("axios");

const HF_URL = "https://router.huggingface.co/v1/chat/completions";
const MODEL = "meta-llama/Meta-Llama-3-8B-Instruct";
const MAX_RETRIES = 3;

/* ===================================================== */
/* UNIVERSAL JSON EXTRACTOR (ULTRA SAFE) */
/* ===================================================== */
function extractJSON(text) {
  if (!text || typeof text !== "string") {
    throw new Error("Invalid AI response format");
  }

  // Remove markdown wrappers
  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  // 1️⃣ Try full parse first
  try {
    return JSON.parse(cleaned);
  } catch { }

  // 2️⃣ Try extracting JSON array (priority for quizzes)
  const firstBracket = cleaned.indexOf("[");
  const lastBracket = cleaned.lastIndexOf("]");

  if (firstBracket !== -1 && lastBracket !== -1) {
    const arrString = cleaned.slice(firstBracket, lastBracket + 1);
    try {
      return JSON.parse(arrString);
    } catch { }
  }

  // 3️⃣ Try extracting JSON object
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace !== -1) {
    const objString = cleaned.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(objString);
    } catch { }
  }

  // 4️⃣ Handle grading case (0 / 1)
  if (cleaned === "0" || cleaned === "1") {
    return Number(cleaned);
  }

  console.error("❌ JSON EXTRACTION FAILED");
  console.error("RAW AI OUTPUT:\n", cleaned);

  throw new Error("No valid JSON found in AI response");
}

/* ===================================================== */
/* MAIN AI CALL */
/* ===================================================== */
async function callAI(prompt, maxTokens = 800, attempt = 1) {
  try {
    const response = await axios.post(
      HF_URL,
      {
        model: MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are a strict JSON generator. Follow instructions exactly."
          },
          { role: "user", content: prompt }
        ],
        max_tokens: maxTokens,
        temperature: 0.2
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.HF_TOKEN}`,
          "Content-Type": "application/json"
        },
        timeout: 20000
      }
    );

    const text = response.data?.choices?.[0]?.message?.content;

    if (!text) {
      throw new Error("Empty AI response");
    }

    return extractJSON(text);

  } catch (err) {
    console.warn(`⚠️ AI attempt ${attempt} failed:`, err.message);

    if (attempt < MAX_RETRIES) {
      return callAI(prompt, maxTokens, attempt + 1);
    }

    console.error("🚨 AI FAILED after retries");
    throw new Error("AI Service Unavailable");
  }
}

module.exports = { callAI };