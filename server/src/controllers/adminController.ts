import { Request, Response } from 'express';
import { User } from '@/models';
import { IApiResponse } from '@/types';

/**
 * Get all users with pagination
 */
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string || '';
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query),
    ]);

    const response: IApiResponse = {
      success: true,
      message: 'Users retrieved successfully',
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
      timestamp: new Date(),
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error('Get all users error:', error);
    const response: IApiResponse = {
      success: false,
      message: error.message || 'Failed to retrieve users',
      timestamp: new Date(),
    };
    res.status(500).json(response);
  }
};

/**
 * Get single user by ID
 */
export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('-password');

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
      message: 'User retrieved successfully',
      data: user,
      timestamp: new Date(),
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error('Get user by ID error:', error);
    const response: IApiResponse = {
      success: false,
      message: error.message || 'Failed to retrieve user',
      timestamp: new Date(),
    };
    res.status(500).json(response);
  }
};

/**
 * Update user
 */
export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { username, email, bio, interests, isActive, isVerified, isAdmin } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      const response: IApiResponse = {
        success: false,
        message: 'User not found',
        timestamp: new Date(),
      };
      res.status(404).json(response);
      return;
    }

    // Update fields if provided
    if (username !== undefined) user.username = username;
    if (email !== undefined) user.email = email;
    if (bio !== undefined) user.bio = bio;
    if (interests !== undefined) user.interests = interests;
    if (isActive !== undefined) user.isActive = isActive;
    if (isVerified !== undefined) user.isVerified = isVerified;
    if (isAdmin !== undefined) user.isAdmin = isAdmin;

    await user.save();

    const response: IApiResponse = {
      success: true,
      message: 'User updated successfully',
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        bio: user.bio,
        interests: user.interests,
        isActive: user.isActive,
        isVerified: user.isVerified,
        isAdmin: user.isAdmin,
      },
      timestamp: new Date(),
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error('Update user error:', error);
    const response: IApiResponse = {
      success: false,
      message: error.message || 'Failed to update user',
      timestamp: new Date(),
    };
    res.status(500).json(response);
  }
};

/**
 * Delete user
 */
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    // Prevent admin from deleting themselves
    if (req.user && req.user._id.toString() === userId) {
      const response: IApiResponse = {
        success: false,
        message: 'Cannot delete your own account',
        timestamp: new Date(),
      };
      res.status(400).json(response);
      return;
    }

    const user = await User.findByIdAndDelete(userId);

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
      message: 'User deleted successfully',
      timestamp: new Date(),
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error('Delete user error:', error);
    const response: IApiResponse = {
      success: false,
      message: error.message || 'Failed to delete user',
      timestamp: new Date(),
    };
    res.status(500).json(response);
  }
};

/**
 * Block/unblock user
 */
export const toggleUserBlock = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      const response: IApiResponse = {
        success: false,
        message: 'User not found',
        timestamp: new Date(),
      };
      res.status(404).json(response);
      return;
    }

    // Toggle active status
    user.isActive = !user.isActive;
    await user.save();

    const response: IApiResponse = {
      success: true,
      message: `User ${user.isActive ? 'unblocked' : 'blocked'} successfully`,
      data: {
        userId: user._id,
        isActive: user.isActive,
      },
      timestamp: new Date(),
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error('Toggle user block error:', error);
    const response: IApiResponse = {
      success: false,
      message: error.message || 'Failed to toggle user block',
      timestamp: new Date(),
    };
    res.status(500).json(response);
  }
};

/**
 * Get admin stats
 */
export const getAdminStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const [
      totalUsers,
      activeUsers,
      blockedUsers,
      verifiedUsers,
      adminUsers,
      recentUsers,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: false }),
      User.countDocuments({ isVerified: true }),
      User.countDocuments({ isAdmin: true }),
      User.find()
        .select('-password')
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    const response: IApiResponse = {
      success: true,
      message: 'Admin stats retrieved successfully',
      data: {
        stats: {
          totalUsers,
          activeUsers,
          blockedUsers,
          verifiedUsers,
          adminUsers,
        },
        recentUsers,
      },
      timestamp: new Date(),
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error('Get admin stats error:', error);
    const response: IApiResponse = {
      success: false,
      message: error.message || 'Failed to retrieve admin stats',
      timestamp: new Date(),
    };
    res.status(500).json(response);
  }
};
