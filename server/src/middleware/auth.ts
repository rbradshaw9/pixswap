import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '@/models';
import { IJwtPayload, IApiResponse } from '@/types';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Check for token in cookies
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      const response: IApiResponse = {
        success: false,
        message: 'Access denied. No token provided.',
        timestamp: new Date(),
      };
      res.status(401).json(response);
      return;
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as IJwtPayload;
      
      // Get user from database
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        const response: IApiResponse = {
          success: false,
          message: 'User not found',
          timestamp: new Date(),
        };
        res.status(401).json(response);
        return;
      }

      if (!user.isActive) {
        const response: IApiResponse = {
          success: false,
          message: 'Account is deactivated',
          timestamp: new Date(),
        };
        res.status(401).json(response);
        return;
      }

      // Update last seen
      user.lastSeen = new Date();
      await user.save();

      // Add user to request object
      req.user = user;
      next();
    } catch (error) {
      const response: IApiResponse = {
        success: false,
        message: 'Invalid token',
        timestamp: new Date(),
      };
      res.status(401).json(response);
      return;
    }
  } catch (error) {
    const response: IApiResponse = {
      success: false,
      message: 'Invalid token',
      timestamp: new Date(),
    };
    res.status(401).json(response);
  }
};

// Optional auth - doesn't fail if no token, just attaches user if present
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Check for token in cookies
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (token) {
      try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as IJwtPayload;
        
        // Get user from database
        const user = await User.findById(decoded.userId).select('-password');
        
        if (user && user.isActive) {
          user.lastSeen = new Date();
          await user.save();
          req.user = user;
        }
      } catch (err) {
        // Token invalid, but don't fail - just continue without user
        console.log('Optional auth: invalid token');
      }
    }

    next();
  } catch (error) {
    // Don't fail, just continue without user
    next();
  }
};

// Admin only middleware
export const adminOnly = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user || req.user.email !== process.env.ADMIN_EMAIL) {
    const response: IApiResponse = {
      success: false,
      message: 'Access denied. Admin privileges required.',
      timestamp: new Date(),
    };
    res.status(403).json(response);
    return;
  }
  next();
};