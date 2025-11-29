import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { sendError } from '../utils';

/**
 * Validation middleware factory
 * Creates a middleware function that validates request body against a Zod schema
 */
export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error: any) {
      const errors = error.errors?.map((err: any) => err.message).join(', ');
      sendError(res, errors || 'Validation failed', 400, 'VALIDATION_ERROR');
    }
  };
};
