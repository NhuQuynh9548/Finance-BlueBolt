import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Award, X, AlertCircle, RefreshCw, Eye } from 'lucide-react';
import { employeeLevelService } from '../../../services/employeeLevelService';

interface Level {
  id: string;
  code: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  order: number;
}

export function CapBacNhanSu() {
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingLevel, setEditingLevel] = useState<Level | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingLevel, setDeletingLevel] = useState<Level | null>(null);
  const [viewingLevel, setViewingLevel] = useState<Level | null>(null);

  const handleViewDetails = (level: Level) => {
    setViewingLevel(level);
  };

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    status: 'active' as 'active' | 'inactive',
    order: 0,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await employeeLevelService.getAll();
      setLevels(data);
    } catch (error) {
      console.error(error);
      alert('Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredLevels = levels.filter(level => {
    const matchesSearch =
      (level.code?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (level.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (level.description && level.description.toLowerCase().includes(searchTerm.toLowerCase()));

    // API might not support active/inactive status field in DB yet?
    // Checking schema: EmployeeLevel: id, code, name, order. No 'status' field in schema!
    // The previous mock had status. I should check schema.
    // Schema lines 270-275: id, code, name, description, order. NO STATUS.
    // I will remove status filtering for now or add it later if needed.
    // For now, assume all are active.

    return matchesSearch;
  });

  const handleAdd = () => {
    setEditingLevel(null);
    setFormData({
      code: '',
      name: '',
      description: '',
      status: 'active',
      order: levels.length + 1,
    });
    setShowModal(true);
  };

  const handleEdit = (level: Level) => {
    setEditingLevel(level);
    setFormData({
      code: level.code || '',
      name: level.name || '',
      description: level.description || '',
      status: 'active', // Placeholder
      order: level.order || 0
    });
    setShowModal(true);
  };

  const handleDelete = (level: Level) => {
    setDeletingLevel(level);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (deletingLevel) {
      try {
        await employeeLevelService.delete(deletingLevel.id);
        fetchData();
        setShowDeleteConfirm(false);
        setDeletingLevel(null);
      } catch (error: any) {
        alert('Xóa thất bại: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      code: formData.code,
      name: formData.name,
      description: formData.description,
      order: parseInt(formData.order as any) || 0
    };

    try {
      if (editingLevel) {
        await employeeLevelService.update(editingLevel.id, payload);
      } else {
        await employeeLevelService.create(payload);
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      console.error(error);
      alert('Lưu thất bại');
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Cấp Bậc Nhân Sự</h1>
        <p className="text-gray-600">Định nghĩa thứ bậc để làm cơ sở cho phân quyền phê duyệt</p>
      </div>

      {/* Actions Bar */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col md:flex-row gap-4 flex-1 w-full">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Tìm kiếm mã, tên cấp bậc..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004aad] focus:border-transparent"
              />
            </div>

            <button onClick={fetchData} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg">
              <RefreshCw className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Add Button */}
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-6 py-2 bg-[#004aad] hover:bg-[#1557A0] text-white rounded-lg transition-colors whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            Thêm Cấp Bậc
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && <div className="text-center py-12">Đang tải dữ liệu...</div>}

      {/* Table */}
      {!loading && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Mã Cấp Bậc</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tên Cấp Bậc</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Mô Tả</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredLevels.map((level) => (
                  <tr key={level.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono font-semibold text-[#004aad]">{level.code}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-[#F7931E]" />
                        <span className="font-medium text-gray-900">{level.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{level.description}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleViewDetails(level)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(level)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(level)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Xóa"
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
          {filteredLevels.length === 0 && (
            <div className="text-center py-12">
              <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Không tìm thấy cấp bậc nào</p>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="border-b border-gray-200 px-6 py-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    {editingLevel ? 'Chỉnh Sửa Cấp Bậc' : 'Tạo Mới Cấp Bậc'}
                  </h2>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-180px)] px-6 py-6">
              <form onSubmit={handleSubmit} id="level-form">
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">
                        Mã Cấp Bậc
                      </label>
                      <input
                        type="text"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        placeholder="L01, L02..."
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#004aad] focus:border-transparent focus:bg-white transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">
                      Tên Cấp Bậc
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ví dụ: Trưởng nhóm"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#004aad] focus:border-transparent focus:bg-white transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">
                      Mô Tả
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Mô tả về cấp bậc này..."
                      rows={3}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#004aad] focus:border-transparent focus:bg-white transition-all resize-none"
                    />
                  </div>
                </div>
              </form>
            </div>

            <div className="border-t border-gray-200 px-6 py-4 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-8 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium min-w-[140px]"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                form="level-form"
                className="px-8 py-2.5 bg-[#004aad] hover:bg-[#1557A0] text-white rounded-lg transition-colors font-medium min-w-[140px]"
              >
                {editingLevel ? 'Cập Nhật' : 'Tạo Mới'}
              </button>
            </div>
          </div>
        </div >
      )
      }

      {/* Delete Confirmation Modal */}
      {
        showDeleteConfirm && deletingLevel && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">Xác nhận xóa</h3>
                    <p className="text-sm text-gray-600">Bạn có chắc chắn muốn xóa cấp bậc này?</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Mã:</span> {deletingLevel.code}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Tên:</span> {deletingLevel.name}
                  </p>
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
        )
      }
      {/* View Details Modal */}
      {viewingLevel && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="border-b border-gray-200 px-6 py-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Chi Tiết Cấp Bậc</h2>
                </div>
                <button
                  onClick={() => setViewingLevel(null)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-500 uppercase mb-1">Mã Cấp Bậc</label>
                <div className="text-gray-900 font-medium bg-gray-50 p-3 rounded-lg border border-gray-100">{viewingLevel.code}</div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-500 uppercase mb-1">Tên Cấp Bậc</label>
                <div className="text-gray-900 font-medium bg-gray-50 p-3 rounded-lg border border-gray-100">{viewingLevel.name}</div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-500 uppercase mb-1">Mô Tả</label>
                <div className="text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-100 whitespace-pre-wrap">
                  {viewingLevel.description || <span className="text-gray-400 italic">Không có mô tả</span>}
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end">
              <button
                onClick={() => setViewingLevel(null)}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div >
  );
}
