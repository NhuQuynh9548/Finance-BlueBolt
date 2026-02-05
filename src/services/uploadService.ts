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
        // If already absolute URL, return as is
        if (url.startsWith('http://') || url.startsWith('https://')) return url;

        const envApiUrl = (import.meta as any).env.VITE_API_URL;
        
        if (envApiUrl) {
            // VITE_API_URL is like: https://bbplatform.bluebolt.vn/api
            // We need to construct: https://bbplatform.bluebolt.vn + url
            
            // Extract base domain (remove /api from end)
            const baseUrl = envApiUrl.replace(/\/api\/?$/, '');
            
            // Ensure url starts with /
            const normalizedUrl = url.startsWith('/') ? url : `/${url}`;
            
            return `${baseUrl}${normalizedUrl}`;
        }

        // Fallback for localhost
        if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
            return `${window.location.origin}${url.startsWith('/') ? url : `/${url}`}`;
        }

        return `http://localhost:5000${url.startsWith('/') ? url : `/${url}`}`;
    }
};
