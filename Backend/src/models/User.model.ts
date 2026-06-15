// src/models/User.model.ts
import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  firebaseUid: string;
  name: string;
  email: string;
  avatar?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  height?: number;
  weight?: number;
  goal?: 'muscle_gain' | 'fat_loss' | 'maintain' | 'lean_bulk';
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  foodPreference?: 'veg' | 'non_veg' | 'vegan' | 'eggetarian';
  allergies: string[];
  targetWeight?: number;
  budget: 'low' | 'medium' | 'high';
  profileComplete: boolean;
  isPremium: boolean;
  fcmToken?: string;
  streak: number;
  lastActiveDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    firebaseUid:    { type: String, required: true, unique: true, index: true },
    name:           { type: String, required: true, minlength: 2, maxlength: 50 },
    email:          { type: String, required: true, unique: true, lowercase: true },
    avatar:         { type: String, default: null },
    age:            { type: Number, min: 13, max: 120 },
    gender:         { type: String, enum: ['male', 'female', 'other'] },
    height:         { type: Number },
    weight:         { type: Number },
    goal:           { type: String, enum: ['muscle_gain', 'fat_loss', 'maintain', 'lean_bulk'] },
    activityLevel:  { type: String, enum: ['sedentary', 'light', 'moderate', 'active', 'very_active'] },
    foodPreference: { type: String, enum: ['veg', 'non_veg', 'vegan', 'eggetarian'] },
    allergies:      { type: [String], default: [] },
    targetWeight:   { type: Number },
    budget:         { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    profileComplete:{ type: Boolean, default: false },
    isPremium:      { type: Boolean, default: false },
    fcmToken:       { type: String },
    streak:         { type: Number, default: 0 },
    lastActiveDate: { type: Date },
  },
  { timestamps: true }
);



export const User = model<IUser>('User', UserSchema);
