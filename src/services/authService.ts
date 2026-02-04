import api from './api';

export interface LoginResponse {
    token: string;
    user: {
        id: string;
        email: string;
        name: string;
        role: string;
        buId: string | null;
        buName: string | null;
    };
}

export const authService = {
    async login(email: string, password: string): Promise<LoginResponse> {
        const response = await api.post('/auth/login', { email, password });
        return response.data;
    },

    async getCurrentUser() {
        const response = await api.get('/auth/me');
        return response.data;
    },

    async logout() {
        const response = await api.post('/auth/logout');
        return response.data;
    },

    async updateProfile(data: { name?: string; fullName?: string; avatar?: string | null }) {
        const response = await api.put('/auth/profile', data);
        return response.data;
    },

    async changePassword(data: { currentPassword: string; newPassword: string }) {
        const response = await api.post('/auth/change-password', data);
        return response.data;
    }
};
