# Project Overview

Node.js backend using TypeScript and Express.

## Project Architecture

- `src/app.ts` - Express app setup (CORS, JSON parsing, error handler). Exports app instance.
- `src/server.ts` - Entry point, starts server on port 5000.
- `tsconfig.json` - TypeScript config targeting ES2020 with commonjs modules.

## Tech Stack

- Node.js 20
- TypeScript
- Express
- cors

## Running

```
npx ts-node src/server.ts
```
