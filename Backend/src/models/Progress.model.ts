// src/models/Progress.model.ts
import { Schema, model, Document, Types } from 'mongoose';

export interface IProgress extends Document {
  userId: Types.ObjectId;
  weightHistory: { weight: number; date: string }[];
  calorieHistory: { date: string; calories: number }[];
  waterHistory: { date: string; liters: number }[];
  createdAt: Date;
  updatedAt: Date;
}

const ProgressSchema = new Schema<IProgress>(
  {
    userId:          { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    weightHistory:   [{ weight: Number, date: String, _id: false }],
    calorieHistory:  [{ date: String, calories: Number, _id: false }],
    waterHistory:    [{ date: String, liters: Number, _id: false }],
  },
  { timestamps: true }
);



export const Progress = model<IProgress>('Progress', ProgressSchema);
