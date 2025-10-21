// In-memory queue for swap matching
// In production, use Redis for scalability

interface QueueEntry {
  userId: string;
  photoUrl: string;
  isNSFW: boolean;
  socketId: string;
  timestamp: number;
}

class SwapQueue {
  private queue: Map<string, QueueEntry> = new Map();

  // Add user to queue
  add(entry: QueueEntry) {
    this.queue.set(entry.userId, entry);
  }

  // Find a match for the user
  findMatch(userId: string, isNSFW: boolean): QueueEntry | null {
    const entries = Array.from(this.queue.values());
    
    // Find someone with matching NSFW preference who isn't the same user
    const match = entries.find(
      entry => entry.userId !== userId && entry.isNSFW === isNSFW
    );

    if (match) {
      // Remove matched user from queue
      this.queue.delete(match.userId);
      return match;
    }

    return null;
  }

  // Remove user from queue
  remove(userId: string) {
    this.queue.delete(userId);
  }

  // Get queue size
  size(): number {
    return this.queue.size;
  }

  // Clean up old entries (> 5 minutes)
  cleanup() {
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    for (const [userId, entry] of this.queue.entries()) {
      if (now - entry.timestamp > fiveMinutes) {
        this.queue.delete(userId);
      }
    }
  }
}

export const swapQueue = new SwapQueue();

// Run cleanup every minute
setInterval(() => swapQueue.cleanup(), 60 * 1000);
