import api from './api';

export interface ActivityLog {
    id: string;
    timestamp: string;
    user: string;
    action: string;
    module: string;
    description: string;
    ip: string;
    status: 'success' | 'error' | 'warning';
}

const logService = {
    getAll: async (params?: { action?: string; module?: string; userId?: string; limit?: number }) => {
        const response = await api.get<ActivityLog[]>('/logs', { params });
        return response.data;
    }
};

export default logService;
