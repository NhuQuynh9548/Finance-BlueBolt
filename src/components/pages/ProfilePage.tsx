import React, { useState } from 'react';
import { User, Mail, Shield, Building2, Edit2, Check, X, Camera } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';

export function ProfilePage() {
    const { currentUser } = useApp();
    const { updateUser } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(currentUser.name);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleSave = async () => {
        setIsSaving(true);
        setMessage(null);
        try {
            const updatedUser = await authService.updateProfile({ name, fullName: name });

            // Update context and local storage via AuthContext
            updateUser(updatedUser as any);

            setMessage({ type: 'success', text: 'Cập nhật thông tin thành công!' });
            setIsEditing(false);

            // Optional: trigger window reload to refresh all components if no state sync
            // window.location.reload();
        } catch (error) {
            setMessage({ type: 'error', text: 'Có lỗi xảy ra khi cập nhật thông tin.' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800">Thông tin cá nhân</h1>
                <p className="text-gray-600">Quản lý thông tin tài khoản của bạn</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Header/Cover */}
                <div className="h-32 bg-gradient-to-r from-[#004aad] to-blue-600"></div>

                <div className="px-8 pb-8">
                    {/* Avatar Section */}
                    <div className="relative -mt-16 mb-8 inline-block">
                        <div className="w-32 h-32 rounded-full border-4 border-white bg-white shadow-md flex items-center justify-center overflow-hidden">
                            {currentUser.avatar ? (
                                <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-[#004aad] flex items-center justify-center text-white text-4xl font-bold">
                                    {currentUser.name.charAt(0)}
                                </div>
                            )}
                        </div>
                        <button className="absolute bottom-1 right-1 p-2 bg-white rounded-full shadow-lg border border-gray-100 text-gray-600 hover:text-[#004aad] transition-colors">
                            <Camera className="w-5 h-5" />
                        </button>
                    </div>

                    {message && (
                        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                            {message.type === 'success' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                            <span className="text-sm font-medium">{message.text}</span>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Basic Info */}
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    Họ và tên
                                </label>
                                {isEditing ? (
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004aad] focus:border-transparent"
                                        />
                                    </div>
                                ) : (
                                    <p className="text-lg font-semibold text-gray-800">{currentUser.name}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                                    <Mail className="w-4 h-4" />
                                    Email
                                </label>
                                <p className="text-gray-800 font-medium">{currentUser.email}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                                    <Shield className="w-4 h-4" />
                                    Vai trò
                                </label>
                                <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-[#004aad] text-sm font-semibold">
                                    {currentUser.role}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                                    <Building2 className="w-4 h-4" />
                                    Đơn vị (BU)
                                </label>
                                <p className="text-gray-800 font-medium">{currentUser.buName || 'N/A'}</p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col justify-end items-end gap-3">
                            {isEditing ? (
                                <>
                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="w-full md:w-auto px-6 py-2.5 bg-[#004aad] text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center gap-2"
                                    >
                                        {isSaving ? (
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            <Check className="w-5 h-5" />
                                        )}
                                        <span>Lưu thay đổi</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsEditing(false);
                                            setName(currentUser.name);
                                            setMessage(null);
                                        }}
                                        className="w-full md:w-auto px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                                    >
                                        Hủy
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="w-full md:w-auto px-6 py-2.5 border border-[#004aad] text-[#004aad] rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Edit2 className="w-4 h-4" />
                                    Cập nhật thông tin
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
