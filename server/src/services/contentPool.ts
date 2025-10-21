// Content pool for storing and serving uploaded media
// Hybrid approach: MongoDB for persistence + in-memory cache for speed

import { Content } from '@/models/Content';
import { UserContentView } from '@/models/UserContentView';

interface ContentEntry {
  id: string;
  userId: string;
  username?: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption?: string;
  isNSFW: boolean;
  timestamp: number;
  views: number;
  reactions: number;
  comments?: number;
  saveForever?: boolean;
  cloudinaryId?: string;
}

class ContentPool {
  private pool: Map<string, ContentEntry> = new Map();
  private userContent: Map<string, Set<string>> = new Map(); // Track what each user has seen
  private useDatabase: boolean = true;
  private isInitialized: boolean = false;

  constructor() {
    // Don't load immediately - wait for database connection
  }

  // Initialize after database connection
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    await this.loadFromDatabase();
    this.isInitialized = true;
  }

  // Load existing content from MongoDB into memory
  private async loadFromDatabase() {
    try {
      const now = new Date();
      console.log('📦 Loading content from database...');
      console.log('📦 Current time:', now);
      
      // First, check total count in database
      const totalCount = await Content.countDocuments({});
      console.log('📦 Total content in database:', totalCount);
      
      const contents = await Content.find({
        $or: [
          { expiresAt: { $gt: now } },
          { savedForever: true },
          { expiresAt: null }
        ]
      }).limit(1000).sort({ uploadedAt: -1 });

      console.log('📦 Content matching query:', contents.length);
      if (contents.length > 0 && contents[0]) {
        console.log('📦 Sample content:', {
          id: contents[0]._id.toString(),
          userId: contents[0].userId,
          expiresAt: contents[0].expiresAt,
          savedForever: contents[0].savedForever,
          uploadedAt: contents[0].uploadedAt,
        });
      }

      for (const content of contents) {
        const entry: ContentEntry = {
          id: content._id.toString(),
          userId: content.userId,
          username: content.username,
          mediaUrl: content.mediaUrl,
          mediaType: content.mediaType,
          caption: content.caption,
          isNSFW: content.isNSFW,
          timestamp: content.uploadedAt.getTime(),
          views: content.views,
          reactions: content.reactions,
          comments: content.comments,
          saveForever: content.savedForever,
          cloudinaryId: content.cloudinaryId,
        };
        this.pool.set(entry.id, entry);
      }

      console.log(`📦 Loaded ${contents.length} content entries from database`);
    } catch (error) {
      console.error('Failed to load from database:', error);
      this.useDatabase = false;
    }
  }

  // Add content to pool
  async add(entry: Omit<ContentEntry, 'id' | 'views' | 'reactions'>): Promise<ContentEntry> {
    const id = `content-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const content: ContentEntry = {
      id,
      ...entry,
      views: 0,
      reactions: 0,
      comments: 0,
    };

    // Add to memory
    this.pool.set(id, content);
    
    // Save to database
    if (this.useDatabase) {
      try {
        const expiresAt = content.saveForever ? undefined : new Date(Date.now() + 24 * 60 * 60 * 1000);
        console.log('💾 Saving content to database:', {
          id,
          userId: content.userId,
          mediaType: content.mediaType,
          isNSFW: content.isNSFW,
          saveForever: content.saveForever,
          expiresAt,
        });
        
        const dbContent = await Content.create({
          _id: id,
          userId: content.userId,
          username: content.username,
          mediaUrl: content.mediaUrl,
          mediaType: content.mediaType,
          caption: content.caption,
          isNSFW: content.isNSFW,
          views: 0,
          reactions: 0,
          comments: 0,
          savedForever: content.saveForever || false,
          uploadedAt: new Date(content.timestamp),
          expiresAt,
          cloudinaryId: content.cloudinaryId,
        });
        console.log('💾 Content saved to database successfully:', id);
      } catch (error) {
        console.error('❌ Failed to save to database:', error);
      }
    }
    
    // Clean up old content
    this.cleanup();
    
    return content;
  }

  // Get random content from pool (excluding user's own and already seen)
  // contentFilter: 'sfw' = SFW only, 'all' = both, 'nsfw' = NSFW only
  async getRandom(userId: string, isNSFW: boolean, contentFilter: 'sfw' | 'all' | 'nsfw' = 'sfw'): Promise<ContentEntry | null> {
    // Get seen content from database (last 30 days)
    let seenContent = this.userContent.get(userId) || new Set<string>();
    
    // Load from database if not in memory
    if (seenContent.size === 0 && this.useDatabase) {
      try {
        const seenViews = await UserContentView.find({ userId })
          .select('contentId')
          .lean();
        seenContent = new Set(seenViews.map(v => v.contentId));
        this.userContent.set(userId, seenContent);
      } catch (error) {
        console.error('Failed to load seen content:', error);
      }
    }
    
    // Filter available content based on user's content filter preference
    const available = Array.from(this.pool.values()).filter(content => {
      // Don't show user's own content
      if (content.userId === userId) return false;
      
      // Don't show already seen content
      if (seenContent.has(content.id)) return false;
      
      // Apply content filter
      if (contentFilter === 'sfw') {
        // SFW only mode: only show non-NSFW content
        return !content.isNSFW;
      } else if (contentFilter === 'nsfw') {
        // NSFW only mode: only show NSFW content
        return content.isNSFW;
      } else {
        // 'all' mode: show everything
        return true;
      }
    });

    if (available.length === 0) {
      // If no unseen content, allow re-showing content (reset seen list)
      const resetAvailable = Array.from(this.pool.values()).filter(content => {
        if (content.userId === userId) return false;
        
        // Apply same filter logic
        if (contentFilter === 'sfw') {
          return !content.isNSFW;
        } else if (contentFilter === 'nsfw') {
          return content.isNSFW;
        } else {
          return true;
        }
      });

      if (resetAvailable.length === 0) {
        return null;
      }

      // Clear seen list for this user (both memory and DB)
      seenContent.clear();
      this.userContent.set(userId, seenContent);
      
      if (this.useDatabase) {
        try {
          await UserContentView.deleteMany({ userId });
        } catch (error) {
          console.error('Failed to clear seen content:', error);
        }
      }

      // Pick random from reset list
      const randomIndex = Math.floor(Math.random() * resetAvailable.length);
      const selected = resetAvailable[randomIndex];

      if (!selected) return null;

      // Mark as seen
      await this.markAsSeen(userId, selected.id);
      selected.views++;
      
      // Update view count in database
      if (this.useDatabase) {
        Content.findByIdAndUpdate(selected.id, { $inc: { views: 1 } }).catch(err => 
          console.error('Failed to update view count:', err)
        );
      }

      return selected;
    }

    // Pick random from available
    const randomIndex = Math.floor(Math.random() * available.length);
    const selected = available[randomIndex];

    if (!selected) return null;

    // Mark as seen (memory + database)
    await this.markAsSeen(userId, selected.id);
    this.userContent.set(userId, seenContent);
    selected.views++;
    
    // Update view count in database
    if (this.useDatabase) {
      Content.findByIdAndUpdate(selected.id, { $inc: { views: 1 } }).catch(err => 
        console.error('Failed to update view count:', err)
      );
    }

    return selected;
  }
  
  // Mark content as seen by user (persisted to database)
  private async markAsSeen(userId: string, contentId: string): Promise<void> {
    const seenContent = this.userContent.get(userId) || new Set<string>();
    seenContent.add(contentId);
    this.userContent.set(userId, seenContent);
    
    if (this.useDatabase) {
      try {
        await UserContentView.create({
          userId,
          contentId,
          viewedAt: new Date(),
        });
      } catch (error: any) {
        // Ignore duplicate key errors (already seen)
        if (error.code !== 11000) {
          console.error('Failed to save view:', error);
        }
      }
    }
  }

  // Get any random content (ignoring user restrictions, for empty pool scenarios)
  // Prioritizes recent content: 24h > 7d > 30d > all time
  async getAny(isNSFW: boolean): Promise<ContentEntry | null> {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const oneWeek = 7 * oneDay;
    const oneMonth = 30 * oneDay;

    // Try to find content from last 24 hours
    let available = Array.from(this.pool.values()).filter(content => 
      content.isNSFW === isNSFW && 
      (now - content.timestamp) <= oneDay
    );

    // If none, try last 7 days
    if (available.length === 0) {
      available = Array.from(this.pool.values()).filter(content => 
        content.isNSFW === isNSFW && 
        (now - content.timestamp) <= oneWeek
      );
    }

    // If none, try last 30 days
    if (available.length === 0) {
      available = Array.from(this.pool.values()).filter(content => 
        content.isNSFW === isNSFW && 
        (now - content.timestamp) <= oneMonth
      );
    }

    // If still none, get any content matching NSFW filter
    if (available.length === 0) {
      available = Array.from(this.pool.values()).filter(content => 
        content.isNSFW === isNSFW
      );
    }

    if (available.length === 0) {
      return null;
    }

    // Pick random
    const randomIndex = Math.floor(Math.random() * available.length);
    const selected = available[randomIndex];

    if (selected) {
      selected.views++;
    }

    return selected || null;
  }

  // Get content by ID
  async getById(id: string): Promise<ContentEntry | null> {
    return this.pool.get(id) || null;
  }

  // Add reaction to content
  async addReaction(id: string): Promise<void> {
    const content = this.pool.get(id);
    if (content) {
      content.reactions++;
      
      // Update in database
      if (this.useDatabase) {
        try {
          await Content.findByIdAndUpdate(id, { $inc: { reactions: 1 } });
        } catch (error) {
          console.error('Failed to update reaction in database:', error);
        }
      }
    }
  }

  // Add comment count to content
  async addComment(id: string): Promise<void> {
    const content = this.pool.get(id);
    if (content) {
      content.comments = (content.comments || 0) + 1;
      
      // Update in database
      if (this.useDatabase) {
        try {
          await Content.findByIdAndUpdate(id, { $inc: { comments: 1 } });
        } catch (error) {
          console.error('Failed to update comment count in database:', error);
        }
      }
    }
  }

  // Get pool size
  size(): number {
    return this.pool.size;
  }

  // Get pool stats
  getStats() {
    const all = Array.from(this.pool.values());
    const sfw = all.filter(c => !c.isNSFW);
    const nsfw = all.filter(c => c.isNSFW);
    const images = all.filter(c => c.mediaType === 'image');
    const videos = all.filter(c => c.mediaType === 'video');

    return {
      total: all.length,
      sfw: sfw.length,
      nsfw: nsfw.length,
      images: images.length,
      videos: videos.length,
      totalViews: all.reduce((sum, c) => sum + c.views, 0),
      totalReactions: all.reduce((sum, c) => sum + c.reactions, 0),
    };
  }

  // Get all content for a specific user
  async getUserContent(userId: string): Promise<ContentEntry[]> {
    try {
      console.log('📂 getUserContent called for userId:', userId);
      
      // Get from in-memory pool
      const memoryContent = Array.from(this.pool.values()).filter(
        content => content.userId === userId
      );
      
      console.log('📂 Found', memoryContent.length, 'items in memory for user');
      
      // Also check database if enabled
      if (this.useDatabase) {
        try {
          console.log('📂 Checking database for user content...');
          const dbContent = await Content.find({ userId }).sort({ uploadedAt: -1 }).lean();
          console.log('📂 Found', dbContent.length, 'items in database for user');
          
          // Merge database content with memory, avoiding duplicates
          const allContent = new Map<string, ContentEntry>();
          
          // Add memory content first (most up-to-date)
          memoryContent.forEach(c => allContent.set(c.id, c));
          
          // Add database content if not already in memory
          dbContent.forEach(doc => {
            const id = doc._id.toString();
            if (!allContent.has(id)) {
              allContent.set(id, {
                id,
                userId: doc.userId,
                username: doc.username,
                mediaUrl: doc.mediaUrl,
                mediaType: doc.mediaType,
                isNSFW: doc.isNSFW,
                timestamp: doc.uploadedAt.getTime(),
                views: doc.views,
                reactions: doc.reactions,
                comments: doc.comments,
                saveForever: doc.savedForever,
              });
            }
          });
          
          const result = Array.from(allContent.values()).sort((a, b) => b.timestamp - a.timestamp);
          console.log('📂 Returning', result.length, 'total items for user');
          return result;
        } catch (error) {
          console.error('Failed to fetch user content from database:', error);
          // Fall back to memory content only
        }
      }
      
      // Sort by most recent first
      console.log('📂 Returning', memoryContent.length, 'items from memory only');
      return memoryContent.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('getUserContent error:', error);
      return []; // Return empty array on error instead of throwing
    }
  }

  // Delete content (only owner can delete)
  async deleteContent(contentId: string, userId: string): Promise<void> {
    const content = this.pool.get(contentId);
    
    if (!content) {
      throw new Error('Content not found');
    }
    
    if (content.userId !== userId) {
      throw new Error('Unauthorized to delete this content');
    }
    
    // Delete from Cloudinary if cloudinaryId exists
    if (content.cloudinaryId) {
      const { deleteFromCloudinary } = await import('@/utils/cloudinary');
      await deleteFromCloudinary(content.cloudinaryId, content.mediaType);
    }
    
    this.pool.delete(contentId);
    
    // Delete from database
    if (this.useDatabase) {
      try {
        await Content.findByIdAndDelete(contentId);
      } catch (error) {
        console.error('Failed to delete from database:', error);
      }
    }
    
    // Clean up from user seen lists
    for (const seenSet of this.userContent.values()) {
      seenSet.delete(contentId);
    }
  }

  // Set save forever status (only owner can modify)
  async setSaveForever(contentId: string, userId: string, saveForever: boolean): Promise<void> {
    const content = this.pool.get(contentId);
    
    if (!content) {
      throw new Error('Content not found');
    }
    
    if (content.userId !== userId) {
      throw new Error('Unauthorized to modify this content');
    }
    
    content.saveForever = saveForever;
    
    // Update in database
    if (this.useDatabase) {
      try {
        await Content.findByIdAndUpdate(contentId, {
          savedForever: saveForever,
          expiresAt: saveForever ? null : new Date(Date.now() + 24 * 60 * 60 * 1000)
        });
      } catch (error) {
        console.error('Failed to update save status in database:', error);
      }
    }
  }

  // Update caption (only owner can modify)
  async updateCaption(contentId: string, userId: string, caption: string): Promise<void> {
    const content = this.pool.get(contentId);
    
    if (!content) {
      throw new Error('Content not found');
    }
    
    if (content.userId !== userId) {
      throw new Error('Unauthorized to modify this content');
    }
    
    content.caption = caption;
    
    // Update in database
    if (this.useDatabase) {
      try {
        await Content.findByIdAndUpdate(contentId, { caption });
      } catch (error) {
        console.error('Failed to update caption in database:', error);
      }
    }
  }

  // Update NSFW status (only owner can modify)
  async updateNSFW(contentId: string, userId: string, isNSFW: boolean): Promise<void> {
    const content = this.pool.get(contentId);
    
    if (!content) {
      throw new Error('Content not found');
    }
    
    if (content.userId !== userId) {
      throw new Error('Unauthorized to modify this content');
    }
    
    content.isNSFW = isNSFW;
    
    // Update in database
    if (this.useDatabase) {
      try {
        await Content.findByIdAndUpdate(contentId, { isNSFW });
      } catch (error) {
        console.error('Failed to update NSFW status in database:', error);
      }
    }
  }

  // Clean up old content (>24 hours)
  cleanup() {
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    for (const [id, content] of this.pool.entries()) {
      // Skip content marked to save forever
      if (content.saveForever) {
        continue;
      }
      
      if (now - content.timestamp > twentyFourHours) {
        this.pool.delete(id);
        
        // Clean up from user seen lists
        for (const seenSet of this.userContent.values()) {
          seenSet.delete(id);
        }
      }
    }
    
    // Clean up database (run less frequently)
    if (this.useDatabase && Math.random() < 0.1) { // 10% chance each cleanup
      this.cleanupDatabase();
    }
  }
  
  // Clean up expired content from database and Cloudinary
  private async cleanupDatabase() {
    try {
      // Find expired content first to get cloudinaryIds
      const expiredContent = await Content.find({
        savedForever: false,
        expiresAt: { $lt: new Date() }
      }).lean();

      if (expiredContent.length === 0) {
        return;
      }

      // Delete from Cloudinary first
      const { deleteFromCloudinary } = await import('@/utils/cloudinary');
      let cloudinaryDeleteCount = 0;
      
      for (const content of expiredContent) {
        if (content.cloudinaryId) {
          try {
            await deleteFromCloudinary(content.cloudinaryId, content.mediaType);
            cloudinaryDeleteCount++;
          } catch (error) {
            console.error(`Failed to delete ${content.cloudinaryId} from Cloudinary:`, error);
          }
        }
      }

      // Then delete from database
      const result = await Content.deleteMany({
        savedForever: false,
        expiresAt: { $lt: new Date() }
      });

      if (result.deletedCount > 0) {
        console.log(`🗑️  Cleaned up ${result.deletedCount} expired content from database (${cloudinaryDeleteCount} from Cloudinary)`);
      }
    } catch (error) {
      console.error('Database cleanup failed:', error);
    }
  }
}

export const contentPool = new ContentPool();

// Run cleanup every hour
setInterval(() => contentPool.cleanup(), 60 * 60 * 1000);
