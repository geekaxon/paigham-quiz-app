"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { statsApi, submissionApi, type Stats, type Submission } from "../../../../services/api";
import Layout from "../../../../components/Layout";
import LoadingSpinner from "../../../../components/LoadingSpinner";
import Notification from "../../../../components/Notification";

export default function DashboardPage() {
  const router = useRouter();

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const statsQuery = useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      const res = await statsApi.getStats();
      if (!res.success) throw new Error(res.message || "Failed to load stats");
      return res.data;
    },
    enabled: !!token,
  });

  const submissionsQuery = useQuery({
    queryKey: ["submissions"],
    queryFn: async () => {
      const res = await submissionApi.getAll();
      if (!res.success) throw new Error("Failed to load submissions");
      return res.data;
    },
    enabled: !!token,
  });

  if (!token) {
    router.push("/admin/login");
    return null;
  }

  const recentSubmissions = useMemo(() => {
    if (!submissionsQuery.data) return [];
    return [...submissionsQuery.data]
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      .slice(0, 5);
  }, [submissionsQuery.data]);

  const stats = statsQuery.data as Stats | undefined;
  const loading = statsQuery.isLoading || submissionsQuery.isLoading;
  const error = statsQuery.error?.message || submissionsQuery.error?.message || "";

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

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return formatDate(dateStr);
  };

  const cards = stats
    ? [
        {
          label: "Paighams",
          value: stats.paighamCount,
          href: "/admin/paigham",
          icon: (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          ),
          color: "bg-primary-50 text-primary dark:bg-primary-50 dark:text-primary-400",
          borderColor: "border-primary-100 dark:border-primary-200",
        },
        {
          label: "Quizzes",
          value: stats.quizCount,
          href: "/admin/quizzes",
          icon: (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
            </svg>
          ),
          color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
          borderColor: "border-emerald-100 dark:border-emerald-800",
        },
        {
          label: "Submissions",
          value: stats.submissionCount,
          href: "/admin/submissions",
          icon: (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
            </svg>
          ),
          color: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
          borderColor: "border-amber-100 dark:border-amber-800",
        },
      ]
    : [];

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Overview of your quiz management system</p>
      </div>

      {loading && <LoadingSpinner size="lg" label="Loading dashboard..." fullPage />}

      {error && (
        <Notification type="error" message={error} onClose={() => {}} duration={0} />
      )}

      {stats && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
            {cards.map((card) => (
              <a
                key={card.label}
                href={card.href}
                className={`bg-white dark:bg-[#1A1128] rounded-xl border ${card.borderColor} p-6 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group block`}
                aria-label={`${card.label}: ${card.value}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.label}</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{card.value}</p>
                  </div>
                  <div className={`rounded-xl p-3 ${card.color} group-hover:scale-110 transition-transform duration-300`}>
                    {card.icon}
                  </div>
                </div>
              </a>
            ))}
          </div>

          <div className="bg-white dark:bg-[#1A1128] rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Submissions</h2>
              </div>
              <a
                href="/admin/submissions"
                className="text-xs font-medium text-primary dark:text-primary-400 hover:text-primary-light dark:hover:text-primary-300 transition-colors duration-200"
              >
                View all
              </a>
            </div>

            {recentSubmissions.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-sm text-gray-400 dark:text-gray-500">No submissions yet</p>
              </div>
            ) : (
              <>
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full" aria-label="Recent submissions">
                    <thead>
                      <tr className="bg-gray-50/80 dark:bg-[#0F0A1A]/50">
                        <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Member</th>
                        <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quiz</th>
                        <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Answers</th>
                        <th scope="col" className="text-right px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">When</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {recentSubmissions.map((s) => (
                        <tr key={s._id} className="hover:bg-primary-50/50 dark:hover:bg-primary-50/30 transition-colors duration-150">
                          <td className="px-5 py-3">
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{getMemberName(s)}</p>
                              <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">{s.memberOmjCard}</p>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <span className="text-sm text-gray-600 dark:text-gray-400">{getQuizTitle(s)}</span>
                          </td>
                          <td className="px-5 py-3">
                            <span className="text-sm text-gray-500 dark:text-gray-400">{s.answers?.length || 0}</span>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">{timeAgo(s.submittedAt)}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="sm:hidden divide-y divide-gray-100 dark:divide-gray-800">
                  {recentSubmissions.map((s) => (
                    <div key={s._id} className="px-4 py-3 flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{getMemberName(s)}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{getQuizTitle(s)}</p>
                      </div>
                      <div className="text-right ml-3 flex-shrink-0">
                        <p className="text-xs text-gray-400 dark:text-gray-500">{timeAgo(s.submittedAt)}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{s.answers?.length || 0} answers</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </Layout>
  );
}
