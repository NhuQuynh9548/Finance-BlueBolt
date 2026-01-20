import React, { useState } from 'react';
import { FolderTree, Plus, Search, Edit, Trash2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

export function QuanLyDanhMuc() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const categories = [
    {
      id: 'DM001',
      code: 'THU-DV',
      name: 'Thu từ dịch vụ',
      type: 'income',
      parent: null,
      description: 'Doanh thu từ cung cấp dịch vụ',
      status: 'active',
      transactions: 45
    },
    {
      id: 'DM002',
      code: 'THU-DA',
      name: 'Thu từ dự án',
      type: 'income',
      parent: null,
      description: 'Doanh thu từ các dự án triển khai',
      status: 'active',
      transactions: 32
    },
    {
      id: 'DM003',
      code: 'THU-TV',
      name: 'Thu từ tư vấn',
      type: 'income',
      parent: null,
      description: 'Thu nhập từ dịch vụ tư vấn',
      status: 'active',
      transactions: 18
    },
    {
      id: 'DM004',
      code: 'CHI-NS',
      name: 'Chi phí nhân sự',
      type: 'expense',
      parent: null,
      description: 'Lương, thưởng, phúc lợi nhân viên',
      status: 'active',
      transactions: 120
    },
    {
      id: 'DM005',
      code: 'CHI-NS-L',
      name: 'Lương cơ bản',
      type: 'expense',
      parent: 'CHI-NS',
      description: 'Lương cơ bản hàng tháng',
      status: 'active',
      transactions: 60
    },
    {
      id: 'DM006',
      code: 'CHI-NS-T',
      name: 'Thưởng',
      type: 'expense',
      parent: 'CHI-NS',
      description: 'Tiền thưởng KPI, dự án',
      status: 'active',
      transactions: 35
    },
    {
      id: 'DM007',
      code: 'CHI-VP',
      name: 'Chi phí văn phòng',
      type: 'expense',
      parent: null,
      description: 'Văn phòng phẩm, điện nước, thuê mặt bằng',
      status: 'active',
      transactions: 48
    },
    {
      id: 'DM008',
      code: 'CHI-MKT',
      name: 'Chi phí Marketing',
      type: 'expense',
      parent: null,
      description: 'Quảng cáo, PR, events',
      status: 'active',
      transactions: 28
    },
    {
      id: 'DM009',
      code: 'CHI-CN',
      name: 'Chi phí công nghệ',
      type: 'expense',
      parent: null,
      description: 'Phần mềm, server, domain',
      status: 'active',
      transactions: 22
    },
    {
      id: 'DM010',
      code: 'CHI-KH',
      name: 'Chi phí khác',
      type: 'expense',
      parent: null,
      description: 'Các chi phí phát sinh khác',
      status: 'active',
      transactions: 15
    }
  ];

  const types = ['all', 'income', 'expense'];

  const filteredCategories = categories.filter(cat => {
    if (filterType !== 'all' && cat.type !== filterType) return false;
    if (searchTerm && !cat.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !cat.code.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const getTypeLabel = (type: string) => {
    return type === 'income' ? 'Thu nhập' : 'Chi phí';
  };

  const getTypeBadgeColor = (type: string) => {
    return type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
  };

  const stats = {
    total: categories.length,
    income: categories.filter(c => c.type === 'income').length,
    expense: categories.filter(c => c.type === 'expense').length,
    transactions: categories.reduce((acc, c) => acc + c.transactions, 0)
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Quản Lý Danh Mục Thu/Chi</h1>
        <p className="text-gray-600">Quản lý phân loại các khoản thu nhập và chi phí</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-3">
            <FolderTree className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-800">{stats.total}</span>
          </div>
          <p className="text-gray-600 text-sm">Tổng Danh Mục</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-3">
            <ArrowUpCircle className="w-8 h-8 text-green-600" />
            <span className="text-2xl font-bold text-gray-800">{stats.income}</span>
          </div>
          <p className="text-gray-600 text-sm">Danh Mục Thu</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-3">
            <ArrowDownCircle className="w-8 h-8 text-red-600" />
            <span className="text-2xl font-bold text-gray-800">{stats.expense}</span>
          </div>
          <p className="text-gray-600 text-sm">Danh Mục Chi</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-3">
            <FolderTree className="w-8 h-8 text-purple-600" />
            <span className="text-2xl font-bold text-gray-800">{stats.transactions}</span>
          </div>
          <p className="text-gray-600 text-sm">Giao Dịch</p>
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
                placeholder="Tìm kiếm danh mục..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {types.map(type => (
                <option key={type} value={type}>
                  {type === 'all' ? 'Tất cả loại' : type === 'income' ? 'Thu nhập' : 'Chi phí'}
                </option>
              ))}
            </select>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors">
            <Plus className="w-5 h-5" />
            Thêm Danh Mục
          </button>
        </div>
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Mã DM</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Mã Code</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Tên Danh Mục</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Loại</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Danh Mục Cha</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Mô Tả</th>
                <th className="text-center py-4 px-6 font-semibold text-gray-700">Giao Dịch</th>
                <th className="text-center py-4 px-6 font-semibold text-gray-700">Trạng Thái</th>
                <th className="text-center py-4 px-6 font-semibold text-gray-700">Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.map((category) => (
                <tr key={category.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-6">
                    <span className="font-mono text-sm font-semibold text-gray-700">{category.id}</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-mono text-sm font-bold text-blue-600">{category.code}</span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      {category.type === 'income' ? (
                        <ArrowUpCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <ArrowDownCircle className="w-5 h-5 text-red-600" />
                      )}
                      <span className="font-semibold text-gray-800">{category.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeBadgeColor(category.type)}`}>
                      {getTypeLabel(category.type)}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    {category.parent ? (
                      <span className="text-sm text-gray-700">{category.parent}</span>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-700">{category.description}</td>
                  <td className="py-4 px-6 text-center">
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
                      {category.transactions}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      category.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {category.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-center gap-2">
                      <button className="p-2 hover:bg-blue-100 rounded-lg transition-colors text-blue-600">
                        <Edit className="w-4 h-4" />
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

      {/* Category Tree */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <ArrowUpCircle className="w-5 h-5 text-green-600" />
            Cấu Trúc Danh Mục Thu
          </h3>
          <div className="space-y-2">
            {categories
              .filter(c => c.type === 'income')
              .map(category => (
                <div key={category.id} className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-gray-800">{category.name}</span>
                      <span className="ml-2 text-xs text-gray-600">({category.code})</span>
                    </div>
                    <span className="text-sm text-gray-600">{category.transactions} GD</span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <ArrowDownCircle className="w-5 h-5 text-red-600" />
            Cấu Trúc Danh Mục Chi
          </h3>
          <div className="space-y-2">
            {categories
              .filter(c => c.type === 'expense' && !c.parent)
              .map(parent => (
                <div key={parent.id} className="space-y-2">
                  <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-gray-800">{parent.name}</span>
                        <span className="ml-2 text-xs text-gray-600">({parent.code})</span>
                      </div>
                      <span className="text-sm text-gray-600">{parent.transactions} GD</span>
                    </div>
                  </div>
                  {categories
                    .filter(c => c.parent === parent.code)
                    .map(child => (
                      <div key={child.id} className="ml-6 p-3 bg-red-50 rounded-lg border border-red-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-sm font-semibold text-gray-800">{child.name}</span>
                            <span className="ml-2 text-xs text-gray-600">({child.code})</span>
                          </div>
                          <span className="text-sm text-gray-600">{child.transactions} GD</span>
                        </div>
                      </div>
                    ))}
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
