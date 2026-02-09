"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Layout from "../../../../components/Layout";
import QuizForm from "../../../../components/QuizForm";

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
    if (now < s) return { label: "Upcoming", className: "bg-yellow-100 text-yellow-700" };
    if (now > e) return { label: "Ended", className: "bg-gray-100 text-gray-600" };
    return { label: "Active", className: "bg-green-100 text-green-700" };
  };

  const renderQuizRow = (quiz: Quiz) => {
    const status = getStatusBadge(quiz.startDate, quiz.endDate);
    return (
      <tr key={quiz._id} className="hover:bg-gray-50/50 transition-colors">
        <td className="px-5 py-4">
          <div>
            <span className="text-sm font-medium text-gray-900">{quiz.title}</span>
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1 hidden sm:block">{quiz.description}</p>
          </div>
        </td>
        <td className="px-5 py-4 hidden md:table-cell">
          <span className="text-sm text-gray-500">
            {quiz.quizTypeId && typeof quiz.quizTypeId === "object"
              ? quiz.quizTypeId.name
              : "—"}
          </span>
        </td>
        <td className="px-5 py-4 hidden lg:table-cell">
          <span className="text-sm text-gray-500">
            {formatDate(quiz.startDate)} – {formatDate(quiz.endDate)}
          </span>
        </td>
        <td className="px-5 py-4 hidden sm:table-cell">
          <span className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full ${status.className}`}>
            {status.label}
          </span>
        </td>
        <td className="px-5 py-4 hidden sm:table-cell">
          <span className="inline-flex items-center gap-1 text-sm text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              title="Edit"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => handleDelete(quiz._id)}
              disabled={deleting === quiz._id}
              className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
              title="Delete"
            >
              {deleting === quiz._id ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-red-600" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <h1 className="text-2xl font-semibold text-gray-900">Quizzes</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage quizzes grouped by Paigham
          </p>
        </div>
        <button
          onClick={() => {
            setEditingQuiz(null);
            setShowForm(true);
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Quiz
        </button>
      </div>

      {quizzes.length > 5 && (
        <div className="mb-4">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search quizzes..."
              className="w-full sm:w-72 rounded-lg border border-gray-300 pl-10 pr-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError("")} className="text-red-500 hover:text-red-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
        </div>
      ) : filteredQuizzes.length === 0 ? (
        <div className="text-center py-20">
          <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-500 text-sm">
            {searchTerm ? "No quizzes match your search" : "No quizzes found"}
          </p>
          {!searchTerm && (
            <p className="text-gray-400 text-xs mt-1">Click &quot;Add Quiz&quot; to create your first one</p>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <div key={group.paigham._id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <button
                onClick={() => toggleGroup(group.paigham._id)}
                className="w-full flex items-center justify-between px-5 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-semibold text-gray-900">{group.paigham.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{group.quizzes.length} quiz{group.quizzes.length !== 1 ? "zes" : ""}</p>
                  </div>
                </div>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    collapsedGroups.has(group.paigham._id) ? "" : "rotate-180"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {!collapsedGroups.has(group.paigham._id) && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50/50">
                        <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Type</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Dates</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Status</th>
                        <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Questions</th>
                        <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {group.quizzes.map(renderQuizRow)}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}

          {ungrouped.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 bg-gray-50 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700">Ungrouped Quizzes</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50/50">
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Type</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Dates</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Status</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Questions</th>
                      <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
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
