import { Router, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// Helper to get transaction amount for a specific BU (Direct vs Indirect)
const getTransactionAmountForBU = (transaction: any, buId: string | undefined, buName: string | undefined): number => {
    // 1. Indirect allocation: check allocation previews first to correctly attribute split amounts
    if (transaction.costAllocation === 'INDIRECT' && transaction.allocationPreviews) {
        // If viewing for a specific BU (from query filter or user scope)
        if (buId && buName) {
            const allocation = transaction.allocationPreviews.find((ap: any) => ap.buName === buName);
            return allocation ? allocation.amount : 0;
        }
        // If CEO view (no buId), return full amount for aggregate totals
        if (!buId) return transaction.amount;
    }

    // 2. Direct allocation
    if (buId) {
        return (transaction.businessUnitId === buId) ? transaction.amount : 0;
    }

    // Default for CEO view without BU filter
    return transaction.amount;
};

// Helper to build date filter
const buildDateFilter = (startDate?: any, endDate?: any) => {
    if (!startDate && !endDate) return {};

    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate as string);
    if (endDate) dateFilter.lte = new Date(endDate as string);

    return { transactionDate: dateFilter };
};

// GET /api/dashboard/stats
router.get('/stats', async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user!;
        const { buId, startDate, endDate } = req.query; // Allow filtering by BU via query param (if Admin/CEO)

        let targetBuId: string | undefined = undefined;
        let targetBuName: string | undefined = undefined;

        // Determine target BU - Use case-insensitive role check
        const roleName = user.role.toLowerCase();
        if (roleName !== 'ceo' && roleName !== 'admin') {
            targetBuId = user.buId || undefined;
        } else if (buId && typeof buId === 'string') {
            targetBuId = buId;
        }

        // Needs BU Name for indirect allocation check if targetBuId is set
        if (targetBuId) {
            const bu = await prisma.businessUnit.findUnique({ where: { id: targetBuId } });
            if (bu) targetBuName = bu.name;
        }

        // Build Where Clause
        let where: any = {
            approvalStatus: 'APPROVED',
            ...buildDateFilter(startDate, endDate)
        };

        if (targetBuId && targetBuName) {
            where.OR = [
                { businessUnitId: targetBuId },
                {
                    costAllocation: 'INDIRECT',
                    allocationPreviews: { some: { buName: targetBuName } }
                }
            ];
        } else if (targetBuId) {
            // Fallback if name not found (shouldn't happen strictly speaking)
            where.businessUnitId = targetBuId;
        }

        const transactions = await prisma.transaction.findMany({
            where,
            include: { allocationPreviews: true }
        });

        // Calculate totals
        let totalIncome = 0;
        let totalExpense = 0;
        let totalLoan = 0;

        transactions.forEach(t => {
            const amount = getTransactionAmountForBU(t, targetBuId, targetBuName);

            if (t.transactionType === 'INCOME') {
                totalIncome += amount;
            } else if (t.transactionType === 'EXPENSE') {
                totalExpense += amount;
            } else if (t.transactionType === 'LOAN') {
                totalLoan += amount;
            }
        });

        res.json({
            totalIncome,
            totalExpense,
            netProfit: totalIncome - totalExpense,
            totalLoan,
            transactionCount: transactions.length
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/dashboard/revenue-chart
router.get('/revenue-chart', async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user!;
        const { buId, period, startDate, endDate } = req.query; // period: 'year' | 'month' | 'quarter'

        let targetBuId: string | undefined = undefined;
        let targetBuName: string | undefined = undefined;

        const roleName = user.role.toLowerCase();
        if (roleName !== 'ceo' && roleName !== 'admin') {
            targetBuId = user.buId || undefined;
        } else if (buId && typeof buId === 'string') {
            targetBuId = buId;
        }

        if (targetBuId) {
            const bu = await prisma.businessUnit.findUnique({ where: { id: targetBuId } });
            if (bu) targetBuName = bu.name;
        }

        let where: any = {
            approvalStatus: 'APPROVED',
            ...buildDateFilter(startDate, endDate)
        };

        if (targetBuId && targetBuName) {
            where.OR = [
                { businessUnitId: targetBuId },
                {
                    costAllocation: 'INDIRECT',
                    allocationPreviews: { some: { buName: targetBuName } }
                }
            ];
        } else if (targetBuId) {
            where.businessUnitId = targetBuId;
        }

        const transactions = await prisma.transaction.findMany({
            where,
            include: { allocationPreviews: true }
        });

        // Grouping logic based on period
        // Format: { groupKey: { label: string, sortKey: number, thu: number, chi: number, vay: number, loiNhuan: number } }
        const chartDataMap: { [key: string]: { label: string; sortKey: number; thu: number; chi: number; vay: number; loiNhuan: number } } = {};

        // Helper to get ISO week number
        const getWeekNumber = (d: Date) => {
            d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
            d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
            var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
            var weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
            return weekNo;
        };

        // Pre-fill labels based on period and range
        const start = startDate ? new Date(startDate as string) : new Date(new Date().getFullYear(), 0, 1);
        const end = endDate ? new Date(endDate as string) : new Date(new Date().getFullYear(), 11, 31);

        const currentIter = new Date(start);
        while (currentIter <= end) {
            let groupKey = '';
            let label = '';
            let sortKey = 0;

            if (period === 'month' || period === 'quarter') {
                const weekNum = getWeekNumber(currentIter);
                groupKey = `${currentIter.getFullYear()}-W${weekNum}`;
                label = `Tuần ${weekNum}`;
                sortKey = new Date(currentIter.getFullYear(), currentIter.getMonth(), currentIter.getDate()).getTime();

                // Increment by 1 week
                currentIter.setDate(currentIter.getDate() + 7);
            } else {
                const month = currentIter.getMonth() + 1;
                const year = currentIter.getFullYear();
                groupKey = `${year}-${month.toString().padStart(2, '0')}`;
                label = `T${month}/${year.toString().slice(2)}`;
                sortKey = new Date(year, currentIter.getMonth(), 1).getTime();

                // Increment by 1 month
                currentIter.setMonth(currentIter.getMonth() + 1);
            }

            if (!chartDataMap[groupKey]) {
                chartDataMap[groupKey] = { label, sortKey, thu: 0, chi: 0, vay: 0, loiNhuan: 0 };
            }
        }

        transactions.forEach(t => {
            const date = new Date(t.transactionDate);
            let groupKey = '';

            if (period === 'month' || period === 'quarter') {
                const weekNum = getWeekNumber(date);
                groupKey = `${date.getFullYear()}-W${weekNum}`;
            } else {
                const month = date.getMonth() + 1;
                const year = date.getFullYear();
                groupKey = `${year}-${month.toString().padStart(2, '0')}`;
            }

            if (chartDataMap[groupKey]) {
                const amount = getTransactionAmountForBU(t, targetBuId, targetBuName);

                if (t.transactionType === 'INCOME') {
                    chartDataMap[groupKey].thu += amount;
                    chartDataMap[groupKey].loiNhuan += amount;
                } else if (t.transactionType === 'EXPENSE') {
                    chartDataMap[groupKey].chi += amount;
                    chartDataMap[groupKey].loiNhuan -= amount;
                } else if (t.transactionType === 'LOAN') {
                    chartDataMap[groupKey].vay += amount;
                }
            }
        });

        // Convert to array and sort
        const result = Object.values(chartDataMap)
            .sort((a, b) => a.sortKey - b.sortKey)
            .map(item => ({
                month: item.label,
                thu: item.thu,
                chi: item.chi,
                vay: item.vay,
                loiNhuan: item.loiNhuan
            }));

        res.json(result);

    } catch (error) {
        console.error('Revenue chart error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/dashboard/expense-chart
router.get('/expense-chart', async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user!;
        const { buId, startDate, endDate } = req.query;

        let targetBuId: string | undefined = undefined;
        let targetBuName: string | undefined = undefined;

        const roleName = user.role.toLowerCase();
        if (roleName !== 'ceo' && roleName !== 'admin') {
            targetBuId = user.buId || undefined;
        } else if (buId && typeof buId === 'string') {
            targetBuId = buId;
        }

        if (targetBuId) {
            const bu = await prisma.businessUnit.findUnique({ where: { id: targetBuId } });
            if (bu) targetBuName = bu.name;
        }

        let where: any = {
            approvalStatus: 'APPROVED',
            transactionType: 'EXPENSE',
            ...buildDateFilter(startDate, endDate)
        };

        if (targetBuId && targetBuName) {
            where.OR = [
                { businessUnitId: targetBuId },
                {
                    costAllocation: 'INDIRECT',
                    allocationPreviews: { some: { buName: targetBuName } }
                }
            ];
        } else if (targetBuId) {
            where.businessUnitId = targetBuId;
        }

        const transactions = await prisma.transaction.findMany({
            where,
            include: {
                category: true,
                allocationPreviews: true
            }
        });

        // Fetch all categories to ensure they are all represented
        const allCategories = await prisma.category.findMany({
            where: { type: 'CHI' },
            orderBy: { name: 'asc' }
        });

        const categoryData: { [key: string]: number } = {};
        allCategories.forEach(cat => {
            categoryData[cat.name] = 0;
        });

        let totalExpense = 0;

        transactions.forEach(t => {
            const amount = getTransactionAmountForBU(t, targetBuId, targetBuName);
            const categoryName = t.category.name;

            categoryData[categoryName] = (categoryData[categoryName] || 0) + amount;
            totalExpense += amount;
        });

        // Convert to array
        const result = Object.entries(categoryData)
            .map(([name, value]) => ({
                name,
                value,
                percentage: totalExpense > 0 ? (value / totalExpense) * 100 : 0
            }))
            .sort((a, b) => b.value - a.value); // Keep sorted by value primarily

        res.json(result);

    } catch (error) {
        console.error('Expense chart error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/dashboard/bu-stats
router.get('/bu-stats', async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user!;
        const { startDate, endDate, buId } = req.query;

        // 1. Determine which BUs to fetch
        let bus: any[] = [];
        const roleName = user.role.toLowerCase();

        if (roleName === 'ceo' || roleName === 'admin') {
            if (buId && typeof buId === 'string' && buId !== 'all') {
                bus = await prisma.businessUnit.findMany({ where: { id: buId } });
            } else {
                bus = await prisma.businessUnit.findMany();
            }
        } else if (user.buId) {
            bus = await prisma.businessUnit.findMany({ where: { id: user.buId } });
        } else {
            return res.json([]); // No access
        }

        // 2. Fetch all relevant transactions (optimized: fetch all approved, then distribute)
        // Ideally we would filter by date range here too
        const transactions = await prisma.transaction.findMany({
            where: {
                approvalStatus: 'APPROVED',
                ...buildDateFilter(startDate, endDate)
            },
            include: { allocationPreviews: true }
        });

        // 3. Initialize stats map
        const statsMap: { [key: string]: { revenue: number; expense: number } } = {};
        bus.forEach(bu => {
            statsMap[bu.id] = { revenue: 0, expense: 0 };
        });

        // 4. Distribute transaction amounts
        transactions.forEach(t => {
            // We need to distribute this transaction to BUs
            // A transaction might affect multiple BUs if indirect? 
            // Actually, the requirement says "Dashboard... by Business Unit".
            // Direct allocation: affects t.businessUnitId
            // Indirect allocation: affects BUs in allocationPreviews

            // For each BU in our list, check if it receives money from this transaction
            bus.forEach(bu => {
                const amount = getTransactionAmountForBU(t, bu.id, bu.name);
                if (amount > 0) {
                    if (t.transactionType === 'INCOME') {
                        statsMap[bu.id].revenue += amount;
                    } else if (t.transactionType === 'EXPENSE') {
                        statsMap[bu.id].expense += amount;
                    }
                }
            });
        });

        // 5. Format result
        const result = bus.map(bu => {
            const stat = statsMap[bu.id];
            const profit = stat.revenue - stat.expense;
            const margin = stat.revenue > 0 ? (profit / stat.revenue) * 100 : 0;

            return {
                id: bu.id,
                buName: bu.name,
                totalRevenue: stat.revenue,
                totalExpense: stat.expense,
                totalProfit: profit,
                profitMargin: margin
            };
        });

        res.json(result);

    } catch (error) {
        console.error('BU stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
