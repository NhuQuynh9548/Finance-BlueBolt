import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Power, X, Check, AlertCircle, Calendar, RefreshCw, Trash2 } from 'lucide-react';
import { allocationRuleService } from '../../../services/allocationRuleService';
import { businessUnitService } from '../../../services/businessUnitService';

interface BUAllocation {
  buId: string;
  buName: string;
  percentage: number;
}

interface AllocationRule {
  id: string;
  name: string;
  description: string;
  allocations: BUAllocation[]; // Parsed JSON
  createdAt?: string;
}

export function PhanBoChiPhi() {
  const [rules, setRules] = useState<AllocationRule[]>([]);
  const [businessUnits, setBusinessUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<AllocationRule | null>(null);

  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    allocations: BUAllocation[];
  }>({
    name: '',
    description: '',
    allocations: []
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rulesData, busData] = await Promise.all([
        allocationRuleService.getAll(),
        businessUnitService.getAll()
      ]);

      setBusinessUnits(busData);

      // Parse allocations (which are JSON in backend) and map BU names
      const formattedRules = rulesData.map((r: any) => ({
        ...r,
        allocations: (r.allocations || []).map((alloc: any) => {
          const bu = busData.find((b: any) => b.id === alloc.buId);
          return {
            buId: alloc.buId,
            buName: bu ? bu.name : 'Unknown BU',
            percentage: alloc.percentage
          };
        })
      }));

      setRules(formattedRules);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredRules = rules.filter(rule => {
    return rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rule.description?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getTotalPercentage = (allocations: BUAllocation[]) => {
    return allocations.reduce((sum, a) => sum + a.percentage, 0);
  };

  const handleAdd = () => {
    setEditingRule(null);
    // Initialize allocations for all BUs with 0%
    const initialAllocations = businessUnits.map(bu => ({
      buId: bu.id,
      buName: bu.name,
      percentage: 0
    }));

    setFormData({
      name: '',
      description: '',
      allocations: initialAllocations
    });
    setShowModal(true);
  };

  const handleEdit = (rule: AllocationRule) => {
    setEditingRule(rule);

    // Merge existing allocations with potentially new BUs
    const mergedAllocations = businessUnits.map(bu => {
      const existing = rule.allocations.find(a => a.buId === bu.id);
      return {
        buId: bu.id,
        buName: bu.name,
        percentage: existing ? existing.percentage : 0
      };
    });

    setFormData({
      name: rule.name,
      description: rule.description || '',
      allocations: mergedAllocations
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa quy tắc này?')) {
      try {
        await allocationRuleService.delete(id);
        fetchData();
      } catch (error) {
        alert('Xóa thất bại (Quy tắc có thể đang được sử dụng)');
      }
    }
  };

  const handlePercentageChange = (buId: string, value: number) => {
    const newAllocations = formData.allocations.map(a =>
      a.buId === buId ? { ...a, percentage: value } : a
    );
    setFormData({ ...formData, allocations: newAllocations });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const total = getTotalPercentage(formData.allocations);
    if (Math.abs(total - 100) > 0.1) { // Floating point tolerance
      alert(`⚠️ Tổng tỷ lệ phân bổ phải bằng 100%!\nHiện tại: ${total.toFixed(2)}%`);
      return;
    }

    const payload = {
      name: formData.name,
      description: formData.description,
      allocations: formData.allocations.map(a => ({
        buId: a.buId,
        percentage: a.percentage
      }))
    };

    try {
      if (editingRule) {
        await allocationRuleService.update(editingRule.id, payload);
      } else {
        await allocationRuleService.create(payload);
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      console.error('Save error:', error);
      alert('Lưu thất bại');
    }
  };

  const formatDescription = (rule: AllocationRule) => {
    const parts = rule.allocations.filter(a => a.percentage > 0).map(a => `${a.buName}: ${a.percentage}%`);
    return `${parts.join(', ')}`;
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Quy tắc phân bổ</h1>
          <p className="text-gray-600">Quản lý các quy tắc phân bổ chi phí tự động cho các BU.</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-6 py-3 bg-[#1E6BB8] hover:bg-[#1557A0] text-white rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Thêm quy tắc mới
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Tìm kiếm quy tắc..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-[#1E6BB8] focus:bg-white transition-all text-gray-700"
          />
        </div>
        <button onClick={fetchData} className="p-3 bg-gray-100 rounded-lg hover:bg-gray-200">
          <RefreshCw className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Loading */}
      {loading && <div className="text-center py-12">Đang tải dữ liệu...</div>}

      {/* Rules List */}
      {!loading && (
        <div className="space-y-6">
          {filteredRules.map((rule) => {
            const total = getTotalPercentage(rule.allocations);
            const isValid = Math.abs(total - 100) <= 0.1;

            return (
              <div key={rule.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Rule Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-bold text-gray-900">{rule.name}</h2>
                      {rule.description && (
                        <span className="text-gray-500 text-sm">({rule.description})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(rule)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(rule.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Xóa"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600">
                    <p><span className="font-semibold">Chi tiết:</span> {formatDescription(rule)}</p>
                  </div>
                </div>

                {/* Allocation Details */}
                <div className="p-6 bg-gray-50">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {rule.allocations.map((allocation) => (
                      <div key={allocation.buId} className={`rounded-lg p-3 text-center border ${allocation.percentage > 0 ? 'bg-white border-blue-200 shadow-sm' : 'bg-transparent border-transparent opacity-50'}`}>
                        <p className="text-xs text-gray-500 mb-1 truncate" title={allocation.buName}>{allocation.buName}</p>
                        <p className={`text-lg font-bold ${allocation.percentage > 0 ? 'text-[#1E6BB8]' : 'text-gray-400'}`}>
                          {allocation.percentage}%
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">
                  {editingRule ? 'Chỉnh Sửa Quy Tắc' : 'Tạo Quy Tắc Mới'}
                </h2>
                <button type="button" onClick={() => setShowModal(false)}><X className="w-6 h-6 text-gray-400" /></button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tên Quy Tắc *</label>
                  <input
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Mô Tả</label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-2 border rounded"
                    rows={2}
                  />
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-bold mb-3">Phân Bổ Theo BU (Tổng: {getTotalPercentage(formData.allocations).toFixed(2)}%)</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                    {formData.allocations.map(alloc => (
                      <div key={alloc.buId} className="flex items-center justify-between gap-4">
                        <span className="flex-1 text-sm">{alloc.buName}</span>
                        <div className="flex items-center w-32">
                          <input
                            type="number"
                            min="0" max="100" step="0.1"
                            value={alloc.percentage}
                            onChange={e => handlePercentageChange(alloc.buId, Number(e.target.value))}
                            className="w-full p-1 border rounded text-right"
                          />
                          <span className="ml-2 text-sm">%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className={`mt-2 text-sm font-bold text-center ${Math.abs(getTotalPercentage(formData.allocations) - 100) <= 0.1 ? 'text-green-600' : 'text-red-600'}`}>
                    Tổng: {getTotalPercentage(formData.allocations).toFixed(2)}%
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-100 rounded">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
