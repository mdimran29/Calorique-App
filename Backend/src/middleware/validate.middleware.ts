// src/middleware/validate.middleware.ts — Request validation runner
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

export function validate(req: Request, res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      error: {
        code:    'VALIDATION_ERROR',
        message: 'Validation failed',
        details: errors.array().map(e => ({ field: e.type === 'field' ? (e as any).path : '', message: e.msg })),
      },
    });
    return;
  }
  next();
}
