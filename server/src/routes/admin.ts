import { Router } from 'express';
import { protect } from '@/middleware/auth';
import { requireAdmin } from '@/middleware/admin';
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  toggleUserBlock,
  getAdminStats,
} from '@/controllers/adminController';

const router = Router();

// All admin routes require authentication and admin role
router.use(protect, requireAdmin);

// Admin stats
router.get('/stats', getAdminStats);

// User management
router.get('/users', getAllUsers);
router.get('/users/:userId', getUserById);
router.put('/users/:userId', updateUser);
router.delete('/users/:userId', deleteUser);
router.post('/users/:userId/toggle-block', toggleUserBlock);

export default router;
