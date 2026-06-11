const {
    GoogleGenerativeAI
} = require("@google/generative-ai");
const dotenv= require("dotenv");
dotenv.config();
const genAI =
    new GoogleGenerativeAI(
        process.env.GEMINI_API_KEY
    );

async function analyzeSubmission(data) {

    try {

        const model =
            genAI.getGenerativeModel({
                model: "gemini-3.5-flash"
            });

        const prompt = `
You are an expert competitive programming tutor.

Analyze this competitive programming solution.

Problem Title:
${data.title}

Platform:
${data.platform}

Code:
${data.code}

Return ONLY valid JSON.

Format:

{
  "cleaned_code": "...",

  "metadata": {
    "title": "...",
    "difficulty": "...",
    "topics": [],
    "time_complexity": "...",
    "space_complexity": "..."
  },

  "explanation_markdown": "..."
}

Rules:
- explanation_markdown must be proper markdown
- cleaned_code must preserve formatting
- no extra text
- no markdown code fences
- return valid parsable JSON only
`;

        const result =
            await model.generateContent(
                prompt
            );

        const response =
            await result.response;

        const text =
            response.text();

        // remove accidental markdown wrappers
        const cleaned = text
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        const parsed =
            JSON.parse(cleaned);

        return parsed;

    } catch (err) {

        console.error(
            "Gemini Error:",
            err
        );

        throw err;
    }
}

module.exports =
    analyzeSubmission;
