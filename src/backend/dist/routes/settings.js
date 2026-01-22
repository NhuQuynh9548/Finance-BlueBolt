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
// GET /api/settings
router.get('/', async (req, res) => {
    try {
        const settings = await prisma_1.default.systemSetting.findMany();
        // Transform into a key-value object for easier frontend use
        const settingsMap = settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});
        res.json(settingsMap);
    }
    catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /api/settings
router.post('/', async (req, res) => {
    try {
        const settingsData = req.body;
        for (const [key, value] of Object.entries(settingsData)) {
            await prisma_1.default.systemSetting.upsert({
                where: { key },
                update: { value: String(value) },
                create: {
                    key,
                    value: String(value),
                    category: 'security' // Default for now
                }
            });
        }
        res.json({ message: 'Settings updated successfully' });
    }
    catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
