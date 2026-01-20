import api from './api';

export const partnerService = {
    async getAll(filters?: { type?: string; status?: string; search?: string }) {
        const response = await api.get('/partners', { params: filters });
        return response.data;
    },

    async getById(id: string) {
        const response = await api.get(`/partners/${id}`);
        return response.data;
    },

    async create(data: any) {
        const response = await api.post('/partners', data);
        return response.data;
    },

    async update(id: string, data: any) {
        const response = await api.put(`/partners/${id}`, data);
        return response.data;
    },

    async deactivate(id: string) {
        const response = await api.put(`/partners/${id}/deactivate`);
        return response.data;
    }
};
