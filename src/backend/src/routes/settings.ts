import { Router, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// GET /api/settings
router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const settings = await prisma.systemSetting.findMany();

        // Transform into a key-value object for easier frontend use
        const settingsMap = settings.reduce((acc: any, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});

        res.json(settingsMap);
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/settings
router.post('/', async (req: AuthRequest, res: Response) => {
    try {
        const settingsData = req.body;

        for (const [key, value] of Object.entries(settingsData)) {
            await prisma.systemSetting.upsert({
                where: { key },
                update: { value: String(value) },
                create: {
                    key,
                    value: String(value),
                    category: 'security' // Default for now
                }
            });
        }

        res.json({ message: 'Settings updated successfully' });
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
