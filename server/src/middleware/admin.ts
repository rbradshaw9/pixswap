import { Request, Response, NextFunction } from 'express';
import { IApiResponse } from '@/types';

/**
 * Admin middleware - verifies user is an admin
 * Must be used after protect middleware
 */
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    const response: IApiResponse = {
      success: false,
      message: 'Authentication required',
      timestamp: new Date(),
    };
    res.status(401).json(response);
    return;
  }

  if (!req.user.isAdmin) {
    const response: IApiResponse = {
      success: false,
      message: 'Admin access required',
      timestamp: new Date(),
    };
    res.status(403).json(response);
    return;
  }

  next();
};
