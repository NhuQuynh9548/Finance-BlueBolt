import { Router, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// GET /api/specializations
router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const specializations = await prisma.specialization.findMany({
            orderBy: { name: 'asc' },
            include: { _count: { select: { employees: true } } }
        });

        res.json(specializations);
    } catch (error) {
        console.error('Get specializations error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/specializations
router.post('/', async (req: AuthRequest, res: Response) => {
    try {
        const { code, name, description } = req.body;
        const specialization = await prisma.specialization.create({
            data: {
                code,
                name,
                description
            }
        });

        res.status(201).json(specialization);
    } catch (error: any) {
        console.error('Create specialization error:', error);
        if (error.code === 'P2002') {
            const field = error.meta?.target?.join(', ');
            return res.status(400).json({ error: `${field} đã tồn tại` });
        }
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// PUT /api/specializations/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { code, name, description } = req.body;

        const specialization = await prisma.specialization.update({
            where: { id: id as string },
            data: {
                code,
                name,
                description
            }
        });
        res.json(specialization);
    } catch (error: any) {
        console.error('Update specialization error:', error);
        if (error.code === 'P2002') {
            const field = error.meta?.target?.join(', ');
            return res.status(400).json({ error: `${field} đã tồn tại` });
        }
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// DELETE /api/specializations/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const spec: any = await prisma.specialization.findUnique({
            where: { id: req.params.id as string },
            include: { _count: { select: { employees: true } } }
        });

        if (spec && spec._count.employees > 0) {
            return res.status(400).json({ error: 'Cannot delete specialization assigned to employees' });
        }

        await prisma.specialization.delete({
            where: { id: req.params.id as string }
        });
        res.json({ message: 'Deleted successfully' });
    } catch (error) {
        console.error('Delete specialization error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
