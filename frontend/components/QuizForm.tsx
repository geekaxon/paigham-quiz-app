"use client";

import { useState, useEffect, FormEvent } from "react";
import api from "../services/api";

interface Paigham {
  _id: string;
  title: string;
}

interface QuizType {
  _id: string;
  name: string;
  description: string;
}

interface Question {
  type: string;
  [key: string]: unknown;
}

interface Quiz {
  _id: string;
  paighamId: Paigham | string;
  quizTypeId: QuizType | string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  questions: Question[];
}

interface QuizFormProps {
  quiz: Quiz | null;
  paighams: Paigham[];
  onClose: () => void;
  onSaved: () => void;
}

const QUESTION_TYPES = [
  { value: "multiple_choice", label: "Multiple Choice" },
  { value: "word_search", label: "Word Search" },
  { value: "translate", label: "Translate" },
  { value: "image", label: "Image Question" },
];

function emptyQuestion(type: string): Question {
  switch (type) {
    case "multiple_choice":
      return { type, question: "", options: ["", "", "", ""], correctAnswer: 0 };
    case "word_search":
      return { type, clue: "", answer: "" };
    case "translate":
      return { type, sourceText: "", sourceLanguage: "Arabic", targetLanguage: "English", answer: "" };
    case "image":
      return { type, imageUrl: "", question: "", answer: "" };
    default:
      return { type, question: "", answer: "" };
  }
}

export default function QuizForm({ quiz, paighams, onClose, onSaved }: QuizFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [paighamId, setPaighamId] = useState("");
  const [quizTypeId, setQuizTypeId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [quizTypes, setQuizTypes] = useState<QuizType[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [expandedQ, setExpandedQ] = useState<number | null>(null);

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const res = await api.get("/quiz/types");
        if (res.data.success) setQuizTypes(res.data.data);
      } catch {
        /* ignore */
      }
    };
    fetchTypes();
  }, []);

  useEffect(() => {
    if (quiz) {
      setTitle(quiz.title);
      setDescription(quiz.description);
      setPaighamId(typeof quiz.paighamId === "object" ? quiz.paighamId._id : quiz.paighamId);
      setQuizTypeId(typeof quiz.quizTypeId === "object" ? quiz.quizTypeId._id : quiz.quizTypeId);
      setStartDate(quiz.startDate.split("T")[0]);
      setEndDate(quiz.endDate.split("T")[0]);
      setQuestions(quiz.questions || []);
      if (quiz.questions?.length > 0) setExpandedQ(0);
    } else {
      setTitle("");
      setDescription("");
      setPaighamId("");
      setQuizTypeId("");
      setStartDate("");
      setEndDate("");
      setQuestions([]);
      setExpandedQ(null);
    }
  }, [quiz]);

  const addQuestion = (type: string) => {
    const newQ = emptyQuestion(type);
    setQuestions([...questions, newQ]);
    setExpandedQ(questions.length);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
    if (expandedQ === index) setExpandedQ(null);
    else if (expandedQ !== null && expandedQ > index) setExpandedQ(expandedQ - 1);
  };

  const updateQuestion = (index: number, field: string, value: unknown) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const updateOption = (qIndex: number, optIndex: number, value: string) => {
    const updated = [...questions];
    const opts = [...(updated[qIndex].options as string[])];
    opts[optIndex] = value;
    updated[qIndex] = { ...updated[qIndex], options: opts };
    setQuestions(updated);
  };

  const addOption = (qIndex: number) => {
    const updated = [...questions];
    const opts = [...(updated[qIndex].options as string[]), ""];
    updated[qIndex] = { ...updated[qIndex], options: opts };
    setQuestions(updated);
  };

  const removeOption = (qIndex: number, optIndex: number) => {
    const updated = [...questions];
    const opts = (updated[qIndex].options as string[]).filter((_, i) => i !== optIndex);
    const currentCorrect = updated[qIndex].correctAnswer as number;
    let newCorrect = currentCorrect;
    if (optIndex < currentCorrect) {
      newCorrect = currentCorrect - 1;
    } else if (optIndex === currentCorrect) {
      newCorrect = 0;
    }
    if (newCorrect >= opts.length) newCorrect = 0;
    updated[qIndex] = { ...updated[qIndex], options: opts, correctAnswer: newCorrect };
    setQuestions(updated);
  };

  const moveQuestion = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= questions.length) return;
    const updated = [...questions];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setQuestions(updated);
    setExpandedQ(newIndex);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!paighamId) { setError("Please select a Paigham"); return; }
    if (!quizTypeId) { setError("Please select a quiz type"); return; }
    if (questions.length === 0) { setError("Please add at least one question"); return; }

    setSaving(true);
    try {
      const payload = { title, description, paighamId, quizTypeId, startDate, endDate, questions };

      if (quiz) {
        await api.put(`/quiz/${quiz._id}`, payload);
      } else {
        await api.post("/quiz", payload);
      }

      onSaved();
    } catch {
      setError("Failed to save quiz");
    } finally {
      setSaving(false);
    }
  };

  const getTypeLabel = (type: string) =>
    QUESTION_TYPES.find((t) => t.value === type)?.label || type;

  const getTypeColor = (type: string) => {
    switch (type) {
      case "multiple_choice": return "bg-primary-100 text-primary dark:bg-primary-100/50 dark:text-primary-400";
      case "word_search": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
      case "translate": return "bg-primary-50 text-primary dark:bg-primary-400/10 dark:text-primary-400";
      case "image": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
      default: return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  const renderQuestionEditor = (q: Question, index: number) => {
    switch (q.type) {
      case "multiple_choice":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Question</label>
              <input
                type="text"
                value={(q.question as string) || ""}
                onChange={(e) => updateQuestion(index, "question", e.target.value)}
                placeholder="Enter question"
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-400 focus:border-transparent transition-all duration-200"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Options</label>
                <button
                  type="button"
                  onClick={() => addOption(index)}
                  className="text-xs text-primary dark:text-primary-400 hover:text-primary-light dark:hover:text-primary-300 font-medium transition-colors duration-200"
                >
                  + Add Option
                </button>
              </div>
              <div className="space-y-2">
                {(q.options as string[]).map((opt, optIdx) => (
                  <div key={optIdx} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateQuestion(index, "correctAnswer", optIdx)}
                      className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        (q.correctAnswer as number) === optIdx
                          ? "border-green-500 bg-green-500"
                          : "border-gray-300 hover:border-green-400"
                      }`}
                      title="Mark as correct"
                    >
                      {(q.correctAnswer as number) === optIdx && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => updateOption(index, optIdx, e.target.value)}
                      placeholder={`Option ${optIdx + 1}`}
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-400 focus:border-transparent transition-all duration-200"
                    />
                    {(q.options as string[]).length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(index, optIdx)}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1.5">Click the circle to mark the correct answer</p>
            </div>
          </div>
        );

      case "word_search":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Clue</label>
              <input
                type="text"
                value={(q.clue as string) || ""}
                onChange={(e) => updateQuestion(index, "clue", e.target.value)}
                placeholder="Enter clue for word search"
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-400 focus:border-transparent transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Answer</label>
              <input
                type="text"
                value={(q.answer as string) || ""}
                onChange={(e) => updateQuestion(index, "answer", e.target.value)}
                placeholder="Enter the word to find"
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-400 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>
        );

      case "translate":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Source Text</label>
              <textarea
                value={(q.sourceText as string) || ""}
                onChange={(e) => updateQuestion(index, "sourceText", e.target.value)}
                placeholder="Enter text to translate"
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-400 focus:border-transparent resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Source Language</label>
                <input
                  type="text"
                  value={(q.sourceLanguage as string) || ""}
                  onChange={(e) => updateQuestion(index, "sourceLanguage", e.target.value)}
                  placeholder="e.g. Arabic"
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-400 focus:border-transparent transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Target Language</label>
                <input
                  type="text"
                  value={(q.targetLanguage as string) || ""}
                  onChange={(e) => updateQuestion(index, "targetLanguage", e.target.value)}
                  placeholder="e.g. English"
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-400 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Expected Answer</label>
              <input
                type="text"
                value={(q.answer as string) || ""}
                onChange={(e) => updateQuestion(index, "answer", e.target.value)}
                placeholder="Enter expected translation"
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-400 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>
        );

      case "image":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Image URL</label>
              <input
                type="url"
                value={(q.imageUrl as string) || ""}
                onChange={(e) => updateQuestion(index, "imageUrl", e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-400 focus:border-transparent transition-all duration-200"
              />
              {(q.imageUrl as string) && (
                <div className="mt-2 rounded-lg border border-gray-200 overflow-hidden">
                  <img
                    src={q.imageUrl as string}
                    alt="Preview"
                    className="max-h-32 w-auto object-contain mx-auto"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Question</label>
              <input
                type="text"
                value={(q.question as string) || ""}
                onChange={(e) => updateQuestion(index, "question", e.target.value)}
                placeholder="What does this image show?"
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-400 focus:border-transparent transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Answer</label>
              <input
                type="text"
                value={(q.answer as string) || ""}
                onChange={(e) => updateQuestion(index, "answer", e.target.value)}
                placeholder="Expected answer"
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-400 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-label={quiz ? "Edit Quiz" : "Add Quiz"}>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-white dark:bg-[#1A1128] rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-[#1A1128] rounded-t-2xl z-10">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {quiz ? "Edit Quiz" : "Add Quiz"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
            aria-label="Close dialog"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300" role="alert">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Paigham</label>
              <select
                required
                value={paighamId}
                onChange={(e) => setPaighamId(e.target.value)}
                aria-label="Select Paigham"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0F0A1A] px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-400 focus:border-transparent transition-all duration-200"
              >
                <option value="">Select Paigham</option>
                {paighams.map((p) => (
                  <option key={p._id} value={p._id}>{p.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Quiz Type</label>
              <select
                required
                value={quizTypeId}
                onChange={(e) => setQuizTypeId(e.target.value)}
                aria-label="Select quiz type"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0F0A1A] px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-400 focus:border-transparent transition-all duration-200"
              >
                <option value="">Select Type</option>
                {quizTypes.map((t) => (
                  <option key={t._id} value={t._id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Quiz title"
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-400 focus:border-transparent transition-all duration-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
            <textarea
              required
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief quiz description"
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-400 focus:border-transparent resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Start Date</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-400 focus:border-transparent transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">End Date</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-400 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Questions ({questions.length})
              </label>
              <div className="relative group">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary dark:text-primary-400 hover:text-primary-light dark:hover:text-primary-300 transition-colors duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Question
                </button>
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 hidden group-hover:block z-20">
                  {QUESTION_TYPES.map((qt) => (
                    <button
                      key={qt.value}
                      type="button"
                      onClick={() => addQuestion(qt.value)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      {qt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {questions.length === 0 ? (
              <div className="rounded-lg border-2 border-dashed border-gray-200 p-8 text-center">
                <svg className="w-10 h-10 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-gray-500">No questions added yet</p>
                <p className="text-xs text-gray-400 mt-1">Hover &quot;Add Question&quot; above to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {questions.map((q, idx) => (
                  <div key={idx} className="rounded-lg border border-gray-200 overflow-hidden">
                    <div
                      className="flex items-center gap-3 px-4 py-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => setExpandedQ(expandedQ === idx ? null : idx)}
                    >
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-xs font-medium flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className={`flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${getTypeColor(q.type)}`}>
                        {getTypeLabel(q.type)}
                      </span>
                      <span className="flex-1 text-sm text-gray-700 truncate">
                        {(q.question as string) || (q.clue as string) || (q.sourceText as string) || "Untitled question"}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); moveQuestion(idx, "up"); }}
                          disabled={idx === 0}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); moveQuestion(idx, "down"); }}
                          disabled={idx === questions.length - 1}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeQuestion(idx); }}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                        <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandedQ === idx ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    {expandedQ === idx && (
                      <div className="p-4 border-t border-gray-200">
                        {renderQuestionEditor(q, idx)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-lg bg-primary dark:bg-primary-400 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-light dark:hover:bg-primary-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
            >
              {saving ? "Saving..." : quiz ? "Update Quiz" : "Create Quiz"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
