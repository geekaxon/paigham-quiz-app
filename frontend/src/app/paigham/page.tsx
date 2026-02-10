"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { paighamApi, getUploadUrl, type Paigham } from "../../../services/api";
import LoadingSpinner from "../../../components/LoadingSpinner";

export default function PaighamPublicPage() {
  const { data: rawPaighams = [], isLoading: loading, error: queryError } = useQuery({
    queryKey: ["paighams-public"],
    queryFn: async () => {
      const res = await paighamApi.getAll();
      if (!res.success) throw new Error("Failed to load magazines");
      return res.data;
    },
  });

  const error = queryError?.message || "";

  const paighams = useMemo(
    () =>
      [...rawPaighams].sort(
        (a, b) => new Date(b.publicationDate).getTime() - new Date(a.publicationDate).getTime()
      ),
    [rawPaighams]
  );

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const getMonthYear = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });

  const handleDownload = async (url: string, title: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `${title.replace(/[^a-zA-Z0-9\s-]/g, "").trim()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, "_blank");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-secondary to-primary-100 dark:from-[#0F0A1A] dark:via-[#1A1128] dark:to-[#0F0A1A]">
      <header className="bg-white/80 dark:bg-[#1A1128]/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-light dark:from-primary-400 dark:to-primary-300 flex items-center justify-center shadow-lg shadow-primary/25">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Paigham Magazines</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">Browse and download our publications</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {loading ? (
          <LoadingSpinner size="lg" label="Loading magazines..." fullPage />
        ) : error ? (
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <svg className="w-12 h-12 mx-auto text-red-300 dark:text-red-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <p className="text-gray-600 dark:text-gray-400">{error}</p>
            </div>
          </div>
        ) : paighams.length === 0 ? (
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto text-gray-200 dark:text-gray-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
              <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">No magazines available yet</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Check back soon for new publications</p>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6 sm:mb-8">
              <p className="text-sm text-gray-500 dark:text-gray-400">{paighams.length} publication{paighams.length !== 1 ? "s" : ""} available</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
              {paighams.map((p) => (
                <div key={p._id} className="group">
                  <div className="relative aspect-[3/4] rounded-lg overflow-hidden shadow-md group-hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1 bg-gradient-to-br from-primary via-primary-light to-primary-400">
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                      <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white/40 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                      </svg>
                      <h3 className="text-white font-semibold text-sm sm:text-base leading-tight line-clamp-3">
                        {p.title}
                      </h3>
                      <span className="mt-2 text-white/60 text-xs font-medium">
                        {getMonthYear(p.publicationDate)}
                      </span>
                    </div>

                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                      <a
                        href={getUploadUrl(p.pdfUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white/90 dark:bg-gray-900/90 rounded-full p-2.5 shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 hover:scale-110"
                        aria-label={`Open ${p.title} in new tab`}
                        title="Open in new tab"
                      >
                        <svg className="w-4 h-4 text-gray-800 dark:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                      <button
                        onClick={() => handleDownload(getUploadUrl(p.pdfUrl), p.title)}
                        className="bg-white/90 dark:bg-gray-900/90 rounded-full p-2.5 shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 hover:scale-110"
                        aria-label={`Download ${p.title} PDF`}
                        title="Download PDF"
                      >
                        <svg className="w-4 h-4 text-gray-800 dark:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </button>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/30 to-transparent" />
                  </div>

                  <div className="mt-2.5 px-0.5">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">{p.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{formatDate(p.publicationDate)}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <a
                        href={getUploadUrl(p.pdfUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs font-medium text-primary dark:text-primary-400 hover:text-primary-light dark:hover:text-primary-300 transition-colors duration-200"
                        aria-label={`View ${p.title}`}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View
                      </a>
                      <span className="text-gray-300 dark:text-gray-600">|</span>
                      <button
                        onClick={() => handleDownload(getUploadUrl(p.pdfUrl), p.title)}
                        className="flex items-center gap-1 text-xs font-medium text-primary dark:text-primary-400 hover:text-primary-light dark:hover:text-primary-300 transition-colors duration-200"
                        aria-label={`Download ${p.title}`}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
