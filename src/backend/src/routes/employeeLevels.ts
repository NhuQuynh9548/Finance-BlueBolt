import { Router, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// GET /api/employee-levels
router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const levels = await prisma.employeeLevel.findMany({
            orderBy: { createdAt: 'desc' },
            include: { _count: { select: { employees: true } } }
        });

        res.json(levels);
    } catch (error) {
        console.error('Get employee levels error:', error);
        res.status(500).json({ error: 'Internal server error', details: String(error) });
    }
});

// POST /api/employee-levels
router.post('/', async (req: AuthRequest, res: Response) => {
    try {
        const { code, name, description, order } = req.body;
        const level = await prisma.employeeLevel.create({
            data: {
                code,
                name,
                description,
                order: order ? parseInt(order) : 0
            }
        });

        res.status(201).json(level);
    } catch (error) {
        console.error('Create employee level error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/employee-levels/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const { code, name, description, order } = req.body;
        const level = await prisma.employeeLevel.update({
            where: { id: req.params.id as string },
            data: {
                code,
                name,
                description,
                order: order ? parseInt(order) : undefined
            }
        });
        res.json(level);
    } catch (error) {
        console.error('Update employee level error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/employee-levels/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const level: any = await prisma.employeeLevel.findUnique({
            where: { id: req.params.id as string },
            include: { _count: { select: { employees: true } } }
        });

        if (level && level._count.employees > 0) {
            return res.status(400).json({ error: 'Cannot delete level assigned to employees' });
        }

        await prisma.employeeLevel.delete({
            where: { id: req.params.id as string }
        });
        res.json({ message: 'Deleted successfully' });
    } catch (error) {
        console.error('Delete employee level error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
