"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../utils/prisma"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticate);
// GET /api/categories
router.get('/', async (req, res) => {
    try {
        const { type, status } = req.query;
        let where = {};
        if (type && type !== 'all') {
            where.type = type.toString().toUpperCase();
        }
        if (status && status !== 'all') {
            where.status = status.toString().toUpperCase();
        }
        const categories = await prisma_1.default.category.findMany({
            where,
            orderBy: { code: 'asc' }
        });
        // Transform to match frontend format
        const transformedCategories = categories.map(cat => ({
            id: cat.id,
            code: cat.code,
            name: cat.name,
            type: cat.type.toLowerCase().replace('_', '-'),
            description: cat.description,
            status: cat.status.toLowerCase()
        }));
        res.json(transformedCategories);
    }
    catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /api/categories
router.post('/', async (req, res) => {
    try {
        const { code, name, type, description, status } = req.body;
        const category = await prisma_1.default.category.create({
            data: {
                code,
                name,
                type: type.toUpperCase().replace('-', '_'),
                description,
                status: status ? status.toUpperCase() : 'ACTIVE'
            }
        });
        res.status(201).json(category);
    }
    catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// PUT /api/categories/:id
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { code, name, type, description, status } = req.body;
        const category = await prisma_1.default.category.update({
            where: { id },
            data: {
                code,
                name,
                type: type.toUpperCase().replace('-', '_'),
                description,
                status: status.toUpperCase()
            }
        });
        res.json(category);
    }
    catch (error) {
        console.error('Update category error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// DELETE /api/categories/:id
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_1.default.category.delete({
            where: { id }
        });
        res.json({ message: 'Category deleted successfully' });
    }
    catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
