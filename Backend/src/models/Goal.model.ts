// src/models/Goal.model.ts
import { Schema, model, Document, Types } from 'mongoose';

export interface IGoal extends Document {
  userId: Types.ObjectId;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFats: number;
  targetWeight?: number;
  targetWaterIntake: number;
  fitnessGoal?: 'muscle_gain' | 'fat_loss' | 'lean_bulk' | 'maintenance';
  createdAt: Date;
  updatedAt: Date;
}

const GoalSchema = new Schema<IGoal>(
  {
    userId:            { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    targetCalories:    { type: Number, required: true },
    targetProtein:     { type: Number, required: true },
    targetCarbs:       { type: Number, required: true },
    targetFats:        { type: Number, required: true },
    targetWeight:      { type: Number },
    targetWaterIntake: { type: Number, default: 3 },
    fitnessGoal:       { type: String, enum: ['muscle_gain', 'fat_loss', 'lean_bulk', 'maintenance'] },
  },
  { timestamps: true }
);




export const Goal = model<IGoal>('Goal', GoalSchema);
