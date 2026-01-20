import api from './api';

export type SystemSettings = Record<string, string | number | boolean>;

const settingService = {
    getAll: async () => {
        const response = await api.get<SystemSettings>('/settings');
        return response.data;
    },

    update: async (settings: Partial<SystemSettings>) => {
        const response = await api.post<{ message: string }>('/settings', settings);
        return response.data;
    }
};

export default settingService;
