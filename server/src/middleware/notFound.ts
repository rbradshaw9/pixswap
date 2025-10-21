import { Request, Response } from 'express';
import { IApiResponse } from '@/types';

export const notFound = (req: Request, res: Response): void => {
  const response: IApiResponse = {
    success: false,
    message: `Not Found - ${req.originalUrl}`,
    timestamp: new Date(),
  };

  res.status(404).json(response);
};