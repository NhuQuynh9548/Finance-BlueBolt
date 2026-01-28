import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Plus, Eye, Edit2, Trash2, DollarSign, X, AlertCircle, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Save, Calendar, Building2, FileText, Paperclip, TrendingUp, TrendingDown, RefreshCw, ChevronDown, ChevronUp, User, Users, Upload, Printer, Send, CheckCircle, XCircle, Image as ImageIcon, ExternalLink, Briefcase, RotateCcw, Settings, GripVertical, Layers } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { transactionService } from '../../services/transactionService';
import { categoryService } from '../../services/categoryService';
import { projectService } from '../../services/projectService';
import { partnerService } from '../../services/partnerService';
import { employeeService } from '../../services/employeeService';
import { businessUnitService } from '../../services/businessUnitService';
import { paymentMethodService } from '../../services/paymentMethodService';
import { allocationRuleService } from '../../services/allocationRuleService';
import { uploadService } from '../../services/uploadService';

// Interfaces matching Backend
interface TransactionFile {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
}

interface AllocationPreview {
  bu: string;
  percentage: number;
  amount: number;
}

interface Transaction {
  id: string;
  transactionCode: string;
  transactionDate: string; // ISO string from API
  transactionType: 'INCOME' | 'EXPENSE' | 'LOAN';
  categoryId: string;
  category?: { id: string; name: string };
  projectId?: string;
  project?: { id: string; name: string; code: string };
  objectType: 'PARTNER' | 'EMPLOYEE' | 'STUDENT' | 'OTHER';
  partnerId?: string;
  partner?: { id: string; partnerName: string };
  employeeId?: string;
  employee?: { id: string; fullName: string };
  paymentMethodId?: string;
  paymentMethod?: { id: string; name: string };
  businessUnitId: string;
  businessUnit?: { id: string; name: string };
  amount: number;
  costAllocation: 'DIRECT' | 'INDIRECT';
  allocationRuleId?: string;
  isAdvance: boolean;
  studentName?: string;
  otherName?: string;
  attachments?: TransactionFile[];
  paymentStatus: 'PAID' | 'UNPAID';
  approvalStatus: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  rejectionReason?: string;
  description: string;
  objectName?: string; // Helper for display
  projectName?: string; // Manual name entry
}

type SortField = 'transactionDate' | 'transactionCode' | 'amount';
type SortOrder = 'asc' | 'desc' | null;
type ModalMode = 'create' | 'view' | 'edit' | null;

interface ColumnConfig {
  id: string;
  label: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: number;
  visible: boolean;
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'transactionDate', label: 'Ngày CT', sortable: true, align: 'left', width: 120, visible: true },
  { id: 'transactionCode', label: 'Mã GD', sortable: true, align: 'left', width: 120, visible: true },
  { id: 'category', label: 'Danh mục', sortable: false, align: 'left', width: 150, visible: true },
  { id: 'transactionType', label: 'Loại', sortable: false, align: 'left', width: 100, visible: true },
  { id: 'objectName', label: 'Đối tượng', sortable: false, align: 'left', width: 150, visible: true },
  { id: 'paymentMethod', label: 'PT Thanh Toán', sortable: false, align: 'left', width: 140, visible: true },
  { id: 'businessUnit', label: 'Đơn vị (BU)', sortable: false, align: 'left', width: 150, visible: true },
  { id: 'project', label: 'Dự án', sortable: false, align: 'left', width: 150, visible: true },
  { id: 'amount', label: 'Số tiền', sortable: true, align: 'right', width: 140, visible: true },
  { id: 'paymentStatus', label: 'TT', sortable: false, align: 'left', width: 130, visible: true },
  { id: 'approvalStatus', label: 'Phê duyệt', sortable: false, align: 'left', width: 130, visible: true },
  { id: 'actions', label: 'Hành động', sortable: false, align: 'center', width: 120, visible: true },
];

export function QuanLyThuChi() {
  const { selectedBU, canSelectBU, currentUser } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  // States
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [businessUnits, setBusinessUnits] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [allocationRules, setAllocationRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [timeRange, setTimeRange] = useState<string>('MONTH');
  const [filterBU, setFilterBU] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Modal States
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [modalType, setModalType] = useState<'INCOME' | 'EXPENSE' | 'LOAN'>('INCOME');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // Local Form Data
  const [formData, setFormData] = useState<Partial<Transaction>>({});
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Sorting & Pagination
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Columns
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);
  const [showFilters, setShowFilters] = useState(true);

  // Load columns from localStorage on mount
  useEffect(() => {
    const savedColumns = localStorage.getItem('thuChiColumns');
    if (savedColumns) {
      try {
        const parsed = JSON.parse(savedColumns);
        // Filter out costAllocation in case it's still in the user's localStorage
        const filtered = parsed.filter((col: ColumnConfig) => col.id !== 'costAllocation');
        setColumns(filtered);
      } catch (e) {
        console.error('Error parsing saved columns:', e);
      }
    }
  }, []);

  // Save columns to localStorage when they change
  useEffect(() => {
    if (columns !== DEFAULT_COLUMNS) {
      localStorage.setItem('thuChiColumns', JSON.stringify(columns));
    }
  }, [columns]);

  const moveColumn = (fromIndex: number, toIndex: number) => {
    const newColumns = [...columns];
    const [movedColumn] = newColumns.splice(fromIndex, 1);
    newColumns.splice(toIndex, 0, movedColumn);
    setColumns(newColumns);
  };

  const handleResetColumns = () => {
    setColumns(DEFAULT_COLUMNS);
    localStorage.removeItem('thuChiColumns');
  };

  // Helper: Format Date
  const formatDate = (isoString?: string) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleDateString('vi-VN');
  };

  // Helper: Format Currency with thousand separators (dots)
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
  };

  // Fetch Data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Prepare filters for API
      const apiFilters: any = {};
      if (selectedBU !== 'all') apiFilters.buId = selectedBU;
      if (filterType !== 'all') apiFilters.type = filterType;
      if (filterStatus !== 'all') apiFilters.status = filterStatus;
      // Date filters would go here if API supports dateFrom/dateTo directly or we handle in client
      // The backend supports dateFrom and dateTo, let's calculate them
      const range = getTransactionRange(timeRange);
      if (range) {
        apiFilters.dateFrom = range.start.toISOString();
        apiFilters.dateTo = range.end.toISOString();
      }

      const [txns, cats, prjs, pts, emps, bus, pms, rules] = await Promise.all([
        transactionService.getAll(apiFilters),
        categoryService.getAll(),
        projectService.getAll(),
        partnerService.getAll(),
        employeeService.getAll(),
        businessUnitService.getAll(),
        paymentMethodService.getAll(),
        allocationRuleService.getAll()
      ]);

      setTransactions(txns);
      setCategories(cats);
      setProjects(prjs);
      setPartners(pts);
      setEmployees(emps);
      setBusinessUnits(bus);
      setPaymentMethods(pms);
      setAllocationRules(rules);

    } catch (err: any) {
      console.error('Error fetching transactions:', err);
      setError('Không thể tải dữ liệu thu chi');
    } finally {
      setLoading(false);
    }
  }, [selectedBU, filterType, filterStatus, timeRange, customStartDate, customEndDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle direct link to a transaction from notification
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const txnId = params.get('id');

    if (txnId && !loading && transactions.length > 0) {
      const txn = transactions.find(t => t.id === txnId);
      if (txn) {
        handleView(txn);
        // Clean up URL to prevent re-opening on next render
        // We use { replace: true } to not clutter history
        navigate(location.pathname, { replace: true });
      }
    }
  }, [location.search, transactions, loading, navigate, location.pathname]);

  // Debounce Search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const getTransactionRange = (preset: string): { start: Date; end: Date } | null => {
    const now = new Date();
    const start = new Date();
    const end = new Date();

    switch (preset) {
      case 'WEEK':
        // Start of current week (Monday)
        const day = now.getDay() || 7; // Make Sunday 7, Monday 1
        start.setDate(now.getDate() - day + 1);
        end.setDate(start.getDate() + 6); // End of current week (Sunday)
        break;
      case 'MONTH':
        // Start of current month
        start.setDate(1);
        end.setMonth(now.getMonth() + 1, 0); // Last day of current month
        break;
      case 'QUARTER':
        // Start of current quarter
        const quarter = Math.floor(now.getMonth() / 3);
        start.setMonth(quarter * 3, 1);
        end.setMonth(quarter * 3 + 3, 0); // Last day of current quarter
        break;
      case 'YEAR':
        // Start of current year
        start.setMonth(0, 1);
        end.setMonth(11, 31); // Last day of current year
        break;
      case 'CUSTOM':
        if (customStartDate && customEndDate) {
          return {
            start: new Date(customStartDate),
            end: new Date(customEndDate)
          };
        }
        return null;
      case 'ALL':
        return null; // No date filter
      default:
        return null;
    }
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  };

  // Filter Logic (Client Side for Search Text)
  const filteredTransactions = transactions.filter(txn => {
    const searchLower = debouncedSearch.toLowerCase();
    const matchCode = txn.transactionCode?.toLowerCase().includes(searchLower);
    const matchDesc = txn.description?.toLowerCase().includes(searchLower);
    const matchPartner = txn.partner?.partnerName?.toLowerCase().includes(searchLower);
    const matchEmployee = txn.employee?.fullName?.toLowerCase().includes(searchLower);

    return matchCode || matchDesc || matchPartner || matchEmployee;
  });

  // Sorting
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    if (!sortField || !sortOrder) return 0;

    let valA: any = a[sortField];
    let valB: any = b[sortField];

    if (sortField === 'transactionDate') {
      valA = new Date(valA).getTime();
      valB = new Date(valB).getTime();
    }

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage);
  const paginatedTransactions = sortedTransactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Handlers
  const handleCreate = (type: 'INCOME' | 'EXPENSE' | 'LOAN') => {
    const prefix = type === 'INCOME' ? 'T' : type === 'EXPENSE' ? 'C' : 'V';
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(-2);
    const tempCode = `${prefix}${mm}${yy}_01`;

    setModalMode('create');
    setModalType(type);
    setSelectedFiles([]);
    setFormData({
      transactionCode: tempCode,
      transactionType: type,
      transactionDate: now.toISOString().split('T')[0],
      amount: 0,
      paymentStatus: 'UNPAID',
      approvalStatus: 'DRAFT',
      costAllocation: 'DIRECT',
      isAdvance: false,
      businessUnitId: (selectedBU !== 'all' ? selectedBU : (businessUnits.length > 0 ? businessUnits[0].id : '')),
      objectType: type === 'LOAN' ? 'EMPLOYEE' : 'PARTNER',
      studentName: '',
      otherName: '',
      paymentMethodId: paymentMethods.length > 0 ? paymentMethods[0].id : '',
      description: ''
    });
  };

  const handleEdit = (txn: Transaction) => {
    setModalMode('edit');
    setModalType(txn.transactionType);
    setSelectedFiles([]);
    setFormData({
      ...txn,
      transactionDate: new Date(txn.transactionDate).toISOString().split('T')[0],
    });
  };

  const handleView = (txn: Transaction) => {
    setModalMode('view');
    setModalType(txn.transactionType);
    setSelectedTransaction(txn);
    setSelectedFiles([]);
    setFormData({
      ...txn,
      transactionDate: new Date(txn.transactionDate).toISOString().split('T')[0],
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa giao dịch này?')) {
      try {
        await transactionService.delete(id);
        fetchData();
      } catch (err) {
        alert('Xóa thất bại');
      }
    }
  };

  const handleCancel = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn hủy giao dịch này?')) {
      try {
        await transactionService.update(id, { approvalStatus: 'CANCELLED' });
        fetchData();
      } catch (err) {
        alert('Hủy thất bại');
      }
    }
  };

  const handleApprove = async (id: string) => {
    if (confirm('Phê duyệt giao dịch này?')) {
      try {
        await transactionService.approve(id);
        fetchData();
      } catch (err) {
        alert('Phê duyệt thất bại');
      }
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Nhập lý do từ chối:');
    if (reason === null) return; // User clicked Cancel
    if (!reason.trim()) {
      alert('Lý do từ chối là bắt buộc');
      return;
    }
    try {
      await transactionService.reject(id, reason);
      fetchData();
    } catch (err) {
      alert('Từ chối thất bại');
    }
  };

  const handleSubmit = async (e: React.FormEvent, submitAction: 'DRAFT' | 'PENDING' = 'DRAFT') => {
    if (e) e.preventDefault();
    try {
      // Validation
      if (!formData.amount || Number(formData.amount) <= 0) {
        alert('Số tiền phải lớn hơn 0');
        return;
      }

      if (formData.costAllocation === 'INDIRECT' && !formData.allocationRuleId) {
        alert('Vui lòng chọn quy tắc phân bổ cho chi phí gián tiếp');
        return;
      }

      setLoading(true);
      // 1. Upload files first if any
      let uploadedAttachments = [];
      if (selectedFiles.length > 0) {
        uploadedAttachments = await uploadService.uploadFiles(selectedFiles);
      }

      // 2. Prepare Payload (Force DIRECT allocation)
      const payload: any = {
        ...formData,
        costAllocation: 'DIRECT',
        allocationRuleId: undefined,
        transactionDate: formData.transactionDate
          ? new Date(formData.transactionDate).toISOString()
          : new Date().toISOString(), // Default to today if not set
        amount: Number(formData.amount),
        approvalStatus: submitAction,
        attachments: uploadedAttachments.length > 0 ? uploadedAttachments : undefined,
        allocationPreviews: undefined
      };

      // Handle "All Employees in BU" - Now creates a SINGLE transaction
      if (formData.objectType === 'EMPLOYEE' && formData.employeeId === 'ALL_IN_BU') {
        if (!formData.businessUnitId) {
          alert('Vui lòng chọn Business Unit');
          return;
        }

        const buName = businessUnits.find(bu => bu.id === formData.businessUnitId)?.name || '';
        payload.employeeId = undefined; // No specific employee
        payload.description = `[Tất cả nhân viên BU ${buName}] ${payload.description || ''}`;
      }
      // Normal single creation
      // Clean up payload based on object type
      if (payload.objectType === 'PARTNER') {
        payload.employeeId = undefined;
        payload.studentName = undefined;
        payload.otherName = undefined;
      } else if (payload.objectType === 'EMPLOYEE') {
        payload.partnerId = undefined;
        payload.studentName = undefined;
        payload.otherName = undefined;
      } else if (payload.objectType === 'STUDENT') {
        payload.partnerId = undefined;
        payload.employeeId = undefined;
        payload.otherName = undefined;
      } else if (payload.objectType === 'OTHER') {
        payload.partnerId = undefined;
        payload.employeeId = undefined;
        payload.studentName = undefined;
      }

      // Clean up allocation
      if (payload.costAllocation === 'DIRECT') {
        payload.allocationRuleId = undefined;
      }

      // Ensure businessUnitId is NEVER undefined (database constraint)
      if (!payload.businessUnitId && businessUnits.length > 0) {
        payload.businessUnitId = businessUnits[0].id;
      }

      if (modalMode === 'create') {
        await transactionService.create(payload);
      } else if (modalMode === 'edit' && formData.id) {
        await transactionService.update(formData.id, payload);
      }

      setModalMode(null);
      setSelectedFiles([]);
      fetchData();
    } catch (err: any) {
      console.error('Submit error:', err);
      alert('Lưu giao dịch thất bại: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Draggable Header Component (Internal)
  const DraggableColumnHeader = ({ column, index }: { column: ColumnConfig; index: number }) => {
    const [isDragging, setIsDragging] = React.useState(false);

    const handleDragStart = (e: React.DragEvent) => {
      e.dataTransfer.setData('text/plain', index.toString());
      setIsDragging(true);
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
      moveColumn(fromIndex, index);
    };

    return (
      <th
        draggable
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-move ${isDragging ? 'opacity-50' : ''}`}
      >
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-gray-300" />
          {column.label}
          {column.sortable && (
            <button onClick={() => {
              if (sortField === column.id) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              else { setSortField(column.id as SortField); setSortOrder('asc'); }
            }}>
              <ArrowUpDown className="w-3 h-3 ml-1" />
            </button>
          )}
        </div>
      </th>
    );
  };

  const getObjectName = (txn: Transaction) => {
    if (txn.objectType === 'PARTNER') return txn.partner?.partnerName;
    if (txn.objectType === 'EMPLOYEE') {
      return txn.employee?.fullName || `Tất cả nhân viên (${txn.businessUnit?.name || 'N/A'})`;
    }
    if (txn.objectType === 'STUDENT') return txn.studentName || '-';
    if (txn.objectType === 'OTHER') return txn.otherName || '-';
    return '-';
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      'DRAFT': 'bg-gray-100 text-gray-800',
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'APPROVED': 'bg-green-100 text-green-800',
      'REJECTED': 'bg-red-100 text-red-800',
      'CANCELLED': 'bg-gray-100 text-gray-600'
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${(styles as any)[status] || ''}`}>{status}</span>;
  };

  // Calculate Summary Stats
  const stats = React.useMemo(() => {
    const income = transactions.filter(t => t.transactionType === 'INCOME' && t.approvalStatus === 'APPROVED').reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions.filter(t => t.transactionType === 'EXPENSE' && t.approvalStatus === 'APPROVED').reduce((sum, t) => sum + t.amount, 0);
    const debt = transactions.filter(t => t.transactionType === 'LOAN' && t.paymentStatus === 'UNPAID').reduce((sum, t) => sum + t.amount, 0);
    return {
      income,
      expense,
      balance: income - expense,
      debt
    };
  }, [transactions]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 uppercase">Quản lý thu - chi - vay</h1>
        <p className="text-gray-500 text-sm">Quản lý giao dịch tài chính và phê duyệt thanh toán</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Total Revenue */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-2">Tổng Doanh thu</p>
              <h3 className="text-2xl font-bold text-gray-800">
                {formatCurrency(stats.income)}
              </h3>
            </div>
          </div>
          <p className="text-xs mt-4 text-green-600 font-medium">Đã phê duyệt</p>
        </div>

        {/* Total Expense */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-2">Tổng Chi phí</p>
              <h3 className="text-2xl font-bold text-gray-800">
                {formatCurrency(stats.expense)}
              </h3>
            </div>
          </div>
          <p className="text-xs mt-4 text-red-600 font-medium">Đã phê duyệt</p>
        </div>

        {/* Total Loan */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-2">Tổng Vay</p>
              <h3 className="text-2xl font-bold text-gray-800">
                {formatCurrency(stats.debt)}
              </h3>
            </div>
          </div>
          <p className="text-xs mt-4 text-orange-600 font-medium">Chưa thanh toán</p>
        </div>

        {/* Profit */}
        <div className={`${stats.balance >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} rounded-xl shadow-md p-6 border`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className={`text-sm mb-2 ${stats.balance >= 0 ? 'text-green-800' : 'text-red-800'}`}>Lợi nhuận</p>
              <h3 className={`text-2xl font-bold ${stats.balance >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                {formatCurrency(stats.balance)}
              </h3>
            </div>
          </div>
          <p className={`text-xs mt-4 font-medium ${stats.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>Thu - Chi</p>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-xl shadow-sm mb-4 overflow-hidden border border-gray-100">
        <div
          onClick={() => setShowFilters(!showFilters)}
          className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-blue-600" />
            <h3 className="text-gray-700 font-semibold text-sm">Bộ lọc tìm kiếm</h3>
          </div>
          {showFilters ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>

        {showFilters && (
          <div className="p-4 border-t border-gray-50">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              {/* Left: Search & Dropdowns */}
              <div className="flex flex-1 gap-3 w-full lg:w-auto">
                <div className="relative flex-1 min-w-[300px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm theo Mã GD, Đối tượng, Danh mục, Dự án..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200">
                  {[
                    { label: 'Tuần này', value: 'WEEK' },
                    { label: 'Tháng này', value: 'MONTH' },
                    { label: 'Quý này', value: 'QUARTER' },
                    { label: 'Năm này', value: 'YEAR' },
                    { label: 'Tất cả', value: 'ALL' }
                  ].map((p) => (
                    <button
                      key={p.value}
                      onClick={() => setTimeRange(p.value)}
                      className={`px-3 py-1.5 text-[11px] font-bold rounded-md transition-all ${timeRange === p.value
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <select
                  value={filterBU}
                  onChange={e => setFilterBU(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white min-w-[120px]"
                >
                  <option value="all">Tất cả BU</option>
                  {businessUnits.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white min-w-[150px]"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="APPROVED">Đã duyệt</option>
                  <option value="PENDING">Chờ duyệt</option>
                  <option value="DRAFT">Nháp</option>
                  <option value="REJECTED">Từ chối</option>
                </select>
                <button
                  onClick={() => { setSearchTerm(''); setFilterStatus('all'); setFilterType('all'); setFilterBU('all'); }}
                  className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={handleResetColumns}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Đặt lại cột
              </button>

              <div className="flex gap-3 ml-auto">
                <button
                  onClick={() => handleCreate('INCOME')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 flex items-center gap-2 shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Tạo Phiếu Thu
                </button>
                <button
                  onClick={() => handleCreate('EXPENSE')}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 flex items-center gap-2 shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Tạo Phiếu Chi
                </button>
                <button
                  onClick={() => handleCreate('LOAN')}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 flex items-center gap-2 shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Tạo Phiếu Vay
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Info Alert */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-6 flex items-start gap-3">
        <Settings className="w-5 h-5 text-blue-500 mt-0.5" />
        <div>
          <p className="text-sm text-blue-800 font-medium">Tùy chỉnh hiển thị cột</p>
          <p className="text-xs text-blue-600 mt-1">
            Kéo biểu tượng <GripVertical className="w-3 h-3 inline" /> bên cạnh tên cột để sắp xếp lại theo thói quen sử dụng của bạn. Hệ thống sẽ tự động lưu cấu hình hiển thị cho tài khoản của bạn.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {['all', 'INCOME', 'EXPENSE', 'LOAN'].map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${filterType === type
              ? 'text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            style={filterType === type ? { backgroundColor: '#004aad', borderColor: '#004aad' } : {}}
          >
            {type === 'all' ? 'Tất cả' : type === 'INCOME' ? 'THU' : type === 'EXPENSE' ? 'CHI' : 'VAY'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Đang tải dữ liệu...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {columns.filter(c => c.visible).map((col, idx) => (
                    <DraggableColumnHeader key={col.id} column={col} index={idx} />
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedTransactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-gray-50 transition-colors">
                    {columns.filter(c => c.visible).map(col => {
                      if (col.id === 'transactionDate') return <td className="px-6 py-4 text-sm text-gray-600">{formatDate(txn.transactionDate)}</td>;
                      if (col.id === 'transactionCode') return <td className="px-6 py-4 text-sm font-medium text-blue-700">{txn.transactionCode}</td>;
                      if (col.id === 'category') return <td className="px-6 py-4 text-sm text-gray-700">{txn.category?.name || '-'}</td>;
                      if (col.id === 'transactionType') return <td className="px-6 py-4">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${txn.transactionType === 'INCOME' ? 'bg-green-50 text-green-700 border-green-200' :
                          txn.transactionType === 'EXPENSE' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                          {txn.transactionType === 'INCOME' ? 'THU' : txn.transactionType === 'EXPENSE' ? 'CHI' : 'VAY'}
                        </span>
                      </td>;
                      if (col.id === 'objectName') return <td className="px-6 py-4 text-sm text-gray-700 font-medium">{getObjectName(txn)}</td>;
                      if (col.id === 'paymentMethod') return <td className="px-6 py-4 text-sm text-gray-600 font-medium">{txn.paymentMethod?.name || '-'}</td>;
                      if (col.id === 'businessUnit') return (
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {txn.businessUnit?.name || '-'}
                        </td>
                      );
                      if (col.id === 'project') return <td className="px-6 py-4 text-sm text-gray-600">{txn.projectName || txn.project?.name || '-'}</td>;
                      if (col.id === 'amount') return (
                        <td className={`px-6 py-4 text-right text-sm font-bold ${txn.transactionType === 'INCOME' ? 'text-green-600' :
                          txn.transactionType === 'EXPENSE' ? 'text-red-600' : 'text-blue-600'
                          }`}>
                          {txn.transactionType === 'INCOME' ? '+' : '-'}{formatCurrency(txn.amount)}
                        </td>
                      );
                      if (col.id === 'paymentStatus') return <td className="px-6 py-4 text-sm text-gray-700">
                        <div className="flex items-center gap-2">
                          <span>
                            {txn.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                          </span>
                          {txn.attachments && txn.attachments.length > 0 && (
                            <div className="flex items-center gap-1 text-gray-400" title={`${txn.attachments.length} chứng từ đính kèm`}>
                              <Paperclip className="w-3.5 h-3.5" />
                              <span className="text-[11px] font-bold">{txn.attachments.length}</span>
                            </div>
                          )}
                        </div>
                      </td>;
                      if (col.id === 'approvalStatus') return <td className="px-6 py-4">{getStatusBadge(txn.approvalStatus)}</td>;
                      if (col.id === 'actions') return (
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center gap-2">
                            <button onClick={() => handleView(txn)} className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors" title="Xem chi tiết"><Eye className="w-4 h-4" /></button>
                            {(txn.approvalStatus === 'DRAFT' || txn.approvalStatus === 'REJECTED') ? (
                              <>
                                <button onClick={() => handleEdit(txn)} className="p-1.5 hover:bg-orange-50 text-orange-600 rounded-lg transition-colors" title="Chỉnh sửa"><Edit2 className="w-4 h-4" /></button>
                                <button onClick={() => handleDelete(txn.id)} className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition-colors" title="Xóa"><Trash2 className="w-4 h-4" /></button>
                                <button onClick={() => handleCancel(txn.id)} className="p-1.5 hover:bg-gray-100 text-gray-500 rounded-lg transition-colors" title="Hủy"><XCircle className="w-4 h-4" /></button>
                              </>
                            ) : txn.approvalStatus !== 'APPROVED' ? (
                              <button disabled className="p-1.5 text-gray-300 cursor-not-allowed"><Edit2 className="w-4 h-4" /></button>
                            ) : null}
                            {txn.approvalStatus === 'APPROVED' && (
                              <button disabled className="p-1.5 text-gray-300 cursor-not-allowed" title="Không thể xóa giao dịch đã duyệt"><Trash2 className="w-4 h-4" /></button>
                            )}
                            {txn.approvalStatus === 'PENDING' && (currentUser.role === 'CEO' || currentUser.role === 'Admin') && (
                              <>
                                <button onClick={() => handleApprove(txn.id)} className="p-1.5 hover:bg-green-50 text-green-600 rounded-lg transition-colors" title="Duyệt"><CheckCircle className="w-4 h-4" /></button>
                                <button onClick={() => handleReject(txn.id)} className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition-colors" title="Từ chối"><XCircle className="w-4 h-4" /></button>
                              </>
                            )}
                          </div>
                        </td>
                      );
                      return <td className="px-6 py-4">-</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalMode && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-6">
              <div className="flex justify-between items-center mb-6 pb-4 border-b">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    {modalMode === 'create' ? `Tạo Phiếu ${modalType === 'INCOME' ? 'Thu' : modalType === 'EXPENSE' ? 'Chi' : 'Vay'} Mới` :
                      modalMode === 'edit' ? 'Chỉnh Sửa Giao Dịch' : 'Chi Tiết Giao Dịch'}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">Vui lòng điền đầy đủ thông tin bắt buộc (*)</p>
                </div>
                <button type="button" onClick={() => setModalMode(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="w-5 h-5 text-gray-400 font-bold" /></button>
              </div>

              <div className="space-y-8">
                {/* SECTION 1: THÔNG TIN GIAO DỊCH */}
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="w-1 h-4 bg-blue-600 rounded-full"></span>
                    Thông tin giao dịch
                  </h3>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                    {modalType !== 'INCOME' && modalType !== 'LOAN' && (
                      <div className="col-span-2 flex items-center gap-2 mb-1">
                        <input
                          type="checkbox"
                          id="isAdvance"
                          checked={formData.isAdvance || false}
                          onChange={e => setFormData({ ...formData, isAdvance: e.target.checked })}
                          disabled={modalMode === 'view'}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="isAdvance" className="text-sm font-semibold text-gray-700 cursor-pointer">
                          Đây là phiếu dự chi (Advance Payment)
                        </label>
                      </div>
                    )}
                    <div>
                      <label className="block text-[13px] font-semibold text-gray-600 mb-1.5 flex items-center gap-2">
                        Mã Giao Dịch (Auto)
                      </label>
                      <input
                        disabled
                        readOnly
                        value={formData.transactionCode || ''}
                        className="w-full px-4 py-2 bg-gray-100 text-gray-500 rounded-lg border border-gray-200 text-sm font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-semibold text-gray-600 mb-1.5 flex items-center gap-2">
                        <span className="text-red-500 font-bold">*</span> Ngày Giao Dịch
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          required
                          disabled={modalMode === 'view'}
                          value={formData.transactionDate}
                          onChange={e => setFormData({ ...formData, transactionDate: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[13px] font-semibold text-gray-600 mb-1.5 flex items-center gap-2">
                        <span className="text-red-500 font-bold">*</span> Danh Mục
                      </label>
                      <div className="relative">
                        <select
                          required
                          disabled={modalMode === 'view' || modalMode === 'edit'}
                          value={formData.categoryId || ''}
                          onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                          className={`w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none ${modalMode === 'edit' ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}`}
                          style={{ WebkitAppearance: 'none', MozAppearance: 'none' } as React.CSSProperties}
                        >
                          <option value="">Chọn danh mục...</option>
                          {categories.filter(c => {
                            const catType = c.type.toUpperCase();
                            if (modalType === 'INCOME') return catType === 'THU';
                            if (modalType === 'EXPENSE') return catType === 'CHI';
                            if (modalType === 'LOAN') return catType === 'VAY';
                            return false;
                          }).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[13px] font-semibold text-gray-600 mb-1.5 flex items-center gap-2">
                        Dự Án
                      </label>
                      <input
                        type="text"
                        disabled={modalMode === 'view'}
                        placeholder="Nhập tên dự án..."
                        value={formData.projectName || ''}
                        onChange={e => setFormData({ ...formData, projectName: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[13px] font-semibold text-gray-600 mb-1.5 flex items-center gap-2">
                        <span className="text-red-500 font-bold">*</span> Business Unit
                      </label>
                      <div className="relative">
                        <select
                          required
                          disabled={
                            modalMode === 'view' ||
                            !canSelectBU ||
                            formData.costAllocation === 'INDIRECT'
                          }
                          value={formData.costAllocation === 'INDIRECT' ? 'indirect' : (formData.businessUnitId || '')}
                          onChange={e => {
                            const newBuId = e.target.value;
                            setFormData({
                              ...formData,
                              businessUnitId: newBuId,
                              partnerId: undefined,
                              employeeId: undefined
                            });
                          }}
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#004aad] outline-none appearance-none bg-white transition-all disabled:bg-gray-50 disabled:text-gray-500"
                          style={{ WebkitAppearance: 'none', MozAppearance: 'none' } as React.CSSProperties}
                        >
                          {formData.costAllocation === 'INDIRECT' ? (
                            <option value="indirect">--- Phân bổ gián tiếp (Tự động) ---</option>
                          ) : (
                            <>
                              <option value="">Chọn đơn vị (BU)...</option>
                              {businessUnits.map(bu => (
                                <option key={bu.id} value={bu.id}>{bu.name}</option>
                              ))}
                            </>
                          )}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                      {formData.costAllocation === 'INDIRECT' && (
                        <p className="text-xs text-gray-500 mt-1.5 italic">
                          💡 BU sẽ được phân bổ tự động theo quy tắc phân bổ gián tiếp
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* SECTION 2: ĐỐI TƯỢNG GIAO DỊCH */}
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="w-1 h-4 bg-blue-600 rounded-full"></span>
                    Đối tượng giao dịch
                  </h3>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                    <div className="col-span-2 flex mb-2" style={{ gap: '50px' }}>
                      <label className="flex-shrink-0 flex items-center cursor-pointer gap-2 group whitespace-nowrap mr-10">
                        <input
                          type="radio"
                          name="objectType"
                          checked={formData.objectType === 'PARTNER'}
                          onChange={() => setFormData({ ...formData, objectType: 'PARTNER' })}
                          disabled={modalMode === 'view'}
                          className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <span className={`text-sm font-semibold ${formData.objectType === 'PARTNER' ? 'text-gray-900' : 'text-gray-500'}`}>Đối tác</span>
                      </label>
                      <label className="flex-shrink-0 flex items-center cursor-pointer gap-2 group whitespace-nowrap mr-10">
                        <input
                          type="radio"
                          name="objectType"
                          checked={formData.objectType === 'EMPLOYEE'}
                          onChange={() => setFormData({ ...formData, objectType: 'EMPLOYEE' })}
                          disabled={modalMode === 'view'}
                          className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <span className={`text-sm font-semibold ${formData.objectType === 'EMPLOYEE' ? 'text-gray-900' : 'text-gray-500'}`}>Nhân viên</span>
                      </label>
                      {modalType === 'INCOME' && (
                        <label className="flex-shrink-0 flex items-center cursor-pointer gap-2 group whitespace-nowrap mr-10">
                          <input
                            type="radio"
                            name="objectType"
                            checked={formData.objectType === 'STUDENT'}
                            onChange={() => setFormData({ ...formData, objectType: 'STUDENT' })}
                            disabled={modalMode === 'view'}
                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                          <span className={`text-sm font-semibold ${formData.objectType === 'STUDENT' ? 'text-gray-900' : 'text-gray-500'}`}>Học viên</span>
                        </label>
                      )}
                      {modalType === 'LOAN' && (
                        <label className="flex-shrink-0 flex items-center cursor-pointer gap-2 group whitespace-nowrap mr-10">
                          <input
                            type="radio"
                            name="objectType"
                            checked={formData.objectType === 'OTHER'}
                            onChange={() => setFormData({ ...formData, objectType: 'OTHER' })}
                            disabled={modalMode === 'view'}
                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                          <span className={`text-sm font-semibold ${formData.objectType === 'OTHER' ? 'text-gray-900' : 'text-gray-500'}`}>Khác</span>
                        </label>
                      )}
                    </div>
                    <div>
                      <label className="block text-[13px] font-semibold text-gray-600 mb-1.5 flex items-center gap-2">
                        <span className="text-red-500 font-bold">*</span> {
                          formData.objectType === 'PARTNER' ? 'Đối tác' :
                            formData.objectType === 'EMPLOYEE' ? 'Nhân viên' :
                              (modalType === 'LOAN' && formData.objectType === 'OTHER') ? 'Đối tượng vay khác' :
                                'Học viên'
                        }
                      </label>
                      <div className="relative">
                        {formData.objectType === 'STUDENT' || formData.objectType === 'OTHER' ? (
                          <input
                            type="text"
                            required
                            disabled={modalMode === 'view'}
                            placeholder={formData.objectType === 'STUDENT' ? "Nhập tên học viên..." : "Nhập người vay/cho vay..."}
                            value={(formData.objectType === 'STUDENT' ? formData.studentName : formData.otherName) || ''}
                            onChange={e => setFormData({ ...formData, [formData.objectType === 'STUDENT' ? 'studentName' : 'otherName']: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                          />
                        ) : (
                          <>
                            <select
                              required
                              disabled={modalMode === 'view'}
                              value={(formData.objectType === 'PARTNER' ? formData.partnerId : formData.employeeId) || ''}
                              onChange={e => setFormData({ ...formData, [formData.objectType === 'PARTNER' ? 'partnerId' : 'employeeId']: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none bg-white font-medium"
                              style={{ WebkitAppearance: 'none', MozAppearance: 'none' } as React.CSSProperties}
                            >
                              <option value="">Chọn...</option>
                              {formData.objectType === 'PARTNER'
                                ? partners
                                  .filter(p => {
                                    if (!formData.businessUnitId) return true;
                                    // Check if partner belongs to selected BU (many-to-many support)
                                    const hasSelectedBU = p.businessUnitId === formData.businessUnitId ||
                                      p.businessUnits?.some((bu: any) => bu.id === formData.businessUnitId) ||
                                      p.businessUnit?.name === businessUnits.find(bu => bu.id === formData.businessUnitId)?.name;
                                    return hasSelectedBU;
                                  })
                                  .map(p => <option key={p.id} value={p.id}>{p.partnerName}</option>)
                                : (
                                  <>
                                    {formData.businessUnitId && (
                                      <option value="ALL_IN_BU" className="font-bold text-blue-600">
                                        --- TẤT CẢ NHÂN VIÊN THUỘC {businessUnits.find(bu => bu.id === formData.businessUnitId)?.name.toUpperCase()} ---
                                      </option>
                                    )}
                                    {employees
                                      .filter(e => !formData.businessUnitId || e.businessUnitId === formData.businessUnitId || e.businessUnit === businessUnits.find(bu => bu.id === formData.businessUnitId)?.name)
                                      .map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)
                                    }
                                  </>
                                )
                              }
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                          </>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[13px] font-semibold text-gray-600 mb-1.5 flex items-center gap-2">
                        <span className="text-red-500 font-bold">*</span> Phương Thức Thanh Toán
                      </label>
                      <div className="relative">
                        <select
                          required
                          disabled={modalMode === 'view'}
                          value={formData.paymentMethodId || ''}
                          onChange={e => setFormData({ ...formData, paymentMethodId: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none bg-white font-medium"
                          style={{ WebkitAppearance: 'none', MozAppearance: 'none' } as React.CSSProperties}
                        >
                          {paymentMethods.map(pm => <option key={pm.id} value={pm.id}>{pm.name}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[13px] font-semibold text-gray-600 mb-1.5 flex items-center gap-2">
                        Trạng Thái Thanh Toán
                      </label>
                      <div className="relative">
                        <select
                          disabled={modalMode === 'view'}
                          value={formData.paymentStatus || 'UNPAID'}
                          onChange={e => setFormData({ ...formData, paymentStatus: e.target.value as any })}
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none bg-white"
                          style={{ WebkitAppearance: 'none', MozAppearance: 'none' } as React.CSSProperties}
                        >
                          <option value="UNPAID">Chưa thanh toán</option>
                          <option value="PAID">Đã thanh toán</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 3: SỐ TIỀN VÀ PHÂN BỔ CHI PHÍ */}
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="w-1 h-4 bg-blue-600 rounded-full"></span>
                    Số tiền {modalType !== 'INCOME' && modalType !== 'LOAN' && 'và phân bổ chi phí'}
                  </h3>
                  <div className="col-span-2">
                    <label className="block text-[13px] font-semibold text-gray-600 mb-1.5">
                      <span className="text-gray-400 font-bold mr-1">$</span> <span className="text-red-500 font-bold">*</span> Số Tiền (VND)
                    </label>
                    <div className="space-y-1">
                      <input
                        type="text"
                        required
                        disabled={modalMode === 'view'}
                        value={formData.amount !== undefined ? formatCurrency(formData.amount) : ''}
                        onChange={e => {
                          const rawValue = e.target.value.replace(/\./g, '').replace(/[^0-9]/g, '');
                          const numValue = rawValue ? parseInt(rawValue, 10) : 0;
                          setFormData({ ...formData, amount: numValue });
                        }}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg font-bold text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        placeholder="0"
                      />
                      <p className="text-[12px] italic text-gray-500">Số tiền gốc: {formData.amount || 0}</p>
                    </div>
                  </div>
                </div>
                {/* SECTION 4: HỢP ĐỒNG ĐÍNH KÈM */}
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="w-1 h-4 bg-blue-600 rounded-full"></span>
                    Hợp đồng đính kèm
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[13px] font-semibold text-gray-600 mb-2">Upload hình ảnh chứng từ</p>
                      <input
                        type="file"
                        multiple
                        ref={fileInputRef}
                        className="hidden"
                        onChange={e => {
                          if (e.target.files) {
                            setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                          }
                        }}
                      />
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group"
                      >
                        <Upload className="w-10 h-10 text-gray-300 group-hover:text-blue-500 transition-colors mb-3" />
                        <p className="text-sm font-semibold text-gray-700">Click để upload hoặc kéo thả file</p>
                        <p className="text-[11px] text-gray-400 mt-1">Hỗ trợ: JPG, PNG, PDF (Tối đa 10MB)</p>
                      </div>
                      {selectedFiles.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {selectedFiles.map((f, i) => (
                            <div key={i} className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-medium border border-blue-100">
                              <FileText className="w-3 h-3" />
                              <span className="max-w-[150px] truncate">{f.name}</span>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setSelectedFiles(prev => prev.filter((_, idx) => idx !== i)); }}
                                className="hover:text-red-500 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-[13px] font-semibold text-gray-600 mb-1.5 flex items-center gap-2">
                        Mô Tả / Ghi Chú
                      </label>
                      <textarea
                        rows={3}
                        disabled={modalMode === 'view'}
                        value={formData.description || ''}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                        placeholder="Nhập mô tả chi tiết..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-center gap-3 border-t pt-6">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-8 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold text-sm transition-colors min-w-[120px]"
                >
                  Hủy bỏ
                </button>
                {modalMode !== 'view' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleSubmit(null as any, 'DRAFT')}
                      className="px-8 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold text-sm transition-colors min-w-[120px] flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" /> Lưu nháp
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSubmit(null as any, 'PENDING')}
                      className="px-8 py-2 bg-[#004aad] text-white rounded-lg hover:bg-[#1557A0] font-semibold text-sm transition-colors min-w-[120px] flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" /> Gửi duyệt
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
