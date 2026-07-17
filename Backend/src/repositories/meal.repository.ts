// src/repositories/meal.repository.ts
import { Meal, IMeal } from '../models/Meal.model';
import { Types } from 'mongoose';

export const mealRepository = {
  async findByUserAndDate(userId: string | Types.ObjectId, date: string): Promise<IMeal | null> {
    return Meal.findOne({ userId, date }).lean() as Promise<IMeal | null>;
  },

  async findByUserId(
    userId: string | Types.ObjectId,
    page = 1,
    limit = 10
  ): Promise<{ meals: IMeal[]; total: number }> {
    const skip = (page - 1) * limit;
    const [meals, total] = await Promise.all([
      Meal.find({ userId }).sort({ date: -1 }).skip(skip).limit(limit).lean(),
      Meal.countDocuments({ userId }),
    ]);
    return { meals: meals as unknown as IMeal[], total };
  },

  async findByDateRange(
    userId: string | Types.ObjectId,
    startDate: string,
    endDate: string
  ): Promise<IMeal[]> {
    return Meal.find({ userId, date: { $gte: startDate, $lte: endDate } })
      .sort({ date: -1 })
      .lean() as unknown as Promise<IMeal[]>;
  },

  async upsertByDate(userId: string | Types.ObjectId, date: string, updateData: Partial<IMeal>): Promise<IMeal> {
    return Meal.findOneAndUpdate(
      { userId, date },
      { $set: updateData },
      { new: true, upsert: true, runValidators: true }
    ) as Promise<IMeal>;
  },

  async findById(id: string | Types.ObjectId): Promise<IMeal | null> {
    return Meal.findById(id).lean() as Promise<IMeal | null>;
  },

  async deleteById(id: string | Types.ObjectId): Promise<void> {
    await Meal.findByIdAndDelete(id);
  },

  async setWaterGlasses(userId: string | Types.ObjectId, date: string, glasses: number): Promise<IMeal> {
    return Meal.findOneAndUpdate(
      { userId, date },
      { $set: { waterGlasses: glasses } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ) as Promise<IMeal>;
  },
};
