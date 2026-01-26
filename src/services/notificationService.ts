import api from './api';

export interface Notification {
    id: string;
    userId: string;
    message: string;
    type: string;
    unread: boolean;
    createdAt: string;
}

export const notificationService = {
    async getNotifications() {
        const response = await api.get('/notifications');
        return response.data as Notification[];
    },

    async markAsRead(id: string) {
        const response = await api.put(`/notifications/${id}/read`);
        return response.data;
    },

    async markAllAsRead() {
        const response = await api.put('/notifications/mark-all-read');
        return response.data;
    }
};
