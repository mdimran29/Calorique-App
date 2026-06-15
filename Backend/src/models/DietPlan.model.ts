// src/models/DietPlan.model.ts
import { Schema, model, Document, Types } from 'mongoose';

export interface IDietPlan extends Document {
  userId: Types.ObjectId;
  plan: object;
  createdAt: Date;
  updatedAt: Date;
}

const DietPlanSchema = new Schema<IDietPlan>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    plan:   { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

DietPlanSchema.index({ userId: 1, createdAt: -1 });

export const DietPlan = model<IDietPlan>('DietPlan', DietPlanSchema);
