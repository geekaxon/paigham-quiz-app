"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { paighamApi, type Paigham } from "../../../../services/api";
import Layout from "../../../../components/Layout";
import PaighamForm from "../../../../components/PaighamForm";
import LoadingSpinner from "../../../../components/LoadingSpinner";
import ConfirmModal from "../../../../components/ConfirmModal";
import { useToast } from "../../../../components/Toast";

type SortField = "title" | "date";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 8;

export default function PaighamPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingPaigham, setEditingPaigham] = useState<Paigham | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const { data: paighams = [], isLoading: loading } = useQuery({
    queryKey: ["paighams"],
    queryFn: async () => {
      const res = await paighamApi.getAll();
      if (!res.success) throw new Error("Failed to load Paighams");
      return res.data;
    },
    enabled: !!token,
  });

  const deleteMutation = useMutation({
    mutationFn: paighamApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paighams"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      toast.success("Paigham deleted successfully");
      setDeleteTarget(null);
    },
    onError: () => {
      toast.error("Failed to delete Paigham");
      setDeleteTarget(null);
    },
  });

  if (!token) {
    router.push("/admin/login");
    return null;
  }

  const handleDelete = (id: string, title: string) => {
    setDeleteTarget({ id, title });
  };

  const confirmDelete = () => {
    if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
  };

  const filtered = useMemo(() => {
    if (!searchTerm) return paighams;
    const term = searchTerm.toLowerCase();
    return paighams.filter(
      (p) =>
        p.title.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term)
    );
  }, [paighams, searchTerm]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      if (sortField === "title") {
        const cmp = a.title.toLowerCase().localeCompare(b.title.toLowerCase());
        return sortDir === "asc" ? cmp : -cmp;
      }
      const cmp = new Date(a.publicationDate).getTime() - new Date(b.publicationDate).getTime();
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortField, sortDir]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginatedPaighams = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "date" ? "desc" : "asc");
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
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

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Paighams</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {sorted.length} publication{sorted.length !== 1 ? "s" : ""}
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

      {paighams.length > 3 && (
        <div className="mb-4">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search paighams..."
              aria-label="Search paighams"
              className="w-full sm:w-72 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1A1128] pl-10 pr-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-400 focus:border-transparent transition-all duration-200"
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
        </div>
      )}

      {loading ? (
        <LoadingSpinner size="lg" label="Loading Paighams..." fullPage />
      ) : sorted.length === 0 ? (
        <div className="text-center py-20" role="status">
          <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {searchTerm ? "No Paighams match your search" : "No Paighams found"}
          </p>
          {!searchTerm && (
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Click &quot;Add Paigham&quot; to create your first one</p>
          )}
        </div>
      ) : (
        <>
          <div className="hidden md:block bg-white dark:bg-[#1A1128] rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto" role="region" aria-label="Paighams table" tabIndex={0}>
              <table className="w-full" aria-label="Paighams">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-[#0F0A1A]/50">
                    <th scope="col" className="text-left px-5 py-3.5 text-gray-500 dark:text-gray-400">
                      <button
                        onClick={() => handleSort("title")}
                        className="inline-flex items-center text-xs font-semibold uppercase tracking-wider hover:text-primary dark:hover:text-primary-400 transition-colors duration-200"
                        aria-label="Sort by title"
                      >
                        Title
                        <SortIcon field="title" />
                      </button>
                    </th>
                    <th scope="col" className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Description
                    </th>
                    <th scope="col" className="text-left px-5 py-3.5 text-gray-500 dark:text-gray-400">
                      <button
                        onClick={() => handleSort("date")}
                        className="inline-flex items-center text-xs font-semibold uppercase tracking-wider hover:text-primary dark:hover:text-primary-400 transition-colors duration-200"
                        aria-label="Sort by date"
                      >
                        Date
                        <SortIcon field="date" />
                      </button>
                    </th>
                    <th scope="col" className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      PDF
                    </th>
                    <th scope="col" className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {paginatedPaighams.map((p) => (
                    <tr key={p._id} className="hover:bg-primary-50/50 dark:hover:bg-primary-50/30 transition-colors duration-150">
                      <td className="px-5 py-4">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{p.title}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 max-w-xs">
                          {p.description}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatDate(p.publicationDate)}</span>
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
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
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
                            onClick={() => handleDelete(p._id, p.title)}
                            disabled={deleteMutation.isPending}
                            className="p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 disabled:opacity-50"
                            aria-label={`Delete ${p.title}`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="md:hidden space-y-3">
            {paginatedPaighams.map((p) => (
              <div
                key={p._id}
                className="bg-white dark:bg-[#1A1128] rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{p.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{p.description}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">{formatDate(p.publicationDate)}</p>
                  </div>
                  <div className="flex-shrink-0 w-10 h-12 rounded bg-gradient-to-br from-primary to-primary-light flex items-center justify-center">
                    <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                    </svg>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <a
                    href={p.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-primary dark:text-primary-400 border border-primary-100 dark:border-primary-200 hover:bg-primary-50 dark:hover:bg-primary-50/50 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    View PDF
                  </a>
                  <button
                    onClick={() => {
                      setEditingPaigham(p);
                      setShowForm(true);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    aria-label={`Edit ${p.title}`}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(p._id, p.title)}
                    disabled={deleteMutation.isPending}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                    aria-label={`Delete ${p.title}`}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
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
            queryClient.invalidateQueries({ queryKey: ["paighams"] });
            queryClient.invalidateQueries({ queryKey: ["stats"] });
            toast.success(editingPaigham ? "Paigham updated successfully" : "Paigham created successfully");
          }}
        />
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Paigham"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone and will also remove any associated quizzes and submissions.`}
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Layout>
  );
}
