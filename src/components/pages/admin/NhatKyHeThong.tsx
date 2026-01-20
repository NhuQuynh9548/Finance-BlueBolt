import React, { useState, useEffect } from 'react';
import { FileText, Search, Filter, Download, Eye, Calendar, User, Activity, Loader2 } from 'lucide-react';
import logService, { ActivityLog } from '../../../services/logService';

export function NhatKyHeThong() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [filterUser, setFilterUser] = useState('all');
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await logService.getAll({
        action: filterAction,
        // For simplicity, we filter user on frontend or if we had user search we'd use it
      });
      setLogs(data);
    } catch (error) {
      console.error('Fetch logs error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterAction]);

  const actions = ['all', 'LOGIN', 'CREATE', 'UPDATE', 'DELETE', 'VIEW', 'EXPORT'];
  // We should ideally fetch unique users from the logs or an API
  const users = ['all', ...Array.from(new Set(logs.map(l => l.user)))];

  const filteredLogs = logs.filter(log => {
    if (filterUser !== 'all' && log.user !== filterUser) return false;
    if (searchTerm && !log.description.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'LOGIN': return 'bg-blue-100 text-blue-700';
      case 'CREATE': return 'bg-green-100 text-green-700';
      case 'UPDATE': return 'bg-yellow-100 text-yellow-700';
      case 'DELETE': return 'bg-red-100 text-red-700';
      case 'VIEW': return 'bg-purple-100 text-purple-700';
      case 'EXPORT': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-700';
      case 'error': return 'bg-red-100 text-red-700';
      case 'warning': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const stats = {
    total: logs.length,
    success: logs.filter(l => l.status === 'success').length,
    error: logs.filter(l => l.status === 'error').length,
    warning: logs.filter(l => l.status === 'warning').length
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Nhật Ký Hệ Thống</h1>
        <p className="text-gray-600">Theo dõi và kiểm tra các hoạt động trong hệ thống</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-3">
            <FileText className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-800">{stats.total}</span>
          </div>
          <p className="text-gray-600 text-sm">Tổng Hoạt Động</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-3">
            <Activity className="w-8 h-8 text-green-600" />
            <span className="text-2xl font-bold text-gray-800">{stats.success}</span>
          </div>
          <p className="text-gray-600 text-sm">Thành Công</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-3">
            <Activity className="w-8 h-8 text-red-600" />
            <span className="text-2xl font-bold text-gray-800">{stats.error}</span>
          </div>
          <p className="text-gray-600 text-sm">Lỗi</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-3">
            <Activity className="w-8 h-8 text-yellow-600" />
            <span className="text-2xl font-bold text-gray-800">{stats.warning}</span>
          </div>
          <p className="text-gray-600 text-sm">Cảnh Báo</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-center">
          <div className="flex flex-col md:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Tìm kiếm nhật ký..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {actions.map(action => (
                <option key={action} value={action}>
                  {action === 'all' ? 'Tất cả hành động' : action}
                </option>
              ))}
            </select>
            <select
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {users.map(user => (
                <option key={user} value={user}>
                  {user === 'all' ? 'Tất cả người dùng' : user}
                </option>
              ))}
            </select>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors">
            <Download className="w-5 h-5" />
            Xuất Nhật Ký
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">ID</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Thời Gian</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Người Dùng</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Hành Động</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Module</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Mô Tả</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">IP</th>
                <th className="text-center py-4 px-6 font-semibold text-gray-700">Trạng Thái</th>
                <th className="text-center py-4 px-6 font-semibold text-gray-700">Chi Tiết</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                      <p className="text-gray-500">Đang tải nhật ký...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-20 text-center text-gray-500">
                    Không tìm thấy nhật ký nào
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <span className="font-mono text-xs text-gray-700">{log.id}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {log.timestamp}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-mono text-gray-700">{log.user}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getActionBadgeColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-700">{log.module}</td>
                    <td className="py-4 px-6 text-sm text-gray-700">{log.description}</td>
                    <td className="py-4 px-6">
                      <span className="font-mono text-xs text-gray-600">{log.ip}</span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(log.status)}`}>
                        {log.status === 'success' ? 'Thành công' :
                          log.status === 'error' ? 'Lỗi' : 'Cảnh báo'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button className="p-2 hover:bg-blue-100 rounded-lg transition-colors text-blue-600">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="mt-8 bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Biểu Đồ Hoạt Động Theo Giờ</h3>
        <div className="flex items-end justify-between h-48 gap-2">
          {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'].map((time, index) => {
            const height = Math.random() * 80 + 20;
            return (
              <div key={time} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-blue-500 rounded-t-lg hover:bg-blue-600 transition-colors cursor-pointer"
                  style={{ height: `${height}%` }}
                  title={`${Math.floor(height / 10)} hoạt động`}
                ></div>
                <span className="text-xs text-gray-600 rotate-45 origin-left">{time}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
