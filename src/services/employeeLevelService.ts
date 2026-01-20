import api from './api';

export const employeeLevelService = {
    async getAll() {
        const response = await api.get('/employee-levels');
        return response.data;
    },

    async create(data: { code: string; name: string; description?: string; order: number }) {
        const response = await api.post('/employee-levels', data);
        return response.data;
    },

    async update(id: string, data: { code: string; name: string; description?: string; order: number }) {
        const response = await api.put(`/employee-levels/${id}`, data);
        return response.data;
    },

    async delete(id: string) {
        const response = await api.delete(`/employee-levels/${id}`);
        return response.data;
    }
};
