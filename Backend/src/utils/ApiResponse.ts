// src/utils/ApiResponse.ts — Standardized response helper
import { Response } from 'express';

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export function sendSuccess(
  res: Response,
  data: object | null,
  message = 'Success',
  statusCode = 200,
  pagination?: PaginationMeta
): void {
  res.status(statusCode).json({
    success: true,
    message,
    data,
    ...(pagination && { pagination }),
  });
}

export function sendError(
  res: Response,
  statusCode: number,
  message: string,
  code = 'INTERNAL_ERROR',
  details?: object[]
): void {
  res.status(statusCode).json({
    success: false,
    error: { code, message, ...(details && { details }) },
  });
}
