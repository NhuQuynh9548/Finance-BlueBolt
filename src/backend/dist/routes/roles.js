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
// GET /api/roles
router.get('/', async (req, res) => {
    try {
        const roles = await prisma_1.default.role.findMany({
            include: {
                _count: {
                    select: { users: true }
                }
            }
        });
        const transformedRoles = roles.map(role => ({
            id: role.id,
            name: role.name,
            description: role.description,
            permissionCount: Array.isArray(role.permissions) ? role.permissions.length : 0,
            userCount: role._count.users,
            createdDate: role.createdAt.toLocaleDateString('vi-VN'),
            isSystemRole: role.isSystemRole,
            permissions: role.permissions || []
        }));
        res.json(transformedRoles);
    }
    catch (error) {
        console.error('Get roles error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /api/roles
router.post('/', async (req, res) => {
    try {
        console.log('Creating role with data:', req.body);
        const { name, description, permissions } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Role name is required' });
        }
        const role = await prisma_1.default.role.create({
            data: {
                name,
                description,
                permissions: permissions || [],
                isSystemRole: false
            }
        });
        res.status(201).json(role);
    }
    catch (error) {
        console.error('Create role error details:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Vai trò này đã tồn tại' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});
// PUT /api/roles/:id
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, permissions } = req.body;
        const role = await prisma_1.default.role.update({
            where: { id },
            data: { name, description, permissions }
        });
        res.json(role);
    }
    catch (error) {
        console.error('Update role error details:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Tên vai trò này đã tồn tại' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});
// DELETE /api/roles/:id
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const role = await prisma_1.default.role.findUnique({ where: { id } });
        if (role?.isSystemRole) {
            return res.status(403).json({ error: 'Cannot delete system roles' });
        }
        await prisma_1.default.role.delete({ where: { id } });
        res.json({ message: 'Role deleted' });
    }
    catch (error) {
        console.error('Delete role error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
