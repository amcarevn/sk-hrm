import { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../utils/api';
import { managementApi } from '../utils/api';
import { companyUnitsAPI } from '../utils/api/hrm.api';
import type { CompanyUnit } from '../utils/api/types';
import { SelectBox } from '../components/LandingLayout/SelectBox';
import {
  DocumentTextIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const CONTRACT_TYPE_LABELS: Record<string, string> = {
  PROBATION: 'Hợp đồng thử việc',
  INTERN: 'Hợp đồng thực tập sinh',
  COLLABORATOR: 'Hợp đồng cộng tác viên',
  ONE_YEAR: 'Hợp đồng lao động 12 tháng',
  TWO_YEAR: 'Hợp đồng lao động 24 tháng',
  INDEFINITE: 'Hợp đồng vô thời hạn',
  SERVICE: 'Hợp đồng dịch vụ',
  CONFIDENTIALITY: 'Thoả thuận bảo mật',
  COMPANY_RULES: 'Cam kết đọc hiểu nội quy công ty',
  NURSING_COMMITMENT: 'Cam kết của CBNV Điều dưỡng',
};

type ContractTemplate = {
  id: number;
  name: string;
  contract_type: string;
  contract_type_display: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE';
  file: string | null;
  file_url?: string | null;
  company_unit: number | null;
  company_unit_name: string | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
};

export default function ContractTemplates() {
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [companyUnits, setCompanyUnits] = useState<CompanyUnit[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(false);

  const [detailTemplate, setDetailTemplate] = useState<ContractTemplate | null>(null);
  const [editTemplate, setEditTemplate] = useState<ContractTemplate | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    contract_type: 'PROBATION',
    description: '',
    status: 'ACTIVE',
    file: null as File | null,
    company_unit: null as number | null,
  });
  const [updating, setUpdating] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '',
    contract_type: 'PROBATION',
    description: '',
    status: 'ACTIVE',
    file: null as File | null,
    company_unit: null as number | null,
  });

  const getAuthHeader = () => {
    const token = localStorage.getItem('accessToken');
    return { Authorization: `Bearer ${token}` };
  };

  const fetchTemplates = async () => {
    try {
      const { data } = await managementApi.get('/api-hrm/contract-templates/');
      setTemplates(Array.isArray(data) ? data : data.results || []);
    } catch (e) {
      console.error('Error fetching templates:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    if (!showAddModal) return;
    setLoadingUnits(true);
    companyUnitsAPI.list({ active_only: true, page_size: 200 })
      .then(res => setCompanyUnits(res.results))
      .catch(() => {})
      .finally(() => setLoadingUnits(false));
  }, [showAddModal]);

  const handleSubmit = async () => {
    if (!form.name.trim()) return alert('Vui lòng nhập tên template');
    if (!form.file) return alert('Vui lòng chọn file .docx');

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('contract_type', form.contract_type);
      formData.append('description', form.description);
      formData.append('status', form.status);
      formData.append('file', form.file);
      if (form.company_unit) formData.append('company_unit', String(form.company_unit));

      await managementApi.post('/api-hrm/contract-templates/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      await fetchTemplates();
      setShowAddModal(false);
      setForm({ name: '', contract_type: 'PROBATION', description: '', status: 'ACTIVE', file: null, company_unit: null });
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (e: any) {
      alert('Lỗi upload: ' + (e.response?.data?.detail || e.message));
    } finally {
      setUploading(false);
    }
  };

  const handleToggleStatus = async (template: ContractTemplate) => {
    const newStatus = template.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await managementApi.patch(`/api-hrm/contract-templates/${template.id}/`, {
        status: newStatus,
      });
      await fetchTemplates();
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Cập nhật thất bại');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa template này?')) return;
    setDeletingId(id);
    try {
      await managementApi.delete(`/api-hrm/contract-templates/${id}/`);
      await fetchTemplates();
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Xóa thất bại');
    } finally {
      setDeletingId(null);
    }
  };

  const openEdit = (t: ContractTemplate) => {
    setEditForm({
      name: t.name,
      contract_type: t.contract_type,
      description: t.description,
      status: t.status,
      file: null,
      company_unit: t.company_unit ?? null,
    });
    setEditTemplate(t);
  };

  const handleUpdate = async () => {
    if (!editTemplate || !editForm.name.trim()) return;
    setUpdating(true);
    try {
      const fd = new FormData();
      fd.append('name', editForm.name);
      fd.append('contract_type', editForm.contract_type);
      fd.append('description', editForm.description);
      fd.append('status', editForm.status);
      if (editForm.company_unit) fd.append('company_unit', String(editForm.company_unit));
      if (editForm.file) fd.append('file', editForm.file);
      await managementApi.patch(`/api-hrm/contract-templates/${editTemplate.id}/`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await fetchTemplates();
      setEditTemplate(null);
      if (editFileInputRef.current) editFileInputRef.current.value = '';
    } catch (e: any) {
      alert('Lỗi: ' + (e.response?.data?.detail || e.message));
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    if (!editTemplate) return;
    setLoadingUnits(true);
    companyUnitsAPI.list({ active_only: true, page_size: 200 })
      .then(res => setCompanyUnits(res.results))
      .catch(() => {})
      .finally(() => setLoadingUnits(false));
  }, [editTemplate]);
  
  const PLACEHOLDER_DOCS = [
    { key: '{{ho_ten}}', desc: 'Họ và tên nhân viên' },
    { key: '{{ngay_sinh}}', desc: 'Ngày sinh' },
    { key: '{{so_cccd}}', desc: 'Số CCCD/CMND' },
    { key: '{{ngay_cap_cccd}}', desc: 'Ngày cấp CCCD' },
    { key: '{{noi_cap_cccd}}', desc: 'Nơi cấp CCCD' },
    { key: '{{dia_chi}}', desc: 'Địa chỉ thường trú' },
    { key: '{{dia_chi_hien_tai}}', desc: 'Địa chỉ hiện tại' },
    { key: '{{so_dien_thoai}}', desc: 'Số điện thoại' },
    { key: '{{email}}', desc: 'Email cá nhân' },
    { key: '{{luong_co_ban}}', desc: 'Lương cơ bản' },
    { key: '{{luong_thu_viec}}', desc: 'Lương thử việc' },
    { key: '{{ngay_bat_dau}}', desc: 'Ngày bắt đầu làm việc' },
    { key: '{{ngay_ky}}', desc: 'Ngày ký hợp đồng' },
    { key: '{{thoi_han_hop_dong}}', desc: 'Ngày kết thúc HĐ' },
    { key: '{{phong_ban}}', desc: 'Phòng ban' },
    { key: '{{vi_tri}}', desc: 'Vị trí/Chức danh' },
    { key: '{{chuc_vu}}', desc: 'Chức vụ (rank)' },
    { key: '{{loai_hop_dong}}', desc: 'Loại hợp đồng' },
    { key: '{{ma_nhan_vien}}', desc: 'Mã nhân viên' },
    { key: '{{so_tai_khoan}}', desc: 'Số tài khoản ngân hàng' },
    { key: '{{ten_ngan_hang}}', desc: 'Tên ngân hàng' },
    { key: '{{ma_so_thue}}', desc: 'Mã số thuế TNCN' },
    { key: '{{ma_bhxh}}', desc: 'Mã BHXH' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Template hợp đồng</h1>
          <p className="text-sm text-gray-500 mt-1">Quản lý các mẫu hợp đồng dùng để tạo PDF tự động</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          <PlusIcon className="w-4 h-4" />
          Thêm template
        </button>
      </div>


      {/* Template list */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Đang tải...</div>
      ) : templates.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Chưa có template nào</p>
          <p className="text-gray-400 text-sm mt-1">Nhấn "Thêm template" để tạo mới</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tên template</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Loại hợp đồng</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Đơn vị</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Người tạo</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ngày tạo</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {templates.map(t => (
                <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <DocumentTextIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-900">{t.name}</p>
                        {t.description && <p className="text-xs text-gray-400 mt-0.5">{t.description}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm text-gray-700">{t.contract_type_display}</span>
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-500">{t.company_unit_name || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      t.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {t.status === 'ACTIVE' ? '● Đang dùng' : '● Không dùng'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-500">{t.created_by_name || '—'}</td>
                  <td className="px-4 py-3 text-center text-sm text-gray-500">
                    {new Date(t.created_at).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-center flex-wrap">
                      <button
                        onClick={() => setDetailTemplate(t)}
                        className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded"
                      >Chi tiết</button>
                      <button
                        onClick={() => openEdit(t)}
                        className="px-2 py-1 text-xs text-indigo-600 hover:bg-indigo-50 rounded"
                      >Sửa</button>
                      {t.file && (
                        <a
                          href={t.file_url || t.file}
                          download
                          className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded"
                        >Tải file</a>
                      )}
                      <button
                        onClick={() => handleToggleStatus(t)}
                        className={`px-2 py-1 text-xs rounded ${
                          t.status === 'ACTIVE'
                            ? 'text-orange-600 hover:bg-orange-50'
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                      >
                        {t.status === 'ACTIVE' ? 'Vô hiệu' : 'Kích hoạt'}
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        disabled={deletingId === t.id}
                        className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                      >Xóa</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {detailTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Chi tiết template</h3>
              <button onClick={() => setDetailTemplate(null)}>
                <XMarkIcon className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              {([
                ['Tên template', detailTemplate.name],
                ['Loại hợp đồng', detailTemplate.contract_type_display],
                ['Đơn vị', detailTemplate.company_unit_name || '—'],
                ['Mô tả', detailTemplate.description || '—'],
                ['Trạng thái', detailTemplate.status === 'ACTIVE' ? 'Đang dùng' : 'Không dùng'],
                ['Người tạo', detailTemplate.created_by_name || '—'],
                ['Ngày tạo', new Date(detailTemplate.created_at).toLocaleDateString('vi-VN')],
                ['Cập nhật', new Date(detailTemplate.updated_at).toLocaleDateString('vi-VN')],
              ] as [string, string][]).map(([label, value]) => (
                <div key={label} className="flex gap-3 text-sm">
                  <span className="w-36 flex-shrink-0 text-gray-500">{label}</span>
                  <span className="text-gray-900 font-medium">{value}</span>
                </div>
              ))}
              {detailTemplate.file && (
                <div className="flex gap-3 text-sm">
                  <span className="w-36 flex-shrink-0 text-gray-500">File</span>
                  <a
                    href={detailTemplate.file_url || detailTemplate.file}
                    download
                    className="text-blue-600 hover:underline font-medium"
                  >Tải xuống</a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Sửa template hợp đồng</h3>
              <button onClick={() => setEditTemplate(null)}>
                <XMarkIcon className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên template <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loại hợp đồng <span className="text-red-500">*</span></label>
                <select
                  value={editForm.contract_type}
                  onChange={e => setEditForm({ ...editForm, contract_type: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(CONTRACT_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <SelectBox<number | null>
                  label="Đơn vị áp dụng"
                  value={editForm.company_unit}
                  placeholder="— Tất cả đơn vị —"
                  searchable
                  options={companyUnits.map(u => ({ value: u.id as number | null, label: u.name }))}
                  onChange={v => setEditForm({ ...editForm, company_unit: v })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <input
                  type="text"
                  value={editForm.description}
                  onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="Mô tả ngắn về template này..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">File Word (.docx)</label>
                <input
                  ref={editFileInputRef}
                  type="file"
                  accept=".docx"
                  onChange={e => setEditForm({ ...editForm, file: e.target.files?.[0] || null })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700"
                />
                <p className="text-xs text-gray-400 mt-1">Bỏ trống để giữ file hiện tại.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                <select
                  value={editForm.status}
                  onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ACTIVE">Đang dùng</option>
                  <option value="INACTIVE">Không dùng</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-gray-100">
              <button
                onClick={() => setEditTemplate(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              >Hủy</button>
              <button
                onClick={handleUpdate}
                disabled={updating || !editForm.name.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Thêm template hợp đồng</h3>
              <button onClick={() => setShowAddModal(false)}>
                <XMarkIcon className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên template <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="VD: Hợp đồng thử việc 2026"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loại hợp đồng <span className="text-red-500">*</span></label>
                <select
                  value={form.contract_type}
                  onChange={e => setForm({ ...form, contract_type: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(CONTRACT_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <SelectBox<number | null>
                  label="Đơn vị áp dụng"
                  value={form.company_unit}
                  placeholder="— Tất cả đơn vị —"
                  searchable
                  options={companyUnits.map(u => ({ value: u.id as number | null, label: u.name }))}
                  onChange={v => setForm({ ...form, company_unit: v })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Mô tả ngắn về template này..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">File Word (.docx) <span className="text-red-500">*</span></label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".docx"
                  onChange={e => setForm({ ...form, file: e.target.files?.[0] || null })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700"
                />
                <p className="text-xs text-gray-400 mt-1">Chỉ chấp nhận file .docx. Sử dụng các placeholder như {'{{ho_ten}}'} trong file Word.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                <select
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ACTIVE">Đang dùng</option>
                  <option value="INACTIVE">Không dùng</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-gray-100">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmit}
                disabled={uploading || !form.name.trim() || !form.file}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Đang upload...' : 'Lưu template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}