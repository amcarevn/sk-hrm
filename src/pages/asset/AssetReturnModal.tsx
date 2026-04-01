import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Asset, assetsAPI } from '../../utils/api';
import { SelectBox } from '../../components/LandingLayout/SelectBox';

interface AssetReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  asset: Asset;
}

const CONDITION_OPTIONS = [
  { value: 'EXCELLENT', label: 'Rất tốt' },
  { value: 'GOOD', label: 'Tốt' },
  { value: 'FAIR', label: 'Khá' },
  { value: 'POOR', label: 'Kém' },
  { value: 'BROKEN', label: 'Hỏng' },
];

export default function AssetReturnModal({ isOpen, onClose, onSuccess, asset }: AssetReturnModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    return_date: new Date().toISOString().split('T')[0],
    condition: 'GOOD',
    notes: '',
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        return_date: new Date().toISOString().split('T')[0],
        condition: asset.condition || 'GOOD',
        notes: '',
      });
    }
  }, [isOpen, asset]);

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    try {
      await assetsAPI.returnAsset(asset.id, {
        return_date: formData.return_date,
        condition: formData.condition,
        notes: formData.notes,
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error returning asset:', error);
      alert('Có lỗi xảy ra khi thu hồi tài sản. Vui lòng kiểm tra lại.');
    } finally {
      setLoading(false);
    }
  };

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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md sm:p-6">
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
                      Thu hồi tài sản về kho
                    </Dialog.Title>
                    <div className="mt-4 mb-4 bg-amber-50 p-3 rounded-md">
                      <p className="text-sm text-amber-800">
                        <strong>Tài sản đang thu hồi:</strong> [{asset.asset_code}] {asset.name}
                      </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label htmlFor="return_date" className="block text-sm font-medium text-gray-700">Ngày thu hồi</label>
                        <input
                          type="date"
                          name="return_date"
                          id="return_date"
                          value={formData.return_date}
                          onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          required
                        />
                      </div>

                      <SelectBox
                        label="Tình trạng lúc thu hồi"
                        value={formData.condition}
                        options={CONDITION_OPTIONS}
                        onChange={(val) => handleChange('condition', val)}
                      />

                      <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Ghi chú (Lý do mất, hỏng, v.v)</label>
                        <textarea
                          name="notes"
                          id="notes"
                          rows={3}
                          value={formData.notes}
                          onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                      </div>

                      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <button
                          type="submit"
                          disabled={loading}
                          className="inline-flex w-full justify-center rounded-md bg-amber-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 sm:ml-3 sm:w-auto"
                        >
                          {loading ? 'Đang lưu...' : 'Xác nhận Thu Hồi'}
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
