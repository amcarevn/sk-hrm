import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowPathIcon,
  PrinterIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { managementApi } from '../utils/api';
import MultiPdfPreviewModal, { ContractPreviewItem } from '../components/Common/MultiPdfPreviewModal';

type RenewalContract = {
  id: number;
  employee: number;
  employee_name: string;
  employee_code: string;
  employee_department: string | null;
  employee_position: string | null;
  contract_type_display: string;
  template_name: string | null;
  contract_number: string | null;
  end_date: string | null;
  generated_file: string | null;
};

const RENEWAL_DAYS = 14;

const formatDate = (value: string | null) => {
  if (!value) return '—';
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
};

const getDaysLeft = (value: string | null) => {
  if (!value) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = new Date(value);
  endDate.setHours(0, 0, 0, 0);
  return Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const ContractRenewal: React.FC = () => {
  const [contracts, setContracts] = useState<RenewalContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showPreview, setShowPreview] = useState(false);
  const [previewItems, setPreviewItems] = useState<ContractPreviewItem[]>([]);

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await managementApi.get('/api-hrm/employee-contracts/renewal-candidates/', {
        params: { days: RENEWAL_DAYS },
      });
      const list: RenewalContract[] = Array.isArray(data) ? data : data.data || [];
      setContracts(list);
      setSelectedIds(new Set());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  const printableContracts = useMemo(
    () => contracts.filter((contract) => !!contract.generated_file),
    [contracts]
  );

  const selectedContracts = useMemo(
    () => contracts.filter((contract) => selectedIds.has(contract.id)),
    [contracts, selectedIds]
  );

  const selectedPrintableContracts = useMemo(
    () => selectedContracts.filter((contract) => !!contract.generated_file),
    [selectedContracts]
  );

  const allSelected = contracts.length > 0 && selectedIds.size === contracts.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(contracts.map((contract) => contract.id)));
  };

  const toggleSelect = (contractId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(contractId)) next.delete(contractId);
      else next.add(contractId);
      return next;
    });
  };

  const openPreview = (targetContracts: RenewalContract[]) => {
    const items = targetContracts
      .filter((contract) => !!contract.generated_file)
      .map((contract) => ({
        id: contract.id,
        employee_name: contract.employee_name,
        template_name: [contract.template_name, contract.contract_type_display, contract.contract_number]
          .filter(Boolean)
          .join(' · '),
      }));

    if (items.length === 0) {
      alert('Không có hợp đồng PDF khả dụng để in. Vui lòng kiểm tra dữ liệu hợp đồng đã tạo PDF.');
      return;
    }

    setPreviewItems(items);
    setShowPreview(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Tái ký hợp đồng</h1>
        <p className="text-sm text-gray-900 mt-1">
          Danh sách nhân sự có hợp đồng sẽ hết hạn trong {RENEWAL_DAYS} ngày tới.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => openPreview(selectedContracts)}
            disabled={selectedIds.size === 0 || selectedPrintableContracts.length === 0}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PrinterIcon className="w-4 h-4" />
            In đã chọn ({selectedPrintableContracts.length})
          </button>
          <button
            onClick={() => openPreview(printableContracts)}
            disabled={printableContracts.length === 0}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PrinterIcon className="w-4 h-4" />
            In tất cả ({printableContracts.length})
          </button>
          <button
            onClick={fetchContracts}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50"
          >
            <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>
        {selectedIds.size > 0 && selectedPrintableContracts.length === 0 && (
          <p className="mt-3 text-xs text-amber-700 flex items-center gap-1">
            <ExclamationTriangleIcon className="w-4 h-4" />
            Nhân sự đã chọn chưa có PDF hợp đồng để in.
          </p>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-600">Đang tải danh sách tái ký hợp đồng...</div>
        ) : contracts.length === 0 ? (
          <div className="p-10 text-center text-gray-500">Không có hợp đồng nào hết hạn trong {RENEWAL_DAYS} ngày tới.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Nhân sự</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Phòng ban / Vị trí</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Loại hợp đồng</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Ngày hết hạn</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Còn lại</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {contracts.map((contract) => {
                  const daysLeft = getDaysLeft(contract.end_date);
                  return (
                    <tr key={contract.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(contract.id)}
                          onChange={() => toggleSelect(contract.id)}
                          className="h-4 w-4 rounded border-gray-300 text-primary-600"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-semibold text-gray-900">{contract.employee_name}</div>
                        <div className="text-xs text-gray-500">{contract.employee_code}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <div>{contract.employee_department || '—'}</div>
                        <div className="text-xs text-gray-500">{contract.employee_position || '—'}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{contract.contract_type_display}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{formatDate(contract.end_date)}</td>
                      <td className="px-4 py-3 text-sm">
                        {daysLeft === null ? (
                          <span className="text-gray-500">—</span>
                        ) : (
                          <span className={daysLeft <= 3 ? 'text-red-600 font-semibold' : 'text-amber-700 font-medium'}>
                            {daysLeft} ngày
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {contract.generated_file ? (
                          <span className="text-emerald-600 font-medium">Sẵn sàng</span>
                        ) : (
                          <span className="text-amber-600">Chưa có PDF</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <MultiPdfPreviewModal
        open={showPreview}
        contracts={previewItems}
        onClose={() => {
          setShowPreview(false);
          setPreviewItems([]);
        }}
      />
    </div>
  );
};

export default ContractRenewal;