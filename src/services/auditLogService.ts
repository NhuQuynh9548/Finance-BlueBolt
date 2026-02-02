import api from './api';

export const auditLogService = {
    getTransactionLogs: async (transactionId: string) => {
        const response = await api.get(`/audit-logs/transaction/${transactionId}`);
        return response.data;
    }
};
