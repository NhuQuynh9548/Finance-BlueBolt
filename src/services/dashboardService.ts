import api from './api';

export const dashboardService = {
    async getStats(buId?: string, dateRange?: { startDate: string, endDate: string }) {
        const params: any = { buId };
        if (dateRange?.startDate) params.startDate = dateRange.startDate;
        if (dateRange?.endDate) params.endDate = dateRange.endDate;
        const response = await api.get('/dashboard/stats', { params });
        return response.data;
    },

    async getRevenueChart(buId?: string, period: string = 'year', dateRange?: { startDate: string, endDate: string }) {
        const params: any = { buId, period };
        if (dateRange?.startDate) params.startDate = dateRange.startDate;
        if (dateRange?.endDate) params.endDate = dateRange.endDate;
        const response = await api.get('/dashboard/revenue-chart', { params });
        return response.data;
    },

    async getExpenseChart(buId?: string, dateRange?: { startDate: string, endDate: string }) {
        const params: any = { buId };
        if (dateRange?.startDate) params.startDate = dateRange.startDate;
        if (dateRange?.endDate) params.endDate = dateRange.endDate;
        const response = await api.get('/dashboard/expense-chart', { params });
        return response.data;
    },

    async getBuStats(buId?: string, dateRange?: { startDate: string, endDate: string }) {
        const params: any = { buId };
        if (dateRange?.startDate) params.startDate = dateRange.startDate;
        if (dateRange?.endDate) params.endDate = dateRange.endDate;
        const response = await api.get('/dashboard/bu-stats', { params });
        return response.data;
    }
};
