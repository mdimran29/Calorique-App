// src/models/Meal.model.ts
import { Schema, model, Document, Types } from 'mongoose';

export interface IFoodItem {
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber?: number;
  spoonacularId?: number;
}

export interface IMealEntry {
  _id?: Types.ObjectId;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foods: IFoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  loggedAt: Date;
}

export interface IMeal extends Document {
  userId: Types.ObjectId;
  date: string;
  meals: IMealEntry[];
  dailyTotals: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
  waterGlasses: number;
  createdAt: Date;
  updatedAt: Date;
}

const FoodItemSchema = new Schema<IFoodItem>(
  {
    name:          { type: String, required: true },
    quantity:      { type: Number, required: true },
    unit:          { type: String, required: true },
    calories:      { type: Number, required: true },
    protein:       { type: Number, required: true },
    carbs:         { type: Number, required: true },
    fats:          { type: Number, required: true },
    fiber:         { type: Number, default: 0 },
    spoonacularId: { type: Number },
  },
  { _id: false }
);

const MealEntrySchema = new Schema<IMealEntry>({
  type:          { type: String, enum: ['breakfast', 'lunch', 'dinner', 'snack'], required: true },
  foods:         { type: [FoodItemSchema], required: true },
  totalCalories: { type: Number, required: true },
  totalProtein:  { type: Number, required: true },
  totalCarbs:    { type: Number, required: true },
  totalFats:     { type: Number, required: true },
  loggedAt:      { type: Date, default: Date.now },
});

const MealSchema = new Schema<IMeal>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date:   { type: String, required: true },
    meals:  { type: [MealEntrySchema], default: [] },
    dailyTotals: {
      calories: { type: Number, default: 0 },
      protein:  { type: Number, default: 0 },
      carbs:    { type: Number, default: 0 },
      fats:     { type: Number, default: 0 },
    },
    waterGlasses: { type: Number, default: 0 },
  },
  { timestamps: true }
);

MealSchema.index({ userId: 1, date: -1 });

export const Meal = model<IMeal>('Meal', MealSchema);
