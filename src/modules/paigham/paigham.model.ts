import mongoose, { Schema, Document } from "mongoose";

export interface IPaigham extends Document {
  title: string;
  description: string;
  pdfUrl: string;
  publicationDate: Date;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const paighamSchema = new Schema<IPaigham>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    pdfUrl: { type: String, required: true },
    publicationDate: { type: Date, required: true },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

paighamSchema.index({ publicationDate: -1 });

const Paigham = mongoose.model<IPaigham>("Paigham", paighamSchema);

export default Paigham;
