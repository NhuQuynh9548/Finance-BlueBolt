import api from './api';

export const transactionService = {
    async getAll(filters?: { buId?: string; type?: string; status?: string; dateFrom?: string; dateTo?: string; categoryId?: string }) {
        const response = await api.get('/transactions', { params: filters });
        return response.data;
    },

    async getById(id: string) {
        const response = await api.get(`/transactions/${id}`);
        return response.data;
    },

    async create(data: any) {
        const response = await api.post('/transactions', data);
        return response.data;
    },

    async update(id: string, data: any) {
        const response = await api.put(`/transactions/${id}`, data);
        return response.data;
    },

    async delete(id: string) {
        const response = await api.delete(`/transactions/${id}`);
        return response.data;
    },

    async approve(id: string) {
        const response = await api.put(`/transactions/${id}/approve`);
        return response.data;
    },

    async reject(id: string, reason: string) {
        const response = await api.put(`/transactions/${id}/reject`, { reason });
        return response.data;
    }
};
