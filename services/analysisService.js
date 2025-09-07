const pdfParse = require('pdf-parse');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Extract raw text from PDF buffer
async function parsePdf(fileBuffer) {
  const { text } = await pdfParse(fileBuffer);
  return text;
}

// Ask Gemini to produce normalized JSON
async function analyzeResume(resumeText) {
  const prompt = `
You are an expert technical recruiter and career coach. Analyze the following resume text and output ONLY a valid JSON object that matches the schema and contains as many fields populated as possible (use null where missing). Do not include any extra commentary.

Resume Text:
"""
${resumeText}
"""

Schema:
{
  "name": "string | null",
  "email": "string | null",
  "phone": "string | null",
  "linkedin_url": "string | null",
  "portfolio_url": "string | null",
  "summary": "string | null",
  "work_experience": [{"role":"string","company":"string","duration":"string","description":["string"]}],
  "education": [{"degree":"string","institution":"string","graduation_year":"string"}],
  "technical_skills": ["string"],
  "soft_skills": ["string"],
  "projects": ["string"],
  "certifications": ["string"],
  "resume_rating": "number (1-10)",
  "improvement_areas": "string",
  "upskill_suggestions": ["string"]
}

Rules:
- Output strictly JSON.
- Make arrays even if there's one item.
- "resume_rating" must be an integer 1–10.
- If phone/email/links are not found, set them to null.
`;

  // Prefer latest stable model; swap to 1.5-pro if you need deeper reasoning
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  try {
    return JSON.parse(text);
  } catch (e) {
    // Basic recovery if model adds fencing; strip code fences
    const cleaned = text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```$/i, '');
    return JSON.parse(cleaned);
  }
}

module.exports = { parsePdf, analyzeResume };
