import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
        buId: string | null;
        roleName?: string;
    };
}

export const authenticate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.substring(7);
        const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

        const decoded = jwt.verify(token, secret) as {
            userId: string;
            email: string;
            role: string;
            buId: string | null;
        };

        // Verify user still exists
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            include: { role: true }
        });

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        req.user = {
            id: user.id,
            email: user.email,
            role: user.role?.name || 'Staff', // Support new Role model
            buId: user.buId
        };

        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};
