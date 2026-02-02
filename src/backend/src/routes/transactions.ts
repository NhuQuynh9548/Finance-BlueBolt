import { Router, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// Helper function to create audit log
async function createAuditLog(params: {
    tableName: string;
    recordId: string;
    action: string;
    userId: string;
    oldValues?: any;
    newValues?: any;
    reason?: string;
    req?: any;
}) {
    try {
        const changes: any = {};

        if (params.oldValues && params.newValues) {
            // Calculate differences
            Object.keys(params.newValues).forEach(key => {
                if (JSON.stringify(params.oldValues[key]) !== JSON.stringify(params.newValues[key])) {
                    changes[key] = {
                        old: params.oldValues[key],
                        new: params.newValues[key]
                    };
                }
            });
        }

        await prisma.auditLog.create({
            data: {
                tableName: params.tableName,
                recordId: params.recordId,
                action: params.action,
                userId: params.userId,
                oldValues: params.oldValues || null,
                newValues: params.newValues || null,
                changes: Object.keys(changes).length > 0 ? changes : null,
                reason: params.reason,
                ipAddress: params.req?.ip || params.req?.connection?.remoteAddress,
                userAgent: params.req?.headers?.['user-agent']
            }
        });
    } catch (error) {
        console.error('Failed to create audit log:', error);
    }
}


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
                allocationPreviews: true,
                creator: {
                    select: {
                        name: true,
                        fullName: true
                    }
                }
            },
            orderBy: { transactionCode: 'asc' }
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
                allocationPreviews: true,
                creator: {
                    select: {
                        name: true,
                        fullName: true
                    }
                }
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

        // Default to APPROVED for all new transactions
        data.approvalStatus = 'APPROVED';

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
                allocationPreviews: true,
                creator: {
                    select: {
                        name: true,
                        fullName: true
                    }
                }
            }
        });

        // Notify the creator
        try {
            await (prisma as any).notification.create({
                data: {
                    userId: req.user!.id,
                    message: `Bạn đã tạo phiếu ${data.transactionType === 'INCOME' ? 'thu' : 'chi'} #${atomicCode} thành công`,
                    type: 'info',
                    unread: true,
                    relatedId: transaction.id,
                    targetPath: '/quan-ly-thu-chi'
                }
            });
        } catch (notifErr) {
            console.error('Failed to create creator notification:', notifErr);
        }

        res.status(201).json(transaction);
    } catch (error) {
        console.error('Create transaction error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/transactions/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const user = req.user!;
        const roleName = user.role.toLowerCase();

        const currentTxn = await prisma.transaction.findUnique({
            where: { id }
        });

        if (!currentTxn) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        // Only Admin and CEO can edit approved transactions
        const canEditApproved = roleName === 'admin' || roleName === 'ceo';
        if (currentTxn.approvalStatus === 'APPROVED' && !canEditApproved) {
            return res.status(400).json({
                error: 'Only Admin and CEO can edit approved transactions'
            });
        }

        const {
            attachments,
            allocationPreviews,
            // Exclude relation objects that might be present in the body
            category,
            project,
            partner,
            employee,
            businessUnit,
            paymentMethod,
            allocationRule,
            ...txnData
        } = req.body;

        const transaction = await prisma.transaction.update({
            where: { id },
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

        // Create audit log
        await createAuditLog({
            tableName: 'Transaction',
            recordId: id,
            action: 'UPDATE',
            userId: user.id,
            oldValues: currentTxn,
            newValues: transaction,
            reason: req.body.updateReason,
            req
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
        const id = req.params.id as string;
        const user = req.user!;
        const roleName = user.role.toLowerCase();

        const currentTxn = await prisma.transaction.findUnique({
            where: { id }
        });

        if (!currentTxn) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        // Only Admin and CEO can delete approved transactions
        const canDeleteApproved = roleName === 'admin' || roleName === 'ceo';
        if (currentTxn.approvalStatus === 'APPROVED' && !canDeleteApproved) {
            return res.status(400).json({
                error: 'Only Admin and CEO can delete approved transactions'
            });
        }

        // Create audit log before deletion
        await createAuditLog({
            tableName: 'Transaction',
            recordId: id,
            action: 'DELETE',
            userId: user.id,
            oldValues: currentTxn,
            reason: req.body.deleteReason,
            req
        });

        await prisma.transaction.delete({
            where: { id }
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

        // Create audit log
        await createAuditLog({
            tableName: 'Transaction',
            recordId: req.params.id as string,
            action: 'APPROVE',
            userId: user.id,
            oldValues: { approvalStatus: 'PENDING' },
            newValues: { approvalStatus: 'APPROVED', paymentStatus: 'PAID' },
            req
        });

        // Notify the creator
        if (transaction.createdBy) {
            try {
                await (prisma as any).notification.create({
                    data: {
                        userId: transaction.createdBy,
                        message: `Phiếu ${transaction.transactionType === 'INCOME' ? 'thu' : 'chi'} #${transaction.transactionCode} đã được duyệt`,
                        type: 'success',
                        unread: true,
                        relatedId: transaction.id,
                        targetPath: '/quan-ly-thu-chi'
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
                paymentStatus: 'UNPAID', // Auto-update to UNPAID when rejected
                rejectionReason: reason || 'No reason provided'
            },
            include: {
                category: true,
                businessUnit: true
            }
        });

        // Create audit log
        await createAuditLog({
            tableName: 'Transaction',
            recordId: req.params.id as string,
            action: 'REJECT',
            userId: user.id,
            oldValues: { approvalStatus: 'PENDING' },
            newValues: { approvalStatus: 'REJECTED', paymentStatus: 'UNPAID' },
            reason: reason,
            req
        });

        // Notify the creator
        if (transaction.createdBy) {
            try {
                await (prisma as any).notification.create({
                    data: {
                        userId: transaction.createdBy,
                        message: `Phiếu ${transaction.transactionType === 'INCOME' ? 'thu' : 'chi'} #${transaction.transactionCode} bị từ chối: ${reason}`,
                        type: 'error',
                        unread: true,
                        relatedId: transaction.id,
                        targetPath: '/quan-ly-thu-chi'
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
