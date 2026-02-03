import { Router, Response } from 'express';
import prisma from '../utils/prisma';
import bcrypt from 'bcryptjs';
import { authenticate, AuthRequest } from '../middleware/auth';
import { auditService } from '../services/auditService';

const router = Router();
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

// GET /api/users
router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            include: {
                role: true,
                businessUnit: true,
                loginHistory: {
                    orderBy: { timestamp: 'desc' },
                    take: 3
                }
            }
        });

        const transformedUsers = users.map(user => ({
            id: user.id,
            userId: user.email.split('@')[0].toUpperCase(), // Simple unique ID generation
            fullName: user.fullName || user.name,
            email: user.email,
            role: user.role?.name || 'N/A',
            roleId: user.roleId,
            businessUnits: user.businessUnit ? [user.businessUnit.name] : [],
            dataScope: user.dataScope,
            status: user.status,
            lastLogin: user.lastLogin ? user.lastLogin.toLocaleString('vi-VN') : 'Chưa đăng nhập',
            createdDate: user.createdAt.toLocaleDateString('vi-VN'),
            twoFAEnabled: user.twoFAEnabled,
            loginHistory: user.loginHistory.map(h => ({
                timestamp: h.timestamp.toLocaleString('vi-VN'),
                ip: h.ip || 'N/A',
                device: h.device || 'N/A'
            }))
        }));

        res.json(transformedUsers);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/users
router.post('/', async (req: AuthRequest, res: Response) => {
    try {
        const { fullName, email, password, roleId, buId, dataScope, status, twoFAEnabled } = req.body;

        const hashedPassword = await bcrypt.hash(password || 'admin123', 10);

        const user = await prisma.user.create({
            data: {
                fullName,
                name: fullName,
                email,
                password: hashedPassword,
                roleId,
                buId,
                dataScope: dataScope || 'personal',
                status: status || 'active',
                twoFAEnabled: !!twoFAEnabled
            },
            include: {
                role: true,
                businessUnit: true
            }
        });

        // Audit Log for CREATE
        await auditService.log({
            tableName: 'User',
            recordId: user.id,
            action: 'CREATE',
            userId: req.user!.id,
            newValues: user,
            ipAddress: req.ip as string,
            userAgent: req.headers['user-agent'] as string
        });

        res.status(201).json(user);
    } catch (error: any) {
        console.error('Create user error:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Email already exists' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/users/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { fullName, email, roleId, buId, dataScope, status, twoFAEnabled, password } = req.body;

        const currentUser = await prisma.user.findUnique({ where: { id } });
        if (!currentUser) return res.status(404).json({ error: 'User not found' });

        const updateData: any = {
            fullName,
            name: fullName,
            email,
            roleId,
            buId,
            dataScope,
            status,
            twoFAEnabled
        };

        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const user = await prisma.user.update({
            where: { id },
            data: updateData,
            include: {
                role: true,
                businessUnit: true
            }
        });

        // Audit Log for UPDATE
        await auditService.log({
            tableName: 'User',
            recordId: user.id,
            action: 'UPDATE',
            userId: req.user!.id,
            oldValues: currentUser,
            newValues: user,
            changes: getChanges(currentUser, user),
            ipAddress: req.ip as string,
            userAgent: req.headers['user-agent'] as string
        });

        res.json(user);
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/users/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const currentUser = await prisma.user.findUnique({ where: { id } });
        if (!currentUser) return res.status(404).json({ error: 'User not found' });

        await prisma.user.delete({ where: { id } });

        // Audit Log for DELETE
        await auditService.log({
            tableName: 'User',
            recordId: id,
            action: 'DELETE',
            userId: req.user!.id,
            oldValues: currentUser,
            ipAddress: req.ip as string,
            userAgent: req.headers['user-agent'] as string
        });

        res.json({ message: 'User deleted' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/users/:id/toggle-lock
router.post('/:id/toggle-lock', async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const oldUser = { ...user };
        const newStatus = user.status === 'active' ? 'locked' : 'active';
        const updatedUser = await prisma.user.update({
            where: { id },
            data: { status: newStatus }
        });

        // Audit Log for UPDATE (Lock/Unlock)
        await auditService.log({
            tableName: 'User',
            recordId: id,
            action: 'UPDATE',
            userId: req.user!.id,
            oldValues: oldUser,
            newValues: updatedUser,
            reason: `Toggled lock to ${newStatus}`,
            ipAddress: req.ip as string,
            userAgent: req.headers['user-agent'] as string
        });

        res.json({ status: newStatus });
    } catch (error) {
        console.error('Toggle lock error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
