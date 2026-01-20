import api from './api';

export const paymentMethodService = {
    async getAll() {
        const response = await api.get('/payment-methods');
        return response.data;
    },

    async create(data: { name: string }) {
        const response = await api.post('/payment-methods', data);
        return response.data;
    },

    async update(id: string, data: { name: string }) {
        const response = await api.put(`/payment-methods/${id}`, data);
        return response.data;
    },

    async delete(id: string) {
        const response = await api.delete(`/payment-methods/${id}`);
        return response.data;
    }
};
