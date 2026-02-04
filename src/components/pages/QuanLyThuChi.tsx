import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
// Force re-compilation
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Plus, Eye, Edit2, Trash2, DollarSign, X, AlertCircle, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Save, Calendar, Building2, FileText, Paperclip, TrendingUp, TrendingDown, RefreshCw, ChevronDown, ChevronUp, User, Users, Upload, Printer, Send, CheckCircle, XCircle, Image as ImageIcon, ExternalLink, Briefcase, RotateCcw, Settings, GripVertical, Layers, Download, History } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import * as XLSX from 'xlsx';
import { uploadService } from '../../services/uploadService';
import { transactionService } from '../../services/transactionService';
import { categoryService } from '../../services/categoryService';
import { projectService } from '../../services/projectService';
import { partnerService } from '../../services/partnerService';
import { employeeService } from '../../services/employeeService';
import { businessUnitService } from '../../services/businessUnitService';
import { paymentMethodService } from '../../services/paymentMethodService';
import { allocationRuleService } from '../../services/allocationRuleService';
import { auditLogService } from '../../services/auditLogService';


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
  studentName?: string;
  otherName?: string;
  projectName?: string;
  amount: number;
  paymentMethodId?: string;
  paymentMethod?: { id: string; name: string };
  businessUnitId: string;
  businessUnit?: { id: string; name: string };
  paymentStatus: 'PAID' | 'UNPAID';
  approvalStatus: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  description: string;
  createdBy?: string;
  creator?: { name: string; fullName: string };
  attachments?: TransactionFile[];
  allocationRuleId?: string;
  isAdvance: boolean;
  costAllocation?: 'DIRECT' | 'INDIRECT';
  rejectionReason?: string;
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
  { id: 'actions_left', label: 'Hành động', sortable: false, align: 'center', width: 100, visible: true },
  { id: 'transactionDate', label: 'Ngày CT', sortable: true, align: 'left', width: 120, visible: true },
  { id: 'transactionCode', label: 'Mã GD', sortable: true, align: 'left', width: 120, visible: true },
  { id: 'businessUnit', label: 'Đơn vị', sortable: false, align: 'left', width: 150, visible: true },
  { id: 'transactionType', label: 'Loại', sortable: false, align: 'left', width: 100, visible: true },
  { id: 'objectName', label: 'Đối tượng', sortable: false, align: 'left', width: 150, visible: true },
  { id: 'project', label: 'Dự án', sortable: false, align: 'left', width: 150, visible: true },
  { id: 'amount', label: 'Số tiền', sortable: true, align: 'right', width: 140, visible: true },
  { id: 'paymentMethod', label: 'PT Thanh Toán', sortable: false, align: 'left', width: 140, visible: true },
  { id: 'attachments', label: 'Chứng từ', sortable: false, align: 'center', width: 100, visible: true },
  { id: 'paymentStatus', label: 'Trạng thái', sortable: false, align: 'left', width: 130, visible: true },
  { id: 'approvalStatus', label: 'Phê duyệt', sortable: false, align: 'left', width: 130, visible: true },
  { id: 'creator', label: 'Người tạo', sortable: false, align: 'left', width: 140, visible: true },
  { id: 'description', label: 'Ghi chú', sortable: false, align: 'left', width: 250, visible: true },
];

export function QuanLyThuChi() {
  const { selectedBU, canSelectBU, currentUser } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  // States
  const [transactions, setTransactions] = useState<Transaction[]>([]); // Filtered transactions for display
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]); // All transactions for KPI stats
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
  const [sortField, setSortField] = useState<SortField | null>('transactionCode');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  // Columns
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);
  const [showFilters, setShowFilters] = useState(true);
  const [highlightedTxnId, setHighlightedTxnId] = useState<string | null>(null);
  const tableRef = React.useRef<HTMLTableElement>(null);

  // Audit Log States
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());


  // Load columns from localStorage on mount
  useEffect(() => {
    const savedColumns = localStorage.getItem('thuChiColumns');
    if (savedColumns) {
      try {
        const parsed = JSON.parse(savedColumns);
        // Sync logic: Keep user's order/visibility but add any new columns from DEFAULT_COLUMNS
        const existingIds = new Set(parsed.map((c: ColumnConfig) => c.id));
        const newColumns = [...parsed];

        DEFAULT_COLUMNS.forEach(defaultCol => {
          if (!existingIds.has(defaultCol.id)) {
            // Append new column to the end before 'actions' if possible
            const actionsIndex = newColumns.findIndex(c => c.id === 'actions');
            if (actionsIndex !== -1) {
              newColumns.splice(actionsIndex, 0, defaultCol);
            } else {
              newColumns.push(defaultCol);
            }
          }
        });

        // Filter out columns that are no longer in DEFAULT_COLUMNS (e.g., actions_right, actions, costAllocation)
        const activeIds = new Set(DEFAULT_COLUMNS.map(c => c.id));
        const filtered = newColumns.filter((col: ColumnConfig) => activeIds.has(col.id));
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

  const formatNumber = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  const toggleNote = (id: string) => {
    setExpandedNotes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderDescription = (txn: Transaction) => {
    if (!txn.description) return '-';
    const words = txn.description.trim().split(/\s+/);
    const isExpanded = expandedNotes.has(txn.id);

    if (words.length <= 6) return txn.description;

    if (isExpanded) {
      return (
        <div className="text-gray-700">
          {txn.description}
          <button
            onClick={() => toggleNote(txn.id)}
            className="ml-1 text-blue-600 hover:text-blue-800 font-medium text-[11px] underline"
          >
            Thu gọn
          </button>
        </div>
      );
    }

    return (
      <div className="text-gray-700">
        {words.slice(0, 6).join(' ')}
        <button
          onClick={() => toggleNote(txn.id)}
          className="ml-1 text-blue-600 hover:text-blue-800 font-medium text-[11px] underline"
        >
          ...Thêm
        </button>
      </div>
    );
  };

  // Fetch Data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Prepare filters for API (for filtered transactions)
      const apiFilters: any = {};
      // Use filterBU for local filtering (not selectedBU from global context)
      if (filterBU !== 'all') apiFilters.buId = filterBU;
      if (filterType !== 'all') apiFilters.type = filterType;
      if (filterStatus !== 'all') apiFilters.status = filterStatus;
      // Date filters
      const range = getTransactionRange(timeRange);
      if (range) {
        apiFilters.dateFrom = range.start.toISOString();
        apiFilters.dateTo = range.end.toISOString();
      }

      // Prepare filters for ALL transactions (for KPI stats - only BU and date filters)
      const allApiFilters: any = {};
      if (filterBU !== 'all') allApiFilters.buId = filterBU;
      if (range) {
        allApiFilters.dateFrom = range.start.toISOString();
        allApiFilters.dateTo = range.end.toISOString();
      }

      const [txns, allTxns, cats, prjs, pts, emps, bus, pms, rules] = await Promise.all([
        transactionService.getAll(apiFilters), // Filtered transactions
        transactionService.getAll(allApiFilters), // All transactions for KPI
        categoryService.getAll(),
        projectService.getAll(),
        partnerService.getAll(),
        employeeService.getAll(),
        businessUnitService.getAll(),
        paymentMethodService.getAll(),
        allocationRuleService.getAll()
      ]);

      setTransactions(txns);
      setAllTransactions(allTxns); // Store all transactions for KPI calculation
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
  }, [filterBU, filterType, filterStatus, timeRange, customStartDate, customEndDate]);

  // Sync filterBU with selectedBU from global context (header)
  useEffect(() => {
    setFilterBU(selectedBU);
  }, [selectedBU]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle direct link to a transaction from notification - Highlight instead of modal
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const highlightId = params.get('highlight');

    console.log('Highlight effect triggered:', { highlightId, loading, transactionsCount: transactions.length });

    if (!highlightId || loading) return;

    const processHighlight = async () => {
      console.log('Processing highlight for transaction:', highlightId);

      // First, try to find in current transactions
      let txn = transactions.find(t => t.id === highlightId);

      // If not found in filtered list, it might be due to date/BU/type filters
      if (!txn) {
        console.log('Transaction not found in current list, fetching details...');
        try {
          // Fetch the full transaction data to know its date and BU
          txn = await transactionService.getById(highlightId);
          console.log('Transaction details fetched:', !!txn, txn?.transactionCode);

          if (txn) {
            // Check if we need to adjust filters
            let needsReload = false;

            // 1. BU Filter
            if (filterBU !== 'all' && filterBU !== txn.businessUnitId) {
              console.log('Adjusting BU filter');
              setFilterBU(txn.businessUnitId);
              needsReload = true;
            }

            // 2. Type Filter
            if (filterType !== 'all' && filterType !== txn.transactionType) {
              console.log('Adjusting Type filter');
              setFilterType(txn.transactionType);
              needsReload = true;
            }

            // 3. Status Filter (Hide REJECTED transactions? No, show all if highlighting)
            if (filterStatus !== 'all' && txn.approvalStatus !== filterStatus) {
              console.log('Adjusting Status filter');
              setFilterStatus('all');
              needsReload = true;
            }

            // 4. Date Filter - CRITICAL FIX
            const range = getTransactionRange(timeRange);
            const txnDate = new Date(txn.transactionDate);
            if (!range || txnDate < range.start || txnDate > range.end) {
              console.log('Adjusting Date filter to include transaction date:', txn.transactionDate);
              setTimeRange('CUSTOM');
              // Set range to just this day
              setCustomStartDate(txn.transactionDate.split('T')[0]);
              setCustomEndDate(txn.transactionDate.split('T')[0]);
              needsReload = true;
            }

            // 5. Search Filter
            if (searchTerm !== '') {
              console.log('Clearing search term');
              setSearchTerm('');
              setDebouncedSearch('');
              needsReload = true;
            }

            if (needsReload) {
              console.log('Filters adjusted, waiting for reload...');
              // The effect will run again after fetchData completes
              return;
            }
          }
        } catch (err) {
          console.error('Error fetching transaction for highlighting:', err);
        }
      }

      if (txn) {
        console.log('Transaction found or filters already correct:', txn.transactionCode);

        // Ensure search is clear even if txn was found (to avoid confusion)
        if (searchTerm !== '') {
          setSearchTerm('');
          setDebouncedSearch('');
        }
        // Apply the same filtering and sorting logic as the table
        const filtered = transactions.filter(t => {
          if (t.approvalStatus === 'REJECTED') return false;

          const searchLower = debouncedSearch.toLowerCase();
          const matchCode = t.transactionCode?.toLowerCase().includes(searchLower);
          const matchDesc = t.description?.toLowerCase().includes(searchLower);
          const matchPartner = t.partner?.partnerName?.toLowerCase().includes(searchLower);
          const matchEmployee = t.employee?.fullName?.toLowerCase().includes(searchLower);
          return matchCode || matchDesc || matchPartner || matchEmployee;
        });

        const sorted = [...filtered].sort((a, b) => {
          if (!sortField || !sortOrder) {
            if (filterType === 'all') {
              return new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime();
            }
            return (a.transactionCode || '').localeCompare(b.transactionCode || '');
          }

          let valA: any = (a as any)[sortField];
          let valB: any = (b as any)[sortField];
          if (sortField === 'transactionDate') {
            valA = new Date(valA).getTime();
            valB = new Date(valB).getTime();
          }
          if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
          if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
          return 0;
        });

        const txnIndex = sorted.findIndex(t => t.id === highlightId);
        console.log('Transaction index:', txnIndex, 'Page size:', itemsPerPage);

        if (txnIndex !== -1) {
          const pageNumber = Math.floor(txnIndex / itemsPerPage) + 1;
          if (pageNumber !== currentPage) {
            console.log('Navigating to page:', pageNumber);
            setCurrentPage(pageNumber);
          }

          setHighlightedTxnId(highlightId);

          // Scroll after render
          setTimeout(() => {
            const rowElement = document.getElementById(`txn-row-${highlightId}`);
            if (rowElement) {
              rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 500);

          // Remove highlight after animation
          setTimeout(() => setHighlightedTxnId(null), 5000);
        }
      } else {
        console.log('Transaction not found anywhere or after adjustment');
      }

      // Clean up URL to prevent infinite loop
      navigate(location.pathname, { replace: true });
    };

    processHighlight();
  }, [location.search, loading, transactions.length]);

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
          const customStart = new Date(customStartDate);
          const customEnd = new Date(customEndDate);
          customStart.setHours(0, 0, 0, 0);
          customEnd.setHours(23, 59, 59, 999);
          return {
            start: customStart,
            end: customEnd
          };
        }
        // If custom dates not set, default to current month
        start.setDate(1);
        end.setMonth(now.getMonth() + 1, 0);
        break;
      default:
        return null;
    }
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  };

  // Filter Logic (Client Side for Search Text)
  const filteredTransactions = transactions.filter(txn => {
    // Exclude REJECTED transactions from the list
    if (txn.approvalStatus === 'REJECTED') return false;

    const searchLower = debouncedSearch.toLowerCase();
    const matchCode = txn.transactionCode?.toLowerCase().includes(searchLower);
    const matchDesc = txn.description?.toLowerCase().includes(searchLower);
    const matchPartner = txn.partner?.partnerName?.toLowerCase().includes(searchLower);
    const matchEmployee = txn.employee?.fullName?.toLowerCase().includes(searchLower);

    return matchCode || matchDesc || matchPartner || matchEmployee;
  });

  // Sorting - Flexible based on user selection
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    if (!sortField || !sortOrder) return 0;

    let valA: any = (a as any)[sortField];
    let valB: any = (b as any)[sortField];

    // Handle nested values if needed (though current sortField items are top-level)
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
    const selectedBUId = (selectedBU !== 'all' ? selectedBU : (businessUnits.length > 0 ? businessUnits[0].id : ''));
    const bu = businessUnits.find(b => b.id === selectedBUId);
    const buCode = bu?.code || 'BU';

    const typePrefix = type === 'INCOME' ? 'PT' : type === 'EXPENSE' ? 'PC' : 'PV';
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(-2);
    const tempCode = `${buCode}_${typePrefix}${mm}${yy}_001`;

    setModalMode('create');
    setModalType(type);
    setSelectedFiles([]);
    setFormData({
      transactionCode: tempCode,
      transactionType: type,
      transactionDate: now.toISOString().split('T')[0],
      amount: 0,
      paymentStatus: 'UNPAID',
      approvalStatus: 'APPROVED',
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
    setSelectedTransaction(txn);
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

  const handleSubmit = async (e: React.FormEvent) => {
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

      // 1. Validation for Description and Attachments (Mandatory)
      if (!formData.description || formData.description.trim() === '') {
        alert('Vui lòng nhập mô tả chi tiết cho phiếu');
        setLoading(false);
        return;
      }

      if (selectedFiles.length === 0 && (!formData.attachments || formData.attachments.length === 0)) {
        alert('Vui lòng upload ít nhất một hình ảnh chứng từ đính kèm');
        setLoading(false);
        return;
      }

      // 2. Upload files first if any
      let uploadedAttachments = [];
      if (selectedFiles.length > 0) {
        uploadedAttachments = await uploadService.uploadFiles(selectedFiles);
      }

      // Merge existing attachments and newly uploaded ones
      const existingAttachments = formData.attachments || [];
      const allAttachments = [...existingAttachments, ...uploadedAttachments].map(att => ({
        fileName: att.fileName,
        fileSize: att.fileSize,
        fileType: att.fileType,
        fileUrl: att.fileUrl
      }));

      // 2. Prepare Payload (Force DIRECT allocation)
      const payload: any = {
        ...formData,
        costAllocation: 'DIRECT',
        allocationRuleId: undefined,
        transactionDate: formData.transactionDate
          ? new Date(formData.transactionDate).toISOString()
          : new Date().toISOString(), // Default to today if not set
        amount: Number(formData.amount),
        approvalStatus: 'APPROVED',
        attachments: allAttachments.length > 0 ? allAttachments : undefined,
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

  const handleDownloadFile = async (fileUrl: string, fileName: string) => {
    try {
      const absoluteUrl = uploadService.getAbsoluteUrl(fileUrl);
      console.log('Downloading file from:', absoluteUrl);
      const response = await fetch(absoluteUrl);

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert('Không thể tải xuống file. Vui lòng thử lại sau.');
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
    const labels: { [key: string]: string } = {
      'DRAFT': 'Nháp',
      'PENDING': 'Chờ duyệt',
      'APPROVED': 'Đã duyệt',
      'REJECTED': 'Từ chối',
      'CANCELLED': 'Đã hủy'
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${(styles as any)[status] || ''}`}>{labels[status] || status}</span>;
  };

  // Handle view audit log
  const handleViewAuditLog = async () => {
    if (!selectedTransaction) return;

    setLoadingLogs(true);
    try {
      const logs = await auditLogService.getTransactionLogs(selectedTransaction.id);
      setAuditLogs(logs);
      setShowAuditLog(true);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
      alert('Không thể tải lịch sử thay đổi');
    } finally {
      setLoadingLogs(false);
    }
  };

  // Handle close audit log modal and clear cache
  const handleCloseAuditLog = () => {
    setShowAuditLog(false);
    setAuditLogs([]); // Clear cache to prevent showing wrong logs
  };

  // Export to Excel function
  const handleExportExcel = () => {
    try {
      // Determine report title based on filter type
      let reportTitle = 'BẢNG TỔNG HỢP THU CHI';
      let sheetName = 'Tổng hợp';

      if (filterType === 'income') {
        reportTitle = 'BẢNG TỔNG HỢP DOANH THU';
        sheetName = 'Doanh thu';
      } else if (filterType === 'expense') {
        reportTitle = 'BẢNG TỔNG HỢP CHI PHÍ';
        sheetName = 'Chi phí';
      } else if (filterType === 'loan') {
        reportTitle = 'BẢNG TỔNG HỢP KHOẢN VAY';
        sheetName = 'Khoản vay';
      }

      // Get date range from filtered data
      let dateRangeText = '';
      if (sortedTransactions.length > 0) {
        const dates = sortedTransactions.map(t => new Date(t.transactionDate));
        const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
        const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
        dateRangeText = `Từ ngày ${minDate.toLocaleDateString('vi-VN')} đến ngày ${maxDate.toLocaleDateString('vi-VN')}`;
      } else {
        dateRangeText = `Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`;
      }

      // Prepare data for export with accounting format
      const exportData = sortedTransactions.map((txn, index) => ({
        'STT': index + 1,
        'Ngày chứng từ': new Date(txn.transactionDate).toLocaleDateString('vi-VN'),
        'Số chứng từ': txn.transactionCode,
        'Diễn giải': txn.description || '-',
        'Danh mục': txn.category?.name || '-',
        'Đối tượng': getObjectName(txn) || '-',
        'Dự án': txn.project?.name || '-',
        'Đơn vị (BU)': txn.businessUnit?.name || '-',
        'Số tiền (VNĐ)': txn.amount,
        'Phương thức thanh toán': txn.paymentMethod?.name || '-',
        'Trạng thái thanh toán': txn.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán',
        'Người tạo': txn.creator?.fullName || txn.creator?.name || 'Hệ thống',
        'Trạng thái duyệt': txn.approvalStatus === 'DRAFT' ? 'Nháp' :
          txn.approvalStatus === 'PENDING' ? 'Chờ duyệt' :
            txn.approvalStatus === 'APPROVED' ? 'Đã duyệt' :
              txn.approvalStatus === 'REJECTED' ? 'Từ chối' : 'Đã hủy',
        'Phân bổ chi phí': txn.costAllocation === 'DIRECT' ? 'Trực tiếp' : 'Gián tiếp'
      }));

      // Calculate totals
      const totalAmount = sortedTransactions.reduce((sum, txn) => sum + txn.amount, 0);
      const paidAmount = sortedTransactions.filter(t => t.paymentStatus === 'PAID').reduce((sum, t) => sum + t.amount, 0);
      const unpaidAmount = sortedTransactions.filter(t => t.paymentStatus === 'UNPAID').reduce((sum, t) => sum + t.amount, 0);

      // Create workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([]);

      // Add title (row 1)
      XLSX.utils.sheet_add_aoa(ws, [[reportTitle]], { origin: 'A1' });

      // Add date range (row 2)
      XLSX.utils.sheet_add_aoa(ws, [[dateRangeText]], { origin: 'A2' });

      // Add empty row (row 3)

      // Add data starting from row 4
      XLSX.utils.sheet_add_json(ws, exportData, { origin: 'A4', skipHeader: false });

      // Add summary section
      const summaryStartRow = 4 + exportData.length + 2;
      XLSX.utils.sheet_add_aoa(ws, [
        ['TỔNG KẾT'],
        ['Tổng số giao dịch:', sortedTransactions.length],
        ['Tổng số tiền:', totalAmount],
        ['Đã thanh toán:', paidAmount],
        ['Chưa thanh toán:', unpaidAmount]
      ], { origin: `A${summaryStartRow}` });

      // Set column widths
      ws['!cols'] = [
        { wch: 5 },  // STT
        { wch: 12 }, // Ngày chứng từ
        { wch: 15 }, // Số chứng từ
        { wch: 35 }, // Diễn giải
        { wch: 20 }, // Danh mục
        { wch: 25 }, // Đối tượng
        { wch: 20 }, // Dự án
        { wch: 15 }, // Đơn vị (BU)
        { wch: 18 }, // Số tiền
        { wch: 20 }, // Phương thức TT
        { wch: 18 }, // Trạng thái TT
        { wch: 20 }, // Người tạo
        { wch: 15 }, // Trạng thái duyệt
        { wch: 15 }  // Phân bổ
      ];

      // Merge cells for title and date range
      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 12 } }, // Title row
        { s: { r: 1, c: 0 }, e: { r: 1, c: 12 } }  // Date range row
      ];

      // Style title (bold, centered, larger font)
      if (!ws['A1'].s) ws['A1'].s = {};
      ws['A1'].s = {
        font: { bold: true, sz: 16 },
        alignment: { horizontal: 'center', vertical: 'center' }
      };

      // Style date range
      if (!ws['A2'].s) ws['A2'].s = {};
      ws['A2'].s = {
        font: { italic: true, sz: 11 },
        alignment: { horizontal: 'center', vertical: 'center' }
      };

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, sheetName);

      // Generate filename
      const today = new Date().toLocaleDateString('vi-VN').replace(/\//g, '-');
      const filename = `${sheetName}_${today}.xlsx`;

      // Save file
      XLSX.writeFile(wb, filename);
    } catch (error) {
      console.error('Export Excel error:', error);
      alert('Có lỗi xảy ra khi xuất file Excel');
    }
  };

  // Calculate Summary Stats - Only include PAID transactions for totals, exclude REJECTED/CANCELLED
  const stats = React.useMemo(() => {
    // KPI only counts PAID transactions
    const paidTxns = allTransactions.filter(t =>
      t.paymentStatus === 'PAID' &&
      t.approvalStatus !== 'CANCELLED' &&
      t.approvalStatus !== 'REJECTED'
    );

    const income = paidTxns.filter(t => t.transactionType === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
    const expense = paidTxns.filter(t => t.transactionType === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);
    const debt = paidTxns.filter(t => t.transactionType === 'LOAN').reduce((sum, t) => sum + t.amount, 0);

    return {
      income,
      expense,
      balance: income - expense,
      debt
    };
  }, [allTransactions]);

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
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm theo Mã GD, Đối tượng, Danh mục, Dự án..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200">
                  {[
                    { label: 'Tuần này', value: 'WEEK' },
                    { label: 'Tháng này', value: 'MONTH' },
                    { label: 'Quý này', value: 'QUARTER' },
                    { label: 'Năm này', value: 'YEAR' },
                    { label: 'Tùy chỉnh', value: 'CUSTOM' }
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
                  onClick={() => {
                    setSearchTerm('');
                    setFilterStatus('all');
                    setFilterType('all');
                    setFilterBU('all');
                    setTimeRange('MONTH');
                    setCustomStartDate('');
                    setCustomEndDate('');
                  }}
                  className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Custom Date Range Picker - Show when CUSTOM is selected */}
            {timeRange === 'CUSTOM' && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">Chọn khoảng thời gian:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Từ ngày:</label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={e => setCustomStartDate(e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Đến ngày:</label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={e => setCustomEndDate(e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons Row */}
            <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={handleExportExcel}
                className="px-4 py-2 bg-[#004aad] text-white rounded-lg text-sm font-medium hover:bg-[#1557A0] flex items-center gap-2 shadow-sm"
              >
                <Download className="w-4 h-4" /> Xuất Excel
              </button>
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
            <table className="w-full" ref={tableRef}>
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {columns.filter(c => c.visible).map((col, idx) => (
                    <DraggableColumnHeader key={col.id} column={col} index={idx} />
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedTransactions.map((txn) => {
                  const isHighlighted = highlightedTxnId === txn.id;
                  return (
                    <tr
                      key={txn.id}
                      id={`txn-row-${txn.id}`}
                      className={`transition-all duration-300 ${isHighlighted
                        ? 'bg-yellow-100 animate-pulse-slow'
                        : 'hover:bg-gray-50'
                        }`}
                      style={isHighlighted ? {
                        animation: 'highlight-flash 2s ease-in-out 2',
                        boxShadow: '0 0 20px rgba(251, 191, 36, 0.5)'
                      } : {}}
                    >
                      {columns.filter(c => c.visible).map(col => {
                        if (col.id === 'transactionDate') return <td className="px-6 py-4 text-sm text-gray-600">{formatDate(txn.transactionDate)}</td>;
                        if (col.id === 'transactionCode') return (
                          <td className={`px-6 py-4 text-sm font-medium ${isHighlighted
                            ? 'text-blue-900 font-bold animate-pulse'
                            : 'text-blue-700'
                            }`}>
                            {txn.transactionCode}
                          </td>
                        );
                        if (col.id === 'description') return (
                          <td className="px-6 py-4 text-sm max-w-[300px]">
                            {renderDescription(txn)}
                          </td>
                        );
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
                        if (col.id === 'attachments') return (
                          <td className="px-6 py-4 text-center">
                            {txn.attachments && txn.attachments.length > 0 ? (
                              <div className="flex items-center justify-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded-md border border-blue-100" title={`${txn.attachments.length} chứng từ đính kèm`}>
                                <Paperclip className="w-3.5 h-3.5" />
                                <span className="text-[11px] font-bold">{txn.attachments.length}</span>
                              </div>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                        );
                        if (col.id === 'paymentStatus') return <td className="px-6 py-4 text-sm text-gray-700">
                          <span>
                            {txn.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                          </span>
                        </td>;
                        if (col.id === 'approvalStatus') return <td className="px-6 py-4">{getStatusBadge(txn.approvalStatus)}</td>;
                        if (col.id === 'creator') return (
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {txn.creator?.fullName || txn.creator?.name || 'Hệ thống'}
                          </td>
                        );
                        if (col.id === 'actions_left' || col.id === 'actions_right' || col.id === 'actions') return (
                          <td className="px-6 py-4 text-center">
                            <div className="flex justify-center gap-2">
                              <button onClick={() => handleView(txn)} className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors" title="Xem chi tiết"><Eye className="w-4 h-4" /></button>
                              {(() => {
                                // Admin and CEO can edit/delete approved transactions
                                const userRole = currentUser?.role?.toLowerCase();
                                const canEditApproved = userRole === 'admin' || userRole === 'ceo';
                                const canEdit = txn.approvalStatus !== 'APPROVED' || canEditApproved;

                                if (canEdit) {
                                  return (
                                    <>
                                      <button onClick={() => handleEdit(txn)} className="p-1.5 hover:bg-orange-50 text-orange-600 rounded-lg transition-colors" title="Chỉnh sửa"><Edit2 className="w-4 h-4" /></button>
                                      <button onClick={() => handleDelete(txn.id)} className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition-colors" title="Xóa"><Trash2 className="w-4 h-4" /></button>
                                    </>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          </td>
                        );
                        return <td className="px-6 py-4">-</td>;
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between bg-white rounded-b-xl">
            <div className="text-sm text-gray-600">
              Hiển thị <span className="font-semibold">{startIndex + 1}</span> - <span className="font-semibold">{Math.min(endIndex, sortedTransactions.length)}</span> trong tổng số <span className="font-semibold">{sortedTransactions.length}</span> giao dịch
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Trang trước"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${currentPage === page
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
                title="Trang sau"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalMode && (
        <div
          className={`fixed inset-0 bg-black/40 z-[999998] flex items-center justify-center p-4 transition-all animate-in fade-in duration-300 ${showAuditLog ? 'opacity-30 pointer-events-none blur-[2px]' : 'opacity-100'}`}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="border-b border-gray-200 px-6 py-5 flex items-start justify-between bg-white">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  {modalMode === 'create' ? `Tạo Phiếu ${modalType === 'INCOME' ? 'Thu' : modalType === 'EXPENSE' ? 'Chi' : 'Vay'} Mới` :
                    modalMode === 'edit' ? 'Chỉnh Sửa Giao Dịch' : 'Chi Tiết Giao Dịch'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">Vui lòng điền đầy đủ thông tin bắt buộc (*)</p>
              </div>
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6">
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
                        <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase flex items-center gap-2">
                          <FileText className="w-4 h-4 text-primary" />
                          Mã Giao Dịch (Tự Động)
                        </label>
                        <input
                          type="text"
                          value={formData.transactionCode}
                          disabled
                          placeholder="BU_PT0126_001"
                          className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 font-mono text-sm"
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
                      </div>
                      <div>
                        <label className="block text-[13px] font-semibold text-gray-600 mb-1.5 flex items-center gap-2">
                          <span className="text-red-500 font-bold">*</span> {
                            formData.objectType === 'PARTNER' ? 'Đối tác' :
                              formData.objectType === 'EMPLOYEE' ? 'Nhân viên' :
                                formData.objectType === 'STUDENT' ? 'Học viên' :
                                  'Đối tượng khác'
                          }
                        </label>
                        <div className="relative">
                          {formData.objectType === 'STUDENT' || formData.objectType === 'OTHER' ? (
                            <input
                              type="text"
                              required
                              disabled={modalMode === 'view'}
                              placeholder={formData.objectType === 'STUDENT' ? "Nhập tên học viên..." : "Nhập tên đối tượng..."}
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
                      <div className="relative">
                        <input
                          type="text"
                          required
                          disabled={modalMode === 'view'}
                          value={formData.amount !== undefined ? formatNumber(formData.amount) : ''}
                          onChange={e => {
                            const rawValue = e.target.value.replace(/\./g, '').replace(/[^0-9]/g, '');
                            const numValue = rawValue ? parseInt(rawValue, 10) : 0;
                            setFormData({ ...formData, amount: numValue });
                          }}
                          className="w-full pl-4 pr-10 py-2 border border-gray-200 rounded-lg font-bold text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                          placeholder="0"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">
                          đ
                        </div>
                      </div>
                      <p className="text-[12px] italic text-gray-500 mt-1">Số tiền gốc: {formData.amount || 0}</p>
                    </div>
                  </div>
                  {/* SECTION 4: HỢP ĐỒNG ĐÍNH KÈM */}
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <span className="w-1 h-4 bg-blue-600 rounded-full"></span>
                      Hợp đồng đính kèm
                    </h3>
                    <div className="space-y-4">
                      {/* Display existing attachments */}
                      {formData.attachments && formData.attachments.length > 0 && (
                        <div className="mb-4">
                          <p className="text-[13px] font-semibold text-gray-600 mb-2 flex items-center gap-2">
                            <Paperclip className="w-4 h-4 text-blue-600" />
                            Chứng từ đã đính kèm:
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {formData.attachments.map((file, idx) => (
                              <div key={file.id || idx} className="relative group border rounded-lg overflow-hidden bg-gray-50 flex flex-col">
                                <div className="aspect-video bg-gray-200 flex items-center justify-center overflow-hidden">
                                  {file.fileType.startsWith('image/') ? (
                                    <img
                                      src={uploadService.getAbsoluteUrl(file.fileUrl)}
                                      alt={file.fileName}
                                      className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                    />
                                  ) : (
                                    <FileText className="w-10 h-10 text-gray-400" />
                                  )}
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const viewerUrl = `/document-viewer?url=${encodeURIComponent(uploadService.getAbsoluteUrl(file.fileUrl))}&name=${encodeURIComponent(file.fileName)}&type=${encodeURIComponent(file.fileType)}`;
                                        window.open(viewerUrl, '_blank');
                                      }}
                                      className="p-2 bg-white rounded-full text-blue-600 hover:bg-blue-50 transition-colors"
                                      title="Xem trước"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDownloadFile(file.fileUrl, file.fileName)}
                                      className="p-2 bg-white rounded-full text-green-600 hover:bg-green-50 transition-colors"
                                      title="Tải xuống"
                                    >
                                      <Download className="w-4 h-4" />
                                    </button>
                                    {modalMode !== 'view' && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const newAttachments = formData.attachments?.filter((_, i) => i !== idx);
                                          setFormData({ ...formData, attachments: newAttachments });
                                        }}
                                        className="p-2 bg-white rounded-full text-red-600 hover:bg-red-50 transition-colors"
                                        title="Xóa"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                                <div className="p-2 bg-white border-t">
                                  <p className="text-xs font-medium text-gray-700 truncate" title={file.fileName}>
                                    {file.fileName}
                                  </p>
                                  <p className="text-[10px] text-gray-500">
                                    {(file.fileSize / 1024).toFixed(1)} KB
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Upload UI - Only show if not in view mode */}
                      {modalMode !== 'view' && (
                        <div>
                          <p className="text-[13px] font-semibold text-gray-600 mb-2 flex items-center gap-2">
                            <ImageIcon className="w-4 h-4 text-blue-600" />
                            Upload hình ảnh chứng từ mới <span className="text-red-500">*</span>
                          </p>
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
                      )}

                      <div>
                        <label className="block text-[13px] font-semibold text-gray-700 mb-1.5 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-600" />
                          Mô Tả / Ghi Chú <span className="text-red-500">*</span>
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
              </div>

              {/* Modal Footer */}
              <div className="border-t border-gray-200 px-6 py-4 flex justify-center gap-3 bg-white">
                {modalMode === 'edit' && (
                  <button
                    type="button"
                    onClick={handleViewAuditLog}
                    disabled={loadingLogs}
                    className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors flex items-center gap-2 min-w-[140px] justify-center"
                  >
                    <History className="w-4 h-4" />
                    {loadingLogs ? 'Đang tải...' : 'Lịch sử'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-8 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors min-w-[140px]"
                >
                  {modalMode === 'view' ? 'Đóng' : 'Hủy bỏ'}
                </button>
                {modalMode !== 'view' && (
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-2.5 bg-[#004aad] text-white rounded-lg hover:bg-[#1557A0] font-medium text-sm transition-colors min-w-[140px] flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {loading ? 'Đang lưu...' : (modalMode === 'edit' ? 'Cập nhật' : 'Xác nhận')}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Audit Log Modal */}
      {showAuditLog && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-[999999] animate-in fade-in duration-300"
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="border-b border-gray-200 px-6 py-5 flex items-start justify-between bg-white">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  Lịch sử thay đổi
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Mã phiếu: {selectedTransaction?.transactionCode}
                </p>
              </div>
              <button
                onClick={handleCloseAuditLog}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Area */}
            <div className="overflow-y-auto max-h-[calc(90vh-180px)] px-6 py-6 bg-white">
              {auditLogs.length === 0 ? (
                <div className="text-center py-20 flex flex-col items-center justify-center gap-4 opacity-50">
                  <History className="w-12 h-12 text-gray-300" />
                  <p className="text-gray-500 font-medium">Phiếu này chưa có lịch sử thay đổi.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="relative pl-6 border-l-2 border-blue-500 pb-2 last:pb-0">
                      {/* Timeline dot */}
                      <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-sm"></div>

                      {/* Log entry content */}
                      <div className="bg-slate-50/50 rounded-xl p-5 border border-slate-100">
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#004aad]/10 flex items-center justify-center text-[#004aad] font-bold">
                              {log.user?.fullName?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{log.user?.fullName}</p>
                              <p className="text-xs text-gray-500">{new Date(log.createdAt).toLocaleString('vi-VN')}</p>
                            </div>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${log.action === 'UPDATE' ? 'bg-blue-100 text-blue-700' :
                            log.action === 'APPROVE' ? 'bg-green-100 text-green-700' :
                              log.action === 'REJECT' ? 'bg-red-100 text-red-700' :
                                'bg-gray-100 text-gray-700'
                            }`}>
                            {log.action === 'UPDATE' ? 'Chỉnh sửa' :
                              log.action === 'APPROVE' ? 'Phê duyệt' :
                                log.action === 'REJECT' ? 'Từ chối' : log.action}
                          </span>
                        </div>

                        {/* Changes */}
                        {log.changes && Object.keys(log.changes).length > 0 && (
                          <div className="space-y-3 bg-white p-4 rounded-lg border border-slate-100 shadow-sm">
                            {Object.entries(log.changes).map(([key, value]: [string, any]) => {
                              const fieldLabels: { [key: string]: string } = {
                                'amount': 'Số tiền',
                                'description': 'Diễn giải',
                                'transactionDate': 'Ngày giao dịch',
                                'categoryId': 'Danh mục',
                                'projectId': 'Dự án',
                                'partnerId': 'Đối tác',
                                'employeeId': 'Nhân viên',
                                'paymentMethodId': 'Phương thức TT',
                                'paymentStatus': 'Trạng thái TT',
                                'approvalStatus': 'Trạng thái duyệt',
                                'costAllocation': 'Phân bổ'
                              };
                              const label = fieldLabels[key] || key;
                              const formatVal = (v: any) => {
                                if (v === null || v === undefined) return '---';
                                if (key === 'amount') return formatCurrency(Number(v));
                                if (key === 'transactionDate') return new Date(v).toLocaleDateString('vi-VN');
                                return String(v);
                              };

                              return (
                                <div key={key} className="grid grid-cols-12 gap-2 text-sm items-center border-b border-dashed border-gray-100 pb-2 last:border-0 last:pb-0">
                                  <div className="col-span-3 font-medium text-gray-500">{label}:</div>
                                  <div className="col-span-9 flex items-center gap-2">
                                    <span className="text-gray-400 line-through truncate max-w-[150px]">{formatVal(value.old)}</span>
                                    <span className="text-gray-400">→</span>
                                    <span className="text-[#004aad] font-bold">{formatVal(value.new)}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {log.reason && (
                          <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-100">
                            <p className="text-xs text-red-800 font-bold mb-1">Lý do từ chối:</p>
                            <p className="text-sm text-red-700 italic">"{log.reason}"</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 px-6 py-4 flex justify-center bg-white">
              <button
                onClick={handleCloseAuditLog}
                className="px-10 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium min-w-[140px]"
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
