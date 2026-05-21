import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RectangleGroupIcon,
  EyeIcon,
  PencilSquareIcon,
  TrashIcon,
  ExclamationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { sectionsAPI, departmentsAPI, Department } from '../utils/api';
import { SelectBox } from '../components/LandingLayout/SelectBox';
import ConfirmDialog from '../components/ConfirmDialog';
import Pagination from '../components/Pagination';

// ── Dialog xem chi tiết bộ phận ──
const SectionDetailDialog: React.FC<{
  section: Department | null;
  getParentName: (id?: number | null) => string;
  onClose: () => void;
  onEdit: (section: Department) => void;
}> = ({ section, getParentName, onClose, onEdit }) => {
  if (!section) return null;

  const InfoRow: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => (
    <div className="flex items-baseline justify-between py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-xs text-gray-400 shrink-0 mr-3">{label}</span>
      <span className={`text-sm text-right ${value ? 'font-medium text-gray-800' : 'text-gray-300 italic'}`}>
        {value || 'Chưa có'}
      </span>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center">
              <RectangleGroupIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">{section.name}</h2>
              <p className="text-xs text-gray-400">{section.code}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4">
          <InfoRow label="Mã bộ phận" value={section.code} />
          <InfoRow label="Tên bộ phận" value={section.name} />
          <InfoRow label="Phòng ban" value={getParentName(section.parent_department)} />
          <InfoRow label="Quản lý" value={section.manager_name || null} />
          <InfoRow label="Mô tả" value={section.description || null} />
          <InfoRow
            label="Ngày tạo"
            value={section.created_at ? new Date(section.created_at).toLocaleDateString('vi-VN') : null}
          />
          <InfoRow
            label="Cập nhật lần cuối"
            value={section.updated_at ? new Date(section.updated_at).toLocaleDateString('vi-VN') : null}
          />
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} className="btn-secondary">
            Đóng
          </button>
          <button
            onClick={() => { onClose(); onEdit(section); }}
            className="btn-primary flex items-center gap-1.5"
          >
            <PencilSquareIcon className="w-4 h-4" />
            Chỉnh sửa
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main component ──
const SectionList: React.FC = () => {
  const navigate = useNavigate();
  const [sections, setSections] = useState<Department[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [sectionToDelete, setSectionToDelete] = useState<Department | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [viewSection, setViewSection] = useState<Department | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const fetchSections = async (search = '', departmentId = '', page = 1, pageSize = 20) => {
    try {
      setLoading(true);
      const params: any = { page, page_size: pageSize };
      if (search) params.search = search;
      if (departmentId) params.parent_department = Number(departmentId);
      const response = await sectionsAPI.list(params);
      setSections(response.results || []);
      setTotalCount(response.count || 0);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách bộ phận');
      console.error('Error fetching sections:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await departmentsAPI.list({ page_size: 1000 });
      setDepartments(response.results || []);
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  useEffect(() => {
    fetchSections('', '', 1, itemsPerPage);
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => {
      setCurrentPage(1);
      fetchSections(searchTerm, departmentFilter, 1, itemsPerPage);
    }, 300);
    setSearchTimeout(timeout);
    return () => { if (searchTimeout) clearTimeout(searchTimeout); };
  }, [searchTerm, departmentFilter]);

  useEffect(() => {
    fetchSections(searchTerm, departmentFilter, currentPage, itemsPerPage);
  }, [currentPage, itemsPerPage]);

  const handleDeleteConfirm = async () => {
    if (!sectionToDelete) return;
    try {
      setDeleting(true);
      await sectionsAPI.delete(sectionToDelete.id);
      setSectionToDelete(null);
      fetchSections(searchTerm, departmentFilter, currentPage, itemsPerPage);
    } catch (err: any) {
      alert('Xóa thất bại: ' + (err.message || 'Lỗi không xác định'));
      setSectionToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  const getParentName = (parentId?: number | null) => {
    if (!parentId) return '—';
    const parent = departments.find((d) => d.id === parentId);
    return parent ? parent.name : `ID: ${parentId}`;
  };

  const tableHeaders = ['Mã bộ phận', 'Tên bộ phận', 'Phòng ban', 'Mô tả', 'Thao tác'];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Quản lý bộ phận</h1>
          <p className="text-sm text-gray-900 mt-0.5">Quản lý các bộ phận trực thuộc phòng ban trong tổ chức.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        {/* Filter */}
        <div className="mb-5 bg-gray-50 p-4 rounded-2xl border border-gray-100">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-bold text-gray-900">Tìm kiếm bộ phận</h3>
            {loading && (
              <div className="flex items-center text-xs text-gray-400 gap-1.5">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                Đang tìm kiếm...
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Tìm kiếm theo tên, mã bộ phận
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field"
                placeholder="Nhập tên hoặc mã bộ phận..."
              />
            </div>
            <div>
              <SelectBox<string>
                label="Phòng ban"
                value={departmentFilter}
                placeholder="Tất cả phòng ban"
                searchable
                options={[
                  { value: '', label: 'Tất cả phòng ban' },
                  ...departments.map((dept) => ({
                    value: String(dept.id),
                    label: dept.name,
                  })),
                ]}
                onChange={setDepartmentFilter}
              />
            </div>
          </div>
        </div>

        {/* List header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Danh sách bộ phận</h2>
            <p className="text-xs text-gray-400 mt-0.5">Tổng số: {totalCount} bộ phận</p>
          </div>
          <button
            className="btn-primary"
            onClick={() => navigate('/dashboard/sections/create')}
          >
            + Thêm bộ phận
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-sm text-gray-500">Đang tải dữ liệu...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="h-12 w-12 bg-red-100 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ExclamationCircleIcon className="h-6 w-6" />
            </div>
            <p className="text-sm font-bold text-gray-900">Đã xảy ra lỗi</p>
            <p className="text-xs text-gray-400 mt-1">{error}</p>
            <button onClick={() => fetchSections()} className="btn-primary mt-4">
              Thử lại
            </button>
          </div>
        ) : (
          <div className="border border-gray-100 rounded-2xl overflow-hidden">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {tableHeaders.map((h) => (
                    <th key={h} className="table-header">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {sections.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-12 w-12 bg-primary-100 text-primary-400 rounded-2xl flex items-center justify-center">
                          <RectangleGroupIcon className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-bold text-gray-900">Chưa có bộ phận nào</p>
                        <p className="text-xs text-gray-400">Bắt đầu bằng cách thêm bộ phận mới</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sections.map((section) => (
                    <tr key={section.id} className="hover:bg-gray-50 transition-colors">
                      <td className="table-cell font-medium">{section.code}</td>
                      <td className="table-cell font-medium">{section.name}</td>
                      <td className="table-cell">{getParentName(section.parent_department)}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-800 max-w-xs truncate">
                          {section.description || 'Không có mô tả'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setViewSection(section)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-primary-600 bg-white border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors"
                          >
                            <EyeIcon className="w-3.5 h-3.5" />
                            Xem
                          </button>
                          <button
                            onClick={() => navigate(`/dashboard/sections/${section.id}/edit`)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-primary-600 bg-white border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors"
                          >
                            <PencilSquareIcon className="w-3.5 h-3.5" />
                            Sửa
                          </button>
                          <button
                            onClick={() => setSectionToDelete(section)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && totalCount > 0 && (
          <div className="mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(totalCount / itemsPerPage)}
              totalItems={totalCount}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(size) => {
                setItemsPerPage(size);
                setCurrentPage(1);
              }}
            />
          </div>
        )}
      </div>

      <SectionDetailDialog
        section={viewSection}
        getParentName={getParentName}
        onClose={() => setViewSection(null)}
        onEdit={(s) => navigate(`/dashboard/sections/${s.id}/edit`)}
      />

      <ConfirmDialog
        open={sectionToDelete !== null}
        variant="danger"
        title="Xóa bộ phận"
        message={sectionToDelete ? `Bạn có chắc chắn muốn xóa bộ phận "${sectionToDelete.name}" (${sectionToDelete.code})?` : ''}
        confirmLabel="Xóa"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setSectionToDelete(null)}
      />
    </div>
  );
};

export default SectionList;
