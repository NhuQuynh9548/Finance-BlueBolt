import api from './api';

export const specializationService = {
    async getAll() {
        const response = await api.get('/specializations');
        return response.data;
    },

    async create(data: { code: string; name: string; description?: string }) {
        const response = await api.post('/specializations', data);
        return response.data;
    },

    async update(id: string, data: { code: string; name: string; description?: string }) {
        const response = await api.put(`/specializations/${id}`, data);
        return response.data;
    },

    async delete(id: string) {
        const response = await api.delete(`/specializations/${id}`);
        return response.data;
    }
};
