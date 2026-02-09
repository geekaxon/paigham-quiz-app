import mongoose, { Schema, Document } from "mongoose";

export interface IQuizType extends Document {
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const quizTypeSchema = new Schema<IQuizType>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
  },
  { timestamps: true }
);

const QuizType = mongoose.model<IQuizType>("QuizType", quizTypeSchema);

export default QuizType;
