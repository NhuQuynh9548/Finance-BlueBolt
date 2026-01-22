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
// GET /api/employee-levels
router.get('/', async (req, res) => {
    try {
        const levels = await prisma_1.default.employeeLevel.findMany({
            orderBy: { createdAt: 'desc' },
            include: { _count: { select: { employees: true } } }
        });
        res.json(levels);
    }
    catch (error) {
        console.error('Get employee levels error:', error);
        res.status(500).json({ error: 'Internal server error', details: String(error) });
    }
});
// POST /api/employee-levels
router.post('/', async (req, res) => {
    try {
        const { code, name, description, order } = req.body;
        const level = await prisma_1.default.employeeLevel.create({
            data: {
                code,
                name,
                description,
                order: order ? parseInt(order) : 0
            }
        });
        res.status(201).json(level);
    }
    catch (error) {
        console.error('Create employee level error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// PUT /api/employee-levels/:id
router.put('/:id', async (req, res) => {
    try {
        const { code, name, description, order } = req.body;
        const level = await prisma_1.default.employeeLevel.update({
            where: { id: req.params.id },
            data: {
                code,
                name,
                description,
                order: order ? parseInt(order) : undefined
            }
        });
        res.json(level);
    }
    catch (error) {
        console.error('Update employee level error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// DELETE /api/employee-levels/:id
router.delete('/:id', async (req, res) => {
    try {
        const level = await prisma_1.default.employeeLevel.findUnique({
            where: { id: req.params.id },
            include: { _count: { select: { employees: true } } }
        });
        if (level && level._count.employees > 0) {
            return res.status(400).json({ error: 'Cannot delete level assigned to employees' });
        }
        await prisma_1.default.employeeLevel.delete({
            where: { id: req.params.id }
        });
        res.json({ message: 'Deleted successfully' });
    }
    catch (error) {
        console.error('Delete employee level error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
