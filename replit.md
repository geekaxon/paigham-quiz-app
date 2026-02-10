# Project Overview

Full-stack application with a Node.js/Express backend and Next.js frontend.

## Project Architecture

### Backend (`src/`)
- `src/app.ts` - Express app setup (CORS, JSON parsing, error handler, route mounting, static file serving for uploads).
- `src/config/db.ts` - MongoDB connection module. Exports `connectDB()` using Mongoose.
- `src/server.ts` - Entry point. Calls `connectDB()`, then starts server on port 3001.
- `src/middlewares/auth.middleware.ts` - JWT validation middleware for admin routes.
- `src/modules/admin/` - Admin model, controller (login), routes.
- `src/modules/paigham/` - Paigham model, routes (CRUD).
- `src/modules/quiz/` - Quiz model, QuizType model, routes (CRUD).
- `src/modules/submission/` - Submission model, service (validation), routes (CRUD with PUT/DELETE for inline editing).
- `src/modules/member/` - Member service (mock API, replaceable), routes (public lookup by OMJ card).
- `src/modules/stats/` - Dashboard stats endpoint (counts for paighams, quizzes, submissions).
- `src/modules/upload/` - PDF file upload endpoint using multer (10MB limit, PDF-only).

### Frontend (`frontend/`)
- Next.js 16 + React 19 + Tailwind CSS v4 + Axios + @tanstack/react-query
- `frontend/components/Layout.tsx` - Admin layout with responsive sidebar, top nav, logout.
- `frontend/components/PaighamForm.tsx` - Modal form for creating/editing Paighams with drag-and-drop PDF upload, progress bar, preview/replace/remove.
- `frontend/src/app/admin/login/page.tsx` - Admin login page.
- `frontend/src/app/admin/dashboard/page.tsx` - Dashboard with stats cards and recent submissions table (last 5, time-ago display).
- `frontend/src/app/admin/paigham/page.tsx` - Paigham list with search, sortable columns (title/date), pagination with ellipsis, mobile card view, CRUD.
- `frontend/src/app/admin/quizzes/page.tsx` - Quiz list grouped by Paigham, CRUD with search, collapsible groups, status badges.
- `frontend/components/QuizForm.tsx` - Modal form for creating/editing Quizzes with dynamic question editor (multiple choice, word search, translate, image).
- `frontend/src/app/admin/submissions/page.tsx` - Submissions list with text search (member/OMJ/quiz), sortable columns (all 6 fields), filter by Paigham/Quiz, inline editing of OMJ card, delete, pagination with ellipsis, mobile card view with expandable rows, CSV export with BOM.
- `frontend/src/app/paigham/page.tsx` - Public bookshelf-style display of all Paigham magazines with download button and open-in-new-tab button per card.
- `frontend/src/app/quiz/[quizId]/page.tsx` - Public quiz-taking page with OMJ card verification, dynamic question rendering (multiple choice, word search, translate, image, guess_who with blurred image reveal, text), countdown timer, required-field validation, and smooth submit states (loading/success/error/retry).
- `frontend/components/Notification.tsx` - Reusable notification component (success/error/info) with auto-dismiss (3-5s), progress bar, NotificationContainer for stacking.
- `frontend/components/Toast.tsx` - Global toast notification system using context API (useToast hook), renders via NotificationContainer, integrated into QueryProvider.
- `frontend/components/ConfirmModal.tsx` - Reusable confirmation dialog with focus trapping, Escape/Tab keyboard support, loading state, and return focus management. Used for all delete actions.
- `frontend/components/LoadingSpinner.tsx` - Reusable loading spinner with sm/md/lg/xl sizes, fullPage mode, overlay mode, InlineLoading variant.
- `frontend/services/api.ts` - Centralized API service layer with Axios instance, JWT interceptor, typed interfaces (Paigham, Quiz, Submission, Stats, Member), and exported API functions (adminApi, statsApi, paighamApi, quizApi, submissionApi, memberApi) used by all pages.
- `frontend/components/QueryProvider.tsx` - React Query provider wrapper with Toast context provider.
- API calls proxied to backend via Next.js rewrites (`/api/*` and `/uploads/*` -> `localhost:3001`).

## Tech Stack

- Node.js 20, TypeScript
- Express, Mongoose (MongoDB), multer (file uploads)
- Next.js 16, React 19, Tailwind CSS v4, Axios, @tanstack/react-query
- bcrypt, jsonwebtoken
- Design: Corporate branding (#2F1268 primary purple, #F5F5F5 secondary), dark mode support

## Environment Variables

- `MONGO_URI` - MongoDB connection string (required, stored as secret)
- `JWT_SECRET` - JWT signing secret (required, stored as secret)

## Running

Backend runs on port 3001 (internal), frontend on port 5000 (user-facing).
API requests are proxied from frontend to backend via Next.js rewrites.
Uploaded PDFs are stored in `/uploads` directory and served statically.
