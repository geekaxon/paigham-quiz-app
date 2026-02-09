import Quiz from "../quiz/quiz.model";
import Submission from "./submission.model";
import { getMemberDetails } from "../member/member.service";

export const submitQuiz = async (
  quizId: string,
  omjCard: string,
  answers: Record<string, unknown>[]
) => {
  const quiz = await Quiz.findById(quizId);

  if (!quiz) {
    throw new Error("Quiz not found");
  }

  const now = new Date();

  if (now < quiz.startDate || now > quiz.endDate) {
    throw new Error("Quiz is not currently active");
  }

  const existingSubmission = await Submission.findOne({
    quizId,
    memberOmjCard: omjCard,
  });

  if (existingSubmission) {
    throw new Error("You have already submitted this quiz");
  }

  const member = await getMemberDetails(omjCard);

  if (!member) {
    throw new Error("Member not found");
  }

  const submission = await Submission.create({
    quizId,
    memberOmjCard: omjCard,
    memberSnapshot: { ...member },
    answers,
  });

  return submission;
};
