import api from './api';

export const auditLogService = {
    getAllLogs: async (params?: {
        tableName?: string;
        action?: string;
        userId?: string;
        startDate?: string;
        endDate?: string;
        limit?: number;
        offset?: number;
    }) => {
        const response = await api.get('/audit-logs', { params });
        return response.data;
    },

    exportLogs: async (params?: {
        tableName?: string;
        action?: string;
        userId?: string;
        startDate?: string;
        endDate?: string;
    }) => {
        const response = await api.get('/audit-logs/export', {
            params,
            responseType: 'blob'
        });
        return response.data;
    },

    getTransactionLogs: async (id: string) => {
        const response = await api.get(`/audit-logs/transaction/${id}`);
        return response.data;
    }
};
