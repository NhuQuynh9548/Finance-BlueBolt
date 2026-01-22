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
// GET /api/projects
router.get('/', async (req, res) => {
    try {
        const { status } = req.query;
        let where = {};
        if (status && status !== 'all') {
            where.status = status;
        }
        const projects = await prisma_1.default.project.findMany({
            where,
            orderBy: { startDate: 'desc' }
        });
        res.json(projects);
    }
    catch (error) {
        console.error('Get projects error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /api/projects/:id
router.get('/:id', async (req, res) => {
    try {
        const project = await prisma_1.default.project.findUnique({
            where: { id: req.params.id }
        });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.json(project);
    }
    catch (error) {
        console.error('Get project error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /api/projects
router.post('/', async (req, res) => {
    try {
        const { code, name, description, buOwner, pm, budget, startDate, endDate, status } = req.body;
        const project = await prisma_1.default.project.create({
            data: {
                code,
                name,
                description,
                buOwner,
                pm,
                budget: budget ? parseFloat(budget) : 0,
                startDate: startDate ? new Date(startDate) : new Date(), // Default to now if missing
                endDate: endDate ? new Date(endDate) : null,
                status
            }
        });
        res.status(201).json(project);
    }
    catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// PUT /api/projects/:id
router.put('/:id', async (req, res) => {
    try {
        const { code, name, description, buOwner, pm, budget, startDate, endDate, status } = req.body;
        const project = await prisma_1.default.project.update({
            where: { id: req.params.id },
            data: {
                code,
                name,
                description,
                buOwner,
                pm,
                budget: budget ? parseFloat(budget) : undefined,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : null,
                status
            }
        });
        res.json(project);
    }
    catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// DELETE /api/projects/:id
router.delete('/:id', async (req, res) => {
    try {
        await prisma_1.default.project.delete({
            where: { id: req.params.id }
        });
        res.json({ message: 'Project deleted successfully' });
    }
    catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
