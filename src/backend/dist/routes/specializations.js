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
// GET /api/specializations
router.get('/', async (req, res) => {
    try {
        const specializations = await prisma_1.default.specialization.findMany({
            orderBy: { name: 'asc' },
            include: { _count: { select: { employees: true } } }
        });
        res.json(specializations);
    }
    catch (error) {
        console.error('Get specializations error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /api/specializations
router.post('/', async (req, res) => {
    try {
        const { code, name, description } = req.body;
        const specialization = await prisma_1.default.specialization.create({
            data: {
                code,
                name,
                description
            }
        });
        res.status(201).json(specialization);
    }
    catch (error) {
        console.error('Create specialization error:', error);
        if (error.code === 'P2002') {
            const field = error.meta?.target?.join(', ');
            return res.status(400).json({ error: `${field} đã tồn tại` });
        }
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});
// PUT /api/specializations/:id
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { code, name, description } = req.body;
        const specialization = await prisma_1.default.specialization.update({
            where: { id: id },
            data: {
                code,
                name,
                description
            }
        });
        res.json(specialization);
    }
    catch (error) {
        console.error('Update specialization error:', error);
        if (error.code === 'P2002') {
            const field = error.meta?.target?.join(', ');
            return res.status(400).json({ error: `${field} đã tồn tại` });
        }
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});
// DELETE /api/specializations/:id
router.delete('/:id', async (req, res) => {
    try {
        const spec = await prisma_1.default.specialization.findUnique({
            where: { id: req.params.id },
            include: { _count: { select: { employees: true } } }
        });
        if (spec && spec._count.employees > 0) {
            return res.status(400).json({ error: 'Cannot delete specialization assigned to employees' });
        }
        await prisma_1.default.specialization.delete({
            where: { id: req.params.id }
        });
        res.json({ message: 'Deleted successfully' });
    }
    catch (error) {
        console.error('Delete specialization error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
