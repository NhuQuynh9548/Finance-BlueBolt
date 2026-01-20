import api from './api';

export interface User {
    id: string;
    userId: string;
    fullName: string;
    email: string;
    role: string;
    roleId?: string;
    businessUnits: string[];
    dataScope: 'global' | 'bu' | 'personal';
    status: 'active' | 'locked';
    lastLogin: string;
    createdDate: string;
    twoFAEnabled: boolean;
    loginHistory: {
        timestamp: string;
        ip: string;
        device: string;
    }[];
}

const userService = {
    getAll: async () => {
        const response = await api.get<User[]>('/users');
        return response.data;
    },

    getById: async (id: string) => {
        const response = await api.get<User>(`/users/${id}`);
        return response.data;
    },

    create: async (data: Partial<User>) => {
        const response = await api.post<User>('/users', data);
        return response.data;
    },

    update: async (id: string, data: Partial<User>) => {
        const response = await api.put<User>(`/users/${id}`, data);
        return response.data;
    },

    delete: async (id: string) => {
        await api.delete(`/users/${id}`);
    },

    toggleLock: async (id: string) => {
        const response = await api.post<{ status: string }>(`/users/${id}/toggle-lock`);
        return response.data;
    },

    resetPassword: async (id: string) => {
        // For now, this just simulates sending an email or actually resets it to a default
        const response = await api.post(`/users/${id}/reset-password`);
        return response.data;
    }
};

export default userService;
