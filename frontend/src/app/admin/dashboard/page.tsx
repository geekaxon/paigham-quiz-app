"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Layout from "../../../../components/Layout";
import LoadingSpinner from "../../../../components/LoadingSpinner";
import Notification from "../../../../components/Notification";

interface Stats {
  paighamCount: number;
  quizCount: number;
  submissionCount: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/admin/login");
      return;
    }

    fetch("/api/stats", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (res.status === 401) {
          localStorage.removeItem("token");
          router.push("/admin/login");
          return;
        }
        const data = await res.json();
        if (data.success) {
          setStats(data.data);
        } else {
          setError(data.message || "Failed to load stats");
        }
      })
      .catch(() => setError("Failed to load stats"))
      .finally(() => setLoading(false));
  }, [router]);

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
        <Notification type="error" message={error} onClose={() => setError("")} duration={0} />
      )}

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
      )}
    </Layout>
  );
}
