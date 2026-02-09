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
- `src/modules/submission/` - Submission model, service (validation), routes.
- `src/modules/member/` - Member service (mock API, replaceable).
- `src/modules/stats/` - Dashboard stats endpoint (counts for paighams, quizzes, submissions).
- `src/modules/upload/` - PDF file upload endpoint using multer (10MB limit, PDF-only).

### Frontend (`frontend/`)
- Next.js 16 + React 19 + Tailwind CSS v4 + Axios
- `frontend/components/Layout.tsx` - Admin layout with responsive sidebar, top nav, logout.
- `frontend/components/PaighamForm.tsx` - Modal form for creating/editing Paighams with PDF upload.
- `frontend/src/app/admin/login/page.tsx` - Admin login page.
- `frontend/src/app/admin/dashboard/page.tsx` - Dashboard with stats cards.
- `frontend/src/app/admin/paigham/page.tsx` - Paigham list with pagination, CRUD.
- `frontend/src/app/admin/quizzes/page.tsx` - Quiz list grouped by Paigham, CRUD with search.
- `frontend/components/QuizForm.tsx` - Modal form for creating/editing Quizzes with dynamic question editor (multiple choice, word search, translate, image).
- `frontend/src/app/admin/submissions/page.tsx` - Submissions list with filters (Paigham/Quiz), pagination, CSV export.
- API calls proxied to backend via Next.js rewrites (`/api/*` and `/uploads/*` -> `localhost:3001`).

## Tech Stack

- Node.js 20, TypeScript
- Express, Mongoose (MongoDB), multer (file uploads)
- Next.js 16, React 19, Tailwind CSS v4, Axios
- bcrypt, jsonwebtoken

## Environment Variables

- `MONGO_URI` - MongoDB connection string (required, stored as secret)
- `JWT_SECRET` - JWT signing secret (required, stored as secret)

## Running

Backend runs on port 3001 (internal), frontend on port 5000 (user-facing).
API requests are proxied from frontend to backend via Next.js rewrites.
Uploaded PDFs are stored in `/uploads` directory and served statically.
