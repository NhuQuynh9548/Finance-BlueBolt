import { Router, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/employees
router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user!;
        const { buId, specialization, status, search } = req.query;

        let where: any = {};

        // Role-based filtering - Use case-insensitive check
        const roleName = user.role.toLowerCase();
        if (roleName !== 'ceo' && roleName !== 'admin') {
            // Non-CEO/Admin can only see employees from their BU
            where.businessUnitId = user.buId;
        } else if (buId && buId !== 'all') {
            // CEO/Admin can filter by BU
            where.businessUnitId = buId as string;
        }

        // Additional filters
        if (specialization) {
            where.specializationId = specialization as string;
        }

        if (status) {
            where.workStatus = status as string;
        }

        if (search) {
            where.OR = [
                { fullName: { contains: search as string, mode: 'insensitive' } },
                { employeeId: { contains: search as string, mode: 'insensitive' } }
            ];
        }

        const employees = await prisma.employee.findMany({
            where,
            include: {
                businessUnit: true,
                specialization: true,
                level: true
            },
            orderBy: { employeeId: 'asc' }
        });

        // Transform to match frontend format
        const transformedEmployees = employees.map(emp => ({
            id: emp.id,
            employeeId: emp.employeeId,
            fullName: emp.fullName,
            email: emp.email,
            phone: emp.phone,
            businessUnit: emp.businessUnit.name,
            specialization: emp.specialization?.name || '',
            level: emp.level?.name || '',
            joinDate: emp.joinDate ? emp.joinDate.toLocaleDateString('vi-VN') : '',
            workStatus: emp.workStatus.toLowerCase(),
            birthDate: emp.birthDate ? emp.birthDate.toLocaleDateString('vi-VN') : '',
            idCard: emp.idCard || '',
            address: emp.address
        }));

        res.json(transformedEmployees);
    } catch (error) {
        console.error('Get employees error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/employees/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const employee = await prisma.employee.findUnique({
            where: { id: id as string },
            include: {
                businessUnit: true,
                specialization: true,
                level: true
            }
        });

        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        res.json(employee);
    } catch (error) {
        console.error('Get employee error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/employees
router.post('/', async (req: AuthRequest, res: Response) => {
    try {
        console.log('Received Create Employee Request:', req.body);
        const { fullName, email, phone, businessUnit, specialization, level, joinDate, birthDate, idCard, address } = req.body;

        if (!businessUnit) {
            console.error('Missing Business Unit');
            return res.status(400).json({ error: 'Business Unit is required' });
        }

        // Find IDs from names
        const bu = await prisma.businessUnit.findFirst({ where: { name: businessUnit } });
        if (!bu) {
            console.error(`Business Unit not found: ${businessUnit}`);
            return res.status(400).json({ error: `Business Unit '${businessUnit}' not found` });
        }

        const spec = specialization ? await prisma.specialization.findFirst({ where: { name: specialization } }) : null;
        const lvl = level ? await prisma.employeeLevel.findFirst({ where: { name: level } }) : null;

        // Generate employee ID based on last ID
        const lastEmployee = await prisma.employee.findFirst({
            orderBy: { employeeId: 'desc' }
        });

        let nextId = 1;
        if (lastEmployee && lastEmployee.employeeId.startsWith('BB')) {
            const currentNum = parseInt(lastEmployee.employeeId.substring(2));
            if (!isNaN(currentNum)) {
                nextId = currentNum + 1;
            }
        }
        const employeeId = `BB${String(nextId).padStart(3, '0')}`;
        console.log('Generated Employee ID:', employeeId);

        // Parse dates safely
        const parseDate = (dateStr: string | null | undefined) => {
            if (!dateStr || dateStr.trim() === '') return null;
            try {
                const [day, month, year] = dateStr.split('/');
                const date = new Date(`${year}-${month}-${day}`);
                if (isNaN(date.getTime())) {
                    return null; // Return null if invalid
                }
                return date;
            } catch (e) {
                console.error("Date parse error", dateStr, e);
                return null;
            }
        };

        const createData = {
            employeeId,
            fullName,
            email,
            phone,
            businessUnitId: bu.id,
            specializationId: spec?.id,
            levelId: lvl?.id,
            joinDate: parseDate(joinDate),
            birthDate: parseDate(birthDate),
            idCard,
            address,
            workStatus: 'WORKING' as const
        };
        console.log('Prisma Create Data:', createData);

        const employee = await prisma.employee.create({
            data: createData,
            include: {
                businessUnit: true,
                specialization: true,
                level: true
            }
        });

        res.status(201).json(employee);
    } catch (error: any) {
        console.error('Create employee error details:', error);
        if (error.code === 'P2002') {
            const field = error.meta?.target?.join(', ');
            return res.status(400).json({ error: `${field} đã được sử dụng (ví dụ: Email, CMND)` });
        }
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// PUT /api/employees/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { fullName, email, phone, businessUnit, specialization, level, joinDate, birthDate, idCard, address, workStatus } = req.body;

        // Find IDs from names
        let bu = null;
        if (businessUnit) {
            bu = await prisma.businessUnit.findFirst({ where: { name: businessUnit } });
            if (!bu) {
                return res.status(400).json({ error: `Business Unit '${businessUnit}' not found` });
            }
        }

        const spec = specialization ? await prisma.specialization.findFirst({ where: { name: specialization } }) : null;
        const lvl = level ? await prisma.employeeLevel.findFirst({ where: { name: level } }) : null;

        // Parse dates safely
        const parseDate = (dateStr: string | null | undefined) => {
            if (!dateStr || dateStr.trim() === '') return null;
            try {
                const [day, month, year] = dateStr.split('/');
                const date = new Date(`${year}-${month}-${day}`);
                if (isNaN(date.getTime())) return null;
                return date;
            } catch (e) {
                return null;
            }
        };

        const employee = await prisma.employee.update({
            where: { id: id as string },
            data: {
                fullName,
                email,
                phone,
                ...(bu && { businessUnitId: bu.id }),
                ...(spec && { specializationId: spec.id }),
                ...(lvl && { levelId: lvl.id }),
                ...(joinDate && { joinDate: parseDate(joinDate) }),
                ...(birthDate && { birthDate: parseDate(birthDate) }),
                idCard,
                address,
                ...(workStatus && { workStatus: workStatus.toUpperCase() })
            },
            include: {
                businessUnit: true,
                specialization: true,
                level: true
            }
        });

        res.json(employee);
    } catch (error: any) {
        console.error('Update employee error:', error);
        if (error.code === 'P2002') {
            const field = error.meta?.target?.join(', ');
            return res.status(400).json({ error: `${field} đã được sử dụng (ví dụ: Email, CMND)` });
        }
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// DELETE /api/employees/:id (soft delete - mark as resigned)
router.delete('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const employee = await prisma.employee.update({
            where: { id: id as string },
            data: { workStatus: 'RESIGNED' }
        });

        res.json({ message: 'Employee marked as resigned', employee });
    } catch (error) {
        console.error('Delete employee error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
