import { Router, Request, Response } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import Paigham from "../paigham/paigham.model";
import Quiz from "../quiz/quiz.model";
import Submission from "../submission/submission.model";

const router = Router();

router.get("/", authMiddleware, async (_req: Request, res: Response) => {
  const [paighamCount, quizCount, submissionCount] = await Promise.all([
    Paigham.countDocuments({ isArchived: false }),
    Quiz.countDocuments(),
    Submission.countDocuments(),
  ]);

  res.json({
    success: true,
    data: { paighamCount, quizCount, submissionCount },
    message: "Stats retrieved successfully",
  });
});

export default router;
