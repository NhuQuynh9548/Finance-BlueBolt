import api from './api';

export interface CategoryFilters {
    type?: string;
    status?: string;
}

export const categoryService = {
    async getAll(filters?: CategoryFilters) {
        const response = await api.get('/categories', { params: filters });
        return response.data;
    },

    async getById(id: string) {
        const response = await api.get(`/categories/${id}`);
        return response.data;
    },

    async create(data: any) {
        const response = await api.post('/categories', data);
        return response.data;
    },

    async update(id: string, data: any) {
        const response = await api.put(`/categories/${id}`, data);
        return response.data;
    },

    async delete(id: string) {
        const response = await api.delete(`/categories/${id}`);
        return response.data;
    }
};
