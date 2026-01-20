import React, { useState } from 'react';
import { Shield, Plus, Edit, Trash2, Check, X } from 'lucide-react';

export function PhanQuyenVaiTro() {
  const [selectedRole, setSelectedRole] = useState('Administrator');

  const roles = [
    {
      name: 'Administrator',
      description: 'Toàn quyền quản trị hệ thống',
      userCount: 1,
      color: 'red'
    },
    {
      name: 'Manager',
      description: 'Quản lý Business Unit',
      userCount: 2,
      color: 'purple'
    },
    {
      name: 'Accountant',
      description: 'Quản lý tài chính và kế toán',
      userCount: 1,
      color: 'blue'
    },
    {
      name: 'HR Manager',
      description: 'Quản lý nhân sự',
      userCount: 1,
      color: 'green'
    },
    {
      name: 'Staff',
      description: 'Nhân viên thông thường',
      userCount: 1,
      color: 'gray'
    }
  ];

  const permissions = [
    {
      module: 'Dashboard',
      permissions: [
        { name: 'Xem Dashboard', key: 'view_dashboard' },
        { name: 'Xuất báo cáo', key: 'export_report' }
      ]
    },
    {
      module: 'Quản Lý BU',
      permissions: [
        { name: 'Xem danh sách BU', key: 'view_bu' },
        { name: 'Thêm BU', key: 'create_bu' },
        { name: 'Sửa BU', key: 'edit_bu' },
        { name: 'Xóa BU', key: 'delete_bu' }
      ]
    },
    {
      module: 'Quản Lý Thu Chi',
      permissions: [
        { name: 'Xem giao dịch', key: 'view_transaction' },
        { name: 'Thêm giao dịch', key: 'create_transaction' },
        { name: 'Sửa giao dịch', key: 'edit_transaction' },
        { name: 'Xóa giao dịch', key: 'delete_transaction' },
        { name: 'Duyệt giao dịch', key: 'approve_transaction' }
      ]
    },
    {
      module: 'Quản Lý Nhân Sự',
      permissions: [
        { name: 'Xem nhân viên', key: 'view_employee' },
        { name: 'Thêm nhân viên', key: 'create_employee' },
        { name: 'Sửa nhân viên', key: 'edit_employee' },
        { name: 'Xóa nhân viên', key: 'delete_employee' },
        { name: 'Quản lý lương', key: 'manage_salary' }
      ]
    },
    {
      module: 'Quản Lý Đối Tác',
      permissions: [
        { name: 'Xem đối tác', key: 'view_partner' },
        { name: 'Thêm đối tác', key: 'create_partner' },
        { name: 'Sửa đối tác', key: 'edit_partner' },
        { name: 'Xóa đối tác', key: 'delete_partner' }
      ]
    },
    {
      module: 'Quản Trị Hệ Thống',
      permissions: [
        { name: 'Quản lý người dùng', key: 'manage_users' },
        { name: 'Phân quyền', key: 'manage_permissions' },
        { name: 'Thiết lập bảo mật', key: 'security_settings' },
        { name: 'Xem nhật ký', key: 'view_logs' }
      ]
    },
    {
      module: 'Master Data',
      permissions: [
        { name: 'Quản lý danh mục', key: 'manage_categories' },
        { name: 'Quản lý dự án', key: 'manage_projects' },
        { name: 'Cấu hình hệ thống', key: 'system_config' }
      ]
    }
  ];

  // Mock permission matrix
  const rolePermissions: Record<string, string[]> = {
    'Administrator': permissions.flatMap(m => m.permissions.map(p => p.key)),
    'Manager': [
      'view_dashboard', 'export_report', 'view_bu', 'edit_bu',
      'view_transaction', 'create_transaction', 'edit_transaction', 'approve_transaction',
      'view_employee', 'create_employee', 'edit_employee',
      'view_partner', 'create_partner', 'edit_partner',
      'manage_projects'
    ],
    'Accountant': [
      'view_dashboard', 'export_report',
      'view_transaction', 'create_transaction', 'edit_transaction', 'delete_transaction', 'approve_transaction',
      'view_bu', 'view_employee', 'view_partner',
      'manage_categories'
    ],
    'HR Manager': [
      'view_dashboard',
      'view_employee', 'create_employee', 'edit_employee', 'delete_employee', 'manage_salary',
      'view_bu', 'view_transaction'
    ],
    'Staff': [
      'view_dashboard',
      'view_transaction', 'view_employee', 'view_partner'
    ]
  };

  const hasPermission = (role: string, permissionKey: string) => {
    return rolePermissions[role]?.includes(permissionKey) || false;
  };

  const getRoleColor = (color: string) => {
    const colors: Record<string, string> = {
      red: 'bg-red-100 text-red-700 border-red-300',
      purple: 'bg-purple-100 text-purple-700 border-purple-300',
      blue: 'bg-blue-100 text-blue-700 border-blue-300',
      green: 'bg-green-100 text-green-700 border-green-300',
      gray: 'bg-gray-100 text-gray-700 border-gray-300'
    };
    return colors[color] || colors.gray;
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Phân Quyền và Vai Trò</h1>
        <p className="text-gray-600">Quản lý vai trò người dùng và phân quyền truy cập</p>
      </div>

      {/* Roles Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        {roles.map(role => (
          <div
            key={role.name}
            onClick={() => setSelectedRole(role.name)}
            className={`cursor-pointer border-2 rounded-xl p-4 transition-all hover:shadow-lg ${
              selectedRole === role.name
                ? getRoleColor(role.color) + ' shadow-md'
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <Shield className="w-6 h-6" />
              <span className="text-xl font-bold">{role.userCount}</span>
            </div>
            <h3 className="font-bold mb-1">{role.name}</h3>
            <p className="text-xs opacity-75">{role.description}</p>
          </div>
        ))}
      </div>

      {/* Add Role Button */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            Quyền của vai trò: <span className="text-blue-600">{selectedRole}</span>
          </h2>
          <p className="text-sm text-gray-600">
            {roles.find(r => r.name === selectedRole)?.description}
          </p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors">
          <Plus className="w-5 h-5" />
          Thêm Vai Trò
        </button>
      </div>

      {/* Permissions Matrix */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-gray-700 w-1/4">Module</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Quyền</th>
                <th className="text-center py-4 px-6 font-semibold text-gray-700 w-24">Trạng Thái</th>
              </tr>
            </thead>
            <tbody>
              {permissions.map((module, moduleIndex) => (
                <React.Fragment key={module.module}>
                  {module.permissions.map((permission, permIndex) => (
                    <tr
                      key={permission.key}
                      className={`border-t border-gray-100 hover:bg-gray-50 ${
                        permIndex === 0 ? 'border-t-2 border-gray-200' : ''
                      }`}
                    >
                      {permIndex === 0 && (
                        <td
                          className="py-4 px-6 font-bold text-gray-800 bg-gray-50"
                          rowSpan={module.permissions.length}
                        >
                          {module.module}
                        </td>
                      )}
                      <td className="py-3 px-6 text-gray-700">{permission.name}</td>
                      <td className="py-3 px-6 text-center">
                        {hasPermission(selectedRole, permission.key) ? (
                          <div className="flex items-center justify-center">
                            <div className="bg-green-100 text-green-600 p-1 rounded-full">
                              <Check className="w-5 h-5" />
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center">
                            <div className="bg-red-100 text-red-600 p-1 rounded-full">
                              <X className="w-5 h-5" />
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex gap-4 justify-end">
        <button className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-2 rounded-lg flex items-center gap-2 transition-colors">
          <Edit className="w-5 h-5" />
          Chỉnh Sửa Quyền
        </button>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors">
          Lưu Thay Đổi
        </button>
      </div>

      {/* Role Management */}
      <div className="mt-8 bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Quản Lý Vai Trò</h3>
        <div className="space-y-3">
          {roles.map(role => (
            <div key={role.name} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
              <div className="flex items-center gap-4">
                <Shield className={`w-8 h-8 ${
                  role.color === 'red' ? 'text-red-600' :
                  role.color === 'purple' ? 'text-purple-600' :
                  role.color === 'blue' ? 'text-blue-600' :
                  role.color === 'green' ? 'text-green-600' : 'text-gray-600'
                }`} />
                <div>
                  <h4 className="font-bold text-gray-800">{role.name}</h4>
                  <p className="text-sm text-gray-600">{role.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">{role.userCount} người dùng</span>
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-blue-100 rounded-lg transition-colors text-blue-600">
                    <Edit className="w-4 h-4" />
                  </button>
                  {role.name !== 'Administrator' && (
                    <button className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
