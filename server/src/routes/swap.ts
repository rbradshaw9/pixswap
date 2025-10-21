import { Router } from 'express';
import { protect } from '@/middleware/auth';
import { upload } from '@/middleware/upload';
import { Swap } from '@/models';
import { SwapStatus } from '@/types';
import { swapQueue } from '@/services/swapQueue';
import { getIO } from '@/socket';

const router = Router();

// Queue endpoint - upload photo and join queue
router.post('/queue', protect, upload.single('image'), async (req: any, res: any) => {
  try {
    const userId = req.user._id;
    const isNSFW = req.body.isNSFW === 'true';
    const photoUrl = req.file?.path || req.file?.location; // Local or S3 path

    if (!photoUrl) {
      return res.status(400).json({ message: 'Photo is required' });
    }

    const io = getIO();

    // Try to find a match
    const match = swapQueue.findMatch(userId.toString(), isNSFW);

    if (match) {
      // Create swap with matched user
      const swap = await Swap.create({
        participants: [
          {
            user: userId,
            mediaSubmitted: null, // We'll store the photo URL in a simpler way
            submittedAt: new Date(),
          },
          {
            user: match.userId,
            mediaSubmitted: null,
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

      // Store photos in a simple map (in production, use proper media storage)
      const swapData = {
        swapId: swap._id.toString(),
        user1: {
          id: userId.toString(),
          photo: photoUrl,
        },
        user2: {
          id: match.userId,
          photo: match.photoUrl,
        },
      };

      // Notify both users via socket
      io.to(req.socketId).emit('swap:matched', {
        swapId: swap._id,
        myPhoto: photoUrl,
        theirPhoto: match.photoUrl,
        partnerId: match.userId,
      });

      io.to(match.socketId).emit('swap:matched', {
        swapId: swap._id,
        myPhoto: match.photoUrl,
        theirPhoto: photoUrl,
        partnerId: userId.toString(),
      });

      res.json({
        swapId: swap._id,
        matched: true,
        myPhoto: photoUrl,
        theirPhoto: match.photoUrl,
      });
    } else {
      // No match found, add to queue
      swapQueue.add({
        userId: userId.toString(),
        photoUrl,
        isNSFW,
        socketId: req.socketId,
        timestamp: Date.now(),
      });

      res.json({
        matched: false,
        queued: true,
        message: 'Waiting for a match...',
      });
    }
  } catch (error) {
    console.error('Queue error:', error);
    res.status(500).json({ message: 'Failed to process request' });
  }
});

// Get swap details
router.get('/:id', protect, async (req: any, res: any) => {
  try {
    const swap = await Swap.findById(req.params.id).populate('participants.user', 'username');
    
    if (!swap) {
      return res.status(404).json({ message: 'Swap not found' });
    }

    // Check if user is a participant
    const isParticipant = swap.participants.some(
      (p: any) => p.user._id.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json({ data: swap });
  } catch (error) {
    console.error('Get swap error:', error);
    res.status(500).json({ message: 'Failed to get swap' });
  }
});

// Upload additional photo to existing swap
router.post('/:id/photos', protect, upload.single('image'), async (req: any, res: any) => {
  try {
    const photoUrl = req.file?.path || req.file?.location;

    if (!photoUrl) {
      return res.status(400).json({ message: 'Photo is required' });
    }

    const swap = await Swap.findById(req.params.id);
    
    if (!swap) {
      return res.status(404).json({ message: 'Swap not found' });
    }

    const io = getIO();
    const partnerId = swap.participants.find(
      (p: any) => p.user.toString() !== req.user._id.toString()
    )?.user;

    // Emit photo to partner
    if (partnerId) {
      io.to(`swap:${swap._id}`).emit('swap:new-photo', {
        senderId: req.user._id,
        photoUrl,
      });
    }

    res.json({ success: true, photoUrl });
  } catch (error) {
    console.error('Upload photo error:', error);
    res.status(500).json({ message: 'Failed to upload photo' });
  }
});

// Legacy endpoints (kept for compatibility)
router.post('/join', protect, async (req: any, res: any) => {
  res.json({ message: 'Use /queue endpoint instead' });
});

router.get('/active', protect, async (req: any, res: any) => {
  try {
    const swaps = await Swap.find({
      'participants.user': req.user._id,
      status: SwapStatus.MATCHED,
    }).sort({ createdAt: -1 });

    res.json({ data: swaps });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get active swaps' });
  }
});

router.post('/:id/submit', protect, async (req: any, res: any) => {
  res.json({ message: 'Submit media for swap - TODO' });
});

router.post('/:id/reveal', protect, async (req: any, res: any) => {
  res.json({ message: 'Reveal swap - TODO' });
});

export default router;