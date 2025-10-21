import { Router } from 'express';
import { protect } from '@/middleware/auth';
import { requireAdmin } from '@/middleware/admin';
import { Content } from '@/models/Content';
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  toggleUserBlock,
  getAdminStats,
} from '@/controllers/adminController';

const router = Router();

// All admin routes require authentication and admin role
router.use(protect, requireAdmin);

// Admin stats
router.get('/stats', getAdminStats);

// Media library - get all content
router.get('/media', async (req: any, res: any) => {
  try {
    console.log('📚 Admin media library request:', {
      query: req.query,
      user: req.user?.username,
      isAdmin: req.user?.isAdmin,
    });

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    
    const query: any = {};
    
    // Filter by NSFW if specified
    if (req.query.isNSFW !== undefined) {
      query.isNSFW = req.query.isNSFW === 'true';
    }
    
    // Filter by mediaType if specified
    if (req.query.mediaType) {
      query.mediaType = req.query.mediaType;
    }
    
    // Search by username or caption
    if (req.query.search) {
      query.$or = [
        { username: { $regex: req.query.search, $options: 'i' } },
        { caption: { $regex: req.query.search, $options: 'i' } },
      ];
    }
    
    console.log('📚 Media query:', query);
    
    const [contents, total] = await Promise.all([
      Content.find(query)
        .sort({ uploadedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Content.countDocuments(query),
    ]);
    
    console.log('📚 Media results:', {
      found: contents.length,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
    
    res.json({
      success: true,
      data: {
        contents,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('❌ Failed to fetch media:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch media library',
    });
  }
});

// Delete content
router.delete('/media/:contentId', async (req: any, res: any) => {
  try {
    const content = await Content.findByIdAndDelete(req.params.contentId);
    
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found',
      });
    }
    
    res.json({
      success: true,
      message: 'Content deleted successfully',
    });
  } catch (error: any) {
    console.error('Failed to delete content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete content',
    });
  }
});

// Toggle NSFW flag
router.patch('/media/:contentId/nsfw', async (req: any, res: any) => {
  try {
    const content = await Content.findById(req.params.contentId);
    
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found',
      });
    }
    
    content.isNSFW = !content.isNSFW;
    await content.save();
    
    res.json({
      success: true,
      message: `Content marked as ${content.isNSFW ? 'NSFW' : 'SFW'}`,
      data: content,
    });
  } catch (error: any) {
    console.error('Failed to update content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update content',
    });
  }
});

// User management
router.get('/users', getAllUsers);
router.get('/users/:userId', getUserById);
router.put('/users/:userId', updateUser);
router.delete('/users/:userId', deleteUser);
router.post('/users/:userId/toggle-block', toggleUserBlock);

export default router;
