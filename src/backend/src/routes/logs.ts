import { Router, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// GET /api/logs
router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const { action, module, userId, limit = 100 } = req.query;

        const where: any = {};
        if (action && action !== 'all') where.action = action;
        if (module && module !== 'all') where.module = module;
        if (userId && userId !== 'all') where.userId = userId;

        const logs = await prisma.activityLog.findMany({
            where,
            include: {
                user: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: { timestamp: 'desc' },
            take: Number(limit)
        });

        const transformedLogs = logs.map(log => ({
            id: log.id,
            timestamp: log.timestamp.toLocaleString('vi-VN'),
            user: log.user?.name || 'System',
            action: log.action,
            module: log.module,
            description: log.description,
            ip: log.ip || 'N/A',
            status: log.status
        }));

        res.json(transformedLogs);
    } catch (error) {
        console.error('Get logs error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
