// src/repositories/progress.repository.ts
import { Progress, IProgress } from '../models/Progress.model';
import { Types } from 'mongoose';

export const progressRepository = {
  async findByUserId(userId: string | Types.ObjectId): Promise<IProgress | null> {
    return Progress.findOne({ userId }).lean() as Promise<IProgress | null>;
  },

  async upsert(userId: string | Types.ObjectId, data: Partial<IProgress>): Promise<IProgress> {
    return Progress.findOneAndUpdate(
      { userId },
      { $set: data },
      { new: true, upsert: true }
    ) as Promise<IProgress>;
  },

  async pushWeightEntry(
    userId: string | Types.ObjectId,
    entry: { weight: number; date: string; notes?: string }
  ): Promise<IProgress> {
    return Progress.findOneAndUpdate(
      { userId },
      { $push: { weightHistory: { $each: [entry], $sort: { date: -1 } } } },
      { new: true, upsert: true }
    ) as Promise<IProgress>;
  },

  async deleteWeightEntry(userId: string | Types.ObjectId, entryId: string): Promise<IProgress | null> {
    return Progress.findOneAndUpdate(
      { userId },
      { $pull: { weightHistory: { _id: entryId } } },
      { new: true }
    ) as Promise<IProgress | null>;
  },

  async pushCalorieEntry(userId: string | Types.ObjectId, entry: { date: string; calories: number }): Promise<IProgress> {
    // Replace any existing entry for the same date (calories are recomputed per meal edit)
    await Progress.updateOne({ userId }, { $pull: { calorieHistory: { date: entry.date } } }, { upsert: false });
    return Progress.findOneAndUpdate(
      { userId },
      { $push: { calorieHistory: { $each: [entry], $sort: { date: -1 } } } },
      { new: true, upsert: true }
    ) as Promise<IProgress>;
  },

  async pushWaterEntry(userId: string | Types.ObjectId, entry: { date: string; liters: number }): Promise<IProgress> {
    await Progress.updateOne({ userId }, { $pull: { waterHistory: { date: entry.date } } }, { upsert: false });
    return Progress.findOneAndUpdate(
      { userId },
      { $push: { waterHistory: { $each: [entry], $sort: { date: -1 } } } },
      { new: true, upsert: true }
    ) as Promise<IProgress>;
  },
};
