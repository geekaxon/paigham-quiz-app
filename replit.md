# Project Overview

Full-stack application with a Node.js/Express backend and Next.js frontend.

## Project Architecture

### Backend (`src/`)
- `src/app.ts` - Express app setup (CORS, JSON parsing, error handler, route mounting).
- `src/config/db.ts` - MongoDB connection module. Exports `connectDB()` using Mongoose.
- `src/server.ts` - Entry point. Calls `connectDB()`, then starts server on port 3001.
- `src/middlewares/auth.middleware.ts` - JWT validation middleware for admin routes.
- `src/modules/admin/` - Admin model, controller (login), routes.
- `src/modules/paigham/` - Paigham model, routes (CRUD).
- `src/modules/quiz/` - Quiz model, QuizType model, routes (CRUD).
- `src/modules/submission/` - Submission model, service (validation), routes.
- `src/modules/member/` - Member service (mock API, replaceable).

### Frontend (`frontend/`)
- Next.js 16 + React 19 + Tailwind CSS v4
- `frontend/components/Layout.tsx` - Admin layout with responsive sidebar, top nav, logout.
- `frontend/src/app/` - Next.js app directory.
- API calls proxied to backend via Next.js rewrites (`/api/*` -> `localhost:3001`).

## Tech Stack

- Node.js 20, TypeScript
- Express, Mongoose (MongoDB)
- Next.js 16, React 19, Tailwind CSS v4
- bcrypt, jsonwebtoken

## Environment Variables

- `MONGO_URI` - MongoDB connection string (required, stored as secret)
- `JWT_SECRET` - JWT signing secret (required, stored as secret)

## Running

Backend runs on port 3001 (internal), frontend on port 5000 (user-facing).
API requests are proxied from frontend to backend via Next.js rewrites.
