import { Router } from 'express';
import { upload } from '@/middleware/upload';
import { optionalAuth, protect } from '@/middleware/auth';
import { Swap, SwapComment, CommentLike } from '@/models';
import { SwapStatus } from '@/types';
import { contentPool } from '@/services/contentPool';
import { getIO } from '@/socket';

const router = Router();

// Upload and get random content from pool (with optional auth)
router.post('/queue', optionalAuth, upload.single('image'), async (req: any, res: any) => {
  try {
    // Use authenticated user ID if available, otherwise generate temp ID
    const userId = req.user?._id?.toString() || `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const isNSFW = req.body.isNSFW === 'true';
    
    // Get media URL - use relative path for uploads
    let mediaUrl = req.file?.path || req.file?.location;
    
    // Convert absolute path to relative path (uploads/filename.jpg)
    if (mediaUrl && mediaUrl.includes('uploads')) {
      mediaUrl = mediaUrl.substring(mediaUrl.indexOf('uploads'));
    }

    if (!mediaUrl || !req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'Media file is required',
        timestamp: new Date(),
      });
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
    let receivedContent = await contentPool.getRandom(userId, isNSFW);

    // If no content available from others, get any random content (even their own or latest)
    if (!receivedContent) {
      // Try to get any content regardless of user (for first-time users or empty pool)
      receivedContent = await contentPool.getAny(isNSFW);
      
      // If still nothing, return their own upload as content
      if (!receivedContent) {
        receivedContent = uploadedContent;
      }
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
        userId: receivedContent.userId,
        mediaUrl: receivedContent.mediaUrl,
        mediaType: receivedContent.mediaType,
        uploadedAt: receivedContent.timestamp,
        views: receivedContent.views,
        reactions: receivedContent.reactions,
      },
    });
  } catch (error: any) {
    console.error('Queue error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to process swap',
      timestamp: new Date(),
    });
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
        userId: content.userId,
        mediaUrl: content.mediaUrl,
        mediaType: content.mediaType,
        uploadedAt: content.timestamp,
        views: content.views,
        reactions: content.reactions,
      },
    });
  } catch (error: any) {
    console.error('Next content error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to get next content',
      timestamp: new Date(),
    });
  }
});

// Get user's uploads (requires auth)
router.get('/my-uploads', protect, async (req: any, res: any) => {
  try {
    const userId = req.user._id.toString();
    console.log('📂 Fetching uploads for user:', userId);
    
    const userContent = await contentPool.getUserContent(userId);
    
    console.log('📂 Found', userContent.length, 'uploads for user');

    res.json({
      success: true,
      data: userContent,
      timestamp: new Date(),
    });
  } catch (error: any) {
    console.error('Get uploads error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to fetch uploads',
      timestamp: new Date(),
    });
  }
});

// Get user's liked posts (requires auth)
router.get('/liked-posts', protect, async (req: any, res: any) => {
  try {
    const userId = req.user._id.toString();
    console.log('❤️ Fetching liked posts for user:', userId);
    
    // Find all likes by this user
    const userLikes = await SwapComment.find({
      author: userId,
      type: 'like',
    }).sort({ createdAt: -1 }).lean();
    
    // Get the content for each like
    const contentIds = userLikes.map(like => like.contentId);
    const likedContent = await Content.find({ 
      _id: { $in: contentIds }
    }).lean();
    
    // Map likes to content with likedAt timestamp
    const likedPosts = likedContent.map(content => {
      const like = userLikes.find(l => l.contentId === content._id.toString());
      return {
        id: content._id.toString(),
        mediaUrl: content.mediaUrl,
        mediaType: content.mediaType,
        username: content.username,
        uploadedAt: content.uploadedAt.getTime(),
        views: content.views,
        isNSFW: content.isNSFW,
        likedAt: like?.createdAt ? new Date(like.createdAt).getTime() : Date.now(),
        comments: content.comments,
      };
    });
    
    console.log('❤️ Found', likedPosts.length, 'liked posts');

    res.json({
      success: true,
      data: likedPosts,
      timestamp: new Date(),
    });
  } catch (error: any) {
    console.error('Get liked posts error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to fetch liked posts',
      timestamp: new Date(),
    });
  }
});

// Delete content (requires auth)
router.delete('/content/:contentId', protect, async (req: any, res: any) => {
  try {
    const userId = req.user._id.toString();
    const { contentId } = req.params;

    await contentPool.deleteContent(contentId, userId);

    res.json({
      success: true,
      message: 'Content deleted successfully',
      timestamp: new Date(),
    });
  } catch (error: any) {
    console.error('Delete content error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to delete content',
      timestamp: new Date(),
    });
  }
});

// Toggle save forever (requires auth)
router.post('/content/:contentId/save', protect, async (req: any, res: any) => {
  try {
    const userId = req.user._id.toString();
    const { contentId } = req.params;
    const { saveForever } = req.body;

    await contentPool.setSaveForever(contentId, userId, saveForever);

    res.json({
      success: true,
      message: saveForever ? 'Content saved forever' : 'Auto-delete re-enabled',
      timestamp: new Date(),
    });
  } catch (error: any) {
    console.error('Save toggle error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to update save status',
      timestamp: new Date(),
    });
  }
});

// Add comment to content (requires auth)
router.post('/content/:contentId/comment', protect, async (req: any, res: any) => {
  try {
    const userId = req.user._id.toString();
    const username = req.user.username;
    const { contentId } = req.params;
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Comment text is required',
        timestamp: new Date(),
      });
    }

    if (text.trim().length > 500) {
      return res.status(400).json({ 
        success: false,
        message: 'Comment cannot exceed 500 characters',
        timestamp: new Date(),
      });
    }

    const comment = await SwapComment.create({
      contentId,
      author: userId,
      username,
      text: text.trim(),
      type: 'comment',
    });

    // Update content pool comment count
    await contentPool.addComment(contentId);

    console.log('💬 Comment added:', { contentId, username, commentId: comment._id });

    res.json({
      success: true,
      data: comment,
      timestamp: new Date(),
    });
  } catch (error: any) {
    console.error('Add comment error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to add comment',
      timestamp: new Date(),
    });
  }
});

// Add like to content (requires auth)
router.post('/content/:contentId/like', protect, async (req: any, res: any) => {
  try {
    const userId = req.user._id.toString();
    const username = req.user.username;
    const { contentId } = req.params;

    // Check if user already liked
    const existingLike = await SwapComment.findOne({
      contentId,
      author: userId,
      type: 'like',
    });

    if (existingLike) {
      // Unlike - remove the like
      await SwapComment.deleteOne({ _id: existingLike._id });
      
      res.json({
        success: true,
        data: { liked: false },
        message: 'Like removed',
        timestamp: new Date(),
      });
    } else {
      // Like - create new like
      await SwapComment.create({
        contentId,
        author: userId,
        username,
        type: 'like',
        text: '', // Not required for likes
      });

      // Update content pool reaction count
      await contentPool.addReaction(contentId);

      console.log('❤️ Like added:', { contentId, username });

      res.json({
        success: true,
        data: { liked: true },
        message: 'Content liked',
        timestamp: new Date(),
      });
    }
  } catch (error: any) {
    console.error('Add like error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to add like',
      timestamp: new Date(),
    });
  }
});

// Get comments for content with hierarchical structure
router.get('/content/:contentId/comments', async (req: any, res: any) => {
  try {
    const { contentId } = req.params;

    // Get all comments (including replies)
    const allComments = await SwapComment.find({
      contentId,
      type: 'comment',
    })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    // Separate top-level comments and replies
    const topLevelComments = allComments.filter(c => !c.parentId);
    const replies = allComments.filter(c => c.parentId);

    // Build hierarchical structure
    const commentsWithReplies = topLevelComments.map(comment => {
      const commentReplies = replies.filter(r => r.parentId === comment._id.toString());
      return {
        ...comment,
        replies: commentReplies.sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        ),
        replyCount: commentReplies.length,
      };
    });

    const likes = await SwapComment.countDocuments({
      contentId,
      type: 'like',
    });

    res.json({
      success: true,
      data: {
        comments: commentsWithReplies,
        likes,
        total: commentsWithReplies.length,
        totalWithReplies: allComments.length,
      },
      timestamp: new Date(),
    });
  } catch (error: any) {
    console.error('Get comments error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to fetch comments',
      timestamp: new Date(),
    });
  }
});

// Reply to a comment
router.post('/content/:contentId/comment/:commentId/reply', protect, async (req: any, res: any) => {
  try {
    const { contentId, commentId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Reply text is required',
        timestamp: new Date(),
      });
    }

    // Verify parent comment exists
    const parentComment = await SwapComment.findById(commentId);
    if (!parentComment) {
      return res.status(404).json({
        success: false,
        message: 'Parent comment not found',
        timestamp: new Date(),
      });
    }

    // Create reply with parentId
    const reply = await SwapComment.create({
      contentId,
      author: req.user._id,
      username: req.user.username,
      text: text.trim(),
      type: 'comment',
      parentId: commentId,
      likes: 0,
    });

    // Update content pool with reply count
    await contentPool.addComment(contentId);

    res.json({
      success: true,
      data: { reply },
      timestamp: new Date(),
    });
  } catch (error: any) {
    console.error('Reply error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to post reply',
      timestamp: new Date(),
    });
  }
});

// Like/unlike a comment
router.post('/content/:contentId/comment/:commentId/like', protect, async (req: any, res: any) => {
  try {
    const { commentId } = req.params;
    const userId = req.user._id;

    // Check if comment exists
    const comment = await SwapComment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
        timestamp: new Date(),
      });
    }

    // Check if user already liked this comment
    const existingLike = await CommentLike.findOne({
      commentId,
      userId,
    });

    let liked: boolean;

    if (existingLike) {
      // Unlike - remove like and decrement counter
      await CommentLike.deleteOne({ _id: existingLike._id });
      await SwapComment.findByIdAndUpdate(commentId, {
        $inc: { likes: -1 }
      });
      liked = false;
    } else {
      // Like - create like and increment counter
      await CommentLike.create({
        commentId,
        userId,
        username: req.user.username,
      });
      await SwapComment.findByIdAndUpdate(commentId, {
        $inc: { likes: 1 }
      });
      liked = true;
    }

    res.json({
      success: true,
      data: { liked },
      timestamp: new Date(),
    });
  } catch (error: any) {
    console.error('Like comment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to like comment',
      timestamp: new Date(),
    });
  }
});

export default router;