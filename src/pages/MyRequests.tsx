import React, { useEffect, useState } from 'react';
import {
  PlusIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import Pagination from '../components/Pagination';
import { SelectBox } from '../components/LandingLayout/SelectBox';
import { useDebounce } from '../hooks/useDebounce';
import { useAuth } from '../contexts/AuthContext';
import genericRequestService, {
  GenericRequest,
  GenericRequestStatus,
  GenericRequestType,
} from '../services/genericRequest.service';
import RequestFormDialog from '../components/MyRequests/RequestFormDialog';
import RequestDetailDialog from '../components/MyRequests/RequestDetailDialog';
import PdfPreviewModal from '../components/Common/PdfPreviewModal';

const STATUS_LABELS: Record<GenericRequestStatus, string> = {
  DRAFT: 'Nháp',
  PENDING_MANAGER: 'Chờ Quản lý duyệt',
  PENDING_ADMIN: 'Chờ Admin duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  CANCELLED: 'Đã huỷ',
};

const STATUS_COLORS: Record<GenericRequestStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  PENDING_MANAGER: 'bg-yellow-100 text-yellow-800',
  PENDING_ADMIN: 'bg-orange-100 text-orange-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-200 text-gray-600',
};

const formatDate = (s: string | null) => {
  if (!s) return '—';
  try {
    return new Date(s).toLocaleDateString('vi-VN');
  } catch {
    return s;
  }
};

type TabKey = 'mine' | 'to-approve';

const MyRequests: React.FC = () => {
  const { user } = useAuth();
  const isManager =
    !!user?.is_manager ||
    !!(user as any)?.employee_profile?.is_manager ||
    !!(user as any)?.hrm_user?.is_manager;

  const [activeTab, setActiveTab] = useState<TabKey>('mine');
  const [requests, setRequests] = useState<GenericRequest[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Filters
  const [filterType, setFilterType] = useState<GenericRequestType | ''>('');
  const [filterStatus, setFilterStatus] = useState<GenericRequestStatus | ''>('');
  const [filterMonth, setFilterMonth] = useState<number>(0);
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());
  const [filterSearch, setFilterSearch] = useState('');
  const debouncedSearch = useDebounce(filterSearch, 400);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Dialogs
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [editingRequest, setEditingRequest] = useState<GenericRequest | null>(null);
  const [detailRequest, setDetailRequest] = useState<GenericRequest | null>(null);
  const [previewRequest, setPreviewRequest] = useState<GenericRequest | null>(null);

  // Approval modals (Manager workflow)
  const [approveTarget, setApproveTarget] = useState<GenericRequest | null>(null);
  const [rejectTarget, setRejectTarget] = useState<GenericRequest | null>(null);
  const [approvalNote, setApprovalNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      // Tab "Đơn của tôi" → owner=me; Tab "Cần tôi duyệt" → owner=subordinates
      const owner: 'me' | 'subordinates' =
        activeTab === 'to-approve' ? 'subordinates' : 'me';
      // Tab "Cần tôi duyệt" mặc định chỉ hiện đơn ở status PENDING_MANAGER
      const effectiveStatus =
        activeTab === 'to-approve' && !filterStatus
          ? 'PENDING_MANAGER'
          : filterStatus || undefined;

      const data = await genericRequestService.list({
        page: currentPage,
        page_size: itemsPerPage,
        owner,
        request_type: filterType || undefined,
        status: effectiveStatus,
        month: filterMonth > 0 ? filterMonth : undefined,
        year: filterMonth > 0 ? filterYear : undefined,
        search: debouncedSearch.trim() || undefined,
      });
      setRequests(data.results || []);
      setTotalCount(data.count || 0);
    } catch (e) {
      console.error(e);
      alert('Không thể tải danh sách đơn. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, currentPage, itemsPerPage, filterType, filterStatus, filterMonth, filterYear, debouncedSearch]);

  // Reset filter + page khi đổi tab
  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setFilterStatus('');
  };

  const openCreate = () => {
    setEditingRequest(null);
    setShowFormDialog(true);
  };

  const openEdit = (req: GenericRequest) => {
    setEditingRequest(req);
    setShowFormDialog(true);
  };

  const handleSubmit = async (req: GenericRequest) => {
    if (!confirm(`Gửi đơn "${req.title}" để duyệt?`)) return;
    try {
      await genericRequestService.submit(req.id);
      await fetchRequests();
    } catch (e: any) {
      alert('Gửi đơn thất bại: ' + (e?.response?.data?.error || e?.message || 'Lỗi'));
    }
  };

  const handleCancel = async (req: GenericRequest) => {
    if (!confirm(`Huỷ đơn "${req.title}"?`)) return;
    try {
      await genericRequestService.cancel(req.id);
      await fetchRequests();
    } catch (e: any) {
      alert('Huỷ đơn thất bại: ' + (e?.response?.data?.error || e?.message || 'Lỗi'));
    }
  };

  const handleDelete = async (req: GenericRequest) => {
    if (!confirm(`Xoá đơn nháp "${req.title}"? Hành động này không thể hoàn tác.`)) return;
    try {
      await genericRequestService.remove(req.id);
      await fetchRequests();
    } catch (e: any) {
      alert('Xoá đơn thất bại: ' + (e?.response?.data?.detail || e?.message || 'Lỗi'));
    }
  };

  const confirmManagerApprove = async () => {
    if (!approveTarget) return;
    setActionLoading(true);
    try {
      await genericRequestService.managerApprove(approveTarget.id, approvalNote);
      setApproveTarget(null);
      setApprovalNote('');
      await fetchRequests();
    } catch (e: any) {
      alert('Duyệt thất bại: ' + (e?.response?.data?.error || e?.message || 'Lỗi'));
    } finally {
      setActionLoading(false);
    }
  };

  const confirmReject = async () => {
    if (!rejectTarget) return;
    if (!approvalNote.trim()) {
      alert('Vui lòng nhập lý do từ chối.');
      return;
    }
    setActionLoading(true);
    try {
      await genericRequestService.reject(rejectTarget.id, approvalNote);
      setRejectTarget(null);
      setApprovalNote('');
      await fetchRequests();
    } catch (e: any) {
      alert('Từ chối thất bại: ' + (e?.response?.data?.error || e?.message || 'Lỗi'));
    } finally {
      setActionLoading(false);
    }
  };

  const hasFilter =
    filterType !== '' || filterStatus !== '' || filterMonth > 0 || filterSearch !== '';

  const resetFilters = () => {
    setFilterType('');
    setFilterStatus('');
    setFilterMonth(0);
    setFilterSearch('');
    setCurrentPage(1);
  };

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Yêu cầu & Đơn từ</h2>
          <p className="text-gray-500 text-sm">Tổng: {totalCount} đơn</p>
        </div>
        {activeTab === 'mine' && (
          <button
            onClick={openCreate}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm flex items-center gap-2"
          >
            <PlusIcon className="w-4 h-4" />
            Tạo đơn mới
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-4">
        <nav className="flex gap-6">
          <button
            onClick={() => handleTabChange('mine')}
            className={`py-2.5 px-1 border-b-2 text-sm font-medium transition-colors ${
              activeTab === 'mine'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Đơn của tôi
          </button>
          {isManager && (
            <button
              onClick={() => handleTabChange('to-approve')}
              className={`py-2.5 px-1 border-b-2 text-sm font-medium transition-colors ${
                activeTab === 'to-approve'
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Cần tôi duyệt
            </button>
          )}
        </nav>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div className="w-52">
          <SelectBox
            label="Loại đơn"
            value={filterType}
            options={[
              { value: '', label: 'Tất cả loại đơn' },
              { value: 'RESIGNATION', label: 'Đơn xin nghỉ việc' },
              { value: 'PROPOSAL', label: 'Đơn đề xuất' },
              { value: 'CONFIRMATION', label: 'Đơn xác nhận' },
              { value: 'COMPLAINT', label: 'Đơn khiếu nại' },
              { value: 'OTHER', label: 'Đơn khác' },
            ]}
            onChange={(v) => { setFilterType(v as GenericRequestType | ''); setCurrentPage(1); }}
          />
        </div>
        <div className="w-52">
          <SelectBox
            label="Trạng thái"
            value={filterStatus}
            options={
              activeTab === 'to-approve'
                ? [
                    { value: 'PENDING_MANAGER', label: 'Chờ Quản lý duyệt' },
                    { value: '', label: 'Tất cả' },
                    { value: 'PENDING_ADMIN', label: 'Đã chuyển Admin' },
                    { value: 'APPROVED', label: 'Đã duyệt' },
                    { value: 'REJECTED', label: 'Từ chối' },
                  ]
                : [
                    { value: '', label: 'Tất cả trạng thái' },
                    { value: 'DRAFT', label: 'Nháp' },
                    { value: 'PENDING_MANAGER', label: 'Chờ Quản lý duyệt' },
                    { value: 'PENDING_ADMIN', label: 'Chờ Admin duyệt' },
                    { value: 'APPROVED', label: 'Đã duyệt' },
                    { value: 'REJECTED', label: 'Từ chối' },
                    { value: 'CANCELLED', label: 'Đã huỷ' },
                  ]
            }
            onChange={(v) => { setFilterStatus(v as GenericRequestStatus | ''); setCurrentPage(1); }}
          />
        </div>
        <div className="w-40">
          <SelectBox
            label="Tháng"
            value={filterMonth}
            options={[
              { value: 0, label: 'Tất cả tháng' },
              ...Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `Tháng ${i + 1}` })),
            ]}
            onChange={(v) => { setFilterMonth(Number(v)); setCurrentPage(1); }}
          />
        </div>
        {filterMonth > 0 && (
          <div className="w-32">
            <SelectBox
              label="Năm"
              value={filterYear}
              options={Array.from({ length: 5 }, (_, i) => {
                const y = new Date().getFullYear() - i;
                return { value: y, label: String(y) };
              })}
              onChange={(v) => { setFilterYear(Number(v)); setCurrentPage(1); }}
            />
          </div>
        )}
        <div className="relative">
          <label className="block text-sm font-medium mb-1 text-gray-700">Tìm kiếm</label>
          <div className="relative">
            <input
              type="text"
              value={filterSearch}
              onChange={(e) => { setFilterSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Tiêu đề, lý do, mã đơn..."
              className="border border-gray-300 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-60"
            />
            <svg className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {hasFilter && (
          <button
            onClick={resetFilters}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-600"
          >
            Xoá bộ lọc
          </button>
        )}

        <button
          onClick={fetchRequests}
          disabled={loading}
          className="ml-auto px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-600 flex items-center gap-1.5 disabled:opacity-50"
        >
          <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-x-auto w-full">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {(activeTab === 'to-approve'
                ? ['Mã đơn', 'Người làm đơn', 'Phòng ban', 'Loại đơn', 'Ngày nghỉ dự kiến', 'Trạng thái', 'Ngày tạo', 'Thao tác']
                : ['Mã đơn', 'Tiêu đề', 'Loại đơn', 'Ngày nghỉ dự kiến', 'Trạng thái', 'Ngày tạo', 'Thao tác']
              ).map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={activeTab === 'to-approve' ? 8 : 7} className="px-4 py-10 text-center text-gray-500">
                  Đang tải...
                </td>
              </tr>
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan={activeTab === 'to-approve' ? 8 : 7} className="px-4 py-10 text-center text-gray-500">
                  {activeTab === 'to-approve'
                    ? 'Không có đơn nào cần bạn duyệt.'
                    : `Chưa có đơn nào${hasFilter ? ' khớp với bộ lọc' : ''}.`}
                </td>
              </tr>
            ) : (
              requests.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono text-gray-700 whitespace-nowrap">
                    {req.request_code || '—'}
                  </td>
                  {activeTab === 'to-approve' ? (
                    <>
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                        {req.employee_name}
                        <div className="text-xs text-gray-500 font-mono">{req.employee_code}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {req.employee_department || '—'}
                      </td>
                    </>
                  ) : (
                    <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate" title={req.title}>
                      {req.title}
                    </td>
                  )}
                  <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                    {req.request_type_display}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                    {formatDate(req.expected_date)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[req.status]}`}>
                      {STATUS_LABELS[req.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                    {formatDate(req.created_at)}
                  </td>
                  <td className="px-4 py-3 text-sm whitespace-nowrap">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* Tab "Cần tôi duyệt": Duyệt + Từ chối lên đầu (ưu tiên action quan trọng) */}
                      {activeTab === 'to-approve' && req.status === 'PENDING_MANAGER' && (
                        <>
                          <button
                            onClick={() => { setApproveTarget(req); setApprovalNote(''); }}
                            className="px-2.5 py-1 text-xs font-medium text-white bg-green-600 border border-green-600 rounded hover:bg-green-700"
                          >
                            Duyệt
                          </button>
                          <button
                            onClick={() => { setRejectTarget(req); setApprovalNote(''); }}
                            className="px-2.5 py-1 text-xs font-medium text-white bg-red-600 border border-red-600 rounded hover:bg-red-700"
                          >
                            Từ chối
                          </button>
                        </>
                      )}

                      {/* Tab "Đơn của tôi" - DRAFT: Sửa + Gửi duyệt + Xoá lên đầu */}
                      {activeTab === 'mine' && req.status === 'DRAFT' && (
                        <>
                          <button
                            onClick={() => handleSubmit(req)}
                            className="px-2.5 py-1 text-xs font-medium text-white bg-green-600 border border-green-600 rounded hover:bg-green-700"
                          >
                            Gửi duyệt
                          </button>
                          <button
                            onClick={() => openEdit(req)}
                            className="px-2.5 py-1 text-xs font-medium text-blue-700 bg-white border border-blue-300 rounded hover:bg-blue-50"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDelete(req)}
                            className="px-2.5 py-1 text-xs font-medium text-red-700 bg-white border border-red-300 rounded hover:bg-red-50"
                          >
                            Xoá
                          </button>
                        </>
                      )}

                      {/* Tab "Đơn của tôi" - PENDING: nút Huỷ */}
                      {activeTab === 'mine' && (req.status === 'PENDING_MANAGER' || req.status === 'PENDING_ADMIN') && (
                        <button
                          onClick={() => handleCancel(req)}
                          className="px-2.5 py-1 text-xs font-medium text-orange-700 bg-white border border-orange-300 rounded hover:bg-orange-50"
                        >
                          Huỷ đơn
                        </button>
                      )}

                      {/* View buttons (Xem PDF + Chi tiết) — đẩy xuống cuối */}
                      {req.request_type === 'RESIGNATION' && (
                        <button
                          onClick={() => setPreviewRequest(req)}
                          className="px-2.5 py-1 text-xs font-medium text-purple-700 bg-white border border-purple-300 rounded hover:bg-purple-50"
                        >
                          Xem PDF
                        </button>
                      )}
                      <button
                        onClick={() => setDetailRequest(req)}
                        className="px-2.5 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                      >
                        Chi tiết
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 mb-6">
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(totalCount / itemsPerPage) || 1}
          totalItems={totalCount}
          itemsPerPage={itemsPerPage}
          onPageChange={(page: number) => setCurrentPage(page)}
          onItemsPerPageChange={(size: number) => { setItemsPerPage(size); setCurrentPage(1); }}
        />
      </div>

      <RequestFormDialog
        open={showFormDialog}
        editing={editingRequest}
        onClose={() => setShowFormDialog(false)}
        onSaved={fetchRequests}
      />

      <RequestDetailDialog
        request={detailRequest}
        onClose={() => setDetailRequest(null)}
        onPreviewPdf={(r) => { setDetailRequest(null); setPreviewRequest(r); }}
      />

      {/* PDF preview modal cho đơn nghỉ việc */}
      <PdfPreviewModal
        open={!!previewRequest}
        title={previewRequest ? `Xem trước: ${previewRequest.title}` : 'Xem PDF'}
        loader={previewRequest ? () => genericRequestService.previewPdf(previewRequest.id) : null}
        downloadFilename={previewRequest ? `${previewRequest.request_code || 'don'}.pdf` : 'don.pdf'}
        onClose={() => setPreviewRequest(null)}
      />

      {/* Modal Manager duyệt đơn */}
      {approveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Duyệt đơn</h3>
            <p className="text-sm text-gray-600 mb-1">
              Bạn sẽ duyệt đơn <span className="font-medium">{approveTarget.title}</span> của{' '}
              <span className="font-medium">{approveTarget.employee_name}</span>.
            </p>
            <p className="text-xs text-gray-500 mb-3">
              Sau khi bạn duyệt, đơn sẽ được chuyển lên Admin để xử lý cuối.
            </p>
            <textarea
              rows={3}
              value={approvalNote}
              onChange={(e) => setApprovalNote(e.target.value)}
              placeholder="Ghi chú (tuỳ chọn)..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => { setApproveTarget(null); setApprovalNote(''); }}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Huỷ
              </button>
              <button
                onClick={confirmManagerApprove}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {actionLoading ? 'Đang duyệt...' : 'Xác nhận duyệt'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal từ chối đơn */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Từ chối đơn</h3>
            <p className="text-sm text-gray-600 mb-3">
              Từ chối đơn <span className="font-medium">{rejectTarget.title}</span> của{' '}
              <span className="font-medium">{rejectTarget.employee_name}</span>.
            </p>
            <textarea
              rows={3}
              value={approvalNote}
              onChange={(e) => setApprovalNote(e.target.value)}
              placeholder="Lý do từ chối (bắt buộc)..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => { setRejectTarget(null); setApprovalNote(''); }}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Huỷ
              </button>
              <button
                onClick={confirmReject}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? 'Đang xử lý...' : 'Xác nhận từ chối'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyRequests;
