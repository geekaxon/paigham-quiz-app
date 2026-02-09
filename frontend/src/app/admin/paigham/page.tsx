"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Layout from "../../../../components/Layout";
import PaighamForm from "../../../../components/PaighamForm";
import LoadingSpinner from "../../../../components/LoadingSpinner";
import Notification from "../../../../components/Notification";

interface Paigham {
  _id: string;
  title: string;
  description: string;
  pdfUrl: string;
  publicationDate: string;
  isArchived: boolean;
}

const PAGE_SIZE = 8;

export default function PaighamPage() {
  const router = useRouter();
  const [paighams, setPaighams] = useState<Paigham[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingPaigham, setEditingPaigham] = useState<Paigham | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const fetchPaighams = useCallback(async () => {
    if (!token) {
      router.push("/admin/login");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get("/api/paigham", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setPaighams(res.data.data);
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        localStorage.removeItem("token");
        router.push("/admin/login");
        return;
      }
      setError("Failed to load Paighams");
    } finally {
      setLoading(false);
    }
  }, [token, router]);

  useEffect(() => {
    fetchPaighams();
  }, [fetchPaighams]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this Paigham?")) return;
    setDeleting(id);
    try {
      await axios.delete(`/api/paigham/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchPaighams();
    } catch {
      setError("Failed to delete Paigham");
    } finally {
      setDeleting(null);
    }
  };

  const totalPages = Math.ceil(paighams.length / PAGE_SIZE);
  const paginatedPaighams = paighams.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Paighams</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your Paigham publications
          </p>
        </div>
        <button
          onClick={() => {
            setEditingPaigham(null);
            setShowForm(true);
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-primary dark:bg-primary-400 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-light dark:hover:bg-primary-300 shadow-sm hover:shadow-md transition-all duration-200"
          aria-label="Add new Paigham"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Paigham
        </button>
      </div>

      {error && (
        <div className="mb-4">
          <Notification type="error" message={error} onClose={() => setError("")} duration={0} />
        </div>
      )}

      {loading ? (
        <LoadingSpinner size="lg" label="Loading Paighams..." fullPage />
      ) : paighams.length === 0 ? (
        <div className="text-center py-20" role="status">
          <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400 text-sm">No Paighams found</p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Click &quot;Add Paigham&quot; to create your first one</p>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-[#1A1128] rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto" role="region" aria-label="Paighams table" tabIndex={0}>
              <table className="w-full min-w-[600px]" aria-label="Paighams">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-[#0F0A1A]/50">
                    <th scope="col" className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Title</th>
                    <th scope="col" className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Description</th>
                    <th scope="col" className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Date</th>
                    <th scope="col" className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">PDF</th>
                    <th scope="col" className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {paginatedPaighams.map((p) => (
                    <tr key={p._id} className="hover:bg-primary-50/50 dark:hover:bg-primary-50/30 transition-colors duration-150">
                      <td className="px-5 py-4">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{p.title}</span>
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <span className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 max-w-xs">
                          {p.description}
                        </span>
                      </td>
                      <td className="px-5 py-4 hidden sm:table-cell">
                        <span className="text-sm text-gray-500 dark:text-gray-400">{formatDate(p.publicationDate)}</span>
                      </td>
                      <td className="px-5 py-4">
                        <a
                          href={p.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-primary dark:text-primary-400 hover:text-primary-light dark:hover:text-primary-300 font-medium transition-colors duration-200"
                          aria-label={`View PDF for ${p.title}`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          View
                        </a>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex gap-1">
                          <button
                            onClick={() => {
                              setEditingPaigham(p);
                              setShowForm(true);
                            }}
                            className="p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:text-primary dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-50/50 transition-all duration-200"
                            aria-label={`Edit ${p.title}`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(p._id)}
                            disabled={deleting === p._id}
                            className="p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 disabled:opacity-50"
                            aria-label={`Delete ${p.title}`}
                          >
                            {deleting === p._id ? (
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <nav className="flex flex-col sm:flex-row items-center justify-between mt-5 gap-3" aria-label="Pagination">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, paighams.length)} of {paighams.length}
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
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
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

      {showForm && (
        <PaighamForm
          paigham={editingPaigham}
          onClose={() => {
            setShowForm(false);
            setEditingPaigham(null);
          }}
          onSaved={() => {
            setShowForm(false);
            setEditingPaigham(null);
            fetchPaighams();
          }}
        />
      )}
    </Layout>
  );
}
