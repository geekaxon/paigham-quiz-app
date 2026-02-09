import mongoose, { Schema, Document, Types } from "mongoose";

export interface IQuiz extends Document {
  paighamId: Types.ObjectId;
  quizTypeId: Types.ObjectId;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  resultPaighamId?: Types.ObjectId;
  questions: Record<string, unknown>[];
  createdAt: Date;
  updatedAt: Date;
}

const quizSchema = new Schema<IQuiz>(
  {
    paighamId: { type: Schema.Types.ObjectId, ref: "Paigham", required: true },
    quizTypeId: { type: Schema.Types.ObjectId, ref: "QuizType", required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    resultPaighamId: { type: Schema.Types.ObjectId, ref: "Paigham" },
    questions: { type: [{ type: Schema.Types.Mixed }], required: true },
  },
  { timestamps: true }
);

quizSchema.index({ paighamId: 1, startDate: -1 });

const Quiz = mongoose.model<IQuiz>("Quiz", quizSchema);

export default Quiz;
