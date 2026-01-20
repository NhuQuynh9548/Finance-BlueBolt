import { Router, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// GET /api/roles
router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const roles = await prisma.role.findMany({
            include: {
                _count: {
                    select: { users: true }
                }
            }
        });

        const transformedRoles = roles.map(role => ({
            id: role.id,
            name: role.name,
            description: role.description,
            permissionCount: Array.isArray(role.permissions) ? role.permissions.length : 0,
            userCount: role._count.users,
            createdDate: role.createdAt.toLocaleDateString('vi-VN'),
            isSystemRole: role.isSystemRole,
            permissions: role.permissions || []
        }));

        res.json(transformedRoles);
    } catch (error) {
        console.error('Get roles error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/roles
router.post('/', async (req: AuthRequest, res: Response) => {
    try {
        console.log('Creating role with data:', req.body);
        const { name, description, permissions } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Role name is required' });
        }

        const role = await prisma.role.create({
            data: {
                name,
                description,
                permissions: permissions || [],
                isSystemRole: false
            }
        });
        res.status(201).json(role);
    } catch (error: any) {
        console.error('Create role error details:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Vai trò này đã tồn tại' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/roles/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, description, permissions } = req.body;
        const role = await prisma.role.update({
            where: { id },
            data: { name, description, permissions }
        });
        res.json(role);
    } catch (error: any) {
        console.error('Update role error details:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Tên vai trò này đã tồn tại' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/roles/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const role = await prisma.role.findUnique({ where: { id } });
        if (role?.isSystemRole) {
            return res.status(403).json({ error: 'Cannot delete system roles' });
        }
        await prisma.role.delete({ where: { id } });
        res.json({ message: 'Role deleted' });
    } catch (error) {
        console.error('Delete role error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
