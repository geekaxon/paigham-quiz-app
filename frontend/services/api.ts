import axios from "axios";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "/api";
const backendBaseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

export function getUploadUrl(path: string): string {
  if (backendBaseUrl && path.startsWith("/")) {
    return `${backendBaseUrl}${path}`;
  }
  return path;
}

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token");
      window.location.href = "/admin/login";
    }
    return Promise.reject(error);
  }
);

export default api;

export interface Paigham {
  _id: string;
  title: string;
  description: string;
  pdfUrl: string;
  publicationDate: string;
  isArchived: boolean;
}

export interface QuizType {
  _id: string;
  name: string;
  description: string;
}

export interface Question {
  type: string;
  required?: boolean;
  [key: string]: unknown;
}

export interface Quiz {
  _id: string;
  paighamId: Paigham;
  quizTypeId: QuizType;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  questions: Question[];
}

export interface PopulatedQuiz {
  _id: string;
  title: string;
  paighamId: Paigham | null;
}

export interface Submission {
  _id: string;
  quizId: PopulatedQuiz | string;
  memberOmjCard: string;
  memberSnapshot: Record<string, unknown>;
  answers: Record<string, unknown>[];
  submittedAt: string;
}

export interface Stats {
  paighamCount: number;
  quizCount: number;
  submissionCount: number;
}

export interface Member {
  omjCard: string;
  name: string;
  email: string;
  phone: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const adminApi = {
  login: async (email: string, password: string) => {
    const res = await api.post<ApiResponse<{ token: string }>>("/admin/login", { email, password });
    return res.data;
  },
};

export const statsApi = {
  getStats: async () => {
    const res = await api.get<ApiResponse<Stats>>("/stats");
    return res.data;
  },
};

export const paighamApi = {
  getAll: async () => {
    const res = await api.get<ApiResponse<Paigham[]>>("/paigham");
    return res.data;
  },
  getById: async (id: string) => {
    const res = await api.get<ApiResponse<Paigham>>(`/paigham/${id}`);
    return res.data;
  },
  create: async (data: FormData) => {
    const res = await api.post<ApiResponse<Paigham>>("/paigham", data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
  update: async (id: string, data: FormData) => {
    const res = await api.put<ApiResponse<Paigham>>(`/paigham/${id}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
  delete: async (id: string) => {
    const res = await api.delete<ApiResponse<null>>(`/paigham/${id}`);
    return res.data;
  },
};

export const quizApi = {
  getAll: async () => {
    const res = await api.get<ApiResponse<Quiz[]>>("/quiz");
    return res.data;
  },
  getById: async (id: string) => {
    const res = await api.get<ApiResponse<Quiz>>(`/quiz/${id}`);
    return res.data;
  },
  create: async (data: Partial<Quiz>) => {
    const res = await api.post<ApiResponse<Quiz>>("/quiz", data);
    return res.data;
  },
  update: async (id: string, data: Partial<Quiz>) => {
    const res = await api.put<ApiResponse<Quiz>>(`/quiz/${id}`, data);
    return res.data;
  },
  delete: async (id: string) => {
    const res = await api.delete<ApiResponse<null>>(`/quiz/${id}`);
    return res.data;
  },
};

export const submissionApi = {
  getAll: async () => {
    const res = await api.get<ApiResponse<Submission[]>>("/submission");
    return res.data;
  },
  create: async (data: { quizId: string; omjCard: string; answers: unknown[] }) => {
    const res = await api.post<ApiResponse<Submission>>("/submission", data);
    return res.data;
  },
  update: async (id: string, data: { memberOmjCard: string }) => {
    const res = await api.put<ApiResponse<Submission>>(`/submission/${id}`, data);
    return res.data;
  },
  delete: async (id: string) => {
    const res = await api.delete<ApiResponse<null>>(`/submission/${id}`);
    return res.data;
  },
};

export const memberApi = {
  lookup: async (omjCard: string) => {
    const res = await api.get<ApiResponse<Member>>(`/member/${encodeURIComponent(omjCard)}`);
    return res.data;
  },
};
