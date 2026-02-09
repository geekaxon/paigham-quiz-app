"use client";

import { useEffect, useState, useCallback, useRef, FormEvent } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import LoadingSpinner from "../../../../components/LoadingSpinner";
import Notification, { NotificationType } from "../../../../components/Notification";

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
  required?: boolean;
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

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

function calcTimeLeft(endDate: string): TimeLeft {
  const diff = new Date(endDate).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
    total: diff,
  };
}

function CountdownTimer({ endDate }: { endDate: string }) {
  const [tl, setTl] = useState<TimeLeft>(calcTimeLeft(endDate));

  useEffect(() => {
    const id = setInterval(() => setTl(calcTimeLeft(endDate)), 1000);
    return () => clearInterval(id);
  }, [endDate]);

  if (tl.total <= 0) return null;

  const isUrgent = tl.total < 3600000;
  const isWarning = tl.total < 86400000 && !isUrgent;

  const segments = [
    { label: "Days", value: tl.days },
    { label: "Hrs", value: tl.hours },
    { label: "Min", value: tl.minutes },
    { label: "Sec", value: tl.seconds },
  ];

  return (
    <div
      className={`rounded-xl border p-4 mb-6 transition-colors duration-200 ${
        isUrgent
          ? "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
          : isWarning
          ? "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800"
          : "bg-primary-50 border-primary-200 dark:bg-primary/10 dark:border-primary-200"
      }`}
      role="timer"
      aria-live="polite"
      aria-label={`Time remaining: ${tl.days} days, ${tl.hours} hours, ${tl.minutes} minutes, ${tl.seconds} seconds`}
    >
      <div className="flex items-center gap-2 mb-3">
        <svg
          className={`w-4 h-4 ${isUrgent ? "text-red-500" : isWarning ? "text-amber-500" : "text-primary dark:text-primary-400"}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className={`text-xs font-semibold uppercase tracking-wider ${
          isUrgent ? "text-red-600 dark:text-red-400" : isWarning ? "text-amber-600 dark:text-amber-400" : "text-primary dark:text-primary-400"
        }`}>
          Time Remaining
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {segments.map((s) => (
          <div key={s.label} className="text-center">
            <div className={`text-xl sm:text-2xl font-bold tabular-nums ${
              isUrgent ? "text-red-700 dark:text-red-300" : isWarning ? "text-amber-700 dark:text-amber-300" : "text-primary dark:text-primary-300"
            }`}>
              {String(s.value).padStart(2, "0")}
            </div>
            <div className={`text-[10px] font-medium uppercase tracking-wider mt-0.5 ${
              isUrgent ? "text-red-400 dark:text-red-500" : isWarning ? "text-amber-400 dark:text-amber-500" : "text-primary-300 dark:text-primary-400"
            }`}>
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BlurredImage({ src, alt, revealed, onReveal }: { src: string; alt: string; revealed: boolean; onReveal: () => void }) {
  return (
    <div className="relative rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-800">
      <img
        src={src}
        alt={revealed ? alt : "Blurred image - click reveal for a hint"}
        className={`w-full max-h-56 object-contain transition-all duration-700 ${revealed ? "blur-0" : "blur-xl scale-105"}`}
      />
      {!revealed && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/10 dark:bg-black/30">
          <button
            type="button"
            onClick={onReveal}
            className="flex items-center gap-2 rounded-full bg-white/90 dark:bg-gray-900/90 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-all duration-200"
            aria-label="Reveal blurred image"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Reveal Image
          </button>
        </div>
      )}
    </div>
  );
}

const TYPE_LABELS: Record<string, string> = {
  multiple_choice: "Multiple Choice",
  word_search: "Word Search",
  translate: "Translation",
  image: "Image Question",
  guess_who: "Guess Who",
  text: "Text Answer",
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  multiple_choice: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  word_search: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  translate: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
    </svg>
  ),
  image: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  guess_who: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  text: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
};

const INPUT_CLASS =
  "w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-400 focus:border-transparent transition-colors duration-200";

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
  const [revealedImages, setRevealedImages] = useState<Record<number, boolean>>({});
  const [validationErrors, setValidationErrors] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [notification, setNotification] = useState<{ type: NotificationType; message: string } | null>(null);
  const [step, setStep] = useState<"identify" | "quiz" | "done">("identify");

  const firstErrorRef = useRef<HTMLDivElement | null>(null);

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

  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const isExpired = quiz ? now > new Date(quiz.endDate).getTime() : false;
  const isNotStarted = quiz ? now < new Date(quiz.startDate).getTime() : false;
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

  const updateAnswer = useCallback((index: number, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [index]: value }));
    setValidationErrors((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  }, []);

  const revealImage = useCallback((index: number) => {
    setRevealedImages((prev) => ({ ...prev, [index]: true }));
  }, []);

  const validateAnswers = useCallback((): boolean => {
    if (!quiz) return false;
    const errors: Record<number, string> = {};

    quiz.questions.forEach((q, i) => {
      const isRequired = q.required !== false;
      if (!isRequired) return;

      const answer = answers[i];
      if (answer === undefined || answer === null || answer === "") {
        errors[i] = "This question requires an answer";
      } else if (typeof answer === "string" && !answer.trim()) {
        errors[i] = "This question requires an answer";
      }
    });

    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      const firstIdx = Math.min(...Object.keys(errors).map(Number));
      setTimeout(() => {
        const el = document.getElementById(`question-${firstIdx}`);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
      return false;
    }

    return true;
  }, [quiz, answers]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!quiz || !member) return;

    if (!validateAnswers()) {
      setNotification({ type: "error", message: "Please answer all required questions before submitting." });
      return;
    }

    const formattedAnswers = quiz.questions.map((q, i) => ({
      questionIndex: i,
      questionType: q.type,
      answer: answers[i] ?? null,
    }));

    setSubmitting(true);
    setSubmitState("loading");
    setNotification(null);

    try {
      const res = await axios.post("/api/submission", {
        quizId: quiz._id,
        omjCard: member.omjCard,
        answers: formattedAnswers,
      });
      if (res.data.success) {
        setSubmitState("success");
        setStep("done");
      } else {
        setSubmitState("error");
        setNotification({ type: "error", message: res.data.message || "Submission failed" });
      }
    } catch (err) {
      setSubmitState("error");
      const message = axios.isAxiosError(err) && err.response?.data?.message
        ? err.response.data.message
        : "Failed to submit answers. Please try again.";
      setNotification({ type: "error", message });
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

  const answeredCount = quiz
    ? quiz.questions.filter((_, i) => {
        const a = answers[i];
        return a !== undefined && a !== null && a !== "";
      }).length
    : 0;

  const renderQuestion = (q: Question, index: number) => {
    const hasError = !!validationErrors[index];

    switch (q.type) {
      case "multiple_choice":
        return (
          <fieldset className="space-y-3" aria-label={`Question ${index + 1}: ${q.question as string}`}>
            <legend className="text-sm font-medium text-gray-900 dark:text-white">{q.question as string}</legend>
            <div className="space-y-2" role="radiogroup">
              {(q.options as string[])?.map((opt, optIdx) => (
                <button
                  type="button"
                  key={optIdx}
                  onClick={() => updateAnswer(index, optIdx)}
                  role="radio"
                  aria-checked={answers[index] === optIdx}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200 w-full text-left ${
                    answers[index] === optIdx
                      ? "border-primary bg-primary-50 ring-1 ring-primary dark:border-primary-400 dark:bg-primary-400/10 dark:ring-primary-400"
                      : hasError
                      ? "border-red-300 dark:border-red-700 hover:border-red-400"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors duration-200 ${
                    answers[index] === optIdx ? "border-primary dark:border-primary-400" : "border-gray-300 dark:border-gray-600"
                  }`}>
                    {answers[index] === optIdx && (
                      <div className="w-2 h-2 rounded-full bg-primary dark:bg-primary-400" />
                    )}
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{opt}</span>
                </button>
              ))}
            </div>
          </fieldset>
        );

      case "word_search":
        return (
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              <span className="text-gray-500 dark:text-gray-400">Clue:</span> {q.clue as string}
            </p>
            <input
              type="text"
              value={(answers[index] as string) || ""}
              onChange={(e) => updateAnswer(index, e.target.value)}
              placeholder="Enter the word"
              aria-label={`Answer for clue: ${q.clue as string}`}
              className={`${INPUT_CLASS} ${hasError ? "ring-2 ring-red-400 border-red-300 dark:border-red-700" : ""}`}
            />
          </div>
        );

      case "translate":
        return (
          <div className="space-y-3">
            <div className="rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {q.sourceLanguage as string}
                </span>
                <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {q.targetLanguage as string}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{q.sourceText as string}</p>
            </div>
            <input
              type="text"
              value={(answers[index] as string) || ""}
              onChange={(e) => updateAnswer(index, e.target.value)}
              placeholder={`Translate to ${q.targetLanguage as string}`}
              aria-label={`Translate "${q.sourceText as string}" to ${q.targetLanguage as string}`}
              className={`${INPUT_CLASS} ${hasError ? "ring-2 ring-red-400 border-red-300 dark:border-red-700" : ""}`}
            />
          </div>
        );

      case "image":
        return (
          <div className="space-y-3">
            {(q.imageUrl as string) && (
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-800 p-2">
                <img
                  src={q.imageUrl as string}
                  alt={(q.question as string) || "Question image"}
                  className="max-h-56 w-auto mx-auto rounded object-contain"
                />
              </div>
            )}
            <p className="text-sm font-medium text-gray-900 dark:text-white">{q.question as string}</p>
            <input
              type="text"
              value={(answers[index] as string) || ""}
              onChange={(e) => updateAnswer(index, e.target.value)}
              placeholder="Enter your answer"
              aria-label={`Answer for: ${q.question as string}`}
              className={`${INPUT_CLASS} ${hasError ? "ring-2 ring-red-400 border-red-300 dark:border-red-700" : ""}`}
            />
          </div>
        );

      case "guess_who":
        return (
          <div className="space-y-3">
            {(q.imageUrl as string) && (
              <BlurredImage
                src={q.imageUrl as string}
                alt={(q.question as string) || "Guess who"}
                revealed={!!revealedImages[index]}
                onReveal={() => revealImage(index)}
              />
            )}
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {(q.question as string) || "Who is this person?"}
            </p>
            <input
              type="text"
              value={(answers[index] as string) || ""}
              onChange={(e) => updateAnswer(index, e.target.value)}
              placeholder="Enter your guess"
              aria-label="Enter your guess for the blurred image"
              className={`${INPUT_CLASS} ${hasError ? "ring-2 ring-red-400 border-red-300 dark:border-red-700" : ""}`}
            />
          </div>
        );

      case "text":
        return (
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-900 dark:text-white">{q.question as string}</p>
            <textarea
              value={(answers[index] as string) || ""}
              onChange={(e) => updateAnswer(index, e.target.value)}
              placeholder="Type your answer here..."
              rows={3}
              aria-label={`Answer for: ${q.question as string}`}
              className={`${INPUT_CLASS} resize-none ${hasError ? "ring-2 ring-red-400 border-red-300 dark:border-red-700" : ""}`}
            />
          </div>
        );

      default:
        return (
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-900 dark:text-white">{(q.question as string) || "Question"}</p>
            <input
              type="text"
              value={(answers[index] as string) || ""}
              onChange={(e) => updateAnswer(index, e.target.value)}
              placeholder="Enter your answer"
              className={`${INPUT_CLASS} ${hasError ? "ring-2 ring-red-400 border-red-300 dark:border-red-700" : ""}`}
            />
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-secondary to-primary-100 dark:from-[#0F0A1A] dark:via-[#1A1128] dark:to-[#0F0A1A]">
        <LoadingSpinner size="lg" label="Loading quiz..." fullPage />
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-secondary to-primary-100 dark:from-[#0F0A1A] dark:via-[#1A1128] dark:to-[#0F0A1A] flex items-center justify-center">
        <div className="text-center max-w-sm mx-auto px-4">
          <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Quiz Not Found</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{error || "This quiz does not exist or has been removed."}</p>
          <a href="/" className="inline-block mt-6 text-sm text-primary dark:text-primary-400 hover:text-primary-light font-medium transition-colors duration-200">
            Go to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-secondary to-primary-100 dark:from-[#0F0A1A] dark:via-[#1A1128] dark:to-[#0F0A1A]">
      <header className="bg-white/80 dark:bg-[#1A1128]/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-light dark:from-primary-400 dark:to-primary-300 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/25">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">{quiz.title}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{quiz.description}</p>
              {quiz.paighamId && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">From: {quiz.paighamId.title}</p>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {notification && (
          <div className="mb-6">
            <Notification
              type={notification.type}
              message={notification.message}
              onClose={() => setNotification(null)}
            />
          </div>
        )}

        {!isActive && (
          <div className={`rounded-xl p-5 mb-6 ${
            isExpired
              ? "bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800"
              : "bg-yellow-50 border border-yellow-200 dark:bg-amber-900/20 dark:border-amber-800"
          }`} role="alert">
            <div className="flex items-start gap-3">
              <svg className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isExpired ? "text-red-500" : "text-yellow-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.27 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h3 className={`font-medium ${isExpired ? "text-red-800 dark:text-red-300" : "text-yellow-800 dark:text-amber-300"}`}>
                  {isExpired ? "Quiz Expired" : "Quiz Not Yet Available"}
                </h3>
                <p className={`text-sm mt-1 ${isExpired ? "text-red-600 dark:text-red-400" : "text-yellow-600 dark:text-amber-400"}`}>
                  {isExpired
                    ? `This quiz ended on ${formatDate(quiz.endDate)}. Submissions are no longer accepted.`
                    : `This quiz will be available from ${formatDate(quiz.startDate)}.`}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-4 mb-6 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {formatDate(quiz.startDate)} – {formatDate(quiz.endDate)}
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {quiz.questions.length} question{quiz.questions.length !== 1 ? "s" : ""}
          </span>
          {step === "quiz" && (
            <span className="flex items-center gap-1 text-primary dark:text-primary-400 font-medium">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
              </svg>
              {answeredCount}/{quiz.questions.length} answered
            </span>
          )}
        </div>

        {isActive && !isExpired && step !== "done" && (
          <CountdownTimer endDate={quiz.endDate} />
        )}

        {step === "done" && submitState === "success" && (
          <div className="rounded-xl bg-green-50 dark:bg-emerald-900/20 border border-green-200 dark:border-emerald-800 p-8 text-center" role="alert">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-emerald-800/40 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-green-800 dark:text-emerald-200 mb-2">Submitted Successfully!</h2>
            <p className="text-green-600 dark:text-emerald-400 text-sm">Your answers have been submitted successfully!</p>
            <a
              href="/paigham"
              className="inline-flex items-center gap-2 mt-6 text-sm text-green-700 dark:text-emerald-300 hover:text-green-900 dark:hover:text-emerald-200 font-medium transition-colors duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Browse Magazines
            </a>
          </div>
        )}

        {step === "identify" && isActive && (
          <div className="bg-white dark:bg-[#1A1128] rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Identify Yourself</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Enter your OMJ Card number to begin the quiz</p>

            {memberError && (
              <div className="mb-4">
                <Notification type="error" message={memberError} onClose={() => setMemberError("")} duration={5000} />
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={omjCard}
                onChange={(e) => setOmjCard(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") lookupMember(); }}
                placeholder="e.g. OMJ-001"
                aria-label="OMJ Card number"
                className={INPUT_CLASS + " flex-1"}
              />
              <button
                onClick={lookupMember}
                disabled={memberLoading}
                className="rounded-lg bg-primary dark:bg-primary-400 px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-light dark:hover:bg-primary-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                aria-label="Verify OMJ Card and continue"
              >
                {memberLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
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
          <form onSubmit={handleSubmit} noValidate>
            <div className="bg-white dark:bg-[#1A1128] rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-4 sm:p-5 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-50 dark:bg-primary-400/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{member.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{member.omjCard}</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setStep("identify"); setMember(null); setOmjCard(""); setAnswers({}); setValidationErrors({}); setRevealedImages({}); }}
                  className="ml-auto text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                  aria-label="Change member"
                >
                  Change
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {quiz.questions.map((q, idx) => {
                const hasError = !!validationErrors[idx];
                return (
                  <div
                    key={idx}
                    id={`question-${idx}`}
                    ref={hasError && !firstErrorRef.current ? firstErrorRef : undefined}
                    className={`bg-white dark:bg-[#1A1128] rounded-xl border shadow-sm p-5 sm:p-6 transition-all duration-200 ${
                      hasError
                        ? "border-red-300 dark:border-red-700 ring-1 ring-red-200 dark:ring-red-800"
                        : "border-gray-200 dark:border-gray-800"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary-50 dark:bg-primary-400/10 text-primary dark:text-primary-400 text-xs font-semibold flex items-center justify-center" aria-hidden="true">
                        {idx + 1}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                        {TYPE_ICONS[q.type] || null}
                        {TYPE_LABELS[q.type] || q.type}
                      </span>
                      {q.required !== false && (
                        <span className="text-red-400 text-xs ml-auto" aria-label="Required">*</span>
                      )}
                    </div>
                    {renderQuestion(q, idx)}
                    {hasError && (
                      <p className="mt-2 text-xs text-red-500 dark:text-red-400 flex items-center gap-1" role="alert">
                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
                        </svg>
                        {validationErrors[idx]}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-8 sticky bottom-4 z-10">
              <div className="bg-white/90 dark:bg-[#1A1128]/90 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg p-4 flex flex-col sm:flex-row items-center gap-3">
                <div className="flex-1 hidden sm:block">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary dark:bg-primary-400 rounded-full transition-all duration-500"
                        style={{ width: `${quiz.questions.length > 0 ? (answeredCount / quiz.questions.length) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium tabular-nums whitespace-nowrap">
                      {answeredCount}/{quiz.questions.length}
                    </span>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={submitting || isExpired}
                  className={`w-full sm:w-auto rounded-xl px-8 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed transition-all duration-200 shadow-lg flex items-center justify-center gap-2 ${
                    submitState === "error"
                      ? "bg-red-600 hover:bg-red-700 shadow-red-600/20"
                      : submitState === "success"
                      ? "bg-emerald-600 shadow-emerald-600/20"
                      : "bg-primary dark:bg-primary-400 hover:bg-primary-light dark:hover:bg-primary-300 shadow-primary/20 disabled:opacity-50"
                  }`}
                  aria-label={submitting ? "Submitting answers" : "Submit all answers"}
                >
                  {submitting ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Submitting...
                    </>
                  ) : submitState === "error" ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
                      </svg>
                      Retry Submission
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Submit Answers
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
