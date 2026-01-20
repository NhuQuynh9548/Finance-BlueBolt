import api from './api';

export const businessUnitService = {
    async getAll() {
        const response = await api.get('/business-units');
        return response.data;
    },

    async getById(id: string) {
        const response = await api.get(`/business-units/${id}`);
        return response.data;
    },

    async create(data: any) {
        const response = await api.post('/business-units', data);
        return response.data;
    },

    async update(id: string, data: any) {
        const response = await api.put(`/business-units/${id}`, data);
        return response.data;
    },

    async delete(id: string) {
        const response = await api.delete(`/business-units/${id}`);
        return response.data;
    }
};
