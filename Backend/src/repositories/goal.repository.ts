// src/repositories/goal.repository.ts
import { Goal, IGoal } from '../models/Goal.model';
import { Types } from 'mongoose';

export const goalRepository = {
  async findByUserId(userId: string | Types.ObjectId): Promise<IGoal | null> {
    return Goal.findOne({ userId }).lean() as Promise<IGoal | null>;
  },

  async upsert(userId: string | Types.ObjectId, data: Partial<IGoal>): Promise<IGoal> {
    return Goal.findOneAndUpdate(
      { userId },
      { $set: { ...data, userId } },
      { new: true, upsert: true, runValidators: true }
    ) as Promise<IGoal>;
  },

  async deleteByUserId(userId: string | Types.ObjectId): Promise<void> {
    await Goal.deleteOne({ userId });
  },
};
