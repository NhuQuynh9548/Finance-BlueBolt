import React, { useState, useEffect } from 'react';
import { Plus, Eye, Edit2, Trash2, Shield, X, AlertCircle, Save, Users } from 'lucide-react';
import roleService, { Permission, Role } from '../../../services/roleService';

type ModalMode = 'create' | 'view' | 'edit' | null;

const DEFAULT_MODULES = [
  { key: 'thu_chi', label: 'Thu - Chi' },
  { key: 'bao_cao', label: 'Báo cáo' },
  { key: 'doi_tac', label: 'Đối tác' },
  { key: 'nhan_su', label: 'Nhân sự' },
  { key: 'quan_ly_bu', label: 'Quản lý BU' },
  { key: 'master_data', label: 'Master Data' },
  { key: 'he_thong', label: 'Hệ thống' },
];

export function PhanQuyenVaiTro() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await roleService.getAll();
      setRoles(data);
    } catch (error) {
      console.error('Fetch roles error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);

  // Modal states
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  // Form data
  const [formData, setFormData] = useState<Partial<Role>>({
    name: '',
    description: '',
    permissions: DEFAULT_MODULES.map(m => ({
      module: m.key,
      view: false,
      create: false,
      edit: false,
      delete: false,
      approve: false,
    })),
  });

  // CRUD Operations
  const handleCreate = () => {
    setModalMode('create');
    setSelectedRole(null);
    setFormData({
      name: '',
      description: '',
      permissions: DEFAULT_MODULES.map(m => ({
        module: m.key,
        view: false,
        create: false,
        edit: false,
        delete: false,
        approve: false,
      })),
      isSystemRole: false,
      userCount: 0,
      createdDate: new Date().toLocaleDateString('vi-VN'),
    });
  };

  const handleView = (role: Role) => {
    setModalMode('view');
    setSelectedRole(role);
    setFormData({ ...role });
  };

  const handleEdit = (role: Role) => {
    setModalMode('edit');
    setSelectedRole(role);
    setFormData({ ...role });
  };

  const handleDelete = (role: Role) => {
    setDeletingRole(role);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (deletingRole) {
      try {
        await roleService.delete(deletingRole.id);
        await fetchData();
        setShowDeleteConfirm(false);
        setDeletingRole(null);
      } catch (error: any) {
        console.error('Delete role error:', error);
        const message = error.response?.data?.error || 'Có lỗi xảy ra khi xóa vai trò';
        alert(message);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.description) {
      alert('Vui lòng điền đầy đủ tên và mô tả vai trò');
      return;
    }

    try {
      if (modalMode === 'create') {
        await roleService.create(formData);
      } else if (modalMode === 'edit' && selectedRole) {
        await roleService.update(selectedRole.id, formData);
      }

      await fetchData();
      setModalMode(null);
      setSelectedRole(null);
    } catch (error: any) {
      console.error('Submit role error:', error);
      const message = error.response?.data?.error || 'Có lỗi xảy ra khi lưu vai trò';
      alert(message);
    }
  };

  const handlePermissionChange = (moduleKey: string, action: keyof Omit<Permission, 'module'>, value: boolean) => {
    const updatedPermissions = formData.permissions?.map(perm => {
      if (perm.module === moduleKey) {
        return { ...perm, [action]: value };
      }
      return perm;
    });
    setFormData({ ...formData, permissions: updatedPermissions });
  };

  const handleSelectAll = (moduleKey: string, select: boolean) => {
    const updatedPermissions = formData.permissions?.map(perm => {
      if (perm.module === moduleKey) {
        return {
          module: perm.module,
          view: select,
          create: select,
          edit: select,
          delete: select,
          approve: select,
        };
      }
      return perm;
    });
    setFormData({ ...formData, permissions: updatedPermissions });
  };

  const getModuleLabel = (moduleKey: string) => {
    return DEFAULT_MODULES.find(m => m.key === moduleKey)?.label || moduleKey;
  };

  const isReadOnly = modalMode === 'view';

  const canDeleteRole = (role: Role) => {
    return !role.isSystemRole;
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">QUẢN LÝ VAI TRÒ</h1>
          <p className="text-gray-600">Quản lý tất cả vai trò trong hệ thống</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-6 py-3 bg-[#1E6BB8] hover:bg-[#1557A0] text-white rounded-lg transition-colors shadow-md"
        >
          <Plus className="w-5 h-5" />
          Tạo nhóm vai trò
        </button>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800">Danh sách vai trò</h2>
          <p className="text-sm text-gray-500 mt-1">Tìm thấy {roles.length} vai trò</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Tên vai trò
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Mô tả
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Số lượng quyền
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Số người dùng
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Ngày tạo
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : roles.map((role) => (
                <tr key={role.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-[#1E6BB8]" />
                      <div>
                        <span className="font-bold text-gray-900">{role.name}</span>
                        {role.isSystemRole && (
                          <span className="ml-2 text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-semibold">
                            System
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{role.description}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-gray-900">{role.permissionCount} quyền</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-semibold text-gray-900">{role.userCount}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{role.createdDate}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleView(role)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(role)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Chỉnh sửa quyền"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(role)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={canDeleteRole(role) ? 'Xóa vai trò' : 'Không thể xóa vai trò hệ thống'}
                        disabled={!canDeleteRole(role)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {roles.length === 0 && (
          <div className="text-center py-12">
            <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Chưa có vai trò nào</p>
          </div>
        )}
      </div>

      {/* Create/View/Edit Modal - Permission Matrix */}
      {modalMode && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
            <div className="border-b border-gray-200 px-6 py-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    {modalMode === 'create' && 'Tạo Vai Trò Mới'}
                    {modalMode === 'view' && 'Chi Tiết Vai Trò'}
                    {modalMode === 'edit' && 'Chỉnh Sửa Vai Trò'}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {isReadOnly ? 'Xem ma trận phân quyền chi tiết' : 'Thiết lập quyền truy cập cho từng module'}
                  </p>
                </div>
                <button
                  onClick={() => setModalMode(null)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-180px)] px-6 py-6">
              <form onSubmit={handleSubmit} id="role-form">
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-700 uppercase mb-4 pb-2 border-b border-gray-200">
                      Thông tin vai trò
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          <span className="text-red-500">*</span> Tên vai trò
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="VD: Accountant, HR Manager..."
                          disabled={isReadOnly}
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1E6BB8] focus:border-transparent focus:bg-white transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          <span className="text-red-500">*</span> Mô tả
                        </label>
                        <input
                          type="text"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="Mô tả vai trò..."
                          disabled={isReadOnly}
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1E6BB8] focus:border-transparent focus:bg-white transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Permission Matrix */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-700 uppercase mb-4 pb-2 border-b border-gray-200">
                      Ma trận phân quyền
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border border-gray-200 rounded-lg">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-bold text-gray-700 border-r border-gray-200">
                              Module
                            </th>
                            <th className="px-4 py-3 text-center text-sm font-bold text-gray-700 border-r border-gray-200">
                              View
                            </th>
                            <th className="px-4 py-3 text-center text-sm font-bold text-gray-700 border-r border-gray-200">
                              Create
                            </th>
                            <th className="px-4 py-3 text-center text-sm font-bold text-gray-700 border-r border-gray-200">
                              Edit
                            </th>
                            <th className="px-4 py-3 text-center text-sm font-bold text-gray-700 border-r border-gray-200">
                              Delete
                            </th>
                            <th className="px-4 py-3 text-center text-sm font-bold text-gray-700 border-r border-gray-200">
                              Approve
                            </th>
                            {!isReadOnly && (
                              <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">
                                Action
                              </th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {formData.permissions?.map((perm) => (
                            <tr key={perm.module} className="hover:bg-gray-50">
                              <td className="px-4 py-3 font-semibold text-gray-900 border-r border-gray-200">
                                {getModuleLabel(perm.module)}
                              </td>
                              <td className="px-4 py-3 text-center border-r border-gray-200">
                                <input
                                  type="checkbox"
                                  checked={perm.view}
                                  onChange={(e) => handlePermissionChange(perm.module, 'view', e.target.checked)}
                                  disabled={isReadOnly}
                                  className="w-5 h-5 text-[#1E6BB8] rounded focus:ring-[#1E6BB8] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                                />
                              </td>
                              <td className="px-4 py-3 text-center border-r border-gray-200">
                                <input
                                  type="checkbox"
                                  checked={perm.create}
                                  onChange={(e) => handlePermissionChange(perm.module, 'create', e.target.checked)}
                                  disabled={isReadOnly}
                                  className="w-5 h-5 text-[#1E6BB8] rounded focus:ring-[#1E6BB8] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                                />
                              </td>
                              <td className="px-4 py-3 text-center border-r border-gray-200">
                                <input
                                  type="checkbox"
                                  checked={perm.edit}
                                  onChange={(e) => handlePermissionChange(perm.module, 'edit', e.target.checked)}
                                  disabled={isReadOnly}
                                  className="w-5 h-5 text-[#1E6BB8] rounded focus:ring-[#1E6BB8] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                                />
                              </td>
                              <td className="px-4 py-3 text-center border-r border-gray-200">
                                <input
                                  type="checkbox"
                                  checked={perm.delete}
                                  onChange={(e) => handlePermissionChange(perm.module, 'delete', e.target.checked)}
                                  disabled={isReadOnly}
                                  className="w-5 h-5 text-[#1E6BB8] rounded focus:ring-[#1E6BB8] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                                />
                              </td>
                              <td className="px-4 py-3 text-center border-r border-gray-200">
                                <input
                                  type="checkbox"
                                  checked={perm.approve}
                                  onChange={(e) => handlePermissionChange(perm.module, 'approve', e.target.checked)}
                                  disabled={isReadOnly}
                                  className="w-5 h-5 text-[#1E6BB8] rounded focus:ring-[#1E6BB8] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                                />
                              </td>
                              {!isReadOnly && (
                                <td className="px-4 py-3 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleSelectAll(perm.module, true)}
                                      className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                                    >
                                      All
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleSelectAll(perm.module, false)}
                                      className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                                    >
                                      None
                                    </button>
                                  </div>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Permission Summary */}
                  {modalMode !== 'create' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="text-sm font-bold text-blue-900 mb-2">Tổng quan quyền</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm text-blue-700">Tổng số quyền:</span>
                          <span className="ml-2 text-lg font-bold text-blue-900">{formData.permissionCount || 0}</span>
                        </div>
                        <div>
                          <span className="text-sm text-blue-700">Số người dùng:</span>
                          <span className="ml-2 text-lg font-bold text-blue-900">{formData.userCount || 0}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </form>
            </div>

            <div className="border-t border-gray-200 px-6 py-4 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="px-8 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium min-w-[140px]"
              >
                Đóng
              </button>
              {modalMode === 'view' && selectedRole && (
                <button
                  type="button"
                  onClick={() => setModalMode('edit')}
                  className="flex items-center gap-2 px-8 py-2.5 bg-[#1E6BB8] hover:bg-[#1557A0] text-white rounded-lg transition-colors font-medium min-w-[140px]"
                >
                  <Edit2 className="w-4 h-4" />
                  Chỉnh sửa quyền
                </button>
              )}
              {modalMode !== 'view' && (
                <button
                  type="submit"
                  form="role-form"
                  className="flex items-center gap-2 px-8 py-2.5 bg-[#1E6BB8] hover:bg-[#1557A0] text-white rounded-lg transition-colors font-medium min-w-[140px]"
                >
                  <Save className="w-4 h-4" />
                  {modalMode === 'create' ? 'Tạo vai trò' : 'Lưu thay đổi'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && deletingRole && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Xác nhận xóa vai trò</h3>
                  <p className="text-sm text-gray-600">Hành động này không thể hoàn tác</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Vai trò:</span> {deletingRole.name}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Số người dùng:</span> {deletingRole.userCount}
                </p>
                {deletingRole.userCount > 0 && (
                  <p className="text-sm text-red-600 mt-2">
                    ⚠️ Cảnh báo: Còn {deletingRole.userCount} người dùng đang sử dụng vai trò này
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Hủy
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                >
                  Xác nhận xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
