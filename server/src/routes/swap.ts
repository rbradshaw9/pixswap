import { Router } from 'express';
import { upload } from '@/middleware/upload';
import { Swap } from '@/models';
import { SwapStatus } from '@/types';
import { contentPool } from '@/services/contentPool';
import { getIO } from '@/socket';

const router = Router();

// Upload and get random content from pool
router.post('/queue', upload.single('image'), async (req: any, res: any) => {
  try {
    // Generate temp user ID if not authenticated
    const userId = req.user?._id?.toString() || `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const isNSFW = req.body.isNSFW === 'true';
    const mediaUrl = req.file?.path || req.file?.location;

    if (!mediaUrl) {
      return res.status(400).json({ message: 'Media file is required' });
    }

    // Add user's content to pool
    const uploadedContent = await contentPool.add({
      userId,
      mediaUrl,
      mediaType: req.file.mimetype.startsWith('video') ? 'video' : 'image',
      isNSFW,
      timestamp: Date.now(),
    });

    // Get random content from pool (not from same user, matching NSFW preference)
    const receivedContent = await contentPool.getRandom(userId, isNSFW);

    if (!receivedContent) {
      // No content available yet, return waiting state
      return res.json({
        success: true,
        waiting: true,
        message: 'Your content has been uploaded! Waiting for others to share...',
        uploadedId: uploadedContent.id,
      });
    }

    // Try to create swap record (optional if DB not connected)
    let swapId = `temp-swap-${Date.now()}`;
    try {
      const swap = await Swap.create({
        participants: [
          {
            user: userId,
            mediaSubmitted: uploadedContent.id,
            submittedAt: new Date(),
          },
          {
            user: receivedContent.userId,
            mediaSubmitted: receivedContent.id,
            submittedAt: new Date(),
          },
        ],
        status: SwapStatus.MATCHED,
        matchedAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        metadata: {
          category: isNSFW ? 'nsfw' : 'sfw',
        },
      });
      swapId = swap._id.toString();
    } catch (dbError) {
      console.warn('Could not save swap to database:', dbError);
    }

    res.json({
      success: true,
      swapId,
      content: {
        id: receivedContent.id,
        mediaUrl: receivedContent.mediaUrl,
        mediaType: receivedContent.mediaType,
        uploadedAt: receivedContent.timestamp,
      },
    });
  } catch (error) {
    console.error('Queue error:', error);
    res.status(500).json({ message: 'Failed to process request' });
  }
});

// Get swap details
router.get('/:id', async (req: any, res: any) => {
  try {
    const swap = await Swap.findById(req.params.id);
    
    if (!swap) {
      return res.status(404).json({ message: 'Swap not found' });
    }

    // Get content details for both participants
    const participant1Id = swap.participants[0]?.mediaSubmitted;
    const participant2Id = swap.participants[1]?.mediaSubmitted;
    
    const participant1Content = participant1Id ? await contentPool.getById(participant1Id.toString()) : null;
    const participant2Content = participant2Id ? await contentPool.getById(participant2Id.toString()) : null;

    res.json({
      success: true,
      data: {
        swapId: swap._id,
        status: swap.status,
        matchedAt: swap.matchedAt,
        expiresAt: swap.expiresAt,
        content1: participant1Content,
        content2: participant2Content,
      },
    });
  } catch (error) {
    console.error('Get swap error:', error);
    res.status(500).json({ message: 'Failed to get swap' });
  }
});

// React to content (like, comment, etc.)
router.post('/:id/react', async (req: any, res: any) => {
  try {
    const { reaction, comment } = req.body;
    const userId = req.user?._id?.toString() || req.body.userId;

    const swap = await Swap.findById(req.params.id);
    
    if (!swap) {
      return res.status(404).json({ message: 'Swap not found' });
    }

    // Store reaction
    if (!swap.metadata) swap.metadata = {};
    if (!(swap.metadata as any).reactions) (swap.metadata as any).reactions = [];
    
    (swap.metadata as any).reactions.push({
      userId,
      reaction,
      comment,
      timestamp: new Date(),
    });

    await swap.save();

    // Notify via socket
    const io = getIO();
    io.to(`swap:${swap._id}`).emit('swap:reaction', {
      userId,
      reaction,
      comment,
    });

    res.json({ success: true });
  } catch (error) {
    console.error('React error:', error);
    res.status(500).json({ message: 'Failed to add reaction' });
  }
});

// Friend a user from a swap
router.post('/:id/friend', async (req: any, res: any) => {
  try {
    const userId = req.user?._id?.toString() || req.body.userId;
    const { friendUserId } = req.body;

    // In production, implement proper friend system with User model
    // For now, just acknowledge the request
    
    const io = getIO();
    io.to(friendUserId).emit('friend:request', {
      from: userId,
      swapId: req.params.id,
    });

    res.json({ 
      success: true,
      message: 'Friend request sent!',
    });
  } catch (error) {
    console.error('Friend error:', error);
    res.status(500).json({ message: 'Failed to send friend request' });
  }
});

// Get more content (skip feature)
router.post('/next', upload.none(), async (req: any, res: any) => {
  try {
    const userId = req.user?._id?.toString() || req.body.userId;
    const isNSFW = req.body.isNSFW === 'true';

    // Get another random content
    const content = await contentPool.getRandom(userId, isNSFW);

    if (!content) {
      return res.json({
        success: false,
        message: 'No more content available right now. Upload something to see more!',
      });
    }

    res.json({
      success: true,
      content: {
        id: content.id,
        mediaUrl: content.mediaUrl,
        mediaType: content.mediaType,
        uploadedAt: content.timestamp,
      },
    });
  } catch (error) {
    console.error('Next content error:', error);
    res.status(500).json({ message: 'Failed to get next content' });
  }
});

export default router;