import api from './api';

export const allocationRuleService = {
    async getAll() {
        const response = await api.get('/allocation-rules');
        return response.data;
    },

    async create(data: { name: string; description?: string; allocations?: any[] }) {
        const response = await api.post('/allocation-rules', data);
        return response.data;
    },

    async update(id: string, data: { name: string; description?: string; allocations?: any[] }) {
        const response = await api.put(`/allocation-rules/${id}`, data);
        return response.data;
    },

    async delete(id: string) {
        const response = await api.delete(`/allocation-rules/${id}`);
        return response.data;
    }
};
