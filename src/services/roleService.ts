import api from './api';

export interface Permission {
    module: string;
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    approve: boolean;
}

export interface Role {
    id: string;
    name: string;
    description: string;
    permissionCount: number;
    userCount: number;
    createdDate: string;
    isSystemRole: boolean;
    permissions: Permission[];
}

const roleService = {
    getAll: async () => {
        const response = await api.get<Role[]>('/roles');
        return response.data;
    },

    getById: async (id: string) => {
        const response = await api.get<Role>(`/roles/${id}`);
        return response.data;
    },

    create: async (data: Partial<Role>) => {
        const response = await api.post<Role>('/roles', data);
        return response.data;
    },

    update: async (id: string, data: Partial<Role>) => {
        const response = await api.put<Role>(`/roles/${id}`, data);
        return response.data;
    },

    delete: async (id: string) => {
        await api.delete(`/roles/${id}`);
    }
};

export default roleService;
