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
    }
};
