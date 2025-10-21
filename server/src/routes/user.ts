import { Router } from 'express';
import { protect, optionalAuth } from '@/middleware/auth';
import { User } from '@/models';

const router = Router();

// User profile routes
router.get('/profile/:id', optionalAuth, async (req, res) => {
  res.json({ message: 'Get user profile - TODO' });
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