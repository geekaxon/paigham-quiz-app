import { Router, Request, Response } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { submitQuiz } from "./submission.service";
import Submission from "./submission.model";

const router = Router();

const populateQuiz = {
  path: "quizId",
  select: "title paighamId",
  populate: { path: "paighamId", select: "title" },
};

router.post("/", async (req: Request, res: Response) => {
  const { quizId, omjCard, answers } = req.body;

  if (!quizId || !omjCard || !answers) {
    res.status(400).json({ success: false, data: null, message: "quizId, omjCard, and answers are required" });
    return;
  }

  try {
    const submission = await submitQuiz(quizId, omjCard, answers);
    res.status(201).json({ success: true, data: submission, message: "Quiz submitted successfully" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Submission failed";
    res.status(400).json({ success: false, data: null, message });
  }
});

router.get("/", authMiddleware, async (req: Request, res: Response) => {
  const filter: Record<string, unknown> = {};
  if (req.query.quizId) filter.quizId = req.query.quizId;

  const submissions = await Submission.find(filter)
    .sort({ submittedAt: -1 })
    .populate(populateQuiz);
  res.json({ success: true, data: submissions, message: "Submissions retrieved successfully" });
});

router.get("/quiz/:quizId", authMiddleware, async (req: Request, res: Response) => {
  const submissions = await Submission.find({ quizId: req.params.quizId })
    .sort({ submittedAt: -1 })
    .populate(populateQuiz);
  res.json({ success: true, data: submissions, message: "Submissions retrieved successfully" });
});

router.get("/:id", authMiddleware, async (req: Request, res: Response) => {
  const submission = await Submission.findById(req.params.id).populate(populateQuiz);

  if (!submission) {
    res.status(404).json({ success: false, data: null, message: "Submission not found" });
    return;
  }

  res.json({ success: true, data: submission, message: "Submission retrieved successfully" });
});

export default router;
