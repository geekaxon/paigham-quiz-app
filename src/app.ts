import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import adminRoutes from "./modules/admin/admin.routes";
import paighamRoutes from "./modules/paigham/paigham.routes";
import quizRoutes from "./modules/quiz/quiz.routes";
import submissionRoutes from "./modules/submission/submission.routes";
import statsRoutes from "./modules/stats/stats.routes";
import uploadRoutes from "./modules/upload/upload.routes";
import path from "path";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api/admin", adminRoutes);
app.use("/api/paigham", paighamRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/submission", submissionRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/upload", uploadRoutes);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ success: false, data: null, message: "Internal Server Error" });
});

export default app;
