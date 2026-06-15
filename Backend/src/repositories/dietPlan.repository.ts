// src/repositories/dietPlan.repository.ts
import { DietPlan, IDietPlan } from '../models/DietPlan.model';
import { Types } from 'mongoose';

export const dietPlanRepository = {
  async findLatestByUserId(userId: string | Types.ObjectId): Promise<IDietPlan | null> {
    return DietPlan.findOne({ userId }).sort({ createdAt: -1 }).lean() as Promise<IDietPlan | null>;
  },

  async create(userId: string | Types.ObjectId, plan: object): Promise<IDietPlan> {
    const dietPlan = new DietPlan({ userId, plan });
    return dietPlan.save();
  },

  async findAllByUserId(userId: string | Types.ObjectId): Promise<IDietPlan[]> {
    return DietPlan.find({ userId }).sort({ createdAt: -1 }).lean() as unknown as Promise<IDietPlan[]>;
  },
};
