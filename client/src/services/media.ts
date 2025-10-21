import type { Media, MediaUploadForm, Comment, PaginatedResponse, FeedParams } from '@/types';
import { apiService } from './api';

export class MediaService {
  async uploadMedia(data: MediaUploadForm): Promise<Media> {
    const response = await apiService.upload<Media>('/media/upload', data.file, {
      caption: data.caption,
      tags: data.tags?.join(','),
      visibility: data.visibility,
      expiresAt: data.expiresAt?.toISOString(),
    });
    
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Upload failed');
  }

  async getMedia(id: string): Promise<Media> {
    const response = await apiService.get<Media>(`/media/${id}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to get media');
  }

  async deleteMedia(id: string): Promise<void> {
    const response = await apiService.delete(`/media/${id}`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete media');
    }
  }

  async likeMedia(id: string): Promise<void> {
    const response = await apiService.post(`/media/${id}/like`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to like media');
    }
  }

  async unlikeMedia(id: string): Promise<void> {
    const response = await apiService.delete(`/media/${id}/like`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to unlike media');
    }
  }

  async addComment(mediaId: string, content: string): Promise<Comment> {
    const response = await apiService.post<Comment>(`/media/${mediaId}/comment`, {
      content,
    });
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to add comment');
  }

  async getComments(mediaId: string, page = 1, limit = 20): Promise<PaginatedResponse<Comment>> {
    return await apiService.getPaginated<Comment>(`/media/${mediaId}/comments`, {
      page,
      limit,
    });
  }

  async getFeed(params: FeedParams = {}): Promise<PaginatedResponse<Media>> {
    return await apiService.getPaginated<Media>('/feed', params);
  }

  async getTrendingFeed(params: FeedParams = {}): Promise<PaginatedResponse<Media>> {
    return await apiService.getPaginated<Media>('/feed/trending', params);
  }

  async searchMedia(query: string, page = 1, limit = 20): Promise<PaginatedResponse<Media>> {
    return await apiService.getPaginated<Media>('/feed/search', {
      q: query,
      page,
      limit,
    });
  }
}

export const mediaService = new MediaService();