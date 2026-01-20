import React, { useState } from 'react';
import { Users, Plus, Search, Edit, Trash2, Shield, Lock, Eye, EyeOff } from 'lucide-react';

export function QuanLyNguoiDung() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  const users = [
    {
      id: 'ND001',
      username: 'admin',
      fullName: 'Nguyễn Văn Admin',
      email: 'admin@bluebolt.com',
      role: 'Administrator',
      department: 'IT',
      status: 'active',
      lastLogin: '2026-01-08 09:30:00',
      createdAt: '2020-01-01'
    },
    {
      id: 'ND002',
      username: 'manager.tech',
      fullName: 'Nguyễn Văn An',
      email: 'an.nguyen@bluebolt.com',
      role: 'Manager',
      department: 'BU Technology',
      status: 'active',
      lastLogin: '2026-01-08 08:15:00',
      createdAt: '2020-03-15'
    },
    {
      id: 'ND003',
      username: 'manager.marketing',
      fullName: 'Trần Thị Bình',
      email: 'binh.tran@bluebolt.com',
      role: 'Manager',
      department: 'BU Marketing',
      status: 'active',
      lastLogin: '2026-01-07 17:45:00',
      createdAt: '2021-06-01'
    },
    {
      id: 'ND004',
      username: 'accountant',
      fullName: 'Lê Thị Cẩm',
      email: 'cam.le@bluebolt.com',
      role: 'Accountant',
      department: 'Finance',
      status: 'active',
      lastLogin: '2026-01-08 10:20:00',
      createdAt: '2021-01-10'
    },
    {
      id: 'ND005',
      username: 'hr.manager',
      fullName: 'Phạm Văn Dũng',
      email: 'dung.pham@bluebolt.com',
      role: 'HR Manager',
      department: 'Human Resources',
      status: 'active',
      lastLogin: '2026-01-08 09:00:00',
      createdAt: '2020-08-20'
    },
    {
      id: 'ND006',
      username: 'staff.user',
      fullName: 'Võ Thị Em',
      email: 'em.vo@bluebolt.com',
      role: 'Staff',
      department: 'BU Sales',
      status: 'active',
      lastLogin: '2026-01-06 16:30:00',
      createdAt: '2022-05-15'
    }
  ];

  const roles = ['all', 'Administrator', 'Manager', 'Accountant', 'HR Manager', 'Staff'];

  const filteredUsers = users.filter(user => {
    if (filterRole !== 'all' && user.role !== filterRole) return false;
    if (searchTerm && !user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !user.username.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Administrator': return 'bg-red-100 text-red-700';
      case 'Manager': return 'bg-purple-100 text-purple-700';
      case 'Accountant': return 'bg-blue-100 text-blue-700';
      case 'HR Manager': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Quản Lý Người Dùng</h1>
        <p className="text-gray-600">Quản lý tài khoản và quyền truy cập hệ thống</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-3">
            <Users className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-800">{users.length}</span>
          </div>
          <p className="text-gray-600 text-sm">Tổng Người Dùng</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-3">
            <Shield className="w-8 h-8 text-green-600" />
            <span className="text-2xl font-bold text-gray-800">
              {users.filter(u => u.status === 'active').length}
            </span>
          </div>
          <p className="text-gray-600 text-sm">Đang Hoạt Động</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-3">
            <Shield className="w-8 h-8 text-red-600" />
            <span className="text-2xl font-bold text-gray-800">
              {users.filter(u => u.role === 'Administrator').length}
            </span>
          </div>
          <p className="text-gray-600 text-sm">Quản Trị Viên</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-3">
            <Users className="w-8 h-8 text-purple-600" />
            <span className="text-2xl font-bold text-gray-800">
              {users.filter(u => u.role === 'Manager').length}
            </span>
          </div>
          <p className="text-gray-600 text-sm">Quản Lý</p>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex flex-col md:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Tìm kiếm người dùng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {roles.map(role => (
                <option key={role} value={role}>
                  {role === 'all' ? 'Tất cả vai trò' : role}
                </option>
              ))}
            </select>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors">
            <Plus className="w-5 h-5" />
            Thêm Người Dùng
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Mã ND</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Người Dùng</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Username</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Email</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Vai Trò</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Phòng Ban</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Đăng Nhập Cuối</th>
                <th className="text-center py-4 px-6 font-semibold text-gray-700">Trạng Thái</th>
                <th className="text-center py-4 px-6 font-semibold text-gray-700">Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-6">
                    <span className="font-mono text-sm font-semibold text-gray-700">{user.id}</span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                        {user.fullName.split(' ').pop()?.charAt(0)}
                      </div>
                      <span className="font-semibold text-gray-800">{user.fullName}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-mono text-sm text-gray-700">{user.username}</span>
                  </td>
                  <td className="py-4 px-6 text-gray-700">{user.email}</td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-gray-700">{user.department}</td>
                  <td className="py-4 px-6 text-sm text-gray-600">
                    {new Date(user.lastLogin).toLocaleString('vi-VN')}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {user.status === 'active' ? 'Hoạt động' : 'Khóa'}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-center gap-2">
                      <button className="p-2 hover:bg-blue-100 rounded-lg transition-colors text-blue-600">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-2 hover:bg-orange-100 rounded-lg transition-colors text-orange-600">
                        <Lock className="w-4 h-4" />
                      </button>
                      <button className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Activity */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Phân Bổ Vai Trò</h3>
          <div className="space-y-3">
            {roles.filter(r => r !== 'all').map(role => {
              const count = users.filter(u => u.role === role).length;
              const percentage = ((count / users.length) * 100).toFixed(1);
              return (
                <div key={role}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-gray-700">{role}</span>
                    <span className="text-sm text-gray-600">{count} người ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Hoạt Động Gần Đây</h3>
          <div className="space-y-3">
            {users
              .sort((a, b) => new Date(b.lastLogin).getTime() - new Date(a.lastLogin).getTime())
              .slice(0, 5)
              .map(user => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {user.fullName.split(' ').pop()?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{user.fullName}</p>
                      <p className="text-xs text-gray-500">{user.username}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-600">
                      {new Date(user.lastLogin).toLocaleString('vi-VN')}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
