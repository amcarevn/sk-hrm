import React, { useState, useEffect, Fragment, useCallback, useMemo } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Asset, assetsAPI, employeesAPI } from '../../utils/api';
import { SelectBox, SelectOption } from '../../components/LandingLayout/SelectBox';
interface AssetAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  asset: Asset;
}

export default function AssetAssignModal({ isOpen, onClose, onSuccess, asset }: AssetAssignModalProps) {
  const [loading, setLoading] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employee_id) return;

    setLoading(true);
    try {
      await assetsAPI.assign(asset.id, {
        employee_id: parseInt(formData.employee_id),
        assigned_date: formData.assigned_date,
        notes: formData.notes,
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error assigning asset:', error);
      alert('Có lỗi xảy ra khi bàn giao tài sản.');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.employee_id.trim() !== '';

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
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
                    <Dialog.Title as="h3" className="text-xl font-semibold leading-6 text-gray-900 border-b pb-3 border-gray-200">
                      Bàn giao tài sản thiết bị
                    </Dialog.Title>
                    <div className="mt-4 mb-4 bg-blue-50 p-3 rounded-md">
                      <p className="text-sm text-blue-800">
                        <strong>Tài sản:</strong> [{asset.asset_code}] {asset.name}
                      </p>
                      {asset.assigned_to_name && (
                        <p className="text-sm text-amber-600 mt-1">
                          Đang bàn giao cho: <strong>{asset.assigned_to_name}</strong> (Nếu chọn nhân viên mới sẽ tiến hành luân chuyển).
                        </p>
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
                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Ghi chú tình trạng lúc giao</label>
                        <textarea
                          name="notes"
                          id="notes"
                          rows={3}
                          value={formData.notes}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          placeholder="Chuột móp, màn trầy..."
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
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
