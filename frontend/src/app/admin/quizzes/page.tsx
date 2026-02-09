"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Layout from "../../../../components/Layout";
import QuizForm from "../../../../components/QuizForm";
import LoadingSpinner from "../../../../components/LoadingSpinner";
import Notification from "../../../../components/Notification";

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
  paighamId: Paigham;
  quizTypeId: QuizType;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  questions: Question[];
}

interface GroupedQuizzes {
  paigham: Paigham;
  quizzes: Quiz[];
}

export default function QuizzesPage() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [paighams, setPaighams] = useState<Paigham[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const fetchData = useCallback(async () => {
    if (!token) {
      router.push("/admin/login");
      return;
    }
    setLoading(true);
    try {
      const [quizRes, paighamRes] = await Promise.all([
        axios.get("/api/quiz", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("/api/paigham", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (quizRes.data.success) setQuizzes(quizRes.data.data);
      if (paighamRes.data.success) setPaighams(paighamRes.data.data);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        localStorage.removeItem("token");
        router.push("/admin/login");
        return;
      }
      setError("Failed to load quizzes");
    } finally {
      setLoading(false);
    }
  }, [token, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this quiz?")) return;
    setDeleting(id);
    try {
      await axios.delete(`/api/quiz/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchData();
    } catch {
      setError("Failed to delete quiz");
    } finally {
      setDeleting(null);
    }
  };

  const toggleGroup = (paighamId: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(paighamId)) next.delete(paighamId);
      else next.add(paighamId);
      return next;
    });
  };

  const filteredQuizzes = searchTerm
    ? quizzes.filter(
        (q) =>
          q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          q.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : quizzes;

  const grouped: GroupedQuizzes[] = [];
  const ungrouped: Quiz[] = [];

  filteredQuizzes.forEach((quiz) => {
    if (quiz.paighamId && typeof quiz.paighamId === "object") {
      const existing = grouped.find((g) => g.paigham._id === quiz.paighamId._id);
      if (existing) {
        existing.quizzes.push(quiz);
      } else {
        grouped.push({ paigham: quiz.paighamId as Paigham, quizzes: [quiz] });
      }
    } else {
      ungrouped.push(quiz);
    }
  });

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const getStatusBadge = (start: string, end: string) => {
    const now = new Date();
    const s = new Date(start);
    const e = new Date(end);
    if (now < s) return { label: "Upcoming", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" };
    if (now > e) return { label: "Ended", className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" };
    return { label: "Active", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" };
  };

  const renderQuizRow = (quiz: Quiz) => {
    const status = getStatusBadge(quiz.startDate, quiz.endDate);
    return (
      <tr key={quiz._id} className="hover:bg-primary-50/50 dark:hover:bg-primary-50/30 transition-colors duration-150">
        <td className="px-5 py-4">
          <div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">{quiz.title}</span>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1 hidden sm:block">{quiz.description}</p>
          </div>
        </td>
        <td className="px-5 py-4 hidden md:table-cell">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {quiz.quizTypeId && typeof quiz.quizTypeId === "object"
              ? quiz.quizTypeId.name
              : "\u2014"}
          </span>
        </td>
        <td className="px-5 py-4 hidden lg:table-cell">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {formatDate(quiz.startDate)} – {formatDate(quiz.endDate)}
          </span>
        </td>
        <td className="px-5 py-4 hidden sm:table-cell">
          <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${status.className}`}>
            {status.label}
          </span>
        </td>
        <td className="px-5 py-4 hidden sm:table-cell">
          <span className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {quiz.questions?.length || 0}
          </span>
        </td>
        <td className="px-5 py-4 text-right">
          <div className="inline-flex gap-1">
            <button
              onClick={() => {
                setEditingQuiz(quiz);
                setShowForm(true);
              }}
              className="p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:text-primary dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-50/50 transition-all duration-200"
              aria-label={`Edit ${quiz.title}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => handleDelete(quiz._id)}
              disabled={deleting === quiz._id}
              className="p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 disabled:opacity-50"
              aria-label={`Delete ${quiz.title}`}
            >
              {deleting === quiz._id ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-red-600" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
            </button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quizzes</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage quizzes grouped by Paigham
          </p>
        </div>
        <button
          onClick={() => {
            setEditingQuiz(null);
            setShowForm(true);
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-primary dark:bg-primary-400 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-light dark:hover:bg-primary-300 shadow-sm hover:shadow-md transition-all duration-200"
          aria-label="Add new quiz"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Quiz
        </button>
      </div>

      {quizzes.length > 5 && (
        <div className="mb-4">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search quizzes..."
              aria-label="Search quizzes"
              className="w-full sm:w-72 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1A1128] pl-10 pr-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-400 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4">
          <Notification type="error" message={error} onClose={() => setError("")} duration={0} />
        </div>
      )}

      {loading ? (
        <LoadingSpinner size="lg" label="Loading quizzes..." fullPage />
      ) : filteredQuizzes.length === 0 ? (
        <div className="text-center py-20" role="status">
          <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {searchTerm ? "No quizzes match your search" : "No quizzes found"}
          </p>
          {!searchTerm && (
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Click &quot;Add Quiz&quot; to create your first one</p>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <div key={group.paigham._id} className="bg-white dark:bg-[#1A1128] rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
              <button
                onClick={() => toggleGroup(group.paigham._id)}
                className="w-full flex items-center justify-between px-5 py-4 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-50/50 dark:to-primary-100/50 hover:from-primary-100 hover:to-primary-200 dark:hover:from-primary-100/50 dark:hover:to-primary-200/50 transition-colors duration-200"
                aria-expanded={!collapsedGroups.has(group.paigham._id)}
                aria-controls={`quizzes-${group.paigham._id}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary-400/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-primary dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{group.paigham.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{group.quizzes.length} quiz{group.quizzes.length !== 1 ? "zes" : ""}</p>
                  </div>
                </div>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                    collapsedGroups.has(group.paigham._id) ? "" : "rotate-180"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {!collapsedGroups.has(group.paigham._id) && (
                <div id={`quizzes-${group.paigham._id}`} className="overflow-x-auto" role="region" aria-label={`Quizzes for ${group.paigham.title}`} tabIndex={0}>
                  <table className="w-full min-w-[700px]" aria-label={`Quizzes for ${group.paigham.title}`}>
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-[#0F0A1A]/50">
                        <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Title</th>
                        <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Type</th>
                        <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">Dates</th>
                        <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Status</th>
                        <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Questions</th>
                        <th scope="col" className="text-right px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {group.quizzes.map(renderQuizRow)}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}

          {ungrouped.length > 0 && (
            <div className="bg-white dark:bg-[#1A1128] rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
              <div className="px-5 py-4 bg-gray-50 dark:bg-[#0F0A1A] border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Ungrouped Quizzes</h3>
              </div>
              <div className="overflow-x-auto" role="region" aria-label="Ungrouped quizzes" tabIndex={0}>
                <table className="w-full min-w-[700px]" aria-label="Ungrouped quizzes">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-[#0F0A1A]/50">
                      <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Title</th>
                      <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Type</th>
                      <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">Dates</th>
                      <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Status</th>
                      <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Questions</th>
                      <th scope="col" className="text-right px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {ungrouped.map(renderQuizRow)}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <QuizForm
          quiz={editingQuiz}
          paighams={paighams}
          onClose={() => {
            setShowForm(false);
            setEditingQuiz(null);
          }}
          onSaved={() => {
            setShowForm(false);
            setEditingQuiz(null);
            fetchData();
          }}
        />
      )}
    </Layout>
  );
}
