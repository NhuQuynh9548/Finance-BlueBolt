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
// GET /api/partners
router.get('/', async (req, res) => {
    try {
        const { type, status, search } = req.query;
        let where = {};
        // Filter by type
        if (type && type !== 'all') {
            where.partnerType = type.toUpperCase();
        }
        // Filter by status
        if (status && status !== 'all') {
            where.status = status.toUpperCase();
        }
        // Search
        if (search) {
            where.OR = [
                { partnerName: { contains: search, mode: 'insensitive' } },
                { partnerId: { contains: search, mode: 'insensitive' } },
                { taxCode: { contains: search, mode: 'insensitive' } }
            ];
        }
        // Filter by BU if not Admin/CEO
        if (req.user?.role === 'Trưởng BU' && req.user.buId) {
            where.businessUnitId = req.user.buId;
        }
        const partners = await prisma_1.default.partner.findMany({
            where,
            include: {
                bankAccounts: true,
                contracts: true,
                paymentMethod: true,
                businessUnit: true
            },
            orderBy: { partnerId: 'asc' }
        });
        res.json(partners);
    }
    catch (error) {
        console.error('Get partners error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /api/partners/:id
router.get('/:id', async (req, res) => {
    try {
        const partner = await prisma_1.default.partner.findUnique({
            where: { id: req.params.id },
            include: {
                bankAccounts: true,
                contracts: true,
                paymentMethod: true,
                businessUnit: true
            }
        });
        if (!partner) {
            return res.status(404).json({ error: 'Partner not found' });
        }
        res.json(partner);
    }
    catch (error) {
        console.error('Get partner error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /api/partners
router.post('/', async (req, res) => {
    try {
        const { bankAccounts, contracts, ...partnerData } = req.body;
        // Sanitize relations
        if (partnerData.paymentMethodId === '') {
            partnerData.paymentMethodId = null;
        }
        // Check for existing partnerId or taxCode
        const existing = await prisma_1.default.partner.findFirst({
            where: {
                OR: [
                    { partnerId: partnerData.partnerId },
                    { taxCode: partnerData.taxCode }
                ]
            }
        });
        if (existing) {
            if (existing.partnerId === partnerData.partnerId) {
                return res.status(400).json({ error: `Mã đối tác '${partnerData.partnerId}' đã tồn tại` });
            }
            if (existing.taxCode === partnerData.taxCode) {
                return res.status(400).json({ error: `Mã số thuế '${partnerData.taxCode}' đã tồn tại` });
            }
        }
        // Automatically assign BU for BU Leaders
        const finalPartnerData = { ...partnerData };
        if (req.user?.role === 'Trưởng BU' && req.user.buId) {
            finalPartnerData.businessUnitId = req.user.buId;
        }
        const partner = await prisma_1.default.partner.create({
            data: {
                ...finalPartnerData,
                bankAccounts: bankAccounts ? {
                    create: bankAccounts
                } : undefined,
                contracts: contracts ? {
                    create: contracts
                } : undefined
            },
            include: {
                bankAccounts: true,
                contracts: true,
                paymentMethod: true,
                businessUnit: true
            }
        });
        res.status(201).json(partner);
    }
    catch (error) {
        console.error('Create partner error:', error);
        // Prisma unique constraint violation code
        if (error.code === 'P2002') {
            const field = error.meta?.target?.join(', ');
            return res.status(400).json({ error: `${field} đã tồn tại` });
        }
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});
// PUT /api/partners/:id
router.put('/:id', async (req, res) => {
    try {
        const { bankAccounts, contracts, ...partnerData } = req.body;
        const updateData = { ...partnerData };
        // Sanitize relations
        if (updateData.paymentMethodId === '') {
            updateData.paymentMethodId = null;
        }
        if (bankAccounts) {
            updateData.bankAccounts = {
                deleteMany: {},
                create: bankAccounts
            };
        }
        if (contracts) {
            updateData.contracts = {
                deleteMany: {},
                create: contracts
            };
        }
        const partner = await prisma_1.default.partner.update({
            where: { id: req.params.id },
            data: updateData,
            include: {
                bankAccounts: true,
                contracts: true,
                paymentMethod: true,
                businessUnit: true
            }
        });
        res.json(partner);
    }
    catch (error) {
        console.error('Update partner error:', error);
        if (error.code === 'P2002') {
            const field = error.meta?.target?.join(', ');
            return res.status(400).json({ error: `${field} đã tồn tại` });
        }
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});
// PUT /api/partners/:id/deactivate
router.put('/:id/deactivate', async (req, res) => {
    try {
        const partner = await prisma_1.default.partner.update({
            where: { id: req.params.id },
            data: { status: 'INACTIVE' },
            include: {
                bankAccounts: true,
                contracts: true,
                businessUnit: true
            }
        });
        res.json(partner);
    }
    catch (error) {
        console.error('Deactivate partner error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /api/partners/:id/bank-accounts
router.post('/:id/bank-accounts', async (req, res) => {
    try {
        const bankAccount = await prisma_1.default.bankAccount.create({
            data: {
                ...req.body,
                partnerId: req.params.id
            }
        });
        res.status(201).json(bankAccount);
    }
    catch (error) {
        console.error('Create bank account error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /api/partners/:id/contracts
router.post('/:id/contracts', async (req, res) => {
    try {
        const contract = await prisma_1.default.contract.create({
            data: {
                ...req.body,
                partnerId: req.params.id
            }
        });
        res.status(201).json(contract);
    }
    catch (error) {
        console.error('Create contract error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
