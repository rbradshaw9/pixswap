import { Router } from 'express';
import { protect } from '@/middleware/auth';

const router = Router();

router.post('/join', protect, async (req: any, res: any) => {
  res.json({ message: 'Join swap queue - TODO' });
});

router.get('/active', protect, async (req: any, res: any) => {
  res.json({ message: 'Get active swaps - TODO' });
});

router.post('/:id/submit', protect, async (req: any, res: any) => {
  res.json({ message: 'Submit media for swap - TODO' });
});

router.post('/:id/reveal', protect, async (req: any, res: any) => {
  res.json({ message: 'Reveal swap - TODO' });
});

export default router;