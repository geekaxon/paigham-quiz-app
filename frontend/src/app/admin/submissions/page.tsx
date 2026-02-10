"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { submissionApi, paighamApi, quizApi, type Submission, type Paigham } from "../../../../services/api";
import Layout from "../../../../components/Layout";
import LoadingSpinner from "../../../../components/LoadingSpinner";
import ConfirmModal from "../../../../components/ConfirmModal";
import { useToast } from "../../../../components/Toast";

type SortField = "member" | "omjCard" | "quiz" | "paigham" | "answers" | "date";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 10;

export default function SubmissionsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [filterPaigham, setFilterPaigham] = useState("");
  const [filterQuiz, setFilterQuiz] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editOmjCard, setEditOmjCard] = useState("");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [expandedAnswers, setExpandedAnswers] = useState<string | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const { data: submissions = [], isLoading: submissionsLoading } = useQuery({
    queryKey: ["submissions"],
    queryFn: async () => {
      const res = await submissionApi.getAll();
      if (!res.success) throw new Error("Failed to load submissions");
      return res.data;
    },
    enabled: !!token,
  });

  const { data: paighams = [] } = useQuery({
    queryKey: ["paighams"],
    queryFn: async () => {
      const res = await paighamApi.getAll();
      if (!res.success) throw new Error("Failed to load paighams");
      return res.data;
    },
    enabled: !!token,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { memberOmjCard: string } }) =>
      submissionApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
      toast.success("Submission updated");
      setEditingId(null);
    },
    onError: () => toast.error("Failed to update submission"),
  });

  const deleteMutation = useMutation({
    mutationFn: submissionApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      toast.success("Submission deleted");
      setDeleteTarget(null);
    },
    onError: () => {
      toast.error("Failed to delete submission");
      setDeleteTarget(null);
    },
  });

  const winnerMutation = useMutation({
    mutationFn: async ({ quizId, submissionId, isWinner }: { quizId: string; submissionId: string; isWinner: boolean }) => {
      const quizSubs = submissions.filter((s) => {
        const qId = typeof s.quizId === "object" ? s.quizId._id : s.quizId;
        return qId === quizId;
      });
      const currentWinners = quizSubs
        .filter((s) => {
          const qId = typeof s.quizId === "object" ? s.quizId._id : s.quizId;
          return qId === quizId;
        })
        .map((s) => s._id);

      let newWinners: string[];
      if (isWinner) {
        newWinners = [...new Set([...getQuizWinners(quizId), submissionId])];
      } else {
        newWinners = getQuizWinners(quizId).filter((id) => id !== submissionId);
      }
      return quizApi.updateWinners(quizId, { winners: newWinners });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quizWinners"] });
      toast.success("Winner status updated");
    },
    onError: () => toast.error("Failed to update winner"),
  });

  const showWinnersMutation = useMutation({
    mutationFn: async ({ quizId, show }: { quizId: string; show: boolean }) => {
      return quizApi.updateWinners(quizId, { showWinners: show });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quizWinners"] });
      toast.success("Winners visibility updated");
    },
    onError: () => toast.error("Failed to update winners visibility"),
  });

  const [quizWinnersMap, setQuizWinnersMap] = useState<Record<string, { winners: string[]; showWinners: boolean }>>({});

  useEffect(() => {
    const fetchWinners = async () => {
      const quizIds = new Set<string>();
      submissions.forEach((s) => {
        const qId = typeof s.quizId === "object" ? s.quizId._id : s.quizId;
        if (qId) quizIds.add(qId);
      });

      const map: Record<string, { winners: string[]; showWinners: boolean }> = {};
      for (const qId of quizIds) {
        try {
          const res = await quizApi.getAll();
          if (res.success) {
            res.data.forEach((q) => {
              map[q._id] = { winners: q.winners || [], showWinners: q.showWinners || false };
            });
          }
          break;
        } catch { /* ignore */ }
      }
      setQuizWinnersMap(map);
    };
    if (submissions.length > 0 && token) fetchWinners();
  }, [submissions, token]);

  const getQuizWinners = (quizId: string): string[] => {
    return quizWinnersMap[quizId]?.winners || [];
  };

  const isWinner = (quizId: string, submissionId: string): boolean => {
    return getQuizWinners(quizId).includes(submissionId);
  };

  const toggleWinner = (s: Submission) => {
    const qId = typeof s.quizId === "object" ? s.quizId._id : (s.quizId as string);
    const currentlyWinner = isWinner(qId, s._id);

    const newWinners = currentlyWinner
      ? getQuizWinners(qId).filter((id) => id !== s._id)
      : [...getQuizWinners(qId), s._id];

    setQuizWinnersMap((prev) => ({
      ...prev,
      [qId]: { ...prev[qId], winners: newWinners },
    }));

    winnerMutation.mutate({ quizId: qId, submissionId: s._id, isWinner: !currentlyWinner });
  };

  const toggleShowWinners = (quizId: string) => {
    const current = quizWinnersMap[quizId]?.showWinners || false;
    setQuizWinnersMap((prev) => ({
      ...prev,
      [quizId]: { ...prev[quizId], showWinners: !current },
    }));
    showWinnersMutation.mutate({ quizId, show: !current });
  };

  if (!token) {
    router.push("/admin/login");
    return null;
  }

  const loading = submissionsLoading;

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  const getMemberName = (s: Submission) => {
    if (s.memberSnapshot && typeof s.memberSnapshot === "object") {
      return (s.memberSnapshot.name as string) || s.memberOmjCard;
    }
    return s.memberOmjCard;
  };

  const getQuizTitle = (s: Submission) => {
    if (s.quizId && typeof s.quizId === "object") return s.quizId.title;
    return "\u2014";
  };

  const getPaighamTitle = (s: Submission) => {
    if (s.quizId && typeof s.quizId === "object" && s.quizId.paighamId) {
      return s.quizId.paighamId.title;
    }
    return "\u2014";
  };

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
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const memberName = getMemberName(s).toLowerCase();
        const omjCard = s.memberOmjCard.toLowerCase();
        const quizTitle = getQuizTitle(s).toLowerCase();
        if (!memberName.includes(term) && !omjCard.includes(term) && !quizTitle.includes(term)) {
          return false;
        }
      }
      return true;
    });
  }, [submissions, filterPaigham, filterQuiz, searchTerm]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let valA = "";
      let valB = "";
      switch (sortField) {
        case "member":
          valA = getMemberName(a).toLowerCase();
          valB = getMemberName(b).toLowerCase();
          break;
        case "omjCard":
          valA = a.memberOmjCard;
          valB = b.memberOmjCard;
          break;
        case "quiz":
          valA = getQuizTitle(a).toLowerCase();
          valB = getQuizTitle(b).toLowerCase();
          break;
        case "paigham":
          valA = getPaighamTitle(a).toLowerCase();
          valB = getPaighamTitle(b).toLowerCase();
          break;
        case "answers":
          return sortDir === "asc"
            ? (a.answers?.length || 0) - (b.answers?.length || 0)
            : (b.answers?.length || 0) - (a.answers?.length || 0);
        case "date":
          return sortDir === "asc"
            ? new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
            : new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
      }
      const cmp = valA.localeCompare(valB);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortField, sortDir]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [filterPaigham, filterQuiz, searchTerm, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "date" ? "desc" : "asc");
    }
  };

  const startEdit = (s: Submission) => {
    setEditingId(s._id);
    setEditOmjCard(s.memberOmjCard);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditOmjCard("");
  };

  const saveEdit = async () => {
    if (!editingId || !editOmjCard.trim()) return;
    updateMutation.mutate({ id: editingId, data: { memberOmjCard: editOmjCard.trim() } });
  };

  const handleDelete = (id: string) => {
    setDeleteTarget(id);
  };

  const confirmDelete = () => {
    if (deleteTarget) deleteMutation.mutate(deleteTarget);
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const exportCSV = () => {
    const headers = ["Member Name", "OMJ Card", "Quiz", "Paigham", "Answers Count", "Submitted At"];
    const rows = sorted.map((s) => [
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
        row
          .map((cell) => {
            const str = String(cell);
            return str.includes(",") || str.includes('"') || str.includes("\n")
              ? `"${str.replace(/"/g, '""')}"`
              : str;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `submissions_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getSimilarityColor = (score: number) => {
    if (score >= 80) return "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20";
    if (score >= 50) return "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20";
    return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20";
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return (
        <svg className="w-3 h-3 ml-1 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortDir === "asc" ? (
      <svg className="w-3 h-3 ml-1 text-primary dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-3 h-3 ml-1 text-primary dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  const SortButton = ({ field, label, className }: { field: SortField; label: string; className?: string }) => (
    <button
      onClick={() => handleSort(field)}
      className={`inline-flex items-center text-xs font-semibold uppercase tracking-wider hover:text-primary dark:hover:text-primary-400 transition-colors duration-200 ${className || ""}`}
      aria-label={`Sort by ${label}`}
    >
      {label}
      <SortIcon field={field} />
    </button>
  );

  const renderAnswersDetail = (s: Submission) => {
    if (!s.answers || s.answers.length === 0) return null;
    const scores = s.similarityScores || [];

    return (
      <div className="space-y-2 mt-3">
        {s.answers.map((a, i) => {
          const score = scores.find((sc) => sc.questionIndex === i);
          const answerStr = typeof a.answer === "object" && Array.isArray(a.answer)
            ? (a.answer as string[]).join(", ")
            : String(a.answer || "—");

          return (
            <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-[10px] font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-700 dark:text-gray-300 break-words">{answerStr}</p>
                {score && score.expectedAnswer && (
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                    Expected: {score.expectedAnswer}
                  </p>
                )}
              </div>
              {score !== undefined && (
                <span className={`flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded ${getSimilarityColor(score.similarity)}`}>
                  {score.similarity}%
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Submissions</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {sorted.length} submission{sorted.length !== 1 ? "s" : ""} found
          </p>
        </div>
        <button
          onClick={exportCSV}
          disabled={sorted.length === 0}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 dark:bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 dark:hover:bg-emerald-600 shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Export submissions as CSV"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export CSV
        </button>
      </div>

      <div className="flex flex-col gap-3 mb-5">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by member name, OMJ card, or quiz..."
            aria-label="Search submissions"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1A1128] pl-10 pr-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-400 focus:border-transparent transition-all duration-200"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Clear search"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <select
              value={filterPaigham}
              onChange={(e) => {
                setFilterPaigham(e.target.value);
                setFilterQuiz("");
              }}
              aria-label="Filter by Paigham"
              className="w-full sm:w-48 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1A1128] px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-400 focus:border-transparent appearance-none pr-8 transition-all duration-200"
            >
              <option value="">All Paighams</option>
              {paighams.map((p: Paigham) => (
                <option key={p._id} value={p._id}>
                  {p.title}
                </option>
              ))}
            </select>
            <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <div className="relative">
            <select
              value={filterQuiz}
              onChange={(e) => setFilterQuiz(e.target.value)}
              aria-label="Filter by Quiz"
              className="w-full sm:w-48 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1A1128] px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-400 focus:border-transparent appearance-none pr-8 transition-all duration-200"
            >
              <option value="">All Quizzes</option>
              {quizList.map((q) => (
                <option key={q._id} value={q._id}>
                  {q.title}
                </option>
              ))}
            </select>
            <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          {filterQuiz && (
            <button
              onClick={() => toggleShowWinners(filterQuiz)}
              className={`inline-flex items-center gap-1.5 px-3 py-2.5 text-sm rounded-lg border transition-all duration-200 ${
                quizWinnersMap[filterQuiz]?.showWinners
                  ? "border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                  : "border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              {quizWinnersMap[filterQuiz]?.showWinners ? "Winners Visible" : "Show Winners"}
            </button>
          )}
          {(filterPaigham || filterQuiz || searchTerm) && (
            <button
              onClick={() => {
                setFilterPaigham("");
                setFilterQuiz("");
                setSearchTerm("");
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200"
              aria-label="Clear all filters"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear all
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" label="Loading submissions..." fullPage />
      ) : sorted.length === 0 ? (
        <div className="text-center py-20" role="status">
          <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {filterPaigham || filterQuiz || searchTerm
              ? "No submissions match your filters"
              : "No submissions yet"}
          </p>
        </div>
      ) : (
        <>
          <div className="hidden md:block bg-white dark:bg-[#1A1128] rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto" role="region" aria-label="Submissions table" tabIndex={0}>
              <table className="w-full" aria-label="Submissions">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-[#0F0A1A]/50">
                    <th scope="col" className="text-left px-5 py-3.5 text-gray-500 dark:text-gray-400">
                      <SortButton field="member" label="Member" />
                    </th>
                    <th scope="col" className="text-left px-5 py-3.5 text-gray-500 dark:text-gray-400">
                      <SortButton field="omjCard" label="OMJ Card" />
                    </th>
                    <th scope="col" className="text-left px-5 py-3.5 text-gray-500 dark:text-gray-400">
                      <SortButton field="quiz" label="Quiz" />
                    </th>
                    <th scope="col" className="text-left px-5 py-3.5 text-gray-500 dark:text-gray-400 hidden lg:table-cell">
                      <SortButton field="paigham" label="Paigham" />
                    </th>
                    <th scope="col" className="text-left px-5 py-3.5 text-gray-500 dark:text-gray-400">
                      <SortButton field="answers" label="Answers" />
                    </th>
                    <th scope="col" className="text-left px-5 py-3.5 text-gray-500 dark:text-gray-400">
                      <SortButton field="date" label="Date" />
                    </th>
                    <th scope="col" className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {paginated.map((s) => {
                    const qId = typeof s.quizId === "object" ? s.quizId._id : (s.quizId as string);
                    const isW = isWinner(qId, s._id);
                    return (
                      <tr key={s._id} className={`hover:bg-primary-50/50 dark:hover:bg-primary-50/30 transition-colors duration-150 ${isW ? "bg-amber-50/30 dark:bg-amber-900/10" : ""}`}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            {isW && (
                              <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-label="Winner">
                                <path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                              </svg>
                            )}
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{getMemberName(s)}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          {editingId === s._id ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                ref={editInputRef}
                                type="text"
                                value={editOmjCard}
                                onChange={(e) => setEditOmjCard(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveEdit();
                                  if (e.key === "Escape") cancelEdit();
                                }}
                                className="w-28 rounded border border-primary dark:border-primary-400 bg-white dark:bg-[#0F0A1A] px-2 py-1 text-xs font-mono text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-primary-400"
                                aria-label="Edit OMJ card number"
                              />
                              <button
                                onClick={saveEdit}
                                disabled={updateMutation.isPending}
                                className="p-1 rounded text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors disabled:opacity-50"
                                aria-label="Save"
                              >
                                {updateMutation.isPending ? (
                                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />
                                ) : (
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                aria-label="Cancel edit"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ) : (
                            <span className="inline-flex items-center text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-primary-50 text-primary dark:bg-primary-50/50 dark:text-primary-400">
                              {s.memberOmjCard}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm text-gray-600 dark:text-gray-400">{getQuizTitle(s)}</span>
                        </td>
                        <td className="px-5 py-4 hidden lg:table-cell">
                          <span className="text-sm text-gray-500 dark:text-gray-400">{getPaighamTitle(s)}</span>
                        </td>
                        <td className="px-5 py-4">
                          <button
                            onClick={() => setExpandedAnswers(expandedAnswers === s._id ? null : s._id)}
                            className="inline-flex items-center gap-1 text-xs font-bold rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 px-2.5 py-1 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                          >
                            {s.answers?.length || 0}
                            <svg className={`w-3 h-3 transition-transform ${expandedAnswers === s._id ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          {expandedAnswers === s._id && renderAnswersDetail(s)}
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatDate(s.submittedAt)}</span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="inline-flex gap-1">
                            <button
                              onClick={() => toggleWinner(s)}
                              className={`p-2 rounded-lg transition-all duration-200 ${
                                isW
                                  ? "text-amber-500 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                                  : "text-gray-400 dark:text-gray-500 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                              }`}
                              aria-label={isW ? "Remove winner" : "Mark as winner"}
                              title={isW ? "Remove winner" : "Mark as winner"}
                            >
                              <svg className="w-4 h-4" fill={isW ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => startEdit(s)}
                              disabled={editingId === s._id}
                              className="p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:text-primary dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-50/50 transition-all duration-200 disabled:opacity-50"
                              aria-label={`Edit OMJ card for ${getMemberName(s)}`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(s._id)}
                              disabled={deleteMutation.isPending}
                              className="p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 disabled:opacity-50"
                              aria-label={`Delete submission from ${getMemberName(s)}`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="md:hidden space-y-3">
            {paginated.map((s) => {
              const qId = typeof s.quizId === "object" ? s.quizId._id : (s.quizId as string);
              const isW = isWinner(qId, s._id);
              return (
                <div
                  key={s._id}
                  className={`bg-white dark:bg-[#1A1128] rounded-xl border shadow-sm ${isW ? "border-amber-200 dark:border-amber-800" : "border-gray-200 dark:border-gray-800"}`}
                >
                  <button
                    onClick={() => setExpandedRow(expandedRow === s._id ? null : s._id)}
                    className="w-full text-left p-4"
                    aria-expanded={expandedRow === s._id}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {isW && (
                            <svg className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                            </svg>
                          )}
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{getMemberName(s)}</h3>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{getQuizTitle(s)}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        <span className="inline-flex items-center text-xs font-mono font-semibold px-2 py-0.5 rounded bg-primary-50 text-primary dark:bg-primary-50/50 dark:text-primary-400">
                          {s.memberOmjCard}
                        </span>
                        <svg
                          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${expandedRow === s._id ? "rotate-180" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </button>
                  {expandedRow === s._id && (
                    <div className="px-4 pb-4 pt-1 border-t border-gray-100 dark:border-gray-800 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">Paigham</span>
                        <span className="text-gray-900 dark:text-white">{getPaighamTitle(s)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">Answers</span>
                        <span className="text-gray-900 dark:text-white">{s.answers?.length || 0}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">Date</span>
                        <span className="text-gray-900 dark:text-white">{formatDate(s.submittedAt)}</span>
                      </div>
                      {renderAnswersDetail(s)}
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => toggleWinner(s)}
                          className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                            isW
                              ? "text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20"
                              : "text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                          }`}
                        >
                          {isW ? "Winner ★" : "Mark Winner"}
                        </button>
                        <button
                          onClick={() => startEdit(s)}
                          className="flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          Edit OMJ
                        </button>
                        <button
                          onClick={() => handleDelete(s._id)}
                          disabled={deleteMutation.isPending}
                          className="flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <nav className="flex flex-col sm:flex-row items-center justify-between mt-5 gap-3" aria-label="Pagination">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length}
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                  aria-label="Previous page"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .map((p, idx, arr) => (
                    <span key={p} className="flex items-center">
                      {idx > 0 && arr[idx - 1] !== p - 1 && (
                        <span className="px-1 text-gray-400" aria-hidden="true">...</span>
                      )}
                      <button
                        onClick={() => setPage(p)}
                        aria-current={p === page ? "page" : undefined}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-all duration-200 ${
                          p === page
                            ? "bg-primary dark:bg-primary-400 text-white shadow-sm"
                            : "border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                        }`}
                      >
                        {p}
                      </button>
                    </span>
                  ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                  aria-label="Next page"
                >
                  Next
                </button>
              </div>
            </nav>
          )}
        </>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Submission"
        message="Are you sure you want to delete this submission? This action cannot be undone."
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Layout>
  );
}
