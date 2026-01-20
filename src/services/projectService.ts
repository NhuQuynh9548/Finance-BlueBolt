import api from './api';

export const projectService = {
    async getAll(filters?: { status?: string }) {
        const response = await api.get('/projects', { params: filters });
        return response.data;
    },

    async getById(id: string) {
        const response = await api.get(`/projects/${id}`);
        return response.data;
    },

    async create(data: any) {
        const response = await api.post('/projects', data);
        return response.data;
    },

    async update(id: string, data: any) {
        const response = await api.put(`/projects/${id}`, data);
        return response.data;
    },

    async delete(id: string) {
        const response = await api.delete(`/projects/${id}`);
        return response.data;
    }
};
