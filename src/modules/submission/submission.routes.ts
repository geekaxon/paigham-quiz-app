import { Router, Request, Response } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { submitQuiz } from "./submission.service";
import Submission from "./submission.model";
import Quiz from "../quiz/quiz.model";
import { textSimilarity } from "../../utils/similarity";

const router = Router();

const populateQuiz = {
  path: "quizId",
  select: "title paighamId questions",
  populate: { path: "paighamId", select: "title" },
};

function computeSimilarityScores(
  submissionAnswers: Record<string, unknown>[],
  quizQuestions: Record<string, unknown>[]
): { questionIndex: number; similarity: number; expectedAnswer: string; userAnswer: string }[] {
  return submissionAnswers.map((sa) => {
    const qIdx = (sa.questionIndex as number) ?? 0;
    const question = quizQuestions[qIdx];
    if (!question) return { questionIndex: qIdx, similarity: 0, expectedAnswer: "", userAnswer: String(sa.answer || "") };

    const qType = question.type as string;
    let expectedAnswer = "";
    const userAnswer = sa.answer;

    if (qType === "multiple_choice") {
      const correctIdx = question.correctAnswer as number;
      const options = question.options as string[];
      expectedAnswer = options?.[correctIdx] || "";
      const userIdx = userAnswer as unknown as number;
      const userStr = typeof userIdx === "number" && options ? (options[userIdx] || "") : String(userAnswer || "");
      return {
        questionIndex: qIdx,
        similarity: typeof userIdx === "number" && userIdx === correctIdx ? 100 : textSimilarity(userStr, expectedAnswer),
        expectedAnswer,
        userAnswer: userStr,
      };
    } else if (qType === "word_search" && Array.isArray(question.answers)) {
      const expectedAnswers = question.answers as string[];
      const userAnswers = Array.isArray(userAnswer) ? userAnswer as string[] : [String(userAnswer || "")];
      let totalSim = 0;
      const count = Math.max(expectedAnswers.length, 1);
      for (let i = 0; i < expectedAnswers.length; i++) {
        totalSim += textSimilarity(userAnswers[i] || "", expectedAnswers[i] || "");
      }
      return {
        questionIndex: qIdx,
        similarity: Math.round(totalSim / count),
        expectedAnswer: expectedAnswers.join(", "),
        userAnswer: userAnswers.join(", "),
      };
    } else {
      expectedAnswer = String(question.answer || "");
      return {
        questionIndex: qIdx,
        similarity: textSimilarity(String(userAnswer || ""), expectedAnswer),
        expectedAnswer,
        userAnswer: String(userAnswer || ""),
      };
    }
  });
}

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

  const results = await Promise.all(
    submissions.map(async (s) => {
      const sObj = s.toObject();
      const quizDoc = typeof s.quizId === "object" && s.quizId ? s.quizId : null;
      const quizQuestions = (quizDoc as unknown as { questions?: Record<string, unknown>[] })?.questions || [];
      if (quizQuestions.length > 0) {
        (sObj as unknown as Record<string, unknown>).similarityScores = computeSimilarityScores(sObj.answers, quizQuestions);
      }
      return sObj;
    })
  );

  res.json({ success: true, data: results, message: "Submissions retrieved successfully" });
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

  const sObj = submission.toObject();
  const quizDoc = typeof submission.quizId === "object" && submission.quizId ? submission.quizId : null;
  const quizQuestions = (quizDoc as unknown as { questions?: Record<string, unknown>[] })?.questions || [];
  if (quizQuestions.length > 0) {
    (sObj as unknown as Record<string, unknown>).similarityScores = computeSimilarityScores(sObj.answers, quizQuestions);
  }

  res.json({ success: true, data: sObj, message: "Submission retrieved successfully" });
});

router.put("/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { memberOmjCard, answers } = req.body;
    const update: Record<string, unknown> = {};
    if (memberOmjCard !== undefined) update.memberOmjCard = memberOmjCard;
    if (answers !== undefined) update.answers = answers;

    const submission = await Submission.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true }
    ).populate(populateQuiz);

    if (!submission) {
      res.status(404).json({ success: false, data: null, message: "Submission not found" });
      return;
    }

    res.json({ success: true, data: submission, message: "Submission updated successfully" });
  } catch {
    res.status(500).json({ success: false, data: null, message: "Failed to update submission" });
  }
});

router.delete("/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const submission = await Submission.findByIdAndDelete(req.params.id);

    if (!submission) {
      res.status(404).json({ success: false, data: null, message: "Submission not found" });
      return;
    }

    res.json({ success: true, data: null, message: "Submission deleted successfully" });
  } catch {
    res.status(500).json({ success: false, data: null, message: "Failed to delete submission" });
  }
});

export default router;
