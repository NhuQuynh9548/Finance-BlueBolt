import { Router, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/business-units
router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user!;
        let businessUnits;

        // CEO and Admin can see all BUs - Use case-insensitive role check
        const roleName = user.role.toLowerCase();
        if (roleName === 'ceo' || roleName === 'admin') {
            const bus = await prisma.businessUnit.findMany({
                orderBy: { name: 'asc' },
                include: {
                    _count: {
                        select: { employees: true }
                    },
                    users: {
                        where: { role: { name: 'BU Manager' } },
                        select: { fullName: true }
                    }
                }
            });

            businessUnits = bus.map(bu => ({
                id: bu.id,
                code: bu.code || `BU-${bu.name.split(' ').pop()?.toUpperCase() || 'CODE'}`,
                name: bu.name,
                leader: bu.leaderName || bu.users[0]?.fullName || '',
                startDate: bu.startDate || bu.createdAt,
                staff: bu.staffCount > 0 ? bu.staffCount : bu._count.employees,
                manualStaff: bu.staffCount,
                generatedStaff: bu._count.employees,
                status: bu.status || 'active'
            }));

            // Checking Query Param?
            if (req.query.format === 'simple') {
                return res.json([
                    { id: 'all', name: 'Tất cả BU' },
                    ...bus.map(b => ({ id: b.id, name: b.name }))
                ]);
            }

            return res.json(businessUnits);
        }

        // Others can only see their own BU
        if (user.buId) {
            const bu = await prisma.businessUnit.findUnique({
                where: { id: user.buId },
                include: {
                    _count: { select: { employees: true } },
                    users: { where: { role: { name: 'BU Manager' } }, select: { fullName: true } }
                }
            });

            if (bu) {
                return res.json([{
                    id: bu.id,
                    code: bu.code || `BU-${bu.name.split(' ').pop()?.toUpperCase()}`,
                    name: bu.name,
                    leader: bu.leaderName || bu.users[0]?.fullName || '',
                    startDate: bu.startDate || bu.createdAt,
                    staff: bu.staffCount > 0 ? bu.staffCount : bu._count.employees,
                    status: bu.status || 'active'
                }]);
            }
            return res.json([]);
        }

        res.json([]);
    } catch (error) {
        console.error('Get business units error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/business-units
router.post('/', async (req: AuthRequest, res: Response) => {
    try {
        const { name, code, leaderName, startDate, status, staff } = req.body;

        // Check if name or code exists
        const existing = await prisma.businessUnit.findFirst({
            where: {
                OR: [
                    { name },
                    { code: code || undefined }
                ]
            }
        });

        if (existing) {
            return res.status(400).json({ error: 'BU Name or Code already exists' });
        }

        const newBU = await prisma.businessUnit.create({
            data: {
                name,
                code,
                leaderName,
                status: status || 'active',
                startDate: startDate ? new Date(startDate) : undefined,
                staffCount: staff ? parseInt(staff) : 0
            }
        });

        res.status(201).json(newBU);
    } catch (error) {
        console.error('Create BU error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/business-units/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, code, leaderName, startDate, status, staff } = req.body;

        const updatedBU = await prisma.businessUnit.update({
            where: { id },
            data: {
                name,
                code,
                leaderName,
                status,
                startDate: startDate ? new Date(startDate) : undefined,
                staffCount: staff !== undefined ? parseInt(staff) : undefined
            }
        });

        res.json(updatedBU);
    } catch (error) {
        console.error('Update BU error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/business-units/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        // Optional: Check if BU has employees/users before deleting?
        // Prisma might handle this or throw error if constraints exist.

        await prisma.businessUnit.delete({
            where: { id }
        });

        res.json({ message: 'Deleted successfully' });
    } catch (error) {
        console.error('Delete BU error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
