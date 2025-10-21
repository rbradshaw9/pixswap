import { Router } from 'express';
import { protect } from '@/middleware/auth';

const router = Router();

router.get('/rooms', protect, async (req: any, res: any) => {
  res.json({ message: 'Get chat rooms - TODO' });
});

router.post('/rooms', protect, async (req: any, res: any) => {
  res.json({ message: 'Create chat room - TODO' });
});

router.get('/rooms/:id/messages', protect, async (req: any, res: any) => {
  res.json({ message: 'Get chat messages - TODO' });
});

router.post('/rooms/:id/messages', protect, async (req: any, res: any) => {
  res.json({ message: 'Send message - TODO' });
});

export default router;