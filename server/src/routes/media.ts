import { Router } from 'express';
import { protect } from '@/middleware/auth';

const router = Router();

router.post('/upload', protect, async (req: any, res: any) => {
  res.json({ message: 'Upload media - TODO' });
});

router.get('/:id', async (req: any, res: any) => {
  res.json({ message: 'Get media - TODO' });
});

router.post('/:id/like', protect, async (req: any, res: any) => {
  res.json({ message: 'Like media - TODO' });
});

router.delete('/:id/like', protect, async (req: any, res: any) => {
  res.json({ message: 'Unlike media - TODO' });
});

router.post('/:id/comment', protect, async (req: any, res: any) => {
  res.json({ message: 'Comment on media - TODO' });
});

export default router;