import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Briefcase, X, AlertCircle, RefreshCw } from 'lucide-react';
import { projectService } from '../../../services/projectService';
import { businessUnitService } from '../../../services/businessUnitService';

interface Project {
  id: string;
  code: string;
  name: string;
  buOwner: string;
  pm: string;
  budget: number;
  spent: number;
  startDate: string;
  endDate: string;
  status: 'ongoing' | 'paused' | 'completed' | 'closed';
}

export function QuanLyDuAn() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [businessUnits, setBusinessUnits] = useState<any[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterBU, setFilterBU] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    buOwner: '',
    pm: '',
    budget: 0,
    startDate: '',
    endDate: '',
    status: 'ongoing' as 'ongoing' | 'paused' | 'completed' | 'closed',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projectsData, buData] = await Promise.all([
        projectService.getAll(),
        businessUnitService.getAll()
      ]);
      setProjects(projectsData);
      setBusinessUnits(buData);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredProjects = projects.filter(project => {
    const matchesSearch =
      project.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.pm && project.pm.toLowerCase().includes(searchTerm.toLowerCase()));

    // Check if filterBU is a name or ID. API returns buOwner as string (name usually in this sloppy mock transition, 
    // but better if we matched strictly. For now assuming buOwner stored as Name in Project based on previous schema/mock).
    // Actually schema says buOwner is String. Ideally it should be Relation. 
    // But let's check strict status.
    const matchesBU = filterBU === 'all' || project.buOwner === filterBU;
    const matchesStatus = filterStatus === 'all' || project.status === filterStatus;

    return matchesSearch && matchesBU && matchesStatus;
  });

  const handleAdd = () => {
    setEditingProject(null);
    setFormData({
      code: '',
      name: '',
      buOwner: '',
      pm: '',
      budget: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      status: 'ongoing',
    });
    setShowModal(true);
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      code: project.code || '',
      name: project.name || '',
      buOwner: project.buOwner || '',
      pm: project.pm || '',
      budget: project.budget || 0,
      startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
      endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
      status: project.status || 'ongoing',
    });
    setShowModal(true);
  };

  const handleDelete = (project: Project) => {
    setDeletingProject(project);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (deletingProject) {
      try {
        await projectService.delete(deletingProject.id);
        fetchData();
        setShowDeleteConfirm(false);
        setDeletingProject(null);
      } catch (error: any) {
        alert('Xóa thất bại: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        ...formData,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null
      };

      if (editingProject) {
        await projectService.update(editingProject.id, payload);
      } else {
        await projectService.create(payload);
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      console.error('Save error:', error);
      alert('Lưu thất bại');
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'ongoing': 'Đang thực hiện',
      'paused': 'Tạm dừng',
      'completed': 'Hoàn thành',
      'closed': 'Quyết toán'
    };
    return labels[status] || status;
  };

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      'ongoing': 'bg-blue-100 text-blue-700',
      'paused': 'bg-yellow-100 text-yellow-700',
      'completed': 'bg-green-100 text-green-700',
      'closed': 'bg-gray-100 text-gray-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Quản Lý Dự Án</h1>
        <p className="text-gray-600">Danh mục để gắn các phiếu thu/chi vào từng dự án cụ thể</p>
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
                placeholder="Tìm kiếm mã, tên dự án, PM..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E6BB8] focus:border-transparent"
              />
            </div>

            {/* Filter BU */}
            <select
              value={filterBU}
              onChange={(e) => setFilterBU(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E6BB8] focus:border-transparent"
            >
              <option value="all">Tất cả BU</option>
              {businessUnits.map(bu => (
                <option key={bu.id} value={bu.name}>{bu.name}</option>
              ))}
            </select>

            {/* Filter Status */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E6BB8] focus:border-transparent"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="ongoing">Đang thực hiện</option>
              <option value="paused">Tạm dừng</option>
              <option value="completed">Hoàn thành</option>
              <option value="closed">Quyết toán</option>
            </select>

            <button onClick={fetchData} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg">
              <RefreshCw className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Add Button */}
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-6 py-2 bg-[#1E6BB8] hover:bg-[#1557A0] text-white rounded-lg transition-colors whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            Thêm Dự Án
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
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Mã Dự Án</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tên Dự Án</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">BU Chủ Quản</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">PM</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Ngân Sách</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Trạng Thái</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono font-semibold text-[#1E6BB8]">{project.code}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-[#F7931E]" />
                        <span className="font-medium text-gray-900">{project.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{project.buOwner}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{project.pm}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{formatCurrency(project.budget)}</div>
                        {/* spent is hard to calculate without backend aggregation. Assuming backend handles it or we leave 0 for now */}
                        <div className="text-xs text-gray-500">
                          {/* Placeholder: Real spent requires transaction aggregation */}
                          {project.spent ? `Đã chi: ${formatCurrency(project.spent)}` : ''}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(project.status)}`}>
                        {getStatusLabel(project.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(project)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(project)}
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

          {filteredProjects.length === 0 && (
            <div className="text-center py-12">
              <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Không tìm thấy dự án nào</p>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
            <div className="border-b border-gray-200 px-6 py-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    {editingProject ? 'Chỉnh Sửa Dự Án' : 'Tạo Mới Dự Án'}
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
              <form onSubmit={handleSubmit} id="project-form">
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">
                        Mã Dự Án
                      </label>
                      <input
                        type="text"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        placeholder="PRJ-..."
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1E6BB8] focus:border-transparent focus:bg-white transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">
                        Trạng Thái
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1E6BB8] focus:border-transparent focus:bg-white transition-all"
                        required
                      >
                        <option value="ongoing">Đang thực hiện</option>
                        <option value="paused">Tạm dừng</option>
                        <option value="completed">Hoàn thành</option>
                        <option value="closed">Quyết toán</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">
                      Tên Dự Án
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Tên dự án..."
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1E6BB8] focus:border-transparent focus:bg-white transition-all"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">
                        BU Chủ Quản
                      </label>
                      <select
                        value={formData.buOwner}
                        onChange={(e) => setFormData({ ...formData, buOwner: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1E6BB8] focus:border-transparent focus:bg-white transition-all"
                        required
                      >
                        <option value="">Chọn BU...</option>
                        {businessUnits.map(bu => (
                          <option key={bu.id} value={bu.name}>{bu.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">
                        Quản Trị Dự Án (PM)
                      </label>
                      <input
                        type="text"
                        value={formData.pm}
                        onChange={(e) => setFormData({ ...formData, pm: e.target.value })}
                        placeholder="Tên PM..."
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1E6BB8] focus:border-transparent focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">
                      Ngân Sách (VND)
                    </label>
                    <input
                      type="number"
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                      min="0"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1E6BB8] focus:border-transparent focus:bg-white transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">
                        Ngày Bắt Đầu
                      </label>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1E6BB8] focus:border-transparent focus:bg-white transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">
                        Ngày Kết Thúc
                      </label>
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1E6BB8] focus:border-transparent focus:bg-white transition-all"
                      />
                    </div>
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
                form="project-form"
                className="px-8 py-2.5 bg-[#1E6BB8] hover:bg-[#1557A0] text-white rounded-lg transition-colors font-medium min-w-[140px]"
              >
                {editingProject ? 'Cập Nhật' : 'Tạo Mới'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && deletingProject && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Xác nhận xóa</h3>
                  <p className="text-sm text-gray-600">Bạn có chắc chắn muốn xóa dự án này?</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Mã:</span> {deletingProject.code}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Tên:</span> {deletingProject.name}
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
      )}
    </div>
  );
}