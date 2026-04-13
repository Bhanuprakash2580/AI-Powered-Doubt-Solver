const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = 'llama-3.3-70b-versatile';

const SYSTEM_PROMPT = `You are an expert tutor for grades 8-12 and college. You create practice quizzes and grade answers with clear, constructive feedback. Always follow the required JSON output format exactly.`;

const parseJsonFromText = (text) => {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
};

// POST /api/quiz/generate
const generateQuiz = async (req, res) => {
  const { topic, subject = 'General', difficulty = 'Mixed' } = req.body || {};

  if (!topic || !String(topic).trim()) {
    return res.status(400).json({ success: false, message: 'Topic is required' });
  }

  const prompt = `Create a short practice quiz for the topic below.

Topic: ${topic}
Subject: ${subject}
Difficulty: ${difficulty}

Return ONLY valid JSON in this exact format:
{
  "questions": [
    { "id": "q1", "question": "..." },
    { "id": "q2", "question": "..." },
    { "id": "q3", "question": "..." },
    { "id": "q4", "question": "..." },
    { "id": "q5", "question": "..." }
  ]
}

Rules:
- Exactly 5 questions
- Prefer step-by-step / reasoning friendly questions
- Avoid requiring images
- Keep each question concise`;

  const response = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    temperature: 0.4,
    max_tokens: 1200,
  });

  const text = response.choices?.[0]?.message?.content || '';
  const json = parseJsonFromText(text);

  if (!json || !Array.isArray(json.questions) || json.questions.length !== 5) {
    return res.status(500).json({
      success: false,
      message: 'Failed to generate quiz (invalid AI response)',
      raw: text,
    });
  }

  res.json({
    quiz: {
      topic: String(topic).trim(),
      subject,
      questions: json.questions.map((q, idx) => ({
        id: q.id || `q${idx + 1}`,
        question: q.question || '',
      })),
    },
  });
};

// POST /api/quiz/grade
const gradeQuiz = async (req, res) => {
  const { topic, subject = 'General', questions, answers } = req.body || {};

  if (!topic || !String(topic).trim()) {
    return res.status(400).json({ success: false, message: 'Topic is required' });
  }
  if (!Array.isArray(questions) || questions.length !== 5) {
    return res.status(400).json({ success: false, message: 'Exactly 5 questions are required' });
  }
  if (!answers || typeof answers !== 'object') {
    return res.status(400).json({ success: false, message: 'Answers are required' });
  }

  const prompt = `Grade the student's answers.

Topic: ${topic}
Subject: ${subject}

Questions (JSON):
${JSON.stringify(questions)}

Student Answers (JSON map id->answer):
${JSON.stringify(answers)}

Return ONLY valid JSON in this exact format:
{
  "results": [
    { "id": "q1", "score": 0, "outOf": 2, "idealAnswer": "...", "feedback": "..." },
    { "id": "q2", "score": 0, "outOf": 2, "idealAnswer": "...", "feedback": "..." },
    { "id": "q3", "score": 0, "outOf": 2, "idealAnswer": "...", "feedback": "..." },
    { "id": "q4", "score": 0, "outOf": 2, "idealAnswer": "...", "feedback": "..." },
    { "id": "q5", "score": 0, "outOf": 2, "idealAnswer": "...", "feedback": "..." }
  ],
  "totalScore": 0,
  "outOf": 10,
  "percentage": 0,
  "overallFeedback": "..."
}

Scoring:
- 2 = correct / strong explanation
- 1 = partially correct
- 0 = incorrect or missing`;

  const response = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    temperature: 0.2,
    max_tokens: 1800,
  });

  const text = response.choices?.[0]?.message?.content || '';
  const json = parseJsonFromText(text);

  if (!json || !Array.isArray(json.results)) {
    return res.status(500).json({
      success: false,
      message: 'Failed to grade quiz (invalid AI response)',
      raw: text,
    });
  }

  res.json({ report: json });
};

module.exports = { generateQuiz, gradeQuiz };

