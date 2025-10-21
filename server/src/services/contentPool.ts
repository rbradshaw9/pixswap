// Content pool for storing and serving uploaded media
// In production, use MongoDB or Redis with proper persistence

interface ContentEntry {
  id: string;
  userId: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  isNSFW: boolean;
  timestamp: number;
  views: number;
  reactions: number;
  comments?: number;
  saveForever?: boolean;
}

class ContentPool {
  private pool: Map<string, ContentEntry> = new Map();
  private userContent: Map<string, Set<string>> = new Map(); // Track what each user has seen

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

    this.pool.set(id, content);
    
    // Clean up old content (>24 hours)
    this.cleanup();
    
    return content;
  }

  // Get random content from pool (excluding user's own and already seen)
  async getRandom(userId: string, isNSFW: boolean): Promise<ContentEntry | null> {
    const seenContent = this.userContent.get(userId) || new Set<string>();
    
    // Filter available content
    const available = Array.from(this.pool.values()).filter(content => 
      content.userId !== userId && // Not user's own content
      content.isNSFW === isNSFW && // Matching NSFW preference
      !seenContent.has(content.id) // Haven't seen it yet
    );

    if (available.length === 0) {
      // If no unseen content, allow re-showing content (reset seen list)
      const resetAvailable = Array.from(this.pool.values()).filter(content =>
        content.userId !== userId &&
        content.isNSFW === isNSFW
      );

      if (resetAvailable.length === 0) {
        return null;
      }

      // Clear seen list for this user
      seenContent.clear();
      this.userContent.set(userId, seenContent);

      // Pick random from reset list
      const randomIndex = Math.floor(Math.random() * resetAvailable.length);
      const selected = resetAvailable[randomIndex];

      if (!selected) return null;

      // Mark as seen
      seenContent.add(selected.id);
      selected.views++;

      return selected;
    }

    // Pick random from available
    const randomIndex = Math.floor(Math.random() * available.length);
    const selected = available[randomIndex];

    if (!selected) return null;

    // Mark as seen
    seenContent.add(selected.id);
    this.userContent.set(userId, seenContent);
    selected.views++;

    return selected;
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
    }
  }

  // Add comment count to content
  async addComment(id: string): Promise<void> {
    const content = this.pool.get(id);
    if (content) {
      content.comments = (content.comments || 0) + 1;
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
    const userContent = Array.from(this.pool.values()).filter(
      content => content.userId === userId
    );
    
    // Sort by most recent first
    return userContent.sort((a, b) => b.timestamp - a.timestamp);
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
    
    this.pool.delete(contentId);
    
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
  }
}

export const contentPool = new ContentPool();

// Run cleanup every hour
setInterval(() => contentPool.cleanup(), 60 * 60 * 1000);
