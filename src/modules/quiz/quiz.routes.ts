import { Router, Request, Response } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import Quiz from "./quiz.model";
import QuizType from "./quizType.model";
import Submission from "../submission/submission.model";

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

  const quizObj = quiz.toObject();
  quizObj.questions = quizObj.questions.map((q: Record<string, unknown>) => {
    const stripped = { ...q };
    delete stripped.answer;
    delete stripped.correctAnswer;
    delete stripped.answers;
    return stripped;
  });

  res.json({ success: true, data: quizObj, message: "Quiz retrieved successfully" });
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

router.put("/:id/winners", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { winners, showWinners } = req.body;
    const update: Record<string, unknown> = {};
    if (winners !== undefined) update.winners = winners;
    if (showWinners !== undefined) update.showWinners = showWinners;

    const quiz = await Quiz.findByIdAndUpdate(req.params.id, { $set: update }, { new: true });

    if (!quiz) {
      res.status(404).json({ success: false, data: null, message: "Quiz not found" });
      return;
    }

    if (winners !== undefined) {
      await Submission.updateMany(
        { quizId: req.params.id, _id: { $in: winners } },
        { $set: { isWinner: true } }
      );
      await Submission.updateMany(
        { quizId: req.params.id, _id: { $nin: winners } },
        { $set: { isWinner: false } }
      );
    }

    res.json({ success: true, data: quiz, message: "Winners updated successfully" });
  } catch {
    res.status(500).json({ success: false, data: null, message: "Failed to update winners" });
  }
});

router.get("/:id/winners", async (req: Request, res: Response) => {
  try {
    const quiz = await Quiz.findById(req.params.id).populate({
      path: "winners",
      select: "memberOmjCard memberSnapshot submittedAt",
    });

    if (!quiz) {
      res.status(404).json({ success: false, data: null, message: "Quiz not found" });
      return;
    }

    if (!quiz.showWinners) {
      res.json({ success: true, data: [], message: "Winners not yet announced" });
      return;
    }

    res.json({ success: true, data: quiz.winners, message: "Winners retrieved successfully" });
  } catch {
    res.status(500).json({ success: false, data: null, message: "Failed to get winners" });
  }
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
