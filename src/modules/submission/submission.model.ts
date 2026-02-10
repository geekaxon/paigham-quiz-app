import mongoose, { Schema, Document, Types } from "mongoose";

export interface ISubmission extends Document {
  quizId: Types.ObjectId;
  memberOmjCard: string;
  memberSnapshot: Record<string, unknown>;
  answers: Record<string, unknown>[];
  submittedAt: Date;
  isWinner: boolean;
}

const submissionSchema = new Schema<ISubmission>({
  quizId: { type: Schema.Types.ObjectId, ref: "Quiz", required: true },
  memberOmjCard: { type: String, required: true },
  memberSnapshot: { type: Schema.Types.Mixed, required: true },
  answers: { type: [{ type: Schema.Types.Mixed }], required: true },
  submittedAt: { type: Date, default: Date.now, required: true },
  isWinner: { type: Boolean, default: false },
});

submissionSchema.index({ quizId: 1, memberOmjCard: 1 }, { unique: true });

const Submission = mongoose.model<ISubmission>("Submission", submissionSchema);

export default Submission;
