import { Router } from 'express';
import { protect, optionalAuth } from '@/middleware/auth';
import { User, Content, SwapComment } from '@/models';

const router = Router();

// User profile routes
router.get('/profile/:username', optionalAuth, async (req: any, res: any) => {
  try {
    const { username } = req.params;
    const currentUserId = req.user?._id?.toString();

    // Find user by username
    const user = await User.findOne({ username }).select('username createdAt');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Get user's public content
    const content = await Content.find({
      userId: user._id.toString(),
      $or: [
        { expiresAt: { $gt: new Date() } },
        { savedForever: true },
        { expiresAt: null }
      ]
    })
    .sort({ uploadedAt: -1 })
    .limit(100)
    .lean();

    // Get like status for each content if user is authenticated
    let contentWithLikes = content;
    if (currentUserId) {
      contentWithLikes = await Promise.all(content.map(async (item) => {
        const liked = await SwapComment.exists({
          contentId: item._id.toString(),
          author: currentUserId,
          type: 'like',
        });
        
        const comments = await SwapComment.countDocuments({
          contentId: item._id.toString(),
          type: 'comment',
        });

        return {
          id: item._id.toString(),
          mediaUrl: item.mediaUrl,
          mediaType: item.mediaType,
          uploadedAt: item.uploadedAt.getTime(),
          views: item.views,
          reactions: item.reactions,
          isNSFW: item.isNSFW,
          caption: item.caption,
          comments,
          liked: !!liked,
          userId: item.userId,
          username: user.username,
        };
      }));
    } else {
      contentWithLikes = await Promise.all(content.map(async (item) => {
        const comments = await SwapComment.countDocuments({
          contentId: item._id.toString(),
          type: 'comment',
        });

        return {
          id: item._id.toString(),
          mediaUrl: item.mediaUrl,
          mediaType: item.mediaType,
          uploadedAt: item.uploadedAt.getTime(),
          views: item.views,
          reactions: item.reactions,
          isNSFW: item.isNSFW,
          caption: item.caption,
          comments,
          liked: false,
          userId: item.userId,
          username: user.username,
        };
      }));
    }

    // Calculate stats
    const totalViews = content.reduce((sum, c) => sum + c.views, 0);
    const totalLikes = content.reduce((sum, c) => sum + c.reactions, 0);

    const profileData = {
      username: user.username,
      joinedAt: user.createdAt.toISOString(),
      totalUploads: content.length,
      totalViews,
      totalLikes,
    };

    res.json({
      success: true,
      data: {
        profile: profileData,
        content: contentWithLikes,
      },
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch profile',
    });
  }
});

router.put('/profile', protect, async (req, res) => {
  res.json({ message: 'Update user profile - TODO' });
});

// Update NSFW content filter preference
router.patch('/content-filter', protect, async (req: any, res: any) => {
  try {
    const userId = req.user._id;
    const { contentFilter } = req.body;

    if (!['sfw', 'all', 'nsfw'].includes(contentFilter)) {
      return res.status(400).json({
        success: false,
        message: 'contentFilter must be one of: sfw, all, nsfw',
      });
    }

    await User.findByIdAndUpdate(userId, { nsfwContentFilter: contentFilter });

    res.json({
      success: true,
      message: 'Content filter updated',
      data: { contentFilter },
    });
  } catch (error: any) {
    console.error('Update content filter error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update filter',
    });
  }
});

// Legacy endpoint for backward compatibility
router.patch('/nsfw-preference', protect, async (req: any, res: any) => {
  try {
    const userId = req.user._id;
    const { nsfwEnabled } = req.body;

    if (typeof nsfwEnabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'nsfwEnabled must be a boolean',
      });
    }

    // Convert boolean to new filter system
    const contentFilter = nsfwEnabled ? 'all' : 'sfw';
    await User.findByIdAndUpdate(userId, { nsfwContentFilter: contentFilter });

    res.json({
      success: true,
      message: 'NSFW preference updated',
      data: { nsfwEnabled, contentFilter },
    });
  } catch (error: any) {
    console.error('Update NSFW preference error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update preference',
    });
  }
});

router.get('/search', optionalAuth, async (req, res) => {
  res.json({ message: 'Search users - TODO' });
});

router.post('/block/:id', protect, async (req, res) => {
  res.json({ message: 'Block user - TODO' });
});

router.delete('/block/:id', protect, async (req, res) => {
  res.json({ message: 'Unblock user - TODO' });
});

export default router;