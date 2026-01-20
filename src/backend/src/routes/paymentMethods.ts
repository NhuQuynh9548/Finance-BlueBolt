import { Router, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// GET /api/payment-methods
router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const paymentMethods = await prisma.paymentMethod.findMany({
            orderBy: { name: 'asc' },
            include: { _count: { select: { transactions: true, partners: true } } }
        });

        res.json(paymentMethods);
    } catch (error) {
        console.error('Get payment methods error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/payment-methods
router.post('/', async (req: AuthRequest, res: Response) => {
    try {
        const paymentMethod = await prisma.paymentMethod.create({
            data: req.body
        });

        res.status(201).json(paymentMethod);
    } catch (error) {
        console.error('Create payment method error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/payment-methods/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const paymentMethod = await prisma.paymentMethod.update({
            where: { id: req.params.id as string },
            data: req.body
        });
        res.json(paymentMethod);
    } catch (error) {
        console.error('Update payment method error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/payment-methods/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const pm: any = await prisma.paymentMethod.findUnique({
            where: { id: req.params.id as string },
            include: { _count: { select: { transactions: true, partners: true } } }
        });

        if (pm && (pm._count.transactions > 0 || pm._count.partners > 0)) {
            return res.status(400).json({ error: 'Cannot delete payment method used in transactions or partners' });
        }

        await prisma.paymentMethod.delete({
            where: { id: req.params.id as string }
        });
        res.json({ message: 'Deleted successfully' });
    } catch (error) {
        console.error('Delete payment method error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
