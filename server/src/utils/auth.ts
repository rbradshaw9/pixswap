import jwt, { SignOptions } from 'jsonwebtoken';
import { Response } from 'express';
import { IJwtPayload, IUser } from '@/types';

export const generateToken = (userId: string, username: string): string => {
  const payload: IJwtPayload = {
    userId,
    username,
  };

  const secret = process.env.JWT_SECRET || 'default-secret-key-change-in-production';
  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as string,
  };

  return jwt.sign(payload, secret, options);
};

export const setTokenCookie = (res: Response, token: string): void => {
  const options = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
  };

  res.cookie('token', token, options);
};

export const clearTokenCookie = (res: Response): void => {
  res.cookie('token', '', {
    expires: new Date(0),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
  });
};

export const sanitizeUser = (user: IUser) => {
  const userObj = user.toObject();
  delete userObj.password;
  delete userObj.__v;
  return userObj;
};