import { Router, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// GET /api/transactions
router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user!;
        const { buId, type, status, dateFrom, dateTo } = req.query;

        let where: any = {};

        // Role-based filtering - Use case-insensitive check
        const roleName = user.role.toLowerCase();
        let targetBuId: string | undefined = undefined;

        if (roleName !== 'ceo' && roleName !== 'admin') {
            targetBuId = user.buId || undefined;
        } else if (buId && buId !== 'all') {
            targetBuId = buId as string;
        }

        if (targetBuId) {
            // Need BU Name for indirect allocation check
            const bu = await prisma.businessUnit.findUnique({
                where: { id: targetBuId },
                select: { name: true } // optimize select
            });

            if (bu) {
                where.OR = [
                    { businessUnitId: targetBuId },
                    {
                        costAllocation: 'INDIRECT',
                        allocationPreviews: { some: { buName: bu.name } }
                    }
                ];
            } else {
                where.businessUnitId = targetBuId;
            }
        }

        // Additional filters
        if (type) {
            where.transactionType = (type as string).toUpperCase();
        }

        if (status) {
            where.approvalStatus = (status as string).toUpperCase();
        }

        if (dateFrom || dateTo) {
            where.transactionDate = {};
            if (dateFrom) {
                where.transactionDate.gte = new Date(dateFrom as string);
            }
            if (dateTo) {
                where.transactionDate.lte = new Date(dateTo as string);
            }
        }

        const transactions = await prisma.transaction.findMany({
            where,
            include: {
                category: true,
                project: true,
                partner: true,
                employee: true,
                businessUnit: true,
                paymentMethod: true,
                attachments: true,
                allocationPreviews: true
            },
            orderBy: { transactionDate: 'desc' }
        });

        res.json(transactions);
    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/transactions/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const transaction = await prisma.transaction.findUnique({
            where: { id: req.params.id as string },
            include: {
                category: true,
                project: true,
                partner: true,
                employee: true,
                businessUnit: true,
                paymentMethod: true,
                attachments: true,
                allocationPreviews: true
            }
        });

        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        res.json(transaction);
    } catch (error) {
        console.error('Get transaction error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/transactions
router.post('/', async (req: AuthRequest, res: Response) => {
    try {
        const data = req.body;

        // Set createdBy to current user
        data.createdBy = req.user!.id;

        if (data.approvalStatus === 'PENDING') {
            data.approvalStatus = 'PENDING';
        } else {
            data.approvalStatus = 'DRAFT';
        }

        // --- ATOMIC CODE GENERATION ---
        // Use transactionDate from form, fallback to current date if invalid
        let txnDate: Date;
        try {
            txnDate = data.transactionDate ? new Date(data.transactionDate) : new Date();
            // Validate date
            if (isNaN(txnDate.getTime())) {
                txnDate = new Date();
            }
        } catch (error) {
            txnDate = new Date();
        }

        const mm = String(txnDate.getMonth() + 1).padStart(2, '0');
        const yy = String(txnDate.getFullYear()).slice(-2);
        const prefix = data.transactionType === 'INCOME' ? 'T' :
            data.transactionType === 'EXPENSE' ? 'C' : 'V';
        const dateStr = `${mm}${yy}`;
        const sequenceKey = `TXN_${prefix}_${dateStr}`;

        // Atomic increment of sequence
        const sequence = await prisma.systemSequence.upsert({
            where: { key: sequenceKey },
            update: { value: { increment: 1 } },
            create: { key: sequenceKey, value: 1 }
        });

        const seqStr = String(sequence.value).padStart(2, '0');
        const atomicCode = `${prefix}${dateStr}_${seqStr}`;
        // ------------------------------

        const { attachments, allocationPreviews, ...txnData } = data;

        const transaction = await prisma.transaction.create({
            data: {
                ...txnData,
                transactionCode: atomicCode, // Override client code with atomic one
                attachments: attachments ? {
                    create: attachments
                } : undefined,
                allocationPreviews: allocationPreviews ? {
                    create: allocationPreviews
                } : undefined
            },
            include: {
                category: true,
                businessUnit: true,
                attachments: true,
                allocationPreviews: true
            }
        });

        // Create notifications for Admins and CEOs
        if (data.approvalStatus === 'PENDING') {
            try {
                const adminsAndCeos = await (prisma as any).user.findMany({
                    where: {
                        role: {
                            name: {
                                in: ['Admin', 'CEO'],
                                mode: 'insensitive'
                            }
                        }
                    }
                });

                await (prisma as any).notification.createMany({
                    data: adminsAndCeos.map((u: any) => ({
                        userId: u.id,
                        message: `Phiếu ${data.transactionType === 'INCOME' ? 'thu' : 'chi'} #${atomicCode} chờ duyệt`,
                        type: 'warning',
                        unread: true
                    }))
                });
            } catch (notifErr) {
                console.error('Failed to create notifications:', notifErr);
            }
        }

        res.status(201).json(transaction);
    } catch (error) {
        console.error('Create transaction error:', error);
        console.error('Request body:', req.body);

        // Send detailed error message
        if (error instanceof Error) {
            res.status(500).json({
                error: 'Internal server error',
                message: error.message,
                details: error.stack
            });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

// PUT /api/transactions/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const { attachments, allocationPreviews, ...txnData } = req.body;

        const transaction = await prisma.transaction.update({
            where: { id: req.params.id as string },
            data: {
                ...txnData,
                attachments: attachments ? {
                    deleteMany: {},
                    create: attachments
                } : undefined,
                allocationPreviews: allocationPreviews ? {
                    deleteMany: {},
                    create: allocationPreviews
                } : undefined
            },
            include: {
                category: true,
                businessUnit: true,
                attachments: true,
                allocationPreviews: true
            }
        });

        res.json(transaction);
    } catch (error) {
        console.error('Update transaction error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/transactions/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
    try {
        await prisma.transaction.delete({
            where: { id: req.params.id as string }
        });

        res.json({ message: 'Transaction deleted successfully' });
    } catch (error) {
        console.error('Delete transaction error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/transactions/:id/approve
router.put('/:id/approve', async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user!;
        const roleName = user.role.toLowerCase();
        // Only CEO, Admin, or BU Manager can approve
        if (roleName !== 'ceo' && roleName !== 'admin' && roleName !== 'trưởng bu') {
            return res.status(403).json({ error: 'You do not have permission to approve transactions' });
        }

        const transaction = await prisma.transaction.update({
            where: { id: req.params.id as string },
            data: {
                approvalStatus: 'APPROVED',
                paymentStatus: 'PAID', // Auto-update to PAID when approved
                rejectionReason: null
            },
            include: {
                category: true,
                businessUnit: true
            }
        });

        // Notify the creator
        if (transaction.createdBy) {
            try {
                await (prisma as any).notification.create({
                    data: {
                        userId: transaction.createdBy,
                        message: `Phiếu ${transaction.transactionType === 'INCOME' ? 'thu' : 'chi'} #${transaction.transactionCode} đã được duyệt`,
                        type: 'success',
                        unread: true
                    }
                });
            } catch (notifErr) {
                console.error('Failed to create notification:', notifErr);
            }
        }

        res.json(transaction);
    } catch (error) {
        console.error('Approve transaction error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/transactions/:id/reject
router.put('/:id/reject', async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user!;
        const { reason } = req.body;
        const roleName = user.role.toLowerCase();
        // Only CEO, Admin, or BU Manager can reject
        if (roleName !== 'ceo' && roleName !== 'admin' && roleName !== 'trưởng bu') {
            return res.status(403).json({ error: 'You do not have permission to reject transactions' });
        }

        if (!reason) {
            return res.status(400).json({ error: 'Rejection reason is required' });
        }

        const transaction = await prisma.transaction.update({
            where: { id: req.params.id as string },
            data: {
                approvalStatus: 'REJECTED',
                rejectionReason: reason
            },
            include: {
                category: true,
                businessUnit: true
            }
        });

        // Notify the creator
        if (transaction.createdBy) {
            try {
                await (prisma as any).notification.create({
                    data: {
                        userId: transaction.createdBy,
                        message: `Phiếu ${transaction.transactionType === 'INCOME' ? 'thu' : 'chi'} #${transaction.transactionCode} bị từ chối: ${reason}`,
                        type: 'error',
                        unread: true
                    }
                });
            } catch (notifErr) {
                console.error('Failed to create notification:', notifErr);
            }
        }

        res.json(transaction);
    } catch (error) {
        console.error('Reject transaction error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
