import React, { useState, useEffect, Fragment, useCallback, useMemo } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { XMarkIcon, UserIcon } from '@heroicons/react/24/outline';
import { Asset, assetsAPI, employeesAPI } from '../../utils/api';
import { SelectBox, SelectOption } from '../../components/LandingLayout/SelectBox';
interface AssetAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  asset: Asset;
}

const QUICK_STATUS_TAGS = [
  'Mới 100%',
  'Bình thường',
  'Trầy xước nhẹ',
  'Móp méo vỏ',
  'Màn hình ố/đốm',
  'Bàn phím kẹt',
  'Thiếu phụ kiện',
  'Hỏng hóc nhẹ',
  'Đã vệ sinh sạch'
];

export default function AssetAssignModal({ isOpen, onClose, onSuccess, asset }: AssetAssignModalProps) {
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [employees, setEmployees] = useState<SelectOption<string>[]>([]);
  const [formData, setFormData] = useState({
    employee_id: '',
    assigned_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const fetchEmployees = useCallback(async () => {
    try {
      // Get all active employees since an asset can be assigned to anyone, not just in the same department
      const data = await employeesAPI.list({ page_size: 500, is_active: true });
      const options = (data.results || []).map((emp) => ({
        value: String(emp.id),
        label: `${emp.full_name} (${emp.employee_id}) - ${emp.department?.name || 'Loading...'}`,
      }));
      setEmployees(options);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        employee_id: asset.assigned_to ? String(asset.assigned_to) : '',
        assigned_date: new Date().toISOString().split('T')[0],
        notes: '',
      });
      fetchEmployees();
    }
  }, [isOpen, asset, fetchEmployees]);

  const handleEmployeeChange = useCallback((val: string) => {
    setFormData((prev) => ({ ...prev, employee_id: val }));
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleTagClick = useCallback((tag: string) => {
    setFormData((prev) => {
      const currentNotes = prev.notes.trim();
      if (!currentNotes) return { ...prev, notes: tag };
      if (currentNotes.includes(tag)) return prev; // Avoid duplicates
      return { ...prev, notes: `${currentNotes}, ${tag}` };
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent, isForced = false) => {
    if (e) e.preventDefault();
    const selectedId = parseInt(formData.employee_id);
    const currentId = asset.assigned_to;

    // Senior UX: If selecting the SAME person, just close the modal
    if (selectedId === currentId) {
      onClose();
      return;
    }

    // Senior UX: Check if asset is already assigned to someone else
    // and if we haven't shown the confirmation yet
    if (currentId && !isForced) {
      setShowConfirmDialog(true);
      return;
    }

    setLoading(true);
    try {
      await assetsAPI.assign(asset.id, {
        employee_id: parseInt(formData.employee_id),
        assigned_date: formData.assigned_date,
        notes: formData.notes,
        force: isForced, // Tell backend to auto-return the previous assignment
      });
      onSuccess();
      onClose();
      setShowConfirmDialog(false);
    } catch (error: any) {
      console.error('Error assigning asset:', error);
      const serverError = error.response?.data?.error || 'Có lỗi xảy ra khi bàn giao tài sản.';
      alert(serverError);
    } finally {
      setLoading(false);
    }
  };

  const isUnusable = asset.condition === 'BROKEN' || asset.condition === 'POOR';
  const isFormValid = formData.employee_id.trim() !== '' && !isUnusable;

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </TransitionChild>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <DialogPanel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <span className="sr-only">Đóng</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                    <DialogTitle as="h3" className="text-xl font-semibold leading-6 text-gray-900 border-b pb-3 border-gray-200">
                      Bàn giao tài sản thiết bị
                    </DialogTitle>
                    <div className={`mt-4 mb-4 p-4 rounded-xl border ${asset.assigned_to_name ? 'bg-amber-50 border-amber-200' : 'bg-primary-50 border-primary-100'}`}>
                      <div className="flex justify-between items-start">
                        <p className={`text-sm ${asset.assigned_to_name ? 'text-amber-800' : 'text-primary-800'}`}>
                          <strong>Tài sản:</strong> [{asset.asset_code}] {asset.name}
                        </p>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold border uppercase tracking-tight ${
                          asset.condition === 'EXCELLENT' ? 'bg-green-100 text-green-700 border-green-200' :
                          asset.condition === 'GOOD' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                          asset.condition === 'FAIR' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                          'bg-red-100 text-red-700 border-red-200'
                        }`}>
                          {asset.condition_display}
                        </span>
                      </div>
                      {asset.assigned_to_name && (
                        <div className="mt-3 bg-white/60 backdrop-blur-sm rounded-lg p-2.5 border border-amber-200">
                          <p className="text-xs text-amber-700 flex items-center gap-2 font-semibold">
                            <UserIcon className="h-4 w-4 text-amber-500" />
                            Đang được sử dụng bởi: <span className="text-amber-900">{asset.assigned_to_name}</span>
                          </p>
                        </div>
                      )}
                      {isUnusable && (
                        <div className="mt-3 bg-rose-50 border-rose-200 border rounded-lg p-3">
                          <p className="text-xs text-rose-700 font-bold flex items-center gap-2 uppercase tracking-wide">
                            <svg className="h-4 w-4 text-rose-500" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0zm-9 3.75h.008v.008H12v-.008z" />
                            </svg>
                            Không thể bàn giao: Tình trạng thiết bị hỏng hoặc kém ({asset.condition_display})
                          </p>
                          <p className="text-[10px] text-rose-600 mt-1 italic">Vui lòng điều chỉnh tình trạng vật lý sang Tốt hoặc Bình thường trước khi thực hiện bàn giao.</p>
                        </div>
                      )}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      <SelectBox
                        label="Nhân viên nhận bàn giao"
                        value={formData.employee_id}
                        options={employees}
                        onChange={handleEmployeeChange}
                        placeholder="Tìm kiếm mã, tên nhân viên"
                        searchable={true}
                      />

                      <div>
                        <label htmlFor="assigned_date" className="block text-sm font-medium text-gray-700">Ngày bàn giao</label>
                        <input
                          type="date"
                          name="assigned_date"
                          id="assigned_date"
                          value={formData.assigned_date}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          required
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-end mb-1">
                          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Ghi chú tình trạng lúc giao</label>
                          <span className="text-[10px] text-gray-400">Chọn nhanh bên dưới</span>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mb-2">
                          {QUICK_STATUS_TAGS.map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => handleTagClick(tag)}
                              className="inline-flex items-center rounded-full bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10 hover:bg-indigo-50 hover:text-indigo-700 hover:ring-indigo-700/30 transition-all active:scale-95"
                            >
                              + {tag}
                            </button>
                          ))}
                        </div>

                        <textarea
                          name="notes"
                          id="notes"
                          rows={3}
                          value={formData.notes}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          placeholder="Mô tả cụ thể tình trạng (VD: Chuột móp, màn trầy...)"
                        />
                      </div>

                      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <button
                          type="submit"
                          disabled={loading || !isFormValid}
                          className={`inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm sm:ml-3 sm:w-auto ${isFormValid ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-300 cursor-not-allowed'
                            }`}
                        >
                          {loading ? 'Đang lưu...' : 'Xác nhận Bàn Giao'}
                        </button>
                        <button
                          type="button"
                          className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                          onClick={onClose}
                        >
                          Hủy
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>

      {/* Confirmation Dialog for Forced Transfer - Senior UX Style */}
      <Transition show={showConfirmDialog} as={Fragment}>
        <Dialog as="div" className="relative z-[60]" onClose={() => setShowConfirmDialog(false)}>
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" />
          </TransitionChild>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <TransitionChild
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <DialogPanel className="relative transform overflow-hidden rounded-2xl bg-white p-6 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-md">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 sm:mx-0 sm:h-10 sm:w-10">
                      <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                      </svg>
                    </div>
                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                      <DialogTitle as="h3" className="text-base font-bold leading-6 text-gray-900 uppercase">
                        Xác nhận điều chuyển tài sản
                      </DialogTitle>
                      <div className="mt-3 bg-amber-50 p-3 rounded-lg border border-amber-100 italic">
                        <p className="text-sm text-gray-600">
                          Máy này hiện đang thuộc về <span className="text-amber-800 font-bold underline">{asset.assigned_to_name}</span>.
                        </p>
                      </div>
                      <p className="text-sm text-gray-500 mt-3 leading-relaxed">
                        Việc tiếp tục bàn giao sẽ tự động thực hiện quy trình **Thu hồi** từ người cũ và **Cấp phát** cho người mới ngay lập tức. Bạn có chắc chắn muốn thực hiện?
                      </p>
                    </div>
                  </div>
                  <div className="mt-6 flex flex-col sm:flex-row-reverse gap-3">
                    <button
                      type="button"
                      disabled={loading}
                      className="inline-flex w-full justify-center rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-amber-700 transition-all active:scale-95 disabled:bg-amber-300"
                      onClick={() => handleSubmit(null as any, true)}
                    >
                      {loading ? 'Đang xử lý...' : 'Xác nhận Điều chuyển'}
                    </button>
                    <button
                      type="button"
                      className="inline-flex w-full justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-all active:scale-95"
                      onClick={() => setShowConfirmDialog(false)}
                    >
                      Hủy thao tác
                    </button>
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>
    </Transition>
  );
}
