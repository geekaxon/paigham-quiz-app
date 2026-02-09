import { Router, Request, Response } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import Quiz from "./quiz.model";
import QuizType from "./quizType.model";

const router = Router();

router.get("/types", authMiddleware, async (_req: Request, res: Response) => {
  const types = await QuizType.find().sort({ createdAt: -1 });
  res.json({ success: true, data: types, message: "Quiz types retrieved successfully" });
});

router.post("/types", authMiddleware, async (req: Request, res: Response) => {
  const quizType = await QuizType.create(req.body);
  res.status(201).json({ success: true, data: quizType, message: "Quiz type created successfully" });
});

router.get("/", authMiddleware, async (_req: Request, res: Response) => {
  const quizzes = await Quiz.find().sort({ startDate: -1 }).populate("paighamId quizTypeId");
  res.json({ success: true, data: quizzes, message: "Quizzes retrieved successfully" });
});

router.get("/active", async (_req: Request, res: Response) => {
  const now = new Date();
  const quizzes = await Quiz.find({
    startDate: { $lte: now },
    endDate: { $gte: now },
  }).sort({ startDate: -1 }).populate("paighamId quizTypeId");
  res.json({ success: true, data: quizzes, message: "Active quizzes retrieved successfully" });
});

router.get("/:id", async (req: Request, res: Response) => {
  const quiz = await Quiz.findById(req.params.id).populate("paighamId quizTypeId");

  if (!quiz) {
    res.status(404).json({ success: false, data: null, message: "Quiz not found" });
    return;
  }

  res.json({ success: true, data: quiz, message: "Quiz retrieved successfully" });
});

router.post("/", authMiddleware, async (req: Request, res: Response) => {
  const quiz = await Quiz.create(req.body);
  res.status(201).json({ success: true, data: quiz, message: "Quiz created successfully" });
});

router.put("/:id", authMiddleware, async (req: Request, res: Response) => {
  const quiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, { new: true });

  if (!quiz) {
    res.status(404).json({ success: false, data: null, message: "Quiz not found" });
    return;
  }

  res.json({ success: true, data: quiz, message: "Quiz updated successfully" });
});

router.delete("/:id", authMiddleware, async (req: Request, res: Response) => {
  const quiz = await Quiz.findByIdAndDelete(req.params.id);

  if (!quiz) {
    res.status(404).json({ success: false, data: null, message: "Quiz not found" });
    return;
  }

  res.json({ success: true, data: null, message: "Quiz deleted successfully" });
});

export default router;
