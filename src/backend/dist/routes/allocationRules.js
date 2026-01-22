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
// GET /api/allocation-rules
router.get('/', async (req, res) => {
    try {
        const rules = await prisma_1.default.allocationRule.findMany({
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: { transactions: true }
                }
            }
        });
        res.json(rules);
    }
    catch (error) {
        console.error('Get allocation rules error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /api/allocation-rules
router.post('/', async (req, res) => {
    try {
        const rule = await prisma_1.default.allocationRule.create({
            data: req.body
        });
        res.status(201).json(rule);
    }
    catch (error) {
        console.error('Create allocation rule error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// PUT /api/allocation-rules/:id
router.put('/:id', async (req, res) => {
    try {
        const rule = await prisma_1.default.allocationRule.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(rule);
    }
    catch (error) {
        console.error('Update allocation rule error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// DELETE /api/allocation-rules/:id
router.delete('/:id', async (req, res) => {
    try {
        // Check if used
        const rule = await prisma_1.default.allocationRule.findUnique({
            where: { id: req.params.id },
            include: { _count: { select: { transactions: true } } }
        });
        if (rule && rule._count.transactions > 0) {
            return res.status(400).json({ error: 'Cannot delete rule that is being used by transactions' });
        }
        await prisma_1.default.allocationRule.delete({
            where: { id: req.params.id }
        });
        res.json({ message: 'Deleted successfully' });
    }
    catch (error) {
        console.error('Delete allocation rule error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
