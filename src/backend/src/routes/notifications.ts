import { Router } from 'express';
import prisma from '../utils/prisma';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// Get notifications for current user
router.get('/', async (req: any, res) => {
    try {
        const notifications = await (prisma as any).notification.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// Mark notification as read
router.put('/:id/read', async (req: any, res) => {
    try {
        const { id } = req.params;
        const notification = await (prisma as any).notification.update({
            where: { id },
            data: { unread: false }
        });
        res.json(notification);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update notification' });
    }
});

// Mark all as read
router.put('/mark-all-read', async (req: any, res) => {
    try {
        await (prisma as any).notification.updateMany({
            where: { userId: req.user.id, unread: true },
            data: { unread: false }
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update notifications' });
    }
});

export default router;
