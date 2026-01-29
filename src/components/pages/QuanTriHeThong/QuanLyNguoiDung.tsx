import React, { useState, useEffect } from 'react';
import { Search, Plus, Eye, Edit2, Lock, Unlock, X, ArrowUpDown, ArrowUp, ArrowDown, User as UserIcon, Calendar, MapPin, Monitor, RotateCw, AlertCircle, ChevronLeft, ChevronRight, Save, Building2, Shield, Mail } from 'lucide-react';
import userService, { User } from '../../../services/userService';
import roleService, { Role } from '../../../services/roleService';
import { businessUnitService } from '../../../services/businessUnitService';

type SortField = 'userId' | 'fullName' | 'lastLogin';
type SortOrder = 'asc' | 'desc' | null;
type ModalMode = 'create' | 'view' | 'edit' | null;

// Simulated current user context
const CURRENT_USER_ROLE = 'admin'; // Can be: admin, ceo, bu_manager, staff

export function QuanLyNguoiDung() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [businessUnits, setBusinessUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterBU, setFilterBU] = useState<string>('all');
  const [showLockConfirm, setShowLockConfirm] = useState(false);
  const [lockingUser, setLockingUser] = useState<User | null>(null);
  const [showResetPasswordConfirm, setShowResetPasswordConfirm] = useState(false);
  const [resettingUser, setResettingUser] = useState<User | null>(null);

  // Modal states
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showLoginHistory, setShowLoginHistory] = useState(false);

  // Form data
  const [formData, setFormData] = useState<Partial<User>>({
    userId: '',
    fullName: '',
    email: '',
    roleId: '',
    businessUnits: [],
    dataScope: 'personal',
    status: 'active',
    twoFAEnabled: false,
    loginHistory: [],
  });

  // Sorting
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersData, rolesData, buData] = await Promise.all([
        userService.getAll(),
        roleService.getAll(),
        businessUnitService.getAll()
      ]);
      setUsers(usersData);
      setRoles(rolesData);
      setBusinessUnits(buData);
    } catch (error) {
      console.error('Fetch user management data error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Check if current user can see BU filter
  const canSeeBUFilter = CURRENT_USER_ROLE === 'admin' || CURRENT_USER_ROLE === 'ceo';

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Filter logic
  const filteredUsers = users.filter(user => {
    const userIdMatch = user.userId?.toLowerCase().includes(debouncedSearch.toLowerCase()) || false;
    const fullNameMatch = user.fullName?.toLowerCase().includes(debouncedSearch.toLowerCase()) || false;
    const emailMatch = user.email?.toLowerCase().includes(debouncedSearch.toLowerCase()) || false;

    const matchesSearch = userIdMatch || fullNameMatch || emailMatch;

    const matchesRole = filterRole === 'all' || user.roleId === filterRole;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    const matchesBU = filterBU === 'all' || user.businessUnits.includes(filterBU) || user.businessUnits.includes('Tất cả');

    return matchesSearch && matchesRole && matchesStatus && matchesBU;
  });

  // Sorting logic
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (!sortField || !sortOrder) return 0;
    let comparison = 0;

    if (sortField === 'userId') comparison = (a.userId || '').localeCompare(b.userId || '');
    else if (sortField === 'fullName') comparison = (a.fullName || '').localeCompare(b.fullName || '');
    else if (sortField === 'lastLogin') comparison = (a.lastLogin || '').localeCompare(b.lastLogin || '');

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Pagination logic
  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = sortedUsers.slice(startIndex, endIndex);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortOrder === 'asc') setSortOrder('desc');
      else if (sortOrder === 'desc') { setSortField(null); setSortOrder(null); }
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    if (sortOrder === 'asc') return <ArrowUp className="w-4 h-4 text-[#004aad]" />;
    return <ArrowDown className="w-4 h-4 text-[#004aad]" />;
  };

  const handleClearFilter = () => {
    setSearchTerm('');
    setFilterRole('all');
    setFilterStatus('all');
    setFilterBU('all');
    setCurrentPage(1);
  };

  // CRUD Operations
  const handleCreate = () => {
    setModalMode('create');
    setSelectedUser(null);
    setFormData({
      userId: `USR${String(users.length + 1).padStart(3, '0')}`,
      fullName: '',
      email: '',
      roleId: '',
      businessUnits: [],
      dataScope: 'personal',
      status: 'active',
      twoFAEnabled: false,
    });
  };

  const handleView = (user: User) => {
    setModalMode('view');
    setSelectedUser(user);
    setFormData({ ...user });
  };

  const handleEdit = (user: User) => {
    setModalMode('edit');
    setSelectedUser(user);
    setFormData({ ...user });
  };

  const handleToggleLock = (user: User) => {
    setLockingUser(user);
    setShowLockConfirm(true);
  };

  const confirmToggleLock = async () => {
    if (lockingUser) {
      try {
        await userService.toggleLock(lockingUser.id);
        await fetchData();
        setShowLockConfirm(false);
        setLockingUser(null);
      } catch (error) {
        console.error('Lock user error:', error);
        alert('Có lỗi xảy ra khi khóa/mở khóa người dùng');
      }
    }
  };

  const handleResetPassword = (user: User) => {
    setResettingUser(user);
    setShowResetPasswordConfirm(true);
  };

  const confirmResetPassword = async () => {
    if (resettingUser) {
      try {
        await userService.resetPassword(resettingUser.id);
        alert(`Email reset mật khẩu đã được gửi đến ${resettingUser.email}`);
        setShowResetPasswordConfirm(false);
        setResettingUser(null);
      } catch (error) {
        console.error('Reset password error:', error);
        alert('Có lỗi xảy ra khi gửi email reset mật khẩu');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName || !formData.email || !formData.roleId) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    // Convert businessUnits array to buId (single BU ID)
    let buId: string | undefined = undefined;
    if (formData.businessUnits && formData.businessUnits.length > 0) {
      const selectedBUName = formData.businessUnits[0]; // Take first BU
      const selectedBU = businessUnits.find(bu => bu.name === selectedBUName);
      buId = selectedBU?.id;
    }

    const submitData = {
      fullName: formData.fullName,
      email: formData.email,
      roleId: formData.roleId,
      buId, // Send buId instead of businessUnits
      dataScope: formData.dataScope,
      status: formData.status,
      twoFAEnabled: formData.twoFAEnabled,
    };

    try {
      if (modalMode === 'create') {
        await userService.create(submitData);
      } else if (modalMode === 'edit' && selectedUser) {
        await userService.update(selectedUser.id, submitData);
      }
      await fetchData();
      setModalMode(null);
      setSelectedUser(null);
    } catch (error: any) {
      console.error('Submit user error:', error);
      alert(error.response?.data?.error || 'Có lỗi xảy ra khi lưu người dùng');
    }
  };

  const getDataScopeLabel = (scope: string) => {
    const labels: Record<string, string> = {
      'global': 'GLOBAL (Toàn hệ thống)',
      'bu': 'BUSINESS UNIT',
      'personal': 'PERSONAL (Cá nhân)'
    };
    return labels[scope] || scope;
  };

  const getDataScopeBadgeColor = (scope: string) => {
    const colors: Record<string, string> = {
      'global': 'bg-purple-100 text-purple-700',
      'bu': 'bg-blue-100 text-blue-700',
      'personal': 'bg-green-100 text-green-700'
    };
    return colors[scope] || 'bg-gray-100 text-gray-700';
  };

  const getStatusBadgeColor = (status: string) => {
    return status === 'active'
      ? 'bg-green-100 text-green-700'
      : 'bg-red-100 text-red-700';
  };

  const getRoleIcon = (roleName: string) => {
    if (roleName === 'Admin' || roleName === 'CEO' || roleName === 'CFO') return '👑';
    if (roleName === 'BU Manager') return '🔑';
    return '👤';
  };

  const isReadOnly = modalMode === 'view';

  const canDeleteUser = (user: User) => {
    return user.role !== 'Admin';
  };

  // Auto-set Data Scope based on Role
  const handleRoleChange = (roleId: string) => {
    const selectedRole = roles.find(r => r.id === roleId);
    let newDataScope: 'global' | 'bu' | 'personal' = 'personal';
    let newBUs: string[] = [];

    if (selectedRole) {
      if (selectedRole.name === 'Admin' || selectedRole.name === 'CEO') {
        newDataScope = 'global';
        newBUs = ['Tất cả'];
      } else if (selectedRole.name === 'BU Manager') {
        newDataScope = 'bu';
      } else {
        newDataScope = 'personal';
      }
    }

    setFormData({ ...formData, roleId, dataScope: newDataScope, businessUnits: newBUs });
  };

  const handleBUChange = (bu: string) => {
    const currentBUs = formData.businessUnits || [];
    if (currentBUs.includes(bu)) {
      setFormData({ ...formData, businessUnits: currentBUs.filter(b => b !== bu) });
    } else {
      setFormData({ ...formData, businessUnits: [...currentBUs, bu] });
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">QUẢN LÝ NGƯỜI DÙNG</h1>
          <p className="text-gray-600">Quản lý tài khoản, phân quyền và Data Scope</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-6 py-3 bg-[#004aad] hover:bg-[#1557A0] text-white rounded-lg transition-colors shadow-md"
        >
          <Plus className="w-5 h-5" />
          Thêm người dùng
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm theo User ID, Họ tên, Email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004aad] focus:border-transparent"
            />
          </div>

          <div className="flex flex-wrap gap-4">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004aad] focus:border-transparent bg-white"
            >
              <option value="all">Tất cả Role</option>
              {roles.map(role => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004aad] focus:border-transparent bg-white"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="locked">Khóa</option>
            </select>

            {canSeeBUFilter && (
              <select
                value={filterBU}
                onChange={(e) => setFilterBU(e.target.value)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004aad] focus:border-transparent bg-white"
              >
                <option value="all">Tất cả BU</option>
                {businessUnits.map(bu => (
                  <option key={bu.id} value={bu.name}>{bu.name}</option>
                ))}
              </select>
            )}

            <button
              onClick={handleClearFilter}
              className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('userId')}
                    className="flex items-center gap-2 text-xs font-semibold text-gray-600 uppercase tracking-wider hover:text-[#004aad] transition-colors"
                  >
                    User ID
                    {getSortIcon('userId')}
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('fullName')}
                    className="flex items-center gap-2 text-xs font-semibold text-gray-600 uppercase tracking-wider hover:text-[#004aad] transition-colors"
                  >
                    Họ Tên
                    {getSortIcon('fullName')}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Vai trò</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Business Unit</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Phạm vi dữ liệu</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Trạng thái</th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('lastLogin')}
                    className="flex items-center gap-2 text-xs font-semibold text-gray-600 uppercase tracking-wider hover:text-[#004aad] transition-colors"
                  >
                    Đăng nhập gần nhất
                    {getSortIcon('lastLogin')}
                  </button>
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : paginatedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="font-bold text-gray-900">{user.userId}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getRoleIcon(user.role)}</span>
                      <span className="font-medium text-gray-900">{user.fullName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-600">{user.email}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-semibold text-[#004aad]">{user.role}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {user.businessUnits.map(bu => (
                        <span key={bu} className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                          {bu}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${getDataScopeBadgeColor(user.dataScope)}`}>
                      {user.dataScope.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(user.status)}`}>
                      {user.status === 'active' ? 'Active' : 'Locked'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    {user.lastLogin}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleView(user)}
                        className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(user)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleLock(user)}
                        className={`p-1.5 rounded transition-colors ${user.status === 'active'
                          ? 'text-red-600 hover:bg-red-50'
                          : 'text-green-600 hover:bg-green-50'
                          }`}
                        title={user.status === 'active' ? 'Khóa user' : 'Mở khóa user'}
                      >
                        {user.status === 'active' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleResetPassword(user)}
                        className="p-1.5 text-amber-600 hover:bg-amber-50 rounded transition-colors"
                        title="Reset mật khẩu"
                      >
                        <RotateCw className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {paginatedUsers.length === 0 && (
          <div className="text-center py-12">
            <UserIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Không tìm thấy người dùng nào</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Hiển thị <span className="font-semibold">{startIndex + 1}</span> - <span className="font-semibold">{Math.min(endIndex, sortedUsers.length)}</span> trong tổng số <span className="font-semibold">{sortedUsers.length}</span> người dùng
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-4 py-2 rounded-lg transition-colors ${currentPage === page
                    ? 'bg-[#004aad] text-white'
                    : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/View/Edit Modal */}
      {modalMode && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="border-b border-gray-200 px-6 py-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    {modalMode === 'create' && 'Thêm Người Dùng Mới'}
                    {modalMode === 'view' && 'Chi Tiết Người Dùng'}
                    {modalMode === 'edit' && 'Chỉnh Sửa Người Dùng'}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {isReadOnly ? 'Thông tin chi tiết và lịch sử đăng nhập' : 'Vui lòng điền đầy đủ thông tin bắt buộc (*)'}
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
              <form onSubmit={handleSubmit} id="user-form">
                <div className="space-y-6">
                  {/* Thông tin cơ bản */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-700 uppercase mb-4 pb-2 border-b border-gray-200">
                      Thông tin cơ bản
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          User ID (Auto)
                        </label>
                        <input
                          type="text"
                          value={formData.userId}
                          disabled
                          className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-lg cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          <span className="text-red-500">*</span> Họ và Tên
                        </label>
                        <input
                          type="text"
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          placeholder="Nguyễn Văn A"
                          disabled={isReadOnly}
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#004aad] focus:border-transparent focus:bg-white transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-500" />
                          <span className="text-red-500">*</span> Email
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="user@bluebolt.vn"
                          disabled={isReadOnly}
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#004aad] focus:border-transparent focus:bg-white transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Phân quyền & Data Scope */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-700 uppercase mb-4 pb-2 border-b border-gray-200">
                      Phân quyền & Phạm vi dữ liệu
                    </h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                          <Shield className="w-4 h-4 text-gray-500" />
                          <span className="text-red-500">*</span> Role
                        </label>
                        <select
                          value={formData.roleId}
                          onChange={(e) => handleRoleChange(e.target.value)}
                          disabled={isReadOnly}
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#004aad] focus:border-transparent focus:bg-white transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                          required
                        >
                          <option value="">Chọn role...</option>
                          {roles.map(role => (
                            <option key={role.id} value={role.id}>{role.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Phạm vi dữ liệu (Auto)
                        </label>
                        <div className={`px-4 py-2.5 rounded-lg border-2 ${getDataScopeBadgeColor(formData.dataScope || 'personal')}`}>
                          <span className="font-bold">{getDataScopeLabel(formData.dataScope || 'personal')}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-500" />
                        <span className="text-red-500">*</span> Business Unit
                      </label>
                      {formData.dataScope === 'global' ? (
                        <div className="px-4 py-2.5 bg-purple-50 border border-purple-200 rounded-lg">
                          <span className="text-purple-700 font-semibold">✓ Tất cả BU (Toàn hệ thống)</span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          {businessUnits.map(bu => (
                            <label key={bu.id} className="flex items-center gap-2 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                              <input
                                type="radio"
                                name="businessUnit"
                                checked={formData.businessUnits?.includes(bu.name) || false}
                                onChange={() => setFormData({ ...formData, businessUnits: [bu.name] })}
                                disabled={isReadOnly}
                                className="w-4 h-4 text-[#004aad] focus:ring-[#004aad]"
                              />
                              <span className="text-sm text-gray-700">{bu.name}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bảo mật */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-700 uppercase mb-4 pb-2 border-b border-gray-200">
                      Bảo mật
                    </h3>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.twoFAEnabled}
                          onChange={(e) => setFormData({ ...formData, twoFAEnabled: e.target.checked })}
                          disabled={isReadOnly}
                          className="w-4 h-4 text-[#004aad] rounded focus:ring-[#004aad]"
                        />
                        <span className="text-sm font-medium text-gray-700">Bật xác thực 2 lớp (2FA)</span>
                      </label>
                      {formData.twoFAEnabled && (
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-semibold">
                          ✓ 2FA Enabled
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Lịch sử đăng nhập - Only in View mode */}
                  {modalMode === 'view' && selectedUser?.loginHistory && (
                    <div>
                      <h3 className="text-sm font-bold text-gray-700 uppercase mb-4 pb-2 border-b border-gray-200">
                        Lịch sử đăng nhập (3 lần gần nhất)
                      </h3>
                      <div className="space-y-3">
                        {selectedUser.loginHistory.slice(0, 3).map((history, index) => (
                          <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                            <Calendar className="w-5 h-5 text-gray-400" />
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-gray-900">{history.timestamp}</p>
                              <div className="flex items-center gap-4 mt-1">
                                <span className="text-xs text-gray-600 flex items-center gap-1">
                                  <MapPin className="w-3 h-3" /> IP: {history.ip}
                                </span>
                                <span className="text-xs text-gray-600 flex items-center gap-1">
                                  <Monitor className="w-3 h-3" /> {history.device}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
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
                {modalMode === 'view' ? 'Đóng' : 'Hủy bỏ'}
              </button>
              {modalMode !== 'view' && (
                <button
                  type="submit"
                  form="user-form"
                  className="flex items-center gap-2 px-8 py-2.5 bg-[#004aad] hover:bg-[#1557A0] text-white rounded-lg transition-colors font-medium min-w-[140px]"
                >
                  <Save className="w-4 h-4" />
                  {modalMode === 'create' ? 'Tạo mới' : 'Lưu thay đổi'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lock/Unlock Confirmation Modal */}
      {showLockConfirm && lockingUser && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${lockingUser.status === 'active' ? 'bg-red-100' : 'bg-green-100'
                  }`}>
                  {lockingUser.status === 'active' ? (
                    <Lock className="w-6 h-6 text-red-600" />
                  ) : (
                    <Unlock className="w-6 h-6 text-green-600" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">
                    {lockingUser.status === 'active' ? 'Xác nhận khóa user' : 'Xác nhận mở khóa user'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {lockingUser.status === 'active'
                      ? 'User sẽ bị đăng xuất và không thể đăng nhập lại'
                      : 'User sẽ có thể đăng nhập trở lại'}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">User ID:</span> {lockingUser.userId}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Họ tên:</span> {lockingUser.fullName}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Email:</span> {lockingUser.email}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowLockConfirm(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Hủy
                </button>
                <button
                  onClick={confirmToggleLock}
                  className={`flex-1 px-4 py-2.5 rounded-lg transition-colors font-medium ${lockingUser.status === 'active'
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                >
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Confirmation Modal */}
      {showResetPasswordConfirm && resettingUser && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <RotateCw className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Xác nhận reset mật khẩu</h3>
                  <p className="text-sm text-gray-600">Email chứa link reset sẽ được gửi đến user</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Email:</span> {resettingUser.email}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowResetPasswordConfirm(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Hủy
                </button>
                <button
                  onClick={confirmResetPassword}
                  className="flex-1 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors font-medium"
                >
                  Gửi email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
