import api from './api';

export const uploadService = {
    async uploadFiles(files: File[]) {
        if (files.length === 0) return [];

        const formData = new FormData();
        files.forEach(file => {
            formData.append('files', file);
        });

        const response = await api.post('/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        return response.data; // Array of {fileName, fileSize, fileType, fileUrl}
    },

    getAbsoluteUrl(url: string | null | undefined) {
        if (!url) return '';
        if (url.startsWith('http')) return url;

        // Legacy fix: if URL starts with /uploads but NOT /api/uploads, prefix with /api
        let normalizedUrl = url;
        if (url.startsWith('/uploads/') && !url.startsWith('/api/uploads/')) {
            normalizedUrl = `/api${url}`;
        }

        const envApiUrl = (import.meta as any).env.VITE_API_URL;
        if (envApiUrl) {
            const baseUrl = envApiUrl.replace('/api', '');
            return `${baseUrl}${normalizedUrl}`;
        }

        if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
            return `${window.location.origin}${normalizedUrl}`;
        }

        return `http://localhost:5000${normalizedUrl}`;
    }
};
