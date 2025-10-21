import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { IApiResponse } from '@/types';

export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const response: IApiResponse = {
      success: false,
      message: 'Validation failed',
      error: errors.array().map(err => err.msg).join(', '),
      timestamp: new Date(),
    };
    
    res.status(400).json(response);
    return;
  }
  
  next();
};