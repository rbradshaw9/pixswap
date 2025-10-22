import { Router } from 'express';
import { upload } from '@/middleware/upload';
import { optionalAuth, protect } from '@/middleware/auth';
import { Swap, SwapComment, CommentLike, Content, FriendRequest, User } from '@/models';
import { SwapStatus } from '@/types';
import { contentPool } from '@/services/contentPool';
import { getIO } from '@/socket';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiter for uploads - 10 uploads per 15 minutes per IP
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 uploads per windowMs
  message: 'Too many uploads from this IP. Please try again in 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: any, res) => {
    res.status(429).json({
      success: false,
      message: 'You\'re uploading too quickly! Please wait a few minutes before uploading again.',
      retryAfter: req.rateLimit?.resetTime ? Math.ceil(req.rateLimit.resetTime / 1000) : Date.now() / 1000 + 900,
    });
  },
});

// Upload and get random content from pool (with optional auth)
router.post('/queue', uploadLimiter, optionalAuth, upload.single('image'), async (req: any, res: any) => {
  try {
    // Use authenticated user ID if available, otherwise generate temp ID
    const userId = req.user?._id?.toString() || `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const isNSFW = req.body.isNSFW === 'true';
    const caption = req.body.caption || '';
    
    console.log('📤 Upload request:', {
      userId,
      username: req.user?.username,
      isNSFW,
      hasCaption: !!caption,
      captionLength: caption.length,
      fileType: req.file?.mimetype,
    });
    
    // Get media URL from Cloudinary or fallback to local path
    let mediaUrl = (req.file as any)?.path; // Cloudinary returns full URL in path
    // Cloudinary returns public_id in filename - ensure it has PixSwap/ prefix
    const cloudinaryId = (req.file as any)?.filename?.includes('PixSwap/') 
      ? (req.file as any)?.filename 
      : `PixSwap/${(req.file as any)?.filename}`;
    
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
      username: req.user?.username,
      mediaUrl,
      mediaType: req.file.mimetype.startsWith('video') ? 'video' : 'image',
      caption,
      isNSFW,
      timestamp: Date.now(),
      cloudinaryId,
    });

    // Get user's content filter preference (if authenticated)
    let contentFilter: 'sfw' | 'all' | 'nsfw' = 'sfw';
    if (req.user) {
      contentFilter = req.user.nsfwContentFilter || 'sfw';
    }

    console.log('🎲 Getting random content with filter:', contentFilter);

    // Get random content from pool based on user's content filter
    let receivedContent = await contentPool.getRandom(userId, isNSFW, contentFilter);
    
    if (receivedContent) {
      console.log('✓ Got content from pool:', {
        id: receivedContent.id,
        isNSFW: receivedContent.isNSFW,
        username: receivedContent.username,
      });
    }

    // If no content available with filter, try without filter but exclude own content
    if (!receivedContent) {
      console.log('⚠️ No content with filter, trying any content except own...');
      // Get any content that's not the user's own
      const allContent: any[] = Array.from((contentPool as any).pool.values()).filter((c: any) => c.userId !== userId);
      
      if (allContent.length > 0) {
        const randomIndex = Math.floor(Math.random() * allContent.length);
        const alternativeContent = allContent[randomIndex] as any;
        if (alternativeContent && alternativeContent.id) {
          receivedContent = alternativeContent;
          console.log('✓ Found alternative content:', alternativeContent.id);
        }
      }
    }
    
    // If STILL no content (empty pool or only user's own content), return error
    if (!receivedContent) {
      console.log('❌ No content available for swap - pool is empty or only contains user\'s own content');
      return res.status(503).json({
        success: false,
        message: 'No content available for swap yet. Please try again later or encourage others to upload!',
        uploadedContent: {
          id: uploadedContent.id,
          mediaUrl: uploadedContent.mediaUrl,
          mediaType: uploadedContent.mediaType,
          caption: uploadedContent.caption,
          isNSFW: uploadedContent.isNSFW,
        },
        timestamp: new Date(),
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

    console.log('✅ Upload successful:', {
      uploadedId: uploadedContent.id,
      receivedId: receivedContent.id,
      receivedIsNSFW: receivedContent.isNSFW,
      swapId,
    });

    res.json({
      success: true,
      swapId,
      content: {
        id: receivedContent.id,
        userId: receivedContent.userId,
        username: receivedContent.username,
        mediaUrl: receivedContent.mediaUrl,
        mediaType: receivedContent.mediaType,
        caption: receivedContent.caption,
        isNSFW: receivedContent.isNSFW,
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

// IMPORTANT: Specific routes must come BEFORE the generic /:id route!

// Get user's uploads (requires auth)
router.get('/my-uploads', protect, async (req: any, res: any) => {
  try {
    const userId = req.user._id.toString();
    console.log('📂 Fetching uploads for user:', { userId, username: req.user.username });
    
    const userContent = await contentPool.getUserContent(userId);
    
    console.log('📂 getUserContent result:', {
      count: userContent.length,
      sample: userContent.slice(0, 2).map((c: any) => ({
        id: c.id,
        mediaType: c.mediaType,
        isNSFW: c.isNSFW,
        hasCaption: !!c.caption,
      })),
    });

    res.json({
      success: true,
      data: userContent,
      timestamp: new Date(),
    });
  } catch (error: any) {
    console.error('📂 Get uploads error:', error);
    console.error('📂 Error stack:', error.stack);
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
    console.log('❤️ Fetching liked posts for user:', { userId, username: req.user.username });
    
    // Find all likes by this user
    const userLikes = await SwapComment.find({
      author: userId,
      type: 'like',
    }).sort({ createdAt: -1 }).lean();
    
    console.log('❤️ Found likes:', {
      count: userLikes.length,
      sample: userLikes.slice(0, 2).map((l: any) => ({
        contentId: l.contentId,
        createdAt: l.createdAt,
      })),
    });
    
    // Get the content for each like
    const contentIds = userLikes.map(like => like.contentId).filter(id => id);
    console.log('❤️ Content IDs to fetch:', contentIds.slice(0, 5));
    
    if (contentIds.length === 0) {
      console.log('❤️ No content IDs, returning empty array');
      return res.json({
        success: true,
        data: [],
        timestamp: new Date(),
      });
    }
    
    const likedContent = await Content.find({ 
      _id: { $in: contentIds }
    }).lean();
    
    console.log('❤️ Found content items:', {
      count: likedContent.length,
      sample: likedContent.slice(0, 2).map((c: any) => ({
        id: c._id?.toString(),
        mediaType: c.mediaType,
        hasUsername: !!c.username,
      })),
    });
    
    // Map likes to content with likedAt timestamp
    const likedPosts = likedContent.map((content: any) => {
      const contentIdStr = content._id?.toString() || '';
      const like = userLikes.find((l: any) => {
        // Handle both string and ObjectId comparisons
        const likeContentId = typeof l.contentId === 'string' ? l.contentId : l.contentId?.toString();
        return likeContentId === contentIdStr;
      });
      
      return {
        id: contentIdStr,
        mediaUrl: content.mediaUrl,
        mediaType: content.mediaType,
        caption: content.caption,
        username: content.username,
        uploadedAt: content.uploadedAt?.getTime() || Date.now(),
        views: content.views || 0,
        isNSFW: content.isNSFW || false,
        likedAt: like?.createdAt ? new Date(like.createdAt).getTime() : Date.now(),
        comments: content.comments || 0,
      };
    });
    
    console.log('❤️ Returning liked posts:', { count: likedPosts.length });

    res.json({
      success: true,
      data: likedPosts,
      timestamp: new Date(),
    });
  } catch (error: any) {
    console.error('❤️ Get liked posts error:', error);
    console.error('❤️ Error name:', error.name);
    console.error('❤️ Error message:', error.message);
    console.error('❤️ Error stack:', error.stack);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to fetch liked posts',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
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
router.post('/:id/friend', protect, async (req: any, res: any) => {
  try {
    const fromUserId = req.user._id;
    const fromUsername = req.user.username;
    const { friendUserId } = req.body;

    // Validate friend user exists
    const toUser = await User.findById(friendUserId);
    if (!toUser) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found',
      });
    }

    // Check if already friends
    const user = await User.findById(fromUserId);
    if (user?.friends.includes(friendUserId)) {
      return res.status(400).json({
        success: false,
        message: 'Already friends with this user',
      });
    }

    // Check if request already exists
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { fromUser: fromUserId, toUser: friendUserId },
        { fromUser: friendUserId, toUser: fromUserId }
      ]
    });

    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Friend request already pending',
        });
      }
    }

    // Create friend request
    const friendRequest = await FriendRequest.create({
      fromUser: fromUserId,
      toUser: friendUserId,
      fromUsername,
      toUsername: toUser.username,
      status: 'pending',
    });

    // Emit socket event to notify user
    const io = getIO();
    io.to(friendUserId.toString()).emit('friend:request', {
      id: friendRequest._id,
      from: fromUserId,
      fromUsername,
      swapId: req.params.id,
    });

    res.json({ 
      success: true,
      message: 'Friend request sent!',
      data: { requestId: friendRequest._id },
    });
  } catch (error: any) {
    console.error('Friend error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to send friend request',
    });
  }
});

// Get more content (skip feature)
router.post('/next', optionalAuth, upload.none(), async (req: any, res: any) => {
  try {
    const userId = req.user?._id?.toString() || req.body.userId;
    const isNSFW = req.body.isNSFW === 'true';

    // Get user's content filter preference (if authenticated)
    let contentFilter: 'sfw' | 'all' | 'nsfw' = 'sfw';
    if (req.user) {
      contentFilter = req.user.nsfwContentFilter || 'sfw';
    }

    // Get another random content based on user's filter
    const content = await contentPool.getRandom(userId, isNSFW, contentFilter);

    if (!content) {
      return res.json({
        success: false,
        message: 'No more content available right now. Upload something to see more!',
      });
    }

    console.log('➡️ Next content:', {
      contentId: content.id,
      isNSFW: content.isNSFW,
      userId: content.userId,
      username: content.username,
    });

    res.json({
      success: true,
      content: {
        id: content.id,
        userId: content.userId,
        username: content.username,
        mediaUrl: content.mediaUrl,
        mediaType: content.mediaType,
        caption: content.caption,
        isNSFW: content.isNSFW,
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

// Accept friend request
router.post('/friend-request/:requestId/accept', protect, async (req: any, res: any) => {
  try {
    const userId = req.user._id;
    const { requestId } = req.params;

    const friendRequest = await FriendRequest.findById(requestId);
    if (!friendRequest) {
      return res.status(404).json({
        success: false,
        message: 'Friend request not found',
      });
    }

    // Verify user is the recipient
    if (friendRequest.toUser.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to accept this request',
      });
    }

    // Update request status
    friendRequest.status = 'accepted';
    friendRequest.respondedAt = new Date();
    await friendRequest.save();

    // Add to both users' friends lists
    await User.findByIdAndUpdate(friendRequest.fromUser, {
      $addToSet: { friends: friendRequest.toUser }
    });
    await User.findByIdAndUpdate(friendRequest.toUser, {
      $addToSet: { friends: friendRequest.fromUser }
    });

    // Emit socket event
    const io = getIO();
    io.to(friendRequest.fromUser.toString()).emit('friend:accepted', {
      requestId: friendRequest._id,
      userId: friendRequest.toUser,
      username: friendRequest.toUsername,
    });

    res.json({
      success: true,
      message: 'Friend request accepted',
    });
  } catch (error: any) {
    console.error('Accept friend error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to accept friend request',
    });
  }
});

// Reject friend request
router.post('/friend-request/:requestId/reject', protect, async (req: any, res: any) => {
  try {
    const userId = req.user._id;
    const { requestId } = req.params;

    const friendRequest = await FriendRequest.findById(requestId);
    if (!friendRequest) {
      return res.status(404).json({
        success: false,
        message: 'Friend request not found',
      });
    }

    // Verify user is the recipient
    if (friendRequest.toUser.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to reject this request',
      });
    }

    // Update request status
    friendRequest.status = 'rejected';
    friendRequest.respondedAt = new Date();
    await friendRequest.save();

    res.json({
      success: true,
      message: 'Friend request rejected',
    });
  } catch (error: any) {
    console.error('Reject friend error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to reject friend request',
    });
  }
});

// Get pending friend requests
router.get('/friend-requests', protect, async (req: any, res: any) => {
  try {
    const userId = req.user._id;

    const requests = await FriendRequest.find({
      toUser: userId,
      status: 'pending',
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: requests,
    });
  } catch (error: any) {
    console.error('Get friend requests error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch friend requests',
    });
  }
});

// Get user's friends list
router.get('/friends', protect, async (req: any, res: any) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).populate('friends', 'username avatar bio lastSeen');
    
    res.json({
      success: true,
      data: user?.friends || [],
    });
  } catch (error: any) {
    console.error('Get friends error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch friends',
    });
  }
});

// Update content caption (requires auth)
router.patch('/content/:contentId/caption', protect, async (req: any, res: any) => {
  try {
    const userId = req.user._id.toString();
    const { contentId } = req.params;
    const { caption } = req.body;

    if (caption && caption.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Caption cannot exceed 500 characters',
      });
    }

    await contentPool.updateCaption(contentId, userId, caption);

    res.json({
      success: true,
      message: 'Caption updated successfully',
      timestamp: new Date(),
    });
  } catch (error: any) {
    console.error('Update caption error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update caption',
      timestamp: new Date(),
    });
  }
});

// Update content NSFW status (requires auth)
router.patch('/content/:contentId/nsfw', protect, async (req: any, res: any) => {
  try {
    const userId = req.user._id.toString();
    const { contentId } = req.params;
    const { isNSFW } = req.body;

    await contentPool.updateNSFW(contentId, userId, isNSFW);

    res.json({
      success: true,
      message: `Content marked as ${isNSFW ? 'NSFW' : 'Safe'}`,
      timestamp: new Date(),
    });
  } catch (error: any) {
    console.error('Update NSFW error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update NSFW status',
      timestamp: new Date(),
    });
  }
});

// Flag content as inappropriate (requires auth)
router.post('/content/:contentId/flag', protect, async (req: any, res: any) => {
  try {
    const userId = req.user._id.toString();
    const username = req.user.username;
    const { contentId } = req.params;
    const { reason } = req.body;

    // Create a flag record (you might want to create a ContentFlag model)
    await SwapComment.create({
      contentId,
      author: userId,
      username,
      type: 'flag',
      text: reason || 'Flagged as inappropriate',
    });

    console.log('🚩 Content flagged:', { contentId, username, reason });

    res.json({
      success: true,
      message: 'Content flagged for review',
      timestamp: new Date(),
    });
  } catch (error: any) {
    console.error('Flag content error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to flag content',
      timestamp: new Date(),
    });
  }
});

export default router;