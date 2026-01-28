import React, { useState, useEffect } from 'react';
import { Search, Plus, Eye, Edit2, Ban, Users, X, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, FileText, Phone, Mail, Building2, Trash2, AlertCircle } from 'lucide-react';
import { useDraggableColumns, DraggableColumnHeader, ColumnConfig } from '../hooks/useDraggableColumns';
import { partnerService } from '../../services/partnerService';
import { paymentMethodService } from '../../services/paymentMethodService';
import { useApp } from '../../contexts/AppContext';

interface BankAccount {
  id?: string;
  accountNumber: string;
  bankName: string;
  branch: string;
  swiftCode: string;
  isDefault: boolean;
}

interface Contract {
  id?: string;
  contractNumber: string;
  signDate: string; // ISO string or DD/MM/YYYY
  expiryDate: string;
  value: number;
  fileName: string;
}

interface PaymentMethod {
  id: string;
  name: string;
}

interface Partner {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerType: 'CUSTOMER' | 'SUPPLIER' | 'BOTH';
  taxCode: string;
  phone: string;
  contactPerson: string;
  status: 'ACTIVE' | 'INACTIVE';
  address: string;
  email: string;
  representativeName: string;
  representativeTitle: string;
  representativePhone: string;
  bankAccounts: BankAccount[];
  paymentMethodId: string | null;
  paymentMethod?: PaymentMethod;
  businessUnitIds?: string[];
  businessUnits?: { id: string, name: string }[];
  paymentTerm: number;
  contracts: Contract[];
  balance: number;
}

type SortField = 'partnerId' | 'partnerName' | 'taxCode';
type SortOrder = 'asc' | 'desc' | null;
type ModalMode = 'create' | 'view' | 'edit' | null;

export function QuanLyDoiTac() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser, availableBUs } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [deactivatingPartner, setDeactivatingPartner] = useState<Partner | null>(null);

  // Modal states
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'contracts'>('info');

  // Form data
  const [formData, setFormData] = useState<Partial<Partner>>({
    partnerId: '',
    partnerName: '',
    partnerType: 'CUSTOMER',
    taxCode: '',
    phone: '',
    contactPerson: '',
    status: 'ACTIVE',
    address: '',
    email: '',
    representativeName: '',
    representativeTitle: '',
    representativePhone: '',
    bankAccounts: [],
    paymentMethodId: '',
    businessUnitIds: [],
    paymentTerm: 30,
    contracts: [],
    balance: 0,
  });

  // Sorting
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Draggable columns
  const columnsConfig: ColumnConfig[] = [
    { id: 'partnerId', label: 'Mã Đối Tác', field: 'partnerId', visible: true, align: 'left' },
    { id: 'partnerName', label: 'Tên Đối Tác', field: 'partnerName', visible: true, align: 'left' },
    { id: 'businessUnit', label: 'BU', field: 'businessUnit', visible: true, align: 'left' },
    { id: 'partnerType', label: 'Loại', field: 'partnerType', visible: true, align: 'center' },
    { id: 'taxCode', label: 'Mã Số Thuế', field: 'taxCode', visible: true, align: 'left' },
    { id: 'phone', label: 'Số ĐT', field: 'phone', visible: true, align: 'left' },
    { id: 'contactPerson', label: 'Người Liên Hệ', field: 'contactPerson', visible: true, align: 'left' },
    { id: 'status', label: 'Trạng Thái', field: 'status', visible: true, align: 'center' },
    { id: 'actions', label: 'Hành Động', visible: true, align: 'center' },
  ];

  const { columns, moveColumn } = useDraggableColumns({
    defaultColumns: columnsConfig,
    storageKey: 'quan-ly-doi-tac-columns',
    userId: 'user_001'
  });

  // Fetch Data
  useEffect(() => {
    fetchData();
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [partnersData, paymentMethodsData] = await Promise.all([
        partnerService.getAll(),
        paymentMethodService.getAll()
      ]);
      setPartners(partnersData);
      setPaymentMethods(paymentMethodsData);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError('Không thể tải dữ liệu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Filter logic
  const filteredPartners = partners.filter(partner => {
    const matchesSearch =
      (partner.partnerId || '').toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      (partner.partnerName || '').toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      (partner.taxCode || '').toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      (partner.phone || '').toLowerCase().includes(debouncedSearch.toLowerCase());

    const matchesType = filterType === 'all' || partner.partnerType === filterType || (filterType === 'both' && partner.partnerType === 'BOTH');

    return matchesSearch && matchesType;
  });

  // Sorting logic
  const sortedPartners = [...filteredPartners].sort((a, b) => {
    if (!sortField || !sortOrder) return 0;
    let comparison = 0;
    // Safe access
    const valA = ((a as any)[sortField] || '').toString().toLowerCase();
    const valB = ((b as any)[sortField] || '').toString().toLowerCase();

    if (valA < valB) comparison = -1;
    if (valA > valB) comparison = 1;

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Pagination logic
  const totalPages = Math.ceil(sortedPartners.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPartners = sortedPartners.slice(startIndex, endIndex);

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
    setFilterType('all');
    setCurrentPage(1);
  };

  // CRUD Operations
  const handleCreate = () => {
    setModalMode('create');
    setSelectedPartner(null);
    setActiveTab('info');
    setFormData({
      partnerId: `PT${String(partners.length + 1).padStart(3, '0')}`, // Rudimentary ID gen, backend generates UUID
      partnerName: '',
      partnerType: 'CUSTOMER',
      taxCode: '',
      phone: '',
      contactPerson: '',
      status: 'ACTIVE',
      address: '',
      email: '',
      representativeName: '',
      representativeTitle: '',
      representativePhone: '',
      bankAccounts: [],
      paymentMethodId: paymentMethods.length > 0 ? paymentMethods[0].id : '',
      businessUnitIds: currentUser.role === 'Trưởng BU' ? (currentUser.buId ? [currentUser.buId] : []) : [],
      paymentTerm: 30,
      contracts: [],
      balance: 0,
    });
  };

  const handleView = (partner: Partner) => {
    setModalMode('view');
    setSelectedPartner(partner);
    setActiveTab('info');
    setFormData({
      ...partner,
      businessUnitIds: partner.businessUnits?.map(bu => bu.id) || []
    });
  };

  const handleEdit = (partner: Partner) => {
    setModalMode('edit');
    setSelectedPartner(partner);
    setActiveTab('info');
    setFormData({
      ...partner,
      businessUnitIds: partner.businessUnits?.map(bu => bu.id) || []
    });
  };

  const handleDeactivate = (partner: Partner) => {
    setDeactivatingPartner(partner);
    setShowDeactivateConfirm(true);
  };

  const confirmDeactivate = async () => {
    if (deactivatingPartner) {
      try {
        await partnerService.deactivate(deactivatingPartner.id);
        await fetchData();
        setShowDeactivateConfirm(false);
        setDeactivatingPartner(null);
      } catch (err) {
        console.error('Deactivate failed', err);
        alert('Có lỗi xảy ra khi ngừng hợp tác.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate tax code
    if (formData.taxCode && (formData.taxCode.length < 10 || formData.taxCode.length > 13)) {
      alert('Mã số thuế phải có từ 10-13 chữ số');
      return;
    }

    // Check duplicate tax code (client-side check for immediate feedback)
    const isDuplicateTaxCode = partners.some(p =>
      p.taxCode === formData.taxCode && p.id !== selectedPartner?.id
    );
    if (isDuplicateTaxCode) {
      alert('Mã số thuế đã tồn tại trong hệ thống');
      return;
    }

    try {
      const { businessUnits, businessUnit, paymentMethod, ...restOfFormData } = formData as any;
      const payload = {
        ...restOfFormData,
        // Clean up unwanted fields if necessary, or just send partial
        bankAccounts: formData.bankAccounts?.map(({ id, ...rest }) => rest),
        contracts: formData.contracts?.map(({ id, ...rest }) => rest),
        paymentMethodId: formData.paymentMethodId || undefined,
        businessUnitIds: formData.businessUnitIds || [],
      };

      if (modalMode === 'create') {
        await partnerService.create(payload);
      } else if (modalMode === 'edit' && selectedPartner) {
        await partnerService.update(selectedPartner.id, payload);
      }

      await fetchData();
      setModalMode(null);
      setSelectedPartner(null);
    } catch (err: any) {
      console.error('Submit failed', err);
      alert('Có lỗi xảy ra khi lưu đối tác. ' + (err.response?.data?.error || err.message));
    }
  };

  const getPartnerTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'CUSTOMER': 'Khách hàng',
      'SUPPLIER': 'Nhà cung cấp',
      'BOTH': 'KH & NCC'
    };
    return labels[type] || type;
  };

  const getPartnerTypeBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      'CUSTOMER': 'bg-blue-100 text-blue-700',
      'SUPPLIER': 'bg-green-100 text-green-700',
      'BOTH': 'bg-purple-100 text-purple-700'
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  const getStatusBadgeColor = (status: string) => {
    return status === 'ACTIVE'
      ? 'bg-green-100 text-green-700'
      : 'bg-gray-100 text-gray-700';
  };

  const canDeactivate = (partner: Partner) => {
    if (partner.balance !== 0) return { canDeactivate: false, reason: 'Đối tác còn dư nợ' };
    const activeContracts = partner.contracts?.filter(c => {
      // Simple date check
      try {
        // Assume expiryDate is ISO or DD/MM/YYYY. If backend gives ISO, new Date work.
        const expiry = new Date(c.expiryDate);
        return expiry > new Date();
      } catch {
        return false;
      }
    }) || [];
    if (activeContracts.length > 0) return { canDeactivate: false, reason: 'Đối tác còn hợp đồng hiệu lực' };
    return { canDeactivate: true, reason: '' };
  };

  const addBankAccount = () => {
    setFormData({
      ...formData,
      bankAccounts: [
        ...(formData.bankAccounts || []),
        { accountNumber: '', bankName: '', branch: '', swiftCode: '', isDefault: false }
      ]
    });
  };

  const removeBankAccount = (index: number) => {
    const newBankAccounts = formData.bankAccounts?.filter((_, i) => i !== index) || [];
    setFormData({ ...formData, bankAccounts: newBankAccounts });
  };

  const updateBankAccount = (index: number, field: keyof BankAccount, value: string | boolean) => {
    const newBankAccounts = [...(formData.bankAccounts || [])];
    if (field === 'isDefault' && value === true) {
      newBankAccounts.forEach((acc, i) => {
        acc.isDefault = i === index;
      });
    } else {
      newBankAccounts[index] = { ...newBankAccounts[index], [field]: value };
    }
    setFormData({ ...formData, bankAccounts: newBankAccounts });
  };

  const addContract = () => {
    setFormData({
      ...formData,
      contracts: [
        ...(formData.contracts || []),
        { contractNumber: '', signDate: new Date().toISOString().split('T')[0], expiryDate: '', value: 0, fileName: '' }
      ]
    });
  };

  const removeContract = (index: number) => {
    const newContracts = formData.contracts?.filter((_, i) => i !== index) || [];
    setFormData({ ...formData, contracts: newContracts });
  };

  const updateContract = (index: number, field: keyof Contract, value: string | number) => {
    const newContracts = [...(formData.contracts || [])];
    newContracts[index] = { ...newContracts[index], [field]: value };
    setFormData({ ...formData, contracts: newContracts });
  };

  const isReadOnly = modalMode === 'view';

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">QUẢN LÝ ĐỐI TÁC</h1>
          <p className="text-gray-600">Quản lý thông tin khách hàng và nhà cung cấp</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-6 py-3 bg-[#004aad] hover:bg-[#1557A0] text-white rounded-lg transition-colors shadow-md"
        >
          <Plus className="w-5 h-5" />
          Thêm Đối tác
        </button>
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
          {/* Filter Bar */}
          <div className="bg-white rounded-xl shadow-md p-4 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo Mã đối tác, Tên, MST, hoặc SĐT..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004aad] focus:border-transparent"
                />
              </div>

              <div className="flex flex-wrap gap-4">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004aad] focus:border-transparent bg-white"
                >
                  <option value="all">Tất cả loại đối tác</option>
                  <option value="CUSTOMER">Khách hàng</option>
                  <option value="SUPPLIER">Nhà cung cấp</option>
                  <option value="BOTH">Cả hai</option>
                </select>

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
                <tbody className="divide-y divide-gray-200">
                  {paginatedPartners.map((partner) => {
                    const deactivateCheck = canDeactivate(partner);
                    return (
                      <tr key={partner.id} className="hover:bg-gray-50 transition-colors">
                        {columns.filter(c => c.visible).map(column => {
                          if (column.id === 'partnerId') return <td key={column.id} className="px-6 py-4 font-bold text-gray-900">{partner.partnerId}</td>;
                          if (column.id === 'partnerName') return <td key={column.id} className="px-6 py-4 font-medium text-gray-900">{partner.partnerName}</td>;
                          if (column.id === 'businessUnit') return <td key={column.id} className="px-6 py-4 text-sm text-gray-600">
                            {partner.businessUnits && partner.businessUnits.length > 0
                              ? partner.businessUnits.map(bu => bu.name).join(', ')
                              : '-'}
                          </td>;
                          if (column.id === 'partnerType') return <td key={column.id} className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPartnerTypeBadgeColor(partner.partnerType)}`}>{getPartnerTypeLabel(partner.partnerType)}</span></td>;
                          if (column.id === 'taxCode') return <td key={column.id} className="px-6 py-4 text-sm text-gray-600">{partner.taxCode}</td>;
                          if (column.id === 'phone') return <td key={column.id} className="px-6 py-4 text-sm text-gray-600">{partner.phone}</td>;
                          if (column.id === 'contactPerson') return <td key={column.id} className="px-6 py-4 text-sm text-gray-600">{partner.contactPerson}</td>;
                          if (column.id === 'status') return <td key={column.id} className="px-6 py-4 text-center"><span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(partner.status)}`}>{partner.status}</span></td>;
                          if (column.id === 'actions') return (
                            <td key={column.id} className="px-6 py-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleView(partner)}
                                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                  title="Xem chi tiết"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleEdit(partner)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Chỉnh sửa"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeactivate(partner)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title={deactivateCheck.canDeactivate ? 'Ngừng hợp tác' : deactivateCheck.reason}
                                  disabled={!deactivateCheck.canDeactivate || partner.status === 'INACTIVE'}
                                >
                                  <Ban className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          );
                          return <td key={column.id} className="px-6 py-4">-</td>;
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {paginatedPartners.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Không tìm thấy đối tác nào</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Hiển thị <span className="font-semibold">{startIndex + 1}</span> - <span className="font-semibold">{Math.min(endIndex, sortedPartners.length)}</span> trong tổng số <span className="font-semibold">{sortedPartners.length}</span> đối tác
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
        </>
      )}

      {/* Create/View/Edit Modal - 360° View */}
      {modalMode && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
            <div className="border-b border-gray-200 px-6 py-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    {modalMode === 'create' && 'Thêm Đối Tác Mới'}
                    {modalMode === 'view' && 'Xem Thông Tin Đối Tác (360° View)'}
                    {modalMode === 'edit' && 'Chỉnh Sửa Thông Tin Đối Tác'}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {modalMode === 'view' ? 'Thông tin chi tiết đối tác' : 'Vui lòng điền đầy đủ thông tin bên dưới'}
                  </p>
                </div>
                <button
                  onClick={() => setModalMode(null)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-4 mt-4">
                <button
                  onClick={() => setActiveTab('info')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'info'
                    ? 'bg-[#004aad] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  Thông tin chung
                </button>
                <button
                  onClick={() => setActiveTab('contracts')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'contracts'
                    ? 'bg-[#004aad] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  Hợp đồng & Lịch sử
                </button>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-200px)] px-6 py-6 scrollbar-thin scrollbar-thumb-gray-300">
              <form onSubmit={handleSubmit} id="partner-form">
                {activeTab === 'info' && (
                  <div className="space-y-6">
                    {/* Thông tin cơ bản */}
                    <div>
                      <h3 className="text-sm font-bold text-gray-700 uppercase mb-4 pb-2 border-b border-gray-200">
                        Thông tin cơ bản
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Mã Đối Tác (Auto)
                          </label>
                          <input
                            type="text"
                            value={formData.partnerId}
                            disabled
                            placeholder="PT-Auto"
                            className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-lg cursor-not-allowed"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <span className="text-red-500">*</span> Tên Đối Tác
                          </label>
                          <input
                            type="text"
                            value={formData.partnerName}
                            onChange={(e) => setFormData({ ...formData, partnerName: e.target.value })}
                            placeholder="Công ty TNHH ABC"
                            disabled={isReadOnly}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#004aad] focus:border-transparent focus:bg-white transition-all disabled:bg-gray-100 disabled:text-gray-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <span className="text-red-500">*</span> Loại Đối Tác
                          </label>
                          <select
                            value={formData.partnerType}
                            onChange={(e) => setFormData({ ...formData, partnerType: e.target.value as any })}
                            disabled={isReadOnly}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#004aad] focus:border-transparent focus:bg-white transition-all disabled:bg-gray-100 disabled:text-gray-500"
                            required
                          >
                            <option value="CUSTOMER">Khách hàng</option>
                            <option value="SUPPLIER">Nhà cung cấp</option>
                            <option value="BOTH">Cả hai (KH & NCC)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gray-500" />
                            <span className="text-red-500">*</span> Mã Số Thuế (10-13 số)
                          </label>
                          <input
                            type="text"
                            value={formData.taxCode}
                            onChange={(e) => setFormData({ ...formData, taxCode: e.target.value.replace(/\D/g, '') })}
                            placeholder="0123456789"
                            maxLength={13}
                            disabled={isReadOnly}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#004aad] focus:border-transparent focus:bg-white transition-all disabled:bg-gray-100 disabled:text-gray-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-500" />
                            <span className="text-red-500">*</span> Số Điện Thoại
                          </label>
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="0281234567"
                            disabled={isReadOnly}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#004aad] focus:border-transparent focus:bg-white transition-all disabled:bg-gray-100 disabled:text-gray-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-500" />
                            <span className="text-red-500">*</span> Email Nhận Hóa Đơn
                          </label>
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="invoice@company.com"
                            disabled={isReadOnly}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#004aad] focus:border-transparent focus:bg-white transition-all disabled:bg-gray-100 disabled:text-gray-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-gray-500" />
                            <span className="text-red-500">*</span> BU Phụ Trách
                          </label>
                          <div className={`grid grid-cols-2 gap-2 p-3 border border-gray-200 rounded-lg bg-gray-50 ${isReadOnly ? 'opacity-75' : ''}`}>
                            {availableBUs.filter(bu => bu.id !== 'all').map(bu => (
                              <label key={bu.id} className="flex items-center gap-2 cursor-pointer hover:bg-white p-1 rounded transition-colors">
                                <input
                                  type="checkbox"
                                  checked={formData.businessUnitIds?.includes(bu.id) || false}
                                  onChange={(e) => {
                                    const currentIds = formData.businessUnitIds || [];
                                    if (e.target.checked) {
                                      setFormData({ ...formData, businessUnitIds: [...currentIds, bu.id] });
                                    } else {
                                      setFormData({ ...formData, businessUnitIds: currentIds.filter(id => id !== bu.id) });
                                    }
                                  }}
                                  disabled={isReadOnly || (currentUser.role === 'Trưởng BU' && bu.id === currentUser.buId)}
                                  className="w-4 h-4 text-[#004aad] rounded focus:ring-[#004aad]"
                                />
                                <span className="text-sm text-gray-700">{bu.name}</span>
                              </label>
                            ))}
                          </div>
                          {(!formData.businessUnitIds || formData.businessUnitIds.length === 0) && (
                            <p className="text-xs text-red-500 mt-1">Vui lòng chọn ít nhất một BU</p>
                          )}
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-gray-500" />
                            <span className="text-red-500">*</span> Địa Chỉ
                          </label>
                          <input
                            type="text"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            placeholder="123 Đường ABC, Quận XYZ, TP.HCM"
                            disabled={isReadOnly}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#004aad] focus:border-transparent focus:bg-white transition-all disabled:bg-gray-100 disabled:text-gray-500"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Người liên hệ & Đại diện */}
                    <div>
                      <h3 className="text-sm font-bold text-gray-700 uppercase mb-4 pb-2 border-b border-gray-200">
                        Thông tin liên hệ
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Người Liên Hệ Chính
                          </label>
                          <input
                            type="text"
                            value={formData.contactPerson}
                            onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                            placeholder="Nguyễn Văn A"
                            disabled={isReadOnly}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#004aad] focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Người Đại Diện Pháp Luật
                          </label>
                          <input
                            type="text"
                            value={formData.representativeName}
                            onChange={(e) => setFormData({ ...formData, representativeName: e.target.value })}
                            placeholder="Trần Văn B"
                            disabled={isReadOnly}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#004aad] focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Chức Vụ
                          </label>
                          <input
                            type="text"
                            value={formData.representativeTitle}
                            onChange={(e) => setFormData({ ...formData, representativeTitle: e.target.value })}
                            placeholder="Giám đốc"
                            disabled={isReadOnly}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#004aad] focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            SĐT Người Đại Diện
                          </label>
                          <input
                            type="text"
                            value={formData.representativePhone}
                            onChange={(e) => setFormData({ ...formData, representativePhone: e.target.value })}
                            placeholder="0909..."
                            disabled={isReadOnly}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#004aad] focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Thông tin thanh toán */}
                    <div>
                      <h3 className="text-sm font-bold text-gray-700 uppercase mb-4 pb-2 border-b border-gray-200">
                        Thông tin thanh toán
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Phương Thức Thanh Toán
                          </label>
                          <select
                            value={formData.paymentMethodId || ''}
                            onChange={(e) => setFormData({ ...formData, paymentMethodId: e.target.value })}
                            disabled={isReadOnly}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#004aad] focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                          >
                            <option value="">Chọn phương thức</option>
                            {paymentMethods.map(pm => (
                              <option key={pm.id} value={pm.id}>{pm.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Thời Hạn Thanh Toán (Ngày)
                          </label>
                          <input
                            type="number"
                            value={formData.paymentTerm}
                            onChange={(e) => setFormData({ ...formData, paymentTerm: parseInt(e.target.value) || 0 })}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#004aad] focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                            disabled={isReadOnly}
                          />
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Tài Khoản Ngân Hàng</label>
                        {formData.bankAccounts?.map((acc, index) => (
                          <div key={index} className="flex gap-2 items-start mb-2 p-3 bg-gray-50 rounded border border-gray-200">
                            <div className="grid grid-cols-2 gap-2 flex-1">
                              <input
                                placeholder="Tên Ngân Hàng"
                                value={acc.bankName}
                                onChange={e => updateBankAccount(index, 'bankName', e.target.value)}
                                className="p-2 border rounded text-sm disabled:bg-gray-100"
                                disabled={isReadOnly}
                              />
                              <input
                                placeholder="Số Tài Khoản"
                                value={acc.accountNumber}
                                onChange={e => updateBankAccount(index, 'accountNumber', e.target.value)}
                                className="p-2 border rounded text-sm disabled:bg-gray-100"
                                disabled={isReadOnly}
                              />
                              <input
                                placeholder="Chi Nhánh"
                                value={acc.branch}
                                onChange={e => updateBankAccount(index, 'branch', e.target.value)}
                                className="p-2 border rounded text-sm disabled:bg-gray-100"
                                disabled={isReadOnly}
                              />
                              <div className="flex items-center gap-2">
                                <input
                                  placeholder="SWIFT Code"
                                  value={acc.swiftCode}
                                  onChange={e => updateBankAccount(index, 'swiftCode', e.target.value)}
                                  className="p-2 border rounded text-sm flex-1 disabled:bg-gray-100"
                                  disabled={isReadOnly}
                                />
                                <label className="flex items-center gap-1 text-xs">
                                  <input
                                    type="checkbox"
                                    checked={acc.isDefault}
                                    onChange={e => updateBankAccount(index, 'isDefault', e.target.checked)}
                                    disabled={isReadOnly}
                                  /> Mặc định
                                </label>
                              </div>
                            </div>
                            {!isReadOnly && (
                              <button type="button" onClick={() => removeBankAccount(index)} className="text-red-500 p-2">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                        {!isReadOnly && (
                          <button type="button" onClick={addBankAccount} className="text-[#004aad] text-sm font-semibold flex items-center gap-1 mt-2">
                            <Plus className="w-4 h-4" /> Thêm tài khoản
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'contracts' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-bold text-gray-700 uppercase">Danh sách hợp đồng</h3>
                      {!isReadOnly && (
                        <button type="button" onClick={addContract} className="px-4 py-2 bg-[#004aad] text-white rounded-lg text-sm flex items-center gap-2">
                          <Plus className="w-4 h-4" /> Thêm hợp đồng
                        </button>
                      )}
                    </div>

                    {formData.contracts?.length === 0 && <p className="text-gray-500 text-center py-4">Chưa có hợp đồng nào.</p>}

                    {formData.contracts?.map((contract, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200 relative mb-4">
                        {!isReadOnly && (
                          <button type="button" onClick={() => removeContract(index)} className="absolute top-2 right-2 text-red-500 p-1">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <label className="text-xs font-semibold text-gray-500">Số Hợp Đồng</label>
                            <input
                              value={contract.contractNumber}
                              onChange={e => updateContract(index, 'contractNumber', e.target.value)}
                              className="w-full mt-1 p-2 border rounded text-sm disabled:bg-gray-100"
                              disabled={isReadOnly}
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-500">Ngày Ký</label>
                            <input
                              type="date"
                              value={contract.signDate ? new Date(contract.signDate).toISOString().split('T')[0] : ''}
                              onChange={e => updateContract(index, 'signDate', e.target.value)}
                              className="w-full mt-1 p-2 border rounded text-sm disabled:bg-gray-100"
                              disabled={isReadOnly}
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-500">Ngày Hết Hạn</label>
                            <input
                              type="date"
                              value={contract.expiryDate ? new Date(contract.expiryDate).toISOString().split('T')[0] : ''}
                              onChange={e => updateContract(index, 'expiryDate', e.target.value)}
                              className="w-full mt-1 p-2 border rounded text-sm disabled:bg-gray-100"
                              disabled={isReadOnly}
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-500">Giá Trị</label>
                            <input
                              type="number"
                              value={contract.value}
                              onChange={e => updateContract(index, 'value', parseInt(e.target.value) || 0)}
                              className="w-full mt-1 p-2 border rounded text-sm disabled:bg-gray-100"
                              disabled={isReadOnly}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </form>
            </div>

            <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3 bg-gray-50">
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Đóng
              </button>
              {!isReadOnly && (
                <button
                  type="submit"
                  form="partner-form"
                  className="px-6 py-2 bg-[#004aad] text-white rounded-lg hover:bg-[#1557A0] transition-colors shadow-sm"
                >
                  {modalMode === 'create' ? 'Tạo Đối Tác' : 'Lưu Thay Đổi'}
                </button>
              )}
            </div>
          </div>
        </div >
      )
      }

      {/* Deactivate Confirm Modal */}
      {
        showDeactivateConfirm && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
              <h3 className="text-lg font-bold text-gray-800 mb-2">Xác nhận ngừng hợp tác</h3>
              <p className="text-gray-600 mb-6">Bạn có chắc chắn muốn ngừng hợp tác với đối tác <b>{deactivatingPartner?.partnerName}</b>?</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeactivateConfirm(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  onClick={confirmDeactivate}
                  className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg"
                >
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}
