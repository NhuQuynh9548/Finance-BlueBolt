import api from './api';

export interface EmployeeFilters {
    buId?: string;
    specialization?: string;
    status?: string;
    search?: string;
}

export const employeeService = {
    async getAll(filters?: EmployeeFilters) {
        const response = await api.get('/employees', { params: filters });
        return response.data;
    },

    async getById(id: string) {
        const response = await api.get(`/employees/${id}`);
        return response.data;
    },

    async create(data: any) {
        const response = await api.post('/employees', data);
        return response.data;
    },

    async update(id: string, data: any) {
        const response = await api.put(`/employees/${id}`, data);
        return response.data;
    },

    async delete(id: string) {
        const response = await api.delete(`/employees/${id}`);
        return response.data;
    }
};
