import { Router, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// GET /api/allocation-rules
router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const rules = await prisma.allocationRule.findMany({
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: { transactions: true }
                }
            }
        });
        res.json(rules);
    } catch (error) {
        console.error('Get allocation rules error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/allocation-rules
router.post('/', async (req: AuthRequest, res: Response) => {
    try {
        const rule = await prisma.allocationRule.create({
            data: req.body
        });
        res.status(201).json(rule);
    } catch (error) {
        console.error('Create allocation rule error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/allocation-rules/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const rule = await prisma.allocationRule.update({
            where: { id: req.params.id as string },
            data: req.body
        });
        res.json(rule);
    } catch (error) {
        console.error('Update allocation rule error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/allocation-rules/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
    try {
        // Check if used
        const rule: any = await prisma.allocationRule.findUnique({
            where: { id: req.params.id as string },
            include: { _count: { select: { transactions: true } } }
        });

        if (rule && rule._count.transactions > 0) {
            return res.status(400).json({ error: 'Cannot delete rule that is being used by transactions' });
        }

        await prisma.allocationRule.delete({
            where: { id: req.params.id as string }
        });
        res.json({ message: 'Deleted successfully' });
    } catch (error) {
        console.error('Delete allocation rule error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
