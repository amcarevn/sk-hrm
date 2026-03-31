import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, ComputerDesktopIcon, CalendarIcon, UserIcon, BuildingOfficeIcon, ShieldCheckIcon, ShoppingBagIcon, CpuChipIcon, ServerStackIcon, Square3Stack3DIcon, CircleStackIcon, DeviceTabletIcon, BoltIcon } from '@heroicons/react/24/outline';
import { Asset } from '../../utils/api';

interface AssetDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: Asset | null;
}

export default function AssetDetailModal({ isOpen, onClose, asset }: AssetDetailModalProps) {
  if (!asset) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN');
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-3xl">
                {/* Header */}
                <div className="bg-primary-600 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3 text-white">
                    <ComputerDesktopIcon className="h-6 w-6" />
                    <Dialog.Title as="h3" className="text-lg font-bold leading-6">
                      Chi tiết tài sản: {asset.asset_code}
                    </Dialog.Title>
                  </div>
                  <button
                    type="button"
                    className="rounded-full p-1 text-white hover:bg-primary-500 transition-colors outline-none"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="px-6 py-6 overflow-y-auto max-h-[80vh]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    {/* General Info Section */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b pb-2">Thông tin chung</h4>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Tên tài sản:</span>
                        <span className="text-sm font-semibold text-gray-900">{asset.name}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Loại tài sản:</span>
                        <span className="text-sm font-medium text-gray-900">{asset.asset_type_display}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Thương hiệu / Model:</span>
                        <span className="text-sm font-medium text-gray-900">{asset.brand} {asset.model}</span>
                      </div>


                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Tình trạng:</span>
                        <span className="text-sm font-semibold text-primary-600">{asset.condition_display}</span>
                      </div>
                    </div>

                    {/* Assignment Info Section */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b pb-2">Sử dụng & Quản lý</h4>
                      
                      <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-100">
                        <div className="flex items-start space-x-3">
                          <UserIcon className="h-5 w-5 text-primary-500 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500">Người sử dụng/quản lý</p>
                            <p className="text-sm font-bold text-gray-900">{asset.assigned_to_name || 'Chưa bàn giao'}</p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <BuildingOfficeIcon className="h-5 w-5 text-blue-500 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500">Phòng ban quản lý</p>
                            <p className="text-sm font-bold text-gray-900">{asset.department_name || 'Chưa gán'}</p>
                          </div>
                        </div>

                        {asset.assigned_date && (
                          <div className="flex items-start space-x-3">
                            <CalendarIcon className="h-5 w-5 text-green-500 mt-0.5" />
                            <div>
                              <p className="text-xs text-gray-500">Ngày bàn giao</p>
                              <p className="text-sm font-medium text-gray-900">{formatDate(asset.assigned_date)}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Desktop Configuration - Full width if applicable */}
                    {asset.asset_type === 'DESKTOP' && asset.specifications && (
                      <div className="md:col-span-2 space-y-4">
                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b pb-2">Cấu hình máy tính</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {/* CPU */}
                          <div className="flex items-center space-x-3 bg-slate-50 p-3 rounded-xl border border-slate-100 hover:border-primary-200 transition-colors">
                            <div className="bg-primary-100 p-2 rounded-lg">
                              <CpuChipIcon className="h-5 w-5 text-primary-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">CPU</p>
                              <p className="text-sm font-bold text-gray-900 truncate" title={asset.specifications.cpu}>{asset.specifications.cpu || '-'}</p>
                            </div>
                          </div>

                          {/* Mainboard */}
                          <div className="flex items-center space-x-3 bg-slate-50 p-3 rounded-xl border border-slate-100 hover:border-primary-200 transition-colors">
                            <div className="bg-emerald-100 p-2 rounded-lg">
                              <ServerStackIcon className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">Mainboard</p>
                              <p className="text-sm font-bold text-gray-900 truncate" title={asset.specifications.mainboard}>{asset.specifications.mainboard || '-'}</p>
                            </div>
                          </div>

                          {/* RAM */}
                          <div className="flex items-center space-x-3 bg-slate-50 p-3 rounded-xl border border-slate-100 hover:border-primary-200 transition-colors">
                            <div className="bg-amber-100 p-2 rounded-lg">
                              <Square3Stack3DIcon className="h-5 w-5 text-amber-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">RAM Capacity</p>
                              <p className="text-sm font-bold text-gray-900 truncate" title={asset.specifications.ram}>{asset.specifications.ram || '-'}</p>
                            </div>
                          </div>

                          {/* Storage */}
                          <div className="flex items-center space-x-3 bg-slate-50 p-3 rounded-xl border border-slate-100 hover:border-primary-200 transition-colors">
                            <div className="bg-indigo-100 p-2 rounded-lg">
                              <CircleStackIcon className="h-5 w-5 text-indigo-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">Ổ cứng</p>
                              <p className="text-sm font-bold text-gray-900 truncate" title={asset.specifications.storage}>{asset.specifications.storage || '-'}</p>
                            </div>
                          </div>

                          {/* VGA */}
                          <div className="flex items-center space-x-3 bg-slate-50 p-3 rounded-xl border border-slate-100 hover:border-primary-200 transition-colors">
                            <div className="bg-rose-100 p-2 rounded-lg">
                              <DeviceTabletIcon className="h-5 w-5 text-rose-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">VGA</p>
                              <p className="text-sm font-bold text-gray-900 truncate" title={asset.specifications.vga}>{asset.specifications.vga || '-'}</p>
                            </div>
                          </div>

                          {/* Power */}
                          <div className="flex items-center space-x-3 bg-slate-50 p-3 rounded-xl border border-slate-100 hover:border-primary-200 transition-colors">
                            <div className="bg-yellow-100 p-2 rounded-lg">
                              <BoltIcon className="h-5 w-5 text-yellow-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">Nguồn</p>
                              <p className="text-sm font-bold text-gray-900 truncate" title={asset.specifications.power_supply}>{asset.specifications.power_supply || '-'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Purchase Info Section */}
                    <div className="md:col-span-2 space-y-4 mt-2">
                      <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b pb-2">Thông tin mua hàng & Bảo hành</h4>
                      <div className="space-y-4 bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <div className="flex items-start space-x-3">
                          <ShoppingBagIcon className="h-5 w-5 text-orange-500 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500">Nhà cung cấp</p>
                            <p className="text-sm font-bold text-gray-900">{asset.supplier || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <CalendarIcon className="h-5 w-5 text-blue-500 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500">Ngày mua</p>
                            <p className="text-sm font-bold text-gray-900">{formatDate(asset.purchase_date)}</p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <ShieldCheckIcon className="h-5 w-5 text-red-500 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500">Hết hạn bảo hành</p>
                            <p className="text-sm font-bold text-gray-900">{formatDate(asset.warranty_expiry)}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Notes Section */}
                    {asset.description && (
                      <div className="md:col-span-2 space-y-2 mt-2">
                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b pb-2">Ghi chú</h4>
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100 italic">
                          "{asset.description}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse rounded-b-2xl">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-xl bg-primary-600 px-6 py-2 text-sm font-bold text-white shadow-sm hover:bg-primary-700 sm:ml-3 sm:w-auto transition-all"
                    onClick={onClose}
                  >
                    Đóng
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
