"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Layout from "../../../../components/Layout";

interface Paigham {
  _id: string;
  title: string;
}

interface PopulatedQuiz {
  _id: string;
  title: string;
  paighamId: Paigham | null;
}

interface Submission {
  _id: string;
  quizId: PopulatedQuiz | string;
  memberOmjCard: string;
  memberSnapshot: Record<string, unknown>;
  answers: Record<string, unknown>[];
  submittedAt: string;
}

const PAGE_SIZE = 10;

export default function SubmissionsPage() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [paighams, setPaighams] = useState<Paigham[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [filterPaigham, setFilterPaigham] = useState("");
  const [filterQuiz, setFilterQuiz] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const fetchData = useCallback(async () => {
    if (!token) {
      router.push("/admin/login");
      return;
    }
    setLoading(true);
    try {
      const [subRes, paighamRes] = await Promise.all([
        axios.get("/api/submission", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("/api/paigham", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (subRes.data.success) setSubmissions(subRes.data.data);
      if (paighamRes.data.success) setPaighams(paighamRes.data.data);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        localStorage.removeItem("token");
        router.push("/admin/login");
        return;
      }
      setError("Failed to load submissions");
    } finally {
      setLoading(false);
    }
  }, [token, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const quizList = useMemo(() => {
    const seen = new Map<string, string>();
    submissions.forEach((s) => {
      if (s.quizId && typeof s.quizId === "object") {
        seen.set(s.quizId._id, s.quizId.title);
      }
    });
    return Array.from(seen.entries()).map(([id, title]) => ({ _id: id, title }));
  }, [submissions]);

  const filtered = useMemo(() => {
    return submissions.filter((s) => {
      const quiz = typeof s.quizId === "object" ? s.quizId : null;
      if (filterPaigham && quiz?.paighamId?._id !== filterPaigham) return false;
      if (filterQuiz && quiz?._id !== filterQuiz) return false;
      return true;
    });
  }, [submissions, filterPaigham, filterQuiz]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [filterPaigham, filterQuiz]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const getMemberName = (s: Submission) => {
    if (s.memberSnapshot && typeof s.memberSnapshot === "object") {
      return (s.memberSnapshot.name as string) || s.memberOmjCard;
    }
    return s.memberOmjCard;
  };

  const getQuizTitle = (s: Submission) => {
    if (s.quizId && typeof s.quizId === "object") return s.quizId.title;
    return "—";
  };

  const getPaighamTitle = (s: Submission) => {
    if (s.quizId && typeof s.quizId === "object" && s.quizId.paighamId) {
      return s.quizId.paighamId.title;
    }
    return "—";
  };

  const exportCSV = () => {
    const headers = ["Member Name", "OMJ Card", "Quiz", "Paigham", "Answers", "Submitted At"];
    const rows = filtered.map((s) => [
      getMemberName(s),
      s.memberOmjCard,
      getQuizTitle(s),
      getPaighamTitle(s),
      s.answers?.length || 0,
      new Date(s.submittedAt).toISOString(),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => {
          const str = String(cell);
          return str.includes(",") || str.includes('"')
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        }).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `submissions_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Submissions</h1>
          <p className="mt-1 text-sm text-gray-500">
            {filtered.length} submission{filtered.length !== 1 ? "s" : ""} found
          </p>
        </div>
        <button
          onClick={exportCSV}
          disabled={filtered.length === 0}
          className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export CSV
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative">
          <select
            value={filterPaigham}
            onChange={(e) => {
              setFilterPaigham(e.target.value);
              setFilterQuiz("");
            }}
            className="w-full sm:w-56 rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white pr-8"
          >
            <option value="">All Paighams</option>
            {paighams.map((p) => (
              <option key={p._id} value={p._id}>{p.title}</option>
            ))}
          </select>
          <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        <div className="relative">
          <select
            value={filterQuiz}
            onChange={(e) => setFilterQuiz(e.target.value)}
            className="w-full sm:w-56 rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white pr-8"
          >
            <option value="">All Quizzes</option>
            {quizList.map((q) => (
              <option key={q._id} value={q._id}>{q.title}</option>
            ))}
          </select>
          <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        {(filterPaigham || filterQuiz) && (
          <button
            onClick={() => { setFilterPaigham(""); setFilterQuiz(""); }}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear filters
          </button>
        )}
      </div>

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
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-500 text-sm">
            {filterPaigham || filterQuiz ? "No submissions match your filters" : "No submissions yet"}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50">
                    <th className="text-left px-5 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                    <th className="text-left px-5 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wider">OMJ Card</th>
                    <th className="text-left px-5 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Quiz</th>
                    <th className="text-left px-5 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Paigham</th>
                    <th className="text-left px-5 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Answers</th>
                    <th className="text-left px-5 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginated.map((s) => (
                    <tr key={s._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <span className="text-sm font-medium text-gray-900">{getMemberName(s)}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center text-xs font-mono font-medium px-2.5 py-1 rounded-md bg-blue-50 text-blue-700">
                          {s.memberOmjCard}
                        </span>
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <span className="text-sm text-gray-600">{getQuizTitle(s)}</span>
                      </td>
                      <td className="px-5 py-4 hidden lg:table-cell">
                        <span className="text-sm text-gray-500">{getPaighamTitle(s)}</span>
                      </td>
                      <td className="px-5 py-4 hidden sm:table-cell">
                        <span className="inline-flex items-center gap-1 text-sm text-gray-500">
                          {s.answers?.length || 0}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-gray-500 whitespace-nowrap">{formatDate(s.submittedAt)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between mt-5 gap-3">
              <p className="text-sm text-gray-500">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .map((p, idx, arr) => (
                    <span key={p} className="flex items-center">
                      {idx > 0 && arr[idx - 1] !== p - 1 && (
                        <span className="px-1 text-gray-400">...</span>
                      )}
                      <button
                        onClick={() => setPage(p)}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                          p === page
                            ? "bg-blue-600 text-white"
                            : "border border-gray-300 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {p}
                      </button>
                    </span>
                  ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}
