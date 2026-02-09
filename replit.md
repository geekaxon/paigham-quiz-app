# Project Overview

Node.js backend using TypeScript and Express.

## Project Architecture

- `src/app.ts` - Express app setup (CORS, JSON parsing, error handler). Exports app instance.
- `src/server.ts` - Entry point. Connects to MongoDB via Mongoose, then starts server on PORT (env var, default 5000).
- `tsconfig.json` - TypeScript config targeting ES2020 with commonjs modules.

## Tech Stack

- Node.js 20
- TypeScript
- Express
- cors
- Mongoose (MongoDB)

## Environment Variables

- `PORT` - Server port (default: 5000)
- `MONGO_URI` - MongoDB connection string (required, stored as secret)

## Running

```
npx ts-node src/server.ts
```
