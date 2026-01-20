import { Router, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// GET /api/projects
router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const { status } = req.query;
        let where: any = {};

        if (status && status !== 'all') {
            where.status = status as string;
        }

        const projects = await prisma.project.findMany({
            where,
            orderBy: { startDate: 'desc' }
        });

        res.json(projects);
    } catch (error) {
        console.error('Get projects error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/projects/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const project = await prisma.project.findUnique({
            where: { id: req.params.id as string }
        });

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        res.json(project);
    } catch (error) {
        console.error('Get project error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/projects
router.post('/', async (req: AuthRequest, res: Response) => {
    try {
        const { code, name, description, buOwner, pm, budget, startDate, endDate, status } = req.body;
        const project = await prisma.project.create({
            data: {
                code,
                name,
                description,
                buOwner,
                pm,
                budget: budget ? parseFloat(budget) : 0,
                startDate: startDate ? new Date(startDate) : new Date(), // Default to now if missing
                endDate: endDate ? new Date(endDate) : null,
                status
            }
        });

        res.status(201).json(project);
    } catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/projects/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const { code, name, description, buOwner, pm, budget, startDate, endDate, status } = req.body;
        const project = await prisma.project.update({
            where: { id: req.params.id as string },
            data: {
                code,
                name,
                description,
                buOwner,
                pm,
                budget: budget ? parseFloat(budget) : undefined,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : null,
                status
            }
        });

        res.json(project);
    } catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/projects/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
    try {
        await prisma.project.delete({
            where: { id: req.params.id as string }
        });

        res.json({ message: 'Project deleted successfully' });
    } catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
