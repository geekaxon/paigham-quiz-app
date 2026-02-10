# Project Overview

Full-stack quiz management application with a Node.js/Express backend and Next.js frontend.

## Project Architecture

### Backend (`src/`)
- `src/app.ts` - Express app setup (CORS, JSON/urlencoded parsing with 200MB limit, error handler, route mounting, static file serving for uploads).
- `src/config/db.ts` - MongoDB connection module. Exports `connectDB()` using Mongoose.
- `src/server.ts` - Entry point. Calls `connectDB()`, seeds default quiz types (Monthly/Special/Weekly Quiz), then starts server on port 3001.
- `src/middlewares/auth.middleware.ts` - JWT validation middleware for admin routes.
- `src/modules/admin/` - Admin model, controller (login), routes.
- `src/modules/paigham/` - Paigham model, routes (CRUD).
- `src/modules/quiz/` - Quiz model (with quizImageUrl, winners, showWinners), QuizType model, routes (CRUD, public answer stripping, winner management endpoints).
- `src/modules/submission/` - Submission model (with isWinner), service (validation), routes (CRUD with PUT/DELETE, similarity scoring computed server-side).
- `src/modules/member/` - Member service (mock API, replaceable), routes (public lookup by OMJ card).
- `src/modules/stats/` - Dashboard stats endpoint (counts for paighams, quizzes, submissions).
- `src/modules/upload/` - PDF and image file upload endpoints using multer (200MB limit).
- `src/utils/similarity.ts` - Levenshtein distance-based text similarity calculation.

### Frontend (`frontend/`)
- Next.js 16 + React 19 + Tailwind CSS v4 + Axios + @tanstack/react-query
- `frontend/components/Layout.tsx` - Admin layout with responsive sidebar, top nav, logout.
- `frontend/components/PaighamForm.tsx` - Modal form for creating/editing Paighams with drag-and-drop PDF upload, progress bar, preview/replace/remove.
- `frontend/src/app/admin/login/page.tsx` - Admin login page.
- `frontend/src/app/admin/dashboard/page.tsx` - Dashboard with stats cards and recent submissions table (last 5, time-ago display).
- `frontend/src/app/admin/paigham/page.tsx` - Paigham list with search, sortable columns (title/date), pagination with ellipsis, mobile card view, CRUD.
- `frontend/src/app/admin/quizzes/page.tsx` - Quiz list grouped by Paigham, CRUD with search, collapsible groups, status badges.
- `frontend/components/QuizForm.tsx` - Modal form for creating/editing Quizzes with click-based question type dropdown, dynamic question editor (multiple choice, word search with configurable word count, translate, image, guess_who, text, question_answer, fill_blanks), quiz image upload.
- `frontend/src/app/admin/submissions/page.tsx` - Submissions list with text search, sortable columns, filter by Paigham/Quiz, inline editing, delete, pagination, mobile card view, CSV export, similarity % display per answer, winner marking toggles, show winners visibility control.
- `frontend/src/app/paigham/page.tsx` - Public bookshelf-style display of all Paigham magazines with download button and open-in-new-tab button per card.
- `frontend/src/app/quiz/[quizId]/page.tsx` - Public quiz-taking page with OMJ card verification, dynamic question rendering (8 types including question_answer and fill_blanks), countdown timer, required-field validation, smooth submit states, winners display when enabled.
- `frontend/components/Notification.tsx` - Reusable notification component (success/error/info) with auto-dismiss (3-5s), progress bar, NotificationContainer for stacking.
- `frontend/components/Toast.tsx` - Global toast notification system using context API (useToast hook), renders via NotificationContainer, integrated into QueryProvider.
- `frontend/components/ConfirmModal.tsx` - Reusable confirmation dialog with focus trapping, Escape/Tab keyboard support, loading state, and return focus management. Used for all delete actions.
- `frontend/components/LoadingSpinner.tsx` - Reusable loading spinner with sm/md/lg/xl sizes, fullPage mode, overlay mode, InlineLoading variant.
- `frontend/services/api.ts` - Centralized API service layer with Axios instance, JWT interceptor, typed interfaces (Paigham, Quiz, Submission, Stats, Member, SimilarityScore), and exported API functions (adminApi, statsApi, paighamApi, quizApi with updateWinners, submissionApi, memberApi) used by all pages.
- `frontend/components/QueryProvider.tsx` - React Query provider wrapper with Toast context provider.
- API calls proxied to backend via Next.js rewrites (`/api/*` and `/uploads/*` -> `localhost:3001`).

## Key Features
- **6+ Question Types**: Multiple choice, word search (with configurable word count), translate, image, guess_who (blurred image reveal), text, question_answer, fill_in_blanks
- **Quiz Image**: Uploaded at quiz level, referenced by image-type questions
- **Answer Security**: Public quiz endpoint strips expected answers to prevent cheating
- **Similarity Scoring**: Server-side Levenshtein distance calculation for answer comparison
- **Winner System**: Quiz-level winners array with admin-controlled visibility, synced isWinner flag on submissions
- **File Uploads**: PDF and image upload endpoints with 200MB limit

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
Uploaded files (PDFs and images) are stored in `/uploads` directory and served statically.
Default quiz types seeded on first startup: Monthly Quiz, Special Quiz, Weekly Quiz.
