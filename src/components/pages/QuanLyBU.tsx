import React, { useState, useEffect } from 'react';
import { Building2, Plus, Search, Edit, Trash2, Filter, X, RotateCcw, AlertCircle, Eye } from 'lucide-react';
import { useDraggableColumns, DraggableColumnHeader, ColumnConfig } from '../hooks/useDraggableColumns';
import { businessUnitService } from '../../services/businessUnitService';
import { useApp } from '../../contexts/AppContext';

interface BUData {
  id: string;
  code: string;
  name: string;
  leader: string;
  startDate: string;
  staff: number;
  status: 'active' | 'paused';
}

// Default column configuration
const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'code', label: 'Mã BU', field: 'code', align: 'left', visible: true },
  { id: 'name', label: 'Tên BU', field: 'name', align: 'left', visible: true },
  { id: 'leader', label: 'Quản Lý', field: 'leader', align: 'left', visible: true },
  { id: 'startDate', label: 'Ngày Bắt Đầu', field: 'startDate', align: 'center', visible: true },
  { id: 'staff', label: 'Nhân Sự', field: 'staff', align: 'center', visible: true },
  { id: 'status', label: 'Trạng Thái', field: 'status', align: 'center', visible: true },
  { id: 'actions', label: 'Hành Động', align: 'center', visible: true },
];

export function QuanLyBU() {
  const { currentUser, canAddBU, canEditBU, canDeleteBU } = useApp();
  // Draggable columns
  const { columns, moveColumn, resetColumns } = useDraggableColumns({
    defaultColumns: DEFAULT_COLUMNS,
    storageKey: 'quan-ly-bu-columns',
    userId: 'user_001' // In real app, get from auth context
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingBU, setEditingBU] = useState<BUData | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState(false);

  const [buList, setBuList] = useState<BUData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Omit<BUData, 'id'>>({
    code: '',
    name: '',
    leader: '',
    startDate: new Date().toISOString().split('T')[0],
    staff: 0,
    status: 'active'
  });

  // Fetch BUs from API
  useEffect(() => {
    fetchBUs();
  }, []);

  const fetchBUs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await businessUnitService.getAll();

      // Backend returns fields that match BUData interface (based on our updated route)
      // If backend returns Date objects for startDate, we might need to stringify them, 
      // but JSON response usually handles it as string.
      setBuList(data);
    } catch (err: any) {
      console.error('Error fetching BUs:', err);
      setError('Không thể tải danh sách Business Unit. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Filter data
  const filteredBUs = buList.filter(bu => {
    const matchSearch = bu.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bu.code && bu.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (bu.leader && bu.leader.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchStatus = statusFilter === 'all' || bu.status === statusFilter;

    // Role-based filtering: Trưởng BU only sees their own
    if (currentUser.role === 'Trưởng BU' && currentUser.buId) {
      if (bu.id !== currentUser.buId && bu.name !== currentUser.buId) return false;
    }

    return matchSearch && matchStatus;
  });

  // Handle Create
  const handleCreate = () => {
    setEditingBU(null);
    setViewMode(false);
    setFormData({
      code: '',
      name: '',
      leader: '',
      startDate: new Date().toISOString().split('T')[0],
      staff: 0,
      status: 'active'
    });
    setShowModal(true);
  };

  // Handle Edit
  const handleEdit = (bu: BUData) => {
    setEditingBU(bu);
    setViewMode(false);
    setFormData({
      code: bu.code || '',
      name: bu.name || '',
      leader: bu.leader || '',
      startDate: bu.startDate ? new Date(bu.startDate).toISOString().split('T')[0] : '',
      staff: bu.staff || 0,
      status: bu.status || 'active'
    });
    setShowModal(true);
  };

  // Handle View
  const handleView = (bu: BUData) => {
    setEditingBU(bu);
    setViewMode(true);
    setFormData({
      code: bu.code || '',
      name: bu.name || '',
      leader: bu.leader || '',
      startDate: bu.startDate ? new Date(bu.startDate).toISOString().split('T')[0] : '',
      staff: bu.staff || 0,
      status: bu.status || 'active'
    });
    setShowModal(true);
  };

  // Handle Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (viewMode) return;

    // Validation
    if (!formData.name) {
      alert('Vui lòng nhập tên Business Unit!');
      return;
    }

    try {
      const payload = {
        name: formData.name,
        code: formData.code,
        leaderName: formData.leader,
        startDate: formData.startDate,
        status: formData.status,
        staff: formData.staff
      };

      if (editingBU) {
        // Update
        await businessUnitService.update(editingBU.id, payload);
      } else {
        // Create
        await businessUnitService.create(payload);
      }

      await fetchBUs(); // Refresh list
      setShowModal(false);
    } catch (err: any) {
      console.error('Error saving BU:', err);
      // Check if it's a duplicate name error
      if (err.response && err.response.status === 400 && err.response.data.error === 'BU Name or Code already exists') {
        alert('Tên hoặc Mã Business Unit đã tồn tại!');
      } else {
        alert('Có lỗi xảy ra khi lưu Business Unit.');
      }
    }
  };

  // Handle Delete
  const handleDelete = async (id: string) => {
    try {
      await businessUnitService.delete(id);
      await fetchBUs(); // Refresh list
      setShowDeleteConfirm(null);
    } catch (err: any) {
      console.error('Error deleting BU:', err);
      alert('Không thể xóa Business Unit. Vui lòng thử lại.');
    }
  };

  // Render cell based on column
  const renderCell = (column: ColumnConfig, bu: BUData) => {
    const alignClass =
      column.align === 'center' ? 'text-center' :
        column.align === 'right' ? 'text-right' : 'text-left';

    switch (column.id) {
      case 'code':
        return (
          <td key={column.id} className={`py-4 px-6 ${alignClass}`}>
            <span className="font-mono text-sm font-semibold text-gray-700">{bu.code}</span>
          </td>
        );

      case 'name':
        return (
          <td key={column.id} className={`py-4 px-6 ${alignClass}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <span className="font-semibold text-gray-800">{bu.name}</span>
            </div>
          </td>
        );

      case 'leader':
        return (
          <td key={column.id} className={`py-4 px-6 text-gray-700 ${alignClass}`}>
            {bu.leader}
          </td>
        );

      case 'startDate':
        return (
          <td key={column.id} className={`py-4 px-6 ${alignClass}`}>
            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
              {bu.startDate ? new Date(bu.startDate).toLocaleDateString('vi-VN') : '-'}
            </span>
          </td>
        );

      case 'staff':
        return (
          <td key={column.id} className={`py-4 px-6 ${alignClass}`}>
            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
              {bu.staff}
            </span>
          </td>
        );

      case 'status':
        return (
          <td key={column.id} className={`py-4 px-6 ${alignClass}`}>
            <span
              className={`px-3 py-1 rounded-full text-sm font-semibold ${bu.status === 'active'
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
                }`}
            >
              {bu.status === 'active' ? 'Hoạt động' : 'Tạm dừng'}
            </span>
          </td>
        );

      case 'actions':
        return (
          <td key={column.id} className={`py-4 px-6 ${alignClass}`}>
            <div className="flex items-center justify-center gap-2">
              <button
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                onClick={() => handleView(bu)}
                title="Xem chi tiết"
              >
                <Eye className="w-4 h-4" />
              </button>
              {canEditBU(bu.id) && (
                <button
                  className="p-2 hover:bg-blue-100 rounded-lg transition-colors text-blue-600"
                  onClick={() => handleEdit(bu)}
                  title="Chỉnh sửa"
                >
                  <Edit className="w-4 h-4" />
                </button>
              )}
              {canDeleteBU(bu.id) && (
                <button
                  className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600"
                  onClick={() => setShowDeleteConfirm(bu.id)}
                  title="Xóa"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </td>
        );

      default:
        return <td key={column.id} className={`py-4 px-6 ${alignClass}`}>-</td>;
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Quản Lý Business Unit</h1>
        <p className="text-gray-600">Quản lý các đơn vị kinh doanh của BLUEBOLT</p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#004aad]"></div>
          <span className="ml-3 text-gray-600">Đang tải dữ liệu...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {!loading && (
        <>
          {/* Actions Bar */}
          <div className="bg-white rounded-xl shadow-md p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Tìm kiếm BU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="relative flex-1 max-w-md">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'paused')}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Tất cả</option>
                  <option value="active">Hoạt động</option>
                  <option value="paused">Tạm dừng</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={resetColumns}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  title="Đặt lại thứ tự cột"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </button>
                {canAddBU && (
                  <button
                    onClick={handleCreate}
                    className="bg-[#004aad] hover:bg-[#1557A0] text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    Thêm BU Mới
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* BU Table */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {columns.filter(c => c.visible).map((column, index) => (
                      <DraggableColumnHeader
                        key={column.id}
                        column={column}
                        index={index}
                        moveColumn={moveColumn}
                      />
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredBUs.map((bu) => (
                    <tr key={bu.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                      {columns.filter(c => c.visible).map((column) => renderCell(column, bu))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredBUs.length === 0 && (
              <div className="text-center py-12">
                <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Không tìm thấy Business Unit nào</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Xác Nhận Xóa</h3>
            <p className="text-gray-600 mb-6">Bạn có chắc chắn muốn xóa Business Unit này?</p>
            <div className="flex justify-end gap-3">
              <button
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
                onClick={() => setShowDeleteConfirm(null)}
              >
                Hủy
              </button>
              <button
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                onClick={() => handleDelete(showDeleteConfirm)}
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal - Centered Popup */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="border-b border-gray-200 px-6 py-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    {viewMode ? 'Chi Tiết Business Unit' : (editingBU ? 'Chỉnh Sửa Business Unit' : 'Tạo Mới Đơn Vị')}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {viewMode ? 'Xem thông tin chi tiết.' : 'Vui lòng điền đầy đủ thông tin bên dưới.'}
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="overflow-y-auto max-h-[calc(90vh-180px)] px-6 py-6">
              <form onSubmit={handleSubmit} id="bu-form">
                <div className="space-y-5">
                  {/* Disable fields that cannot be edited via BU API */}

                  {/* Row 1: Mã BU & Trạng Thái */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">
                        Mã BU
                      </label>
                      <input
                        type="text"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        disabled={viewMode}
                        placeholder="BU-AUTO"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#004aad] focus:border-transparent focus:bg-white transition-all disabled:text-gray-500 disabled:bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">
                        Trạng Thái
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'paused' })}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#004aad] focus:border-transparent focus:bg-white transition-all disabled:bg-gray-100 disabled:text-gray-500"
                        disabled={viewMode}
                      >
                        <option value="active">Hoạt động</option>
                        <option value="paused">Tạm dừng</option>
                      </select>
                    </div>
                  </div>

                  {/* Row 2: Tên Đơn Vị */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">
                      Tên Đơn Vị <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ví dụ: BlueBolt Software"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#004aad] focus:border-transparent focus:bg-white transition-all disabled:text-gray-500 disabled:bg-gray-100"
                      required
                      disabled={viewMode}
                    />
                  </div>

                  {/* Row 3: Người Phụ Trách (Leader) */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">
                      Người Phụ Trách
                    </label>
                    <input
                      type="text"
                      value={formData.leader}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, leader: e.target.value })}
                      placeholder="Nhập tên người quản lý"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#004aad] focus:border-transparent focus:bg-white transition-all disabled:text-gray-500 disabled:bg-gray-100"
                      disabled={viewMode}
                    />
                  </div>

                  {/* Row 4: Ngày Thành Lập & Số Lượng Nhân Sự */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">
                        Ngày Thành Lập
                      </label>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#004aad] focus:border-transparent focus:bg-white transition-all disabled:text-gray-500 disabled:bg-gray-100"
                        disabled={viewMode}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">
                        Số Lượng Nhân Sự
                      </label>
                      <input
                        type="number"
                        value={formData.staff}
                        onChange={(e) => setFormData({ ...formData, staff: parseInt(e.target.value) || 0 })}
                        placeholder="0"
                        min="0"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#004aad] focus:border-transparent focus:bg-white transition-all disabled:text-gray-500 disabled:bg-gray-100"
                        disabled={viewMode}
                      />
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 px-6 py-4 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-8 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium min-w-[140px]"
              >
                {viewMode ? 'Đóng' : 'Hủy bỏ'}
              </button>
              {!viewMode && (
                <button
                  type="submit"
                  form="bu-form"
                  className="px-8 py-2.5 bg-[#004aad] hover:bg-[#1557A0] text-white rounded-lg transition-colors font-medium min-w-[140px]"
                >
                  {editingBU ? 'Xác nhận cập nhật' : 'Xác nhận tạo mới'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
