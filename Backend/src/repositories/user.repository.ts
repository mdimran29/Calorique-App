// src/repositories/user.repository.ts
import { User, IUser } from '../models/User.model';
import { FilterQuery, Types } from 'mongoose';

export const userRepository = {
  async findById(id: string | Types.ObjectId): Promise<IUser | null> {
    return User.findById(id).lean() as Promise<IUser | null>;
  },

  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email: email.toLowerCase() }).lean() as Promise<IUser | null>;
  },

  async findByFirebaseUid(firebaseUid: string): Promise<IUser | null> {
    return User.findOne({ firebaseUid }).lean() as Promise<IUser | null>;
  },

  async create(data: Partial<IUser>): Promise<IUser> {
    const user = new User(data);
    return user.save();
  },

  async updateById(id: string | Types.ObjectId, data: Partial<IUser>): Promise<IUser | null> {
    return User.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).lean() as Promise<IUser | null>;
  },

  async existsByEmail(email: string): Promise<boolean> {
    return !!(await User.exists({ email: email.toLowerCase() }));
  },

  async findMany(filter: FilterQuery<IUser> = {}) {
    return User.find(filter).lean();
  },
};
