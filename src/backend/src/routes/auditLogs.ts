import { Router, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// GET /api/audit-logs/transaction/:id - Get logs for specific transaction
router.get('/transaction/:id', async (req: AuthRequest, res: Response) => {
    try {
        const logs = await prisma.auditLog.findMany({
            where: {
                tableName: 'Transaction',
                recordId: req.params.id
            },
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        role: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(logs);
    } catch (error) {
        console.error('Get transaction audit logs error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
