import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { auditService } from '../services/auditService';

const router = Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login to the system
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Missing email or password
 *       401:
 *         description: Invalid credentials
 */
// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                businessUnit: true,
                role: true
            }
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
        const expiresIn = (process.env.JWT_EXPIRES_IN || '24h') as any;

        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email,
                role: user.role?.name || null,
                buId: user.buId
            },
            secret,
            { expiresIn }
        );

        // Audit Log for LOGIN
        await auditService.log({
            tableName: 'User',
            recordId: user.id,
            action: 'LOGIN',
            userId: user.id,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'] as string
        });

        // Return user data (without password)
        const { password: _, ...userWithoutPassword } = user;

        res.json({
            token,
            user: {
                ...userWithoutPassword,
                role: user.role?.name || null,
                buName: user.businessUnit?.name || null
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Not authenticated
 */
// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: {
                businessUnit: true,
                role: true
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const { password: _, ...userWithoutPassword } = user;

        res.json({
            ...userWithoutPassword,
            role: user.role?.name || null,
            buName: user.businessUnit?.name || null
        });
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/auth/logout
router.post('/logout', authenticate, async (req: AuthRequest, res: Response) => {
    // With JWT, logout is handled client-side by removing the token
    if (req.user) {
        await auditService.log({
            tableName: 'User',
            recordId: req.user.id,
            action: 'LOGOUT',
            userId: req.user.id,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'] as string
        });
    }
    res.json({ message: 'Logged out successfully' });
});

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     summary: Update current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               fullName:
 *                 type: string
 *               avatar:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
// PUT /api/auth/profile
router.put('/profile', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const { name, fullName, avatar } = req.body;

        const currentProfile = await prisma.user.findUnique({ where: { id: req.user.id } });

        const updatedUser = await prisma.user.update({
            where: { id: req.user.id },
            data: {
                name: name || undefined,
                fullName: fullName || undefined,
                avatar: avatar || undefined
            },
            include: {
                businessUnit: true,
                role: true
            }
        });

        // Audit Log for UPDATE
        await auditService.log({
            tableName: 'User',
            recordId: req.user.id,
            action: 'UPDATE',
            userId: req.user.id,
            oldValues: currentProfile,
            newValues: updatedUser,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'] as string
        });

        const { password: _, ...userWithoutPassword } = updatedUser;

        res.json({
            ...userWithoutPassword,
            role: updatedUser.role?.name || null,
            buName: updatedUser.businessUnit?.name || null
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Change current user password
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Invalid current password
 */
// POST /api/auth/change-password
router.post('/change-password', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current password and new password are required' });
        }

        const user = await prisma.user.findUnique({
            where: { id: req.user.id }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        if (!isValidPassword) {
            return res.status(400).json({ error: 'Mật khẩu hiện tại không chính xác' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await prisma.user.update({
            where: { id: req.user.id },
            data: { password: hashedPassword }
        });

        // Audit Log for Change Password
        await auditService.log({
            tableName: 'User',
            recordId: req.user.id,
            action: 'UPDATE',
            userId: req.user.id,
            reason: 'Đổi mật khẩu',
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'] as string
        });

        res.json({ message: 'Đổi mật khẩu thành công' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
