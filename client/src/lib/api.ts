import { apiService } from '@/services/api';

export const api = {
  get: apiService.get.bind(apiService),
  post: apiService.post.bind(apiService),
  put: apiService.put.bind(apiService),
  delete: apiService.delete.bind(apiService),
  upload: apiService.upload.bind(apiService),
  getInstance: () => apiService.getInstance(),
};
