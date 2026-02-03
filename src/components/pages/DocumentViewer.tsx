import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, X, FileText } from 'lucide-react';

export const DocumentViewer: React.FC = () => {
    const [searchParams] = useSearchParams();
    const url = searchParams.get('url') || '';
    const name = searchParams.get('name') || 'Document';
    const type = searchParams.get('type') || '';

    const handleDownload = async () => {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Download failed');
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            console.error('Download error:', error);
            alert('Không thể tải xuống file');
        }
    };

    const handleClose = () => {
        window.close();
    };

    return (
        <div className="flex flex-col h-screen bg-[#1a1a1a] text-white">
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-6 bg-[#262626] border-b border-white/10 shadow-lg z-10">
                <div className="flex items-center gap-3 overflow-hidden">
                    <FileText className="w-5 h-5 text-blue-400 shrink-0" />
                    <h1 className="text-sm font-medium truncate" title={name}>
                        {name}
                    </h1>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={handleDownload}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-blue-500/20 active:scale-95"
                    >
                        <Download className="w-4 h-4" />
                        <span className="text-sm font-semibold">Tải xuống</span>
                    </button>

                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white"
                        title="Đóng tab"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 relative overflow-hidden flex items-center justify-center p-4">
                {!url ? (
                    <div className="text-center">
                        <p className="text-gray-400">Không tìm thấy tài liệu.</p>
                    </div>
                ) : type.startsWith('image/') ? (
                    <div className="w-full h-full flex items-center justify-center overflow-auto custom-scrollbar">
                        <img
                            src={url}
                            alt={name}
                            className="max-w-full max-h-full object-contain backdrop-blur-sm shadow-2xl rounded-sm"
                        />
                    </div>
                ) : type === 'application/pdf' ? (
                    <iframe
                        src={`${url}#toolbar=0&view=FitH`}
                        className="w-full h-full border-0 bg-white shadow-2xl rounded-sm"
                        title={name}
                    />
                ) : (
                    <div className="bg-[#262626] p-10 rounded-2xl flex flex-col items-center gap-6 shadow-2xl border border-white/5">
                        <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center">
                            <FileText className="w-10 h-10 text-blue-400" />
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-medium mb-2">Định dạng không hỗ trợ xem trực tiếp</p>
                            <p className="text-sm text-gray-400">Vui lòng tải xuống để xem nội dung chi tiết.</p>
                        </div>
                        <button
                            onClick={handleDownload}
                            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-blue-600/20"
                        >
                            Tải xuống ngay
                        </button>
                    </div>
                )}
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                    height: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
            `}</style>
        </div>
    );
};
