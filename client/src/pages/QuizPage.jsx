import { useState } from 'react';
import { Brain, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import Navbar from '../components/Layout/Navbar';
import { quizAPI } from '../services/api';
import toast from 'react-hot-toast';

const SUBJECTS = ['General', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'English', 'Computer Science', 'Economics', 'Other'];
const DIFFICULTIES = ['Mixed', 'Easy', 'Medium', 'Hard'];

export default function QuizPage() {
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('General');
  const [difficulty, setDifficulty] = useState('Mixed');
  const [loading, setLoading] = useState(false);
  const [grading, setGrading] = useState(false);
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [report, setReport] = useState(null);

  const generate = async () => {
    if (!topic.trim()) return toast.error('Enter a topic');
    setLoading(true);
    setReport(null);
    try {
      const { data } = await quizAPI.generate({ topic, subject, difficulty });
      setQuiz(data.quiz);
      setAnswers({});
      toast.success('Quiz generated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate quiz');
    } finally {
      setLoading(false);
    }
  };

  const grade = async () => {
    if (!quiz) return;
    const missing = quiz.questions.filter(q => !(answers[q.id] || '').trim());
    if (missing.length) return toast.error('Answer all questions before grading');

    setGrading(true);
    try {
      const { data } = await quizAPI.grade({
        topic: quiz.topic,
        subject: quiz.subject,
        questions: quiz.questions,
        answers,
      });
      setReport(data.report);
      toast.success('Quiz graded');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to grade quiz');
    } finally {
      setGrading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <Brain className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quiz Mode</h1>
            <p className="text-sm text-gray-500">Generate 5 practice questions and get instant feedback.</p>
          </div>
        </div>

        <div className="card mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-gray-600">Topic</label>
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Arrays in JavaScript, Newton's Laws, Photosynthesis..."
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Subject</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2 flex items-end">
              <button onClick={generate} disabled={loading} className="btn-primary w-full py-2.5 justify-center">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4" /> Generate Quiz</>}
              </button>
            </div>
          </div>
        </div>

        {quiz && (
          <div className="card">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="min-w-0">
                <h2 className="font-semibold text-gray-900 truncate">{quiz.topic}</h2>
                <p className="text-xs text-gray-500">{quiz.subject} • 5 questions</p>
              </div>
              <button onClick={grade} disabled={grading} className="btn-primary px-4 py-2">
                {grading ? <><Loader2 className="w-4 h-4 animate-spin" /> Grading...</> : <><CheckCircle2 className="w-4 h-4" /> Grade</>}
              </button>
            </div>

            <div className="space-y-4">
              {quiz.questions.map((q, idx) => (
                <div key={q.id} className="border border-gray-100 rounded-xl p-4 bg-white">
                  <p className="text-sm font-medium text-gray-900 mb-2">{idx + 1}. {q.question}</p>
                  <textarea
                    value={answers[q.id] || ''}
                    onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                    rows={3}
                    placeholder="Write your answer..."
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {report?.results?.find(r => r.id === q.id) && (
                    <div className="mt-3 bg-gray-50 border border-gray-100 rounded-xl p-3">
                      {(() => {
                        const r = report.results.find(x => x.id === q.id);
                        return (
                          <>
                            <p className="text-xs font-medium text-gray-700">Score: <span className="font-semibold">{r.score}/{r.outOf}</span></p>
                            <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{r.feedback}</p>
                            <p className="text-xs text-gray-500 mt-2">Ideal answer:</p>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{r.idealAnswer}</p>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {report && (
              <div className="mt-6 border-t border-gray-100 pt-4">
                <p className="text-sm text-gray-900 font-semibold">
                  Total: {report.totalScore}/{report.outOf} ({report.percentage}%)
                </p>
                <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{report.overallFeedback}</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

