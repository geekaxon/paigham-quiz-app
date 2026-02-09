"use client";

import { useEffect, useState } from "react";
import axios from "axios";

interface Paigham {
  _id: string;
  title: string;
  description: string;
  pdfUrl: string;
  publicationDate: string;
}

export default function PaighamPublicPage() {
  const [paighams, setPaighams] = useState<Paigham[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPaighams = async () => {
      try {
        const res = await axios.get("/api/paigham");
        if (res.data.success) {
          const sorted = [...res.data.data].sort(
            (a: Paigham, b: Paigham) =>
              new Date(b.publicationDate).getTime() - new Date(a.publicationDate).getTime()
          );
          setPaighams(sorted);
        }
      } catch {
        setError("Failed to load magazines");
      } finally {
        setLoading(false);
      }
    };
    fetchPaighams();
  }, []);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Paigham Magazines</h1>
              <p className="text-sm text-gray-500 hidden sm:block">Browse and download our publications</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 mx-auto" />
              <p className="mt-4 text-sm text-gray-500">Loading magazines...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <svg className="w-12 h-12 mx-auto text-red-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <p className="text-gray-600">{error}</p>
            </div>
          </div>
        ) : paighams.length === 0 ? (
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto text-gray-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
              <p className="text-gray-500 text-lg font-medium">No magazines available yet</p>
              <p className="text-gray-400 text-sm mt-1">Check back soon for new publications</p>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6 sm:mb-8">
              <p className="text-sm text-gray-500">{paighams.length} publication{paighams.length !== 1 ? "s" : ""} available</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
              {paighams.map((p) => (
                <div key={p._id} className="group">
                  <a
                    href={p.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <div className="relative aspect-[3/4] rounded-lg overflow-hidden shadow-md group-hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700">
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                        <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white/40 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                        </svg>
                        <h3 className="text-white font-semibold text-sm sm:text-base leading-tight line-clamp-3">
                          {p.title}
                        </h3>
                        <span className="mt-2 text-white/60 text-xs font-medium">
                          {getMonthYear(p.publicationDate)}
                        </span>
                      </div>

                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="bg-white/90 rounded-full p-3 shadow-lg">
                          <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                      </div>

                      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/30 to-transparent" />
                    </div>
                  </a>

                  <div className="mt-2.5 px-0.5">
                    <h3 className="text-sm font-medium text-gray-900 line-clamp-1">{p.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{formatDate(p.publicationDate)}</p>
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
