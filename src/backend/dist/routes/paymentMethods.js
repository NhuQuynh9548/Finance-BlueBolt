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
// GET /api/payment-methods
router.get('/', async (req, res) => {
    try {
        const paymentMethods = await prisma_1.default.paymentMethod.findMany({
            orderBy: { name: 'asc' },
            include: { _count: { select: { transactions: true, partners: true } } }
        });
        res.json(paymentMethods);
    }
    catch (error) {
        console.error('Get payment methods error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /api/payment-methods
router.post('/', async (req, res) => {
    try {
        const paymentMethod = await prisma_1.default.paymentMethod.create({
            data: req.body
        });
        res.status(201).json(paymentMethod);
    }
    catch (error) {
        console.error('Create payment method error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// PUT /api/payment-methods/:id
router.put('/:id', async (req, res) => {
    try {
        const paymentMethod = await prisma_1.default.paymentMethod.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(paymentMethod);
    }
    catch (error) {
        console.error('Update payment method error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// DELETE /api/payment-methods/:id
router.delete('/:id', async (req, res) => {
    try {
        const pm = await prisma_1.default.paymentMethod.findUnique({
            where: { id: req.params.id },
            include: { _count: { select: { transactions: true, partners: true } } }
        });
        if (pm && (pm._count.transactions > 0 || pm._count.partners > 0)) {
            return res.status(400).json({ error: 'Cannot delete payment method used in transactions or partners' });
        }
        await prisma_1.default.paymentMethod.delete({
            where: { id: req.params.id }
        });
        res.json({ message: 'Deleted successfully' });
    }
    catch (error) {
        console.error('Delete payment method error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
