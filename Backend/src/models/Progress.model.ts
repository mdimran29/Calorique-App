// src/models/Progress.model.ts
import { Schema, model, Document, Types } from 'mongoose';

export interface IWeightEntry {
  _id: Types.ObjectId;
  weight: number;
  date: string;
  notes?: string;
}

export interface IProgress extends Document {
  userId: Types.ObjectId;
  weightHistory: IWeightEntry[];
  calorieHistory: { date: string; calories: number }[];
  waterHistory: { date: string; liters: number }[];
  createdAt: Date;
  updatedAt: Date;
}

const ProgressSchema = new Schema<IProgress>(
  {
    userId:          { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    weightHistory:   [{ weight: Number, date: String, notes: String }],
    calorieHistory:  [{ date: String, calories: Number, _id: false }],
    waterHistory:    [{ date: String, liters: Number, _id: false }],
  },
  { timestamps: true }
);

export const Progress = model<IProgress>('Progress', ProgressSchema);
