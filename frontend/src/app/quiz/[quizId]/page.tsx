"use client";

import { useEffect, useState, FormEvent } from "react";
import { useParams } from "next/navigation";
import axios from "axios";

interface Paigham {
  _id: string;
  title: string;
}

interface QuizType {
  _id: string;
  name: string;
}

interface Question {
  type: string;
  [key: string]: unknown;
}

interface Quiz {
  _id: string;
  title: string;
  description: string;
  paighamId: Paigham | null;
  quizTypeId: QuizType | null;
  startDate: string;
  endDate: string;
  questions: Question[];
}

interface Member {
  omjCard: string;
  name: string;
  email: string;
  phone: string;
}

export default function QuizPage() {
  const params = useParams();
  const quizId = params.quizId as string;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [omjCard, setOmjCard] = useState("");
  const [member, setMember] = useState<Member | null>(null);
  const [memberLoading, setMemberLoading] = useState(false);
  const [memberError, setMemberError] = useState("");

  const [answers, setAnswers] = useState<Record<number, unknown>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(null);

  const [step, setStep] = useState<"identify" | "quiz" | "done">("identify");

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const res = await axios.get(`/api/quiz/${quizId}`);
        if (res.data.success) {
          setQuiz(res.data.data);
        } else {
          setError("Quiz not found");
        }
      } catch {
        setError("Failed to load quiz");
      } finally {
        setLoading(false);
      }
    };
    if (quizId) fetchQuiz();
  }, [quizId]);

  const isExpired = quiz ? new Date() > new Date(quiz.endDate) : false;
  const isNotStarted = quiz ? new Date() < new Date(quiz.startDate) : false;
  const isActive = quiz && !isExpired && !isNotStarted;

  const lookupMember = async () => {
    if (!omjCard.trim()) {
      setMemberError("Please enter your OMJ Card number");
      return;
    }
    setMemberLoading(true);
    setMemberError("");
    try {
      const res = await axios.get(`/api/member/${encodeURIComponent(omjCard.trim())}`);
      if (res.data.success) {
        setMember(res.data.data);
        setStep("quiz");
      } else {
        setMemberError("Member not found");
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        setMemberError("Member not found. Please check your OMJ Card number.");
      } else {
        setMemberError("Failed to verify member");
      }
    } finally {
      setMemberLoading(false);
    }
  };

  const updateAnswer = (index: number, value: unknown) => {
    setAnswers({ ...answers, [index]: value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!quiz || !member) return;

    const formattedAnswers = quiz.questions.map((q, i) => ({
      questionIndex: i,
      questionType: q.type,
      answer: answers[i] ?? null,
    }));

    setSubmitting(true);
    setSubmitResult(null);
    try {
      const res = await axios.post("/api/submission", {
        quizId: quiz._id,
        omjCard: member.omjCard,
        answers: formattedAnswers,
      });
      if (res.data.success) {
        setSubmitResult({ success: true, message: "Your answers have been submitted successfully!" });
        setStep("done");
      } else {
        setSubmitResult({ success: false, message: res.data.message || "Submission failed" });
      }
    } catch (err) {
      const message = axios.isAxiosError(err) && err.response?.data?.message
        ? err.response.data.message
        : "Failed to submit answers";
      setSubmitResult({ success: false, message });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const renderQuestion = (q: Question, index: number) => {
    switch (q.type) {
      case "multiple_choice":
        return (
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-900">{q.question as string}</p>
            <div className="space-y-2">
              {(q.options as string[]).map((opt, optIdx) => (
                <button
                  type="button"
                  key={optIdx}
                  onClick={() => updateAnswer(index, optIdx)}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all w-full text-left ${
                    answers[index] === optIdx
                      ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    answers[index] === optIdx ? "border-blue-500" : "border-gray-300"
                  }`}>
                    {answers[index] === optIdx && (
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                    )}
                  </div>
                  <span className="text-sm text-gray-700">{opt}</span>
                </button>
              ))}
            </div>
          </div>
        );

      case "word_search":
        return (
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-900">
              <span className="text-gray-500">Clue:</span> {q.clue as string}
            </p>
            <input
              type="text"
              value={(answers[index] as string) || ""}
              onChange={(e) => updateAnswer(index, e.target.value)}
              placeholder="Enter the word"
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        );

      case "translate":
        return (
          <div className="space-y-3">
            <div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {q.sourceLanguage as string}
                </span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {q.targetLanguage as string}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-900">{q.sourceText as string}</p>
            </div>
            <input
              type="text"
              value={(answers[index] as string) || ""}
              onChange={(e) => updateAnswer(index, e.target.value)}
              placeholder={`Translate to ${q.targetLanguage as string}`}
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        );

      case "image":
        return (
          <div className="space-y-3">
            {(q.imageUrl as string) && (
              <div className="rounded-lg border border-gray-200 overflow-hidden bg-gray-50 p-2">
                <img
                  src={q.imageUrl as string}
                  alt="Question"
                  className="max-h-48 w-auto mx-auto rounded object-contain"
                />
              </div>
            )}
            <p className="text-sm font-medium text-gray-900">{q.question as string}</p>
            <input
              type="text"
              value={(answers[index] as string) || ""}
              onChange={(e) => updateAnswer(index, e.target.value)}
              placeholder="Enter your answer"
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        );

      default:
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">Unknown question type</p>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 mx-auto" />
          <p className="mt-4 text-sm text-gray-500">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center max-w-sm mx-auto px-4">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Quiz Not Found</h2>
          <p className="text-gray-500 text-sm">{error || "This quiz does not exist or has been removed."}</p>
          <a href="/" className="inline-block mt-6 text-sm text-blue-600 hover:text-blue-800 font-medium">
            Go to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{quiz.title}</h1>
              <p className="text-sm text-gray-500 mt-0.5">{quiz.description}</p>
              {quiz.paighamId && (
                <p className="text-xs text-gray-400 mt-1">From: {quiz.paighamId.title}</p>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {!isActive && (
          <div className={`rounded-xl p-5 mb-6 ${
            isExpired
              ? "bg-red-50 border border-red-200"
              : "bg-yellow-50 border border-yellow-200"
          }`}>
            <div className="flex items-start gap-3">
              <svg className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isExpired ? "text-red-500" : "text-yellow-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.27 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h3 className={`font-medium ${isExpired ? "text-red-800" : "text-yellow-800"}`}>
                  {isExpired ? "Quiz Expired" : "Quiz Not Yet Available"}
                </h3>
                <p className={`text-sm mt-1 ${isExpired ? "text-red-600" : "text-yellow-600"}`}>
                  {isExpired
                    ? `This quiz ended on ${formatDate(quiz.endDate)}. Submissions are no longer accepted.`
                    : `This quiz will be available from ${formatDate(quiz.startDate)}.`}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 mb-6 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {formatDate(quiz.startDate)} – {formatDate(quiz.endDate)}
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {quiz.questions.length} question{quiz.questions.length !== 1 ? "s" : ""}
          </span>
        </div>

        {step === "done" && submitResult?.success && (
          <div className="rounded-xl bg-green-50 border border-green-200 p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-green-800 mb-2">Submitted Successfully!</h2>
            <p className="text-green-600 text-sm">{submitResult.message}</p>
            <a href="/" className="inline-block mt-6 text-sm text-green-700 hover:text-green-900 font-medium underline">
              Back to Home
            </a>
          </div>
        )}

        {step === "identify" && isActive && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Identify Yourself</h2>
            <p className="text-sm text-gray-500 mb-6">Enter your OMJ Card number to begin the quiz</p>

            {memberError && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-4">
                {memberError}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={omjCard}
                onChange={(e) => setOmjCard(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") lookupMember(); }}
                placeholder="e.g. OMJ-001"
                className="flex-1 rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={lookupMember}
                disabled={memberLoading}
                className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {memberLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Verifying...
                  </span>
                ) : (
                  "Continue"
                )}
              </button>
            </div>
          </div>
        )}

        {step === "quiz" && isActive && member && (
          <form onSubmit={handleSubmit}>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{member.name}</p>
                  <p className="text-xs text-gray-500">{member.omjCard}</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setStep("identify"); setMember(null); setOmjCard(""); setAnswers({}); }}
                  className="ml-auto text-xs text-gray-400 hover:text-gray-600"
                >
                  Change
                </button>
              </div>
            </div>

            {submitResult && !submitResult.success && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-6">
                {submitResult.message}
              </div>
            )}

            <div className="space-y-4">
              {quiz.questions.map((q, idx) => (
                <div key={idx} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 sm:p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                      {q.type === "multiple_choice" ? "Multiple Choice"
                        : q.type === "word_search" ? "Word Search"
                        : q.type === "translate" ? "Translation"
                        : q.type === "image" ? "Image Question"
                        : q.type}
                    </span>
                  </div>
                  {renderQuestion(q, idx)}
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto rounded-xl bg-blue-600 px-8 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-600/20"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Submitting...
                  </span>
                ) : (
                  "Submit Answers"
                )}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
