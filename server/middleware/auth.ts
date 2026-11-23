import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import { env } from '../config/env.ts';

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export function apiSuccess<T>(res: Response, data: T, message = 'OK', statusCode = 200): Response {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

export function apiError(res: Response, message: string, statusCode = 400, errors?: unknown): Response {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors ? { errors } : {}),
  });
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    apiError(res, 'Authentication required. Please sign in.', 401);
    return;
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    apiError(res, 'Invalid authentication token.', 401);
    return;
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret) as { userId?: string };
    if (!decoded.userId) {
      apiError(res, 'Invalid token payload.', 401);
      return;
    }
    req.userId = decoded.userId;
    next();
  } catch {
    apiError(res, 'Session expired or invalid token. Please sign in again.', 401);
  }
}

export function validateRequest(req: Request, res: Response, next: NextFunction): void {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    apiError(res, 'Validation failed', 422, result.array());
    return;
  }
  next();
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error('[API Error]', err);
  if (err.name === 'ValidationError') {
    apiError(res, err.message, 400);
    return;
  }
  if (err.name === 'CastError') {
    apiError(res, 'Invalid resource identifier', 400);
    return;
  }
  apiError(res, 'Internal server error', 500);
}
