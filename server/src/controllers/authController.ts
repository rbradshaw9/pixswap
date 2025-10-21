import { Request, Response } from 'express';
import { User } from '@/models';
import { generateToken, setTokenCookie, clearTokenCookie, sanitizeUser } from '@/utils/auth';
import { IApiResponse, IAuthResponse, ISignupRequest, ILoginRequest } from '@/types';

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password, bio, interests }: ISignupRequest = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      const response: IApiResponse = {
        success: false,
        message: existingUser.email === email 
          ? 'User with this email already exists'
          : 'Username is already taken',
        timestamp: new Date(),
      };
      res.status(400).json(response);
      return;
    }

    // Create new user
    const user = await User.create({
      username,
      email,
      password,
      bio: bio || '',
      interests: interests || [],
    });

    // Generate token
    const token = generateToken(user._id.toString(), user.username);

    // Set cookie
    setTokenCookie(res, token);

    const authResponse: IAuthResponse = {
      user: sanitizeUser(user),
      token,
    };

    const response: IApiResponse<IAuthResponse> = {
      success: true,
      message: 'User registered successfully',
      data: authResponse,
      timestamp: new Date(),
    };

    res.status(201).json(response);
  } catch (error) {
    const response: IApiResponse = {
      success: false,
      message: 'Error creating user',
      timestamp: new Date(),
    };
    res.status(500).json(response);
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password }: ILoginRequest = req.body;

    // Validate input
    if (!email || !password) {
      const response: IApiResponse = {
        success: false,
        message: 'Please provide email and password',
        timestamp: new Date(),
      };
      res.status(400).json(response);
      return;
    }

    // Find user and include password
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      const response: IApiResponse = {
        success: false,
        message: 'Invalid email or password',
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

    // Generate token
    const token = generateToken(user._id.toString(), user.username);

    // Set cookie
    setTokenCookie(res, token);

    const authResponse: IAuthResponse = {
      user: sanitizeUser(user),
      token,
    };

    const response: IApiResponse<IAuthResponse> = {
      success: true,
      message: 'Logged in successfully',
      data: authResponse,
      timestamp: new Date(),
    };

    res.status(200).json(response);
  } catch (error) {
    const response: IApiResponse = {
      success: false,
      message: 'Error during login',
      timestamp: new Date(),
    };
    res.status(500).json(response);
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    // Clear cookie
    clearTokenCookie(res);

    const response: IApiResponse = {
      success: true,
      message: 'Logged out successfully',
      timestamp: new Date(),
    };

    res.status(200).json(response);
  } catch (error) {
    const response: IApiResponse = {
      success: false,
      message: 'Error during logout',
      timestamp: new Date(),
    };
    res.status(500).json(response);
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      const response: IApiResponse = {
        success: false,
        message: 'User not found',
        timestamp: new Date(),
      };
      res.status(404).json(response);
      return;
    }

    const response: IApiResponse = {
      success: true,
      message: 'User profile retrieved successfully',
      data: sanitizeUser(user),
      timestamp: new Date(),
    };

    res.status(200).json(response);
  } catch (error) {
    const response: IApiResponse = {
      success: false,
      message: 'Error retrieving user profile',
      timestamp: new Date(),
    };
    res.status(500).json(response);
  }
};