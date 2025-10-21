import { Router } from 'express';
import { optionalAuth } from '@/middleware/auth';

const router = Router();

router.get('/', optionalAuth, async (req: any, res: any) => {
  res.json({ message: 'Get public feed - TODO' });
});

router.get('/trending', optionalAuth, async (req: any, res: any) => {
  res.json({ message: 'Get trending feed - TODO' });
});

router.get('/search', optionalAuth, async (req: any, res: any) => {
  res.json({ message: 'Search feed - TODO' });
});

export default router;