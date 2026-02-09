import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import adminRoutes from "./modules/admin/admin.routes";
import paighamRoutes from "./modules/paigham/paigham.routes";
import quizRoutes from "./modules/quiz/quiz.routes";
import submissionRoutes from "./modules/submission/submission.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/admin", adminRoutes);
app.use("/api/paigham", paighamRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/submission", submissionRoutes);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ success: false, data: null, message: "Internal Server Error" });
});

export default app;
