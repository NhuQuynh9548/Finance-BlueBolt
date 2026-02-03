import { Router, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { Parser } from 'json2csv';

const router = Router();
router.use(authenticate);

const actionTranslations: Record<string, string> = {
    'CREATE': 'THÊM MỚI',
    'UPDATE': 'CẬP NHẬT',
    'DELETE': 'XÓA',
    'APPROVE': 'DUYỆT',
    'REJECT': 'TỪ CHỐI',
    'LOGIN': 'ĐĂNG NHẬP',
    'LOGOUT': 'ĐĂNG XUẤT'
};

const tableTranslations: Record<string, string> = {
    'Transaction': 'Giao dịch',
    'Partner': 'Đối tác',
    'Employee': 'Nhân viên',
    'Category': 'Danh mục',
    'User': 'Người dùng'
};

// GET /api/audit-logs/export - Export logs to CSV
router.get('/export', async (req: AuthRequest, res: Response) => {
    try {
        const { tableName, action, userId, startDate, endDate } = req.query;

        const where: any = {};

        // Security: Non-admins can only export their own logs
        if (req.user!.role !== 'Admin' && req.user!.role !== 'Administrator') {
            where.userId = req.user!.id;
        } else if (userId) {
            where.userId = userId as string;
        }

        if (tableName) where.tableName = tableName as string;
        if (action) where.action = action as string;

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate as string);
            if (endDate) where.createdAt.lte = new Date(endDate as string);
        }

        const logs = await prisma.auditLog.findMany({
            where,
            include: {
                user: {
                    select: {
                        fullName: true,
                        email: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const csvData = logs.map(log => ({
            'Thời gian': new Date(log.createdAt).toLocaleString('vi-VN'),
            'Người dùng': log.user.fullName,
            'Email': log.user.email,
            'Hành động': actionTranslations[log.action] || log.action,
            'Bảng': tableTranslations[log.tableName] || log.tableName,
            'Record ID': log.recordId,
            'Lý do': log.reason || '',
            'IP Address': log.ipAddress || '',
            'User Agent': log.userAgent || ''
        }));

        const json2csvParser = new Parser({ withBOM: true });
        const csv = json2csvParser.parse(csvData);

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
        res.status(200).send(csv);

    } catch (error) {
        console.error('Export audit logs error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/audit-logs - Get all audit logs with filters
router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const { tableName, action, userId, startDate, endDate, limit = 50, offset = 0 } = req.query;

        const where: any = {};

        // Security: Non-admins can only see their own logs
        if (req.user!.role !== 'Admin' && req.user!.role !== 'Administrator') {
            where.userId = req.user!.id;
        } else if (userId) {
            // Admin can filter by any user
            where.userId = userId as string;
        }

        if (tableName) where.tableName = tableName as string;
        if (action) where.action = action as string;

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate as string);
            if (endDate) where.createdAt.lte = new Date(endDate as string);
        }

        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                            role: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                take: Number(limit),
                skip: Number(offset)
            }),
            prisma.auditLog.count({ where })
        ]);

        res.json({
            logs,
            pagination: {
                total,
                limit: Number(limit),
                offset: Number(offset)
            }
        });
    } catch (error) {
        console.error('Get all audit logs error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/audit-logs/transaction/:id - Get logs for specific transaction
router.get('/transaction/:id', async (req: AuthRequest, res: Response) => {
    try {
        const logs = await prisma.auditLog.findMany({
            where: {
                tableName: 'Transaction',
                recordId: req.params.id as string
            },
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        role: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(logs);
    } catch (error) {
        console.error('Get transaction audit logs error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
