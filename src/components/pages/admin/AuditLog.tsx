import React, { useState, useEffect } from 'react';
import {
    FileText, Search, Filter, Download, Eye, Calendar, User,
    Activity, Loader2, Table, ChevronLeft, ChevronRight,
    ArrowLeftRight, Info
} from 'lucide-react';
import { auditLogService } from '../../../services/auditLogService';

interface AuditLog {
    id: string;
    tableName: string;
    recordId: string;
    action: string;
    userId: string;
    user: {
        fullName: string;
        email: string;
        role: string;
    };
    oldValues: any;
    newValues: any;
    changes: any;
    reason: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: string;
}

export function AuditLog() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [total, setTotal] = useState(0);
    const [limit, setLimit] = useState(10);
    const [offset, setOffset] = useState(0);

    const [filterTable, setFilterTable] = useState('all');
    const [filterAction, setFilterAction] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

    const tables = ['all', 'Transaction', 'Partner', 'Employee', 'Category', 'User'];
    const actions = ['all', 'CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'LOGIN', 'LOGOUT'];

    const actionTranslations: Record<string, string> = {
        'CREATE': 'THÊM MỚI',
        'UPDATE': 'CẬP NHẬT',
        'DELETE': 'XÓA',
        'APPROVE': 'DUYỆT',
        'REJECT': 'TỪ CHỐI',
        'LOGIN': 'ĐĂNG NHẬP',
        'LOGOUT': 'ĐĂNG XUẤT'
    };

    const fieldTranslations: Record<string, string> = {
        'amount': 'Số tiền',
        'category': 'Danh mục',
        'attachments': 'Tệp đính kèm',
        'date': 'Ngày',
        'description': 'Mô tả',
        'type': 'Loại',
        'partner': 'Đối tác',
        'employee': 'Nhân viên',
        'fullName': 'Họ và tên',
        'email': 'Email',
        'role': 'Vai trò',
        'status': 'Trạng thái',
        'reason': 'Lý do',
        'note': 'Ghi chú',
        'method': 'Phương thức',
        'reference': 'Tham chiếu',
        'bankAccount': 'Tài khoản ngân hàng',
        'bankName': 'Tên ngân hàng',
        'phone': 'Số điện thoại',
        'address': 'Địa chỉ',
        'username': 'Tên đăng nhập',
        'dataScope': 'Phạm vi dữ liệu',
        'businessUnit': 'Đơn vị kinh doanh (BU)',
        'isAdvance': 'Phiếu dự chi',
        'costAllocations': 'Phân bổ chi phí',
        'plannedDate': 'Ngày dự kiến',
        'actualDate': 'Ngày thực tế',
        'code': 'Mã'
    };

    const tableTranslations: Record<string, string> = {
        'Transaction': 'Giao dịch',
        'Partner': 'Đối tác',
        'Employee': 'Nhân viên',
        'Category': 'Danh mục',
        'User': 'Người dùng'
    };

    const translateAction = (action: string) => actionTranslations[action] || action;
    const translateField = (field: string) => fieldTranslations[field] || field;
    const translateTable = (table: string) => tableTranslations[table] || table;

    const fetchData = async () => {
        try {
            setLoading(true);
            const params: any = {
                limit,
                offset,
                tableName: filterTable === 'all' ? undefined : filterTable,
                action: filterAction === 'all' ? undefined : filterAction
            };
            const data = await auditLogService.getAllLogs(params);
            setLogs(data.logs);
            setTotal(data.pagination.total);
        } catch (error) {
            console.error('Fetch audit logs error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            setExporting(true);
            const params: any = {
                tableName: filterTable === 'all' ? undefined : filterTable,
                action: filterAction === 'all' ? undefined : filterAction
            };
            const blob = await auditLogService.exportLogs(params);

            // Create a link and trigger download
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
        } catch (error) {
            console.error('Export audit logs error:', error);
            alert('Có lỗi xảy ra khi xuất CSV. Vui lòng thử lại sau.');
        } finally {
            setExporting(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [limit, offset, filterTable, filterAction]);

    const getActionBadgeColor = (action: string) => {
        switch (action) {
            case 'CREATE': return 'bg-green-100 text-green-700';
            case 'UPDATE': return 'bg-yellow-100 text-yellow-700';
            case 'DELETE': return 'bg-red-100 text-red-700';
            case 'APPROVE': return 'bg-blue-100 text-blue-700';
            case 'REJECT': return 'bg-orange-100 text-orange-700';
            case 'LOGIN': return 'bg-indigo-100 text-indigo-700';
            case 'LOGOUT': return 'bg-gray-100 text-gray-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('vi-VN');
    };

    const isSystemField = (key: string) => {
        const systemFields = ['id', 'createdAt', 'updatedAt', 'buId', 'roleId', 'password', 'twoFAEnabled', 'permissions'];
        return systemFields.includes(key);
    };

    const renderValue = (value: any) => {
        if (value === null || value === undefined) return <span className="text-gray-400 italic">null</span>;
        if (typeof value === 'boolean') return <span>{value ? 'Có' : 'Không'}</span>;

        if (typeof value === 'object') {
            // Handle common data structures to avoid raw JSON
            if (value.name) return <span>{value.name}</span>;
            if (value.fullName) return <span>{value.fullName}</span>;
            if (value.label) return <span>{value.label}</span>;
            if (value.code) return <span>{value.code}</span>;
            if (value.displayName) return <span>{value.displayName}</span>;
            if (value.title) return <span>{value.title}</span>;

            // If it's an array, join names if possible
            if (Array.isArray(value)) {
                if (value.length === 0) return <span>(trống)</span>;
                const items = value.map(v => {
                    if (typeof v === 'object') return v.name || v.label || v.fullName || JSON.stringify(v);
                    return String(v);
                });
                return <span>{items.join(', ')}</span>;
            }

            return <span className="text-xs font-serif text-gray-600 bg-gray-50 px-1 rounded">{JSON.stringify(value)}</span>;
        }

        return <span>{String(value)}</span>;
    };

    const renderDataList = (data: any) => {
        if (!data) return <p className="text-sm text-gray-400 italic">Không có dữ liệu</p>;

        const filteredKeys = Object.keys(data).filter(key => !isSystemField(key));

        if (filteredKeys.length === 0) return <p className="text-sm text-gray-400 italic">Không có thông tin thay đổi đáng kể</p>;

        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredKeys.map(key => (
                    <div key={key} className="p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">{translateField(key)}</p>
                        <div className="text-sm font-medium text-gray-800 break-all">
                            {renderValue(data[key])}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderChanges = (changes: any) => {
        if (!changes) return <span className="text-gray-400 italic">Không có chi tiết thay đổi</span>;

        const filteredKeys = Object.keys(changes).filter(key => !isSystemField(key));

        if (filteredKeys.length === 0) return <span className="text-gray-400 italic">Thay đổi ở các trường hệ thống</span>;

        return (
            <div className="space-y-4">
                {filteredKeys.map(key => (
                    <div key={key} className="border-b border-gray-50 pb-3 last:border-0">
                        <p className="text-sm font-bold text-gray-700 mb-2">{translateField(key)}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="p-2 bg-red-50 rounded border border-red-100">
                                <p className="text-[10px] text-red-400 font-bold uppercase mb-1">Cũ</p>
                                <div className="text-xs text-red-700 break-all">
                                    {renderValue(changes[key].old)}
                                </div>
                            </div>
                            <div className="p-2 bg-green-50 rounded border border-green-100">
                                <p className="text-[10px] text-green-400 font-bold uppercase mb-1">Mới</p>
                                <div className="text-xs text-green-700 break-all">
                                    {renderValue(changes[key].new)}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="p-8">
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Nhật Ký Kiểm Soát (Audit Logs)</h1>
                    <p className="text-gray-600">Theo dõi chi tiết các thay đổi dữ liệu trong hệ thống</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 flex items-center gap-3">
                        <Activity className="w-6 h-6 text-blue-500" />
                        <div>
                            <p className="text-sm text-gray-500">Tổng số log</p>
                            <p className="text-xl font-bold">{total}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-md p-4 mb-6">
                <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex-1 min-w-[300px] relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm bằng Record ID hoặc User..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700">Bảng:</span>
                            <select
                                value={filterTable}
                                onChange={(e) => {
                                    setFilterTable(e.target.value);
                                    setOffset(0);
                                }}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            >
                                <option value="all">Tất cả</option>
                                {tables.filter(t => t !== 'all').map(t => (
                                    <option key={t} value={t}>{translateTable(t)}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700">Hành động:</span>
                            <select
                                value={filterAction}
                                onChange={(e) => {
                                    setFilterAction(e.target.value);
                                    setOffset(0);
                                }}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            >
                                <option value="all">Tất cả</option>
                                {actions.filter(a => a !== 'all').map(a => (
                                    <option key={a} value={a}>{translateAction(a)}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <button
                        onClick={handleExport}
                        disabled={exporting || logs.length === 0}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ml-auto disabled:opacity-50"
                    >
                        {exporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                        {exporting ? 'Đang xuất...' : 'Xuất CSV'}
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="text-left py-4 px-6 font-semibold text-gray-700">Thời gian</th>
                                <th className="text-left py-4 px-6 font-semibold text-gray-700">Người dùng</th>
                                <th className="text-left py-4 px-6 font-semibold text-gray-700">Hành động</th>
                                <th className="text-left py-4 px-6 font-semibold text-gray-700">Bảng</th>
                                <th className="text-left py-4 px-6 font-semibold text-gray-700">Record ID</th>
                                <th className="text-center py-4 px-6 font-semibold text-gray-700">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                                            <p className="text-gray-500">Đang tải dữ liệu...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center text-gray-500">
                                        Không có dữ liệu audit log nào được tìm thấy
                                    </td>
                                </tr>
                            ) : (
                                logs.filter(log =>
                                    log.recordId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    log.user.fullName.toLowerCase().includes(searchTerm.toLowerCase())
                                ).map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="py-4 px-6 text-sm text-gray-600">
                                            {formatDate(log.createdAt)}
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-gray-800">{log.user.fullName}</span>
                                                <span className="text-xs text-gray-500">{log.user.email}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${getActionBadgeColor(log.action)}`}>
                                                {translateAction(log.action)}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-sm font-medium text-blue-600">
                                            {translateTable(log.tableName)}
                                        </td>
                                        <td className="py-4 px-6 text-sm font-mono text-gray-500 truncate max-w-[150px]">
                                            {log.recordId}
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <button
                                                onClick={() => setSelectedLog(log)}
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            >
                                                <Eye className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-gray-100 flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                        Hiển thị {offset + 1} - {Math.min(offset + limit, total)} trên tổng số {total}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={offset === 0}
                            onClick={() => setOffset(Math.max(0, offset - limit))}
                            className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            disabled={offset + limit >= total}
                            onClick={() => setOffset(offset + limit)}
                            className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal Detail */}
            {selectedLog && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Chi tiết Audit Log</h2>
                                <p className="text-sm text-gray-500">ID: {selectedLog.id}</p>
                            </div>
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                            >
                                <ChevronRight className="w-6 h-6 rotate-90" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            {/* General Info */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div className="space-y-1">
                                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Thời gian</p>
                                    <p className="text-sm font-medium">{formatDate(selectedLog.createdAt)}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Người thực hiện</p>
                                    <p className="text-sm font-medium">{selectedLog.user.fullName}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Hành động</p>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getActionBadgeColor(selectedLog.action)}`}>
                                        {translateAction(selectedLog.action)}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Bảng dữ liệu</p>
                                    <p className="text-sm font-bold text-blue-600">{translateTable(selectedLog.tableName)}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-4 bg-gray-50 rounded-xl space-y-2 border border-gray-100">
                                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                                        <Info className="w-4 h-4" />
                                        <span className="text-xs font-bold uppercase">Thông tin thêm</span>
                                    </div>
                                    <p className="text-sm text-gray-700"><strong>IP Address:</strong> {selectedLog.ipAddress || 'Unknown'}</p>
                                    <p className="text-sm text-gray-700"><strong>Lý do:</strong> {selectedLog.reason || 'Không có'}</p>
                                    <p className="text-xs text-gray-500 truncate" title={selectedLog.userAgent || ''}>
                                        <strong>User Agent:</strong> {selectedLog.userAgent || 'Unknown'}
                                    </p>
                                </div>
                                <div className="p-4 bg-blue-50 rounded-xl space-y-2 border border-blue-100">
                                    <div className="flex items-center gap-2 text-blue-600 mb-2">
                                        <Table className="w-4 h-4" />
                                        <span className="text-xs font-bold uppercase">Record ID</span>
                                    </div>
                                    <code className="text-xs bg-white p-2 rounded block break-all font-mono border border-blue-100">
                                        {selectedLog.recordId}
                                    </code>
                                </div>
                            </div>

                            {/* Changes Section */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <ArrowLeftRight className="w-5 h-5 text-orange-500" />
                                    <h3 className="text-lg font-bold text-gray-800">Chi tiết thay đổi</h3>
                                </div>

                                {selectedLog.action === 'UPDATE' ? (
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                                            <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 font-bold text-xs text-gray-500">CÁC TRƯỜNG THAY ĐỔI</div>
                                            <div className="p-4">
                                                {renderChanges(selectedLog.changes)}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                                            <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 font-bold text-xs text-gray-500">DỮ LIỆU {selectedLog.action === 'CREATE' ? 'GỐC' : 'CUỐI'}</div>
                                            <div className="p-4 bg-gray-50">
                                                {renderDataList(selectedLog.action === 'CREATE' ? selectedLog.newValues : selectedLog.oldValues)}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 flex justify-end">
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-all"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AuditLog;
