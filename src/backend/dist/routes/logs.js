"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../utils/prisma"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
// GET /api/logs
router.get('/', async (req, res) => {
    try {
        const { action, module, userId, limit = 100 } = req.query;
        const where = {};
        if (action && action !== 'all')
            where.action = action;
        if (module && module !== 'all')
            where.module = module;
        if (userId && userId !== 'all')
            where.userId = userId;
        const logs = await prisma_1.default.activityLog.findMany({
            where,
            include: {
                user: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: { timestamp: 'desc' },
            take: Number(limit)
        });
        const transformedLogs = logs.map(log => ({
            id: log.id,
            timestamp: log.timestamp.toLocaleString('vi-VN'),
            user: log.user?.name || 'System',
            action: log.action,
            module: log.module,
            description: log.description,
            ip: log.ip || 'N/A',
            status: log.status
        }));
        res.json(transformedLogs);
    }
    catch (error) {
        console.error('Get logs error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
