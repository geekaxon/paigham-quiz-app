import express, { Request, Response, NextFunction } from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

export default app;
