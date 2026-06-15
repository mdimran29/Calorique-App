// src/middleware/auth.middleware.ts — JWT verification & user injection
import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/tokenUtils';
import { userRepository } from '../repositories/user.repository';
import { ApiError } from '../utils/ApiError';
import { sendError } from '../utils/ApiResponse';

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      sendError(res, 401, 'No authorization token provided', 'UNAUTHORIZED');
      return;
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);

    const user = await userRepository.findById(payload.userId);
    if (!user) {
      sendError(res, 401, 'User not found', 'UNAUTHORIZED');
      return;
    }

    (req as any).user = user;
    (req as any).userId = payload.userId;
    next();
  } catch (err) {
    if (err instanceof ApiError) {
      sendError(res, err.statusCode, err.message, err.code);
    } else {
      sendError(res, 401, 'Invalid token', 'UNAUTHORIZED');
    }
  }
}
