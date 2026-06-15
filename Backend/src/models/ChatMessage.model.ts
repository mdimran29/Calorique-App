// src/models/ChatMessage.model.ts
import { Schema, model, Document, Types } from 'mongoose';

export interface IChatMessage extends Document {
  userId: Types.ObjectId;
  role: 'user' | 'assistant';
  content: string;
  conversationId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    conversationId: { type: String },
  },
  { timestamps: true }
);

ChatMessageSchema.index({ userId: 1, createdAt: 1 });
ChatMessageSchema.index({ userId: 1, conversationId: 1, createdAt: 1 });

export const ChatMessage = model<IChatMessage>('ChatMessage', ChatMessageSchema);
