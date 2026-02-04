import React, { useState, useRef } from 'react';
import { User, Mail, Shield, Building2, Edit2, Check, X, Camera, Link, Upload } from 'lucide-react';
import { uploadService } from '../../services/uploadService';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';

export function ProfilePage() {
    const { currentUser } = useApp();
    const { updateUser } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(currentUser.name);
    const [isSaving, setIsSaving] = useState(false);
    const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Avatar states
    const [avatarTab, setAvatarTab] = useState<'upload' | 'url'>('upload');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [avatarInputUrl, setAvatarInputUrl] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAvatarUpdate = async () => {
        setIsUpdatingAvatar(true);
        setMessage(null);
        try {
            let newAvatarUrl = currentUser.avatar;

            if (avatarTab === 'upload') {
                if (!selectedFile) {
                    setMessage({ type: 'error', text: 'Vui lòng chọn ảnh để tải lên.' });
                    setIsUpdatingAvatar(false);
                    return;
                }
                const uploadedFiles = await uploadService.uploadFiles([selectedFile]);
                if (uploadedFiles && uploadedFiles.length > 0) {
                    newAvatarUrl = uploadedFiles[0].fileUrl;
                }
            } else {
                if (!avatarInputUrl.trim()) {
                    setMessage({ type: 'error', text: 'Vui lòng nhập đường dẫn ảnh.' });
                    setIsUpdatingAvatar(false);
                    return;
                }
                newAvatarUrl = avatarInputUrl;
            }

            const updatedUser = await authService.updateProfile({ avatar: newAvatarUrl });
            updateUser(updatedUser as any);
            setMessage({ type: 'success', text: 'Cập nhật ảnh đại diện thành công!' });
            setSelectedFile(null);
            setPreviewUrl(null);
            setAvatarInputUrl('');
        } catch (error) {
            setMessage({ type: 'error', text: 'Có lỗi xảy ra khi cập nhật ảnh đại diện.' });
        } finally {
            setIsUpdatingAvatar(false);
        }
    };

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
        <div className="p-8 max-w-6xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800">Cài đặt tài khoản</h1>
                <p className="text-gray-600">Quản lý thông tin hồ sơ và ảnh đại diện của bạn</p>
            </div>

            {message && (
                <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {message.type === 'success' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                    <span className="text-sm font-medium">{message.text}</span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* AVATAR CARD */}
                <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100 flex items-center gap-2">
                        <Camera className="w-5 h-5 text-blue-600" />
                        <h2 className="font-bold text-gray-800">Ảnh đại diện</h2>
                    </div>
                    <div className="p-8 flex flex-col items-center">
                        {/* Current Avatar */}
                        <div className="relative mb-8 text-center">
                            <div className="w-40 h-40 p-4 rounded-full border-4 border-gray-100 shadow-sm flex items-center justify-center overflow-hidden bg-[#004aad] mx-auto">
                                {(previewUrl || avatarInputUrl || currentUser.avatar) ? (
                                    <img
                                        src={previewUrl || (avatarTab === 'url' ? avatarInputUrl : uploadService.getAbsoluteUrl(currentUser.avatar)) || undefined}
                                        alt={currentUser.name}
                                        className="w-full h-full object-cover rounded-full"
                                    />
                                ) : (
                                    <div className="text-white flex items-center justify-center text-3xl font-bold">
                                        {currentUser.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <p className="mt-4 text-xs text-gray-400">Xem trước ảnh mới của bạn</p>
                        </div>

                        {/* Tab Switcher */}
                        <div className="w-full flex rounded-lg bg-gray-100 p-1 mb-6">
                            <button
                                onClick={() => setAvatarTab('upload')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${avatarTab === 'upload' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <Camera className="w-4 h-4" />
                                Tải lên
                            </button>
                            <button
                                onClick={() => setAvatarTab('url')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${avatarTab === 'url' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <Link className="w-4 h-4" />
                                Đường dẫn URL
                            </button>
                        </div>

                        {/* Input Area */}
                        {avatarTab === 'upload' ? (
                            <>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept="image/*"
                                    className="hidden"
                                />
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer mb-6"
                                >
                                    <Upload className="w-8 h-8 text-gray-300 mb-3" />
                                    <p className="text-sm font-medium text-gray-600">
                                        {selectedFile ? selectedFile.name : 'Nhấp để chọn ảnh hoặc kéo thả'}
                                    </p>
                                </div>
                            </>
                        ) : (
                            <div className="w-full mb-6">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Đường dẫn ảnh</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={avatarInputUrl}
                                        onChange={(e) => setAvatarInputUrl(e.target.value)}
                                        placeholder="https://example.com/image.jpg"
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004aad]/20 focus:border-[#004aad] transition-all bg-white font-medium"
                                    />
                                    <Link className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                </div>
                            </div>
                        )}

                        {/* Update Avatar Action */}
                        <button
                            onClick={handleAvatarUpdate}
                            disabled={isUpdatingAvatar}
                            className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-md shadow-blue-100 uppercase tracking-wide text-sm flex items-center justify-center gap-2"
                        >
                            {isUpdatingAvatar ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <Check className="w-4 h-4" />
                            )}
                            Cập nhật ảnh đại diện
                        </button>
                    </div>
                </div>

                {/* PROFILE INFO CARD */}
                <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100 flex items-center gap-2">
                        <User className="w-5 h-5 text-blue-600" />
                        <h2 className="font-bold text-gray-800">Thông tin cá nhân</h2>
                    </div>
                    <div className="p-8 flex flex-col gap-6">
                        {/* User Name */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Họ và tên</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Nhập họ và tên..."
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004aad]/20 focus:border-[#004aad] transition-all bg-white font-medium"
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                            <input
                                type="email"
                                disabled
                                value={currentUser.email}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed font-medium"
                            />
                            <p className="mt-2 text-[12px] text-gray-400 italic">Email không thể thay đổi</p>
                        </div>

                        {/* Business Unit & Role (Extra context info) */}
                        <div className="grid grid-cols-2 gap-4 mt-2">
                            <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                                <label className="block text-[11px] font-bold text-blue-600 uppercase tracking-wider mb-1">Đơn vị (BU)</label>
                                <p className="text-sm font-bold text-gray-800">{currentUser.buName || 'N/A'}</p>
                            </div>
                            <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                                <label className="block text-[11px] font-bold text-indigo-600 uppercase tracking-wider mb-1">Vai trò</label>
                                <div className="inline-flex items-center text-sm font-bold text-gray-800">
                                    {currentUser.role}
                                </div>
                            </div>
                        </div>

                        {/* Update Profile Action */}
                        <div className="mt-auto pt-6 border-t border-gray-50">
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100 flex items-center justify-center gap-2 uppercase tracking-wide text-sm"
                            >
                                {isSaving ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <Check className="w-5 h-5" />
                                )}
                                <span>Cập nhật thông tin</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
