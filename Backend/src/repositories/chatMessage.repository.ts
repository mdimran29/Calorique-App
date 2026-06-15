// src/repositories/chatMessage.repository.ts
import { ChatMessage, IChatMessage } from '../models/ChatMessage.model';
import { Types } from 'mongoose';

export const chatMessageRepository = {
  async findHistory(userId: string | Types.ObjectId, conversationId?: string): Promise<IChatMessage[]> {
    const query: any = { userId };
    if (conversationId) {
      query.conversationId = conversationId;
    }
    return ChatMessage.find(query).sort({ createdAt: 1 }).lean() as unknown as Promise<IChatMessage[]>;
  },

  async create(userId: string | Types.ObjectId, role: 'user' | 'assistant', content: string, conversationId?: string): Promise<IChatMessage> {
    const msg = new ChatMessage({
      userId,
      role,
      content,
      conversationId,
    });
    return msg.save();
  },
};
