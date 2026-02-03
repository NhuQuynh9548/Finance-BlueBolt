import { Router, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { auditService } from '../services/auditService';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Helper function to calculate differences between objects
function getChanges(oldVal: any, newVal: any) {
    const changes: any = {};
    if (!oldVal || !newVal) return null;

    Object.keys(newVal).forEach(key => {
        if (JSON.stringify(oldVal[key]) !== JSON.stringify(newVal[key])) {
            changes[key] = {
                old: oldVal[key],
                new: newVal[key]
            };
        }
    });
    return Object.keys(changes).length > 0 ? changes : null;
}

// GET /api/categories
router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const { type, status } = req.query;

        let where: any = {};

        if (type && type !== 'all') {
            where.type = type.toString().toUpperCase();
        }

        if (status && status !== 'all') {
            where.status = status.toString().toUpperCase();
        }

        const categories = await prisma.category.findMany({
            where,
            orderBy: { code: 'asc' }
        });

        // Transform to match frontend format
        const transformedCategories = categories.map(cat => ({
            id: cat.id,
            code: cat.code,
            name: cat.name,
            type: cat.type.toLowerCase().replace('_', '-'),
            description: cat.description,
            status: cat.status.toLowerCase()
        }));

        res.json(transformedCategories);
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/categories
router.post('/', async (req: AuthRequest, res: Response) => {
    try {
        const { code, name, type, description, status } = req.body;

        const category = await prisma.category.create({
            data: {
                code,
                name,
                type: type.toUpperCase().replace('-', '_'),
                description,
                status: status ? status.toUpperCase() : 'ACTIVE'
            }
        });

        // Audit Log for CREATE
        await auditService.log({
            tableName: 'Category',
            recordId: category.id,
            action: 'CREATE',
            userId: req.user!.id,
            newValues: category,
            ipAddress: req.ip as string,
            userAgent: req.headers['user-agent'] as string
        });

        res.status(201).json(category);
    } catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/categories/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { code, name, type, description, status } = req.body;

        const currentCategory = await prisma.category.findUnique({ where: { id } });
        if (!currentCategory) return res.status(404).json({ error: 'Category not found' });

        const category = await prisma.category.update({
            where: { id },
            data: {
                code,
                name,
                type: type.toUpperCase().replace('-', '_'),
                description,
                status: status.toUpperCase()
            }
        });

        // Audit Log for UPDATE
        await auditService.log({
            tableName: 'Category',
            recordId: category.id,
            action: 'UPDATE',
            userId: req.user!.id,
            oldValues: currentCategory,
            newValues: category,
            changes: getChanges(currentCategory, category),
            ipAddress: req.ip as string,
            userAgent: req.headers['user-agent'] as string
        });

        res.json(category);
    } catch (error) {
        console.error('Update category error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/categories/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const currentCategory = await prisma.category.findUnique({ where: { id } });
        if (!currentCategory) return res.status(404).json({ error: 'Category not found' });

        await prisma.category.delete({
            where: { id }
        });

        // Audit Log for DELETE
        await auditService.log({
            tableName: 'Category',
            recordId: id,
            action: 'DELETE',
            userId: req.user!.id,
            oldValues: currentCategory,
            ipAddress: req.ip as string,
            userAgent: req.headers['user-agent'] as string
        });

        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
