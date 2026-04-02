import React, { Fragment } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { XMarkIcon, ComputerDesktopIcon, CalendarIcon, UserIcon, BuildingOfficeIcon, ShieldCheckIcon, ShoppingBagIcon, CpuChipIcon, ServerStackIcon, Square3Stack3DIcon, CircleStackIcon, DeviceTabletIcon, BoltIcon, ArrowUturnLeftIcon, IdentificationIcon, TagIcon, BuildingStorefrontIcon, SparklesIcon } from '@heroicons/react/24/outline';
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'IN_USE':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'IDLE':
        return 'bg-amber-100 text-amber-800 border border-amber-200';
      case 'UNDER_MAINTENANCE':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'DAMAGED':
        return 'bg-red-100 text-red-800 border border-red-200';
      case 'RETIRED':
        return 'bg-gray-100 text-gray-800 border border-gray-200';
      case 'NEW':
        return 'bg-purple-100 text-purple-800 border border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'EXCELLENT':
        return 'bg-purple-100 text-purple-800 border border-purple-200';
      case 'GOOD':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'FAIR':
        return 'bg-amber-100 text-amber-800 border border-amber-200';
      case 'POOR':
        return 'bg-orange-100 text-orange-800 border border-orange-200';
      case 'BROKEN':
        return 'bg-red-100 text-red-800 border border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

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
              <DialogPanel className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-3xl">
                {/* Header */}
                <div className="bg-primary-600 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3 text-white">
                    <ComputerDesktopIcon className="h-6 w-6" />
                    <DialogTitle as="h3" className="text-lg font-bold leading-6">
                      Chi tiết tài sản: {asset.asset_code}
                    </DialogTitle>
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
                    {/* Header Identity Section - High prominence for the TA Code */}
                     <div className="md:col-span-2 bg-gradient-to-r from-primary-50 to-white p-5 rounded-2xl border border-primary-100 flex items-center justify-between shadow-sm">
                      <div className="flex items-center space-x-4">
                        <div className="bg-primary-600 p-3 rounded-xl shadow-lg shadow-primary-200">
                          <IdentificationIcon className="h-7 w-7 text-white" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-primary-500 uppercase tracking-[0.2em] mb-0.5">Mã thiết bị dán nhãn</p>
                          <h2 className="text-2xl font-black text-gray-900 tracking-tight">{asset.name}</h2>
                        </div>
                      </div>
                      <div className="text-right hidden sm:block">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">ID Hệ thống</p>
                        <code className="text-xs font-mono bg-white px-2 py-1 rounded border border-gray-100 text-gray-500">{asset.asset_code}</code>
                      </div>
                    </div>

                    {/* General Specifications Grid */}
                    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Loại tài sản */}
                      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center space-x-3 mb-2">
                          <TagIcon className="h-4 w-4 text-primary-500" />
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Loại tài sản</span>
                        </div>
                        <p className="text-sm font-bold text-gray-900">{asset.asset_type_display}</p>
                      </div>

                      {/* Thương hiệu */}
                      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center space-x-3 mb-2">
                          <BuildingStorefrontIcon className="h-4 w-4 text-blue-500" />
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Thương hiệu</span>
                        </div>
                        <p className="text-sm font-bold text-gray-900">{asset.brand || '-'}</p>
                      </div>

                      {/* Model */}
                      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center space-x-3 mb-2">
                          <ComputerDesktopIcon className="h-4 w-4 text-indigo-500" />
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Model thiết bị</span>
                        </div>
                        <p className="text-sm font-bold text-gray-900">{asset.model || '-'}</p>
                      </div>

                      {/* Tình trạng vật lý */}
                      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center space-x-3 mb-2">
                          <SparklesIcon className="h-4 w-4 text-amber-500" />
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tình trạng vật lý</span>
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${getConditionColor(asset.condition)} uppercase tracking-tight`}>
                          {asset.condition_display}
                        </span>
                      </div>
                    </div>

                    {/* Usage & Management Section */}
                    <div className="space-y-4 md:col-span-2">
                      <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b pb-2">Nhân sự phụ trách</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Người sử dụng Card */}
                        <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100 flex items-start space-x-4">
                          <div className="bg-emerald-100 p-2.5 rounded-lg">
                            <UserIcon className="h-6 w-6 text-emerald-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Người đang sử dụng</p>
                            {asset.assigned_to ? (
                              <>
                                <p className="text-base font-bold text-gray-900">{asset.assigned_to_name}</p>
                                <p className="text-sm text-emerald-700">{asset.assigned_to_department_name || 'Phòng ban: -'}</p>
                                <div className="mt-2 flex items-center text-xs text-emerald-600 font-medium">
                                  <CalendarIcon className="h-3 w-3 mr-1" />
                                  Nhận máy ngày: {formatDate(asset.assigned_date)}
                                </div>
                              </>
                            ) : (
                              <p className="text-sm font-medium text-gray-500 italic">Chưa bàn giao cho nhân viên</p>
                            )}
                          </div>
                        </div>

                        {/* Người quản lý Card */}
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex items-start space-x-4">
                          <div className="bg-slate-200 p-2.5 rounded-lg">
                            <ShieldCheckIcon className="h-6 w-6 text-slate-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Đơn vị quản lý kho</p>
                            <p className="text-base font-bold text-gray-900">{asset.managed_by_name || 'Hệ thống tự động'}</p>
                            <p className="text-sm text-slate-600">{asset.department_name || 'Bộ phận: Chưa xác định'}</p>
                            <div className="mt-2 flex items-center">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusColor(asset.status)} uppercase tracking-tight`}>
                                {asset.status_display}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Notes Section - Full width within this block */}
                      <div className="flex flex-col gap-4">
                        {asset.description && (
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <div className="flex items-center space-x-2 mb-2">
                              <SparklesIcon className="h-4 w-4 text-slate-500" />
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Lịch sử & Tình trạng vật tư</p>
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed italic bg-white/60 p-3 rounded-lg border border-white shadow-sm">
                              {asset.description}
                            </p>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {(asset as any).assignment_notes && (
                            <div className="bg-emerald-50/30 p-3 rounded-xl border border-emerald-100">
                               <div className="flex items-center space-x-2 mb-1.5">
                                 <ShieldCheckIcon className="h-4 w-4 text-emerald-500" />
                                 <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-tight">Ghi chú bàn giao hiện tại</p>
                               </div>
                               <p className="text-sm text-emerald-800 font-medium ml-6">"{(asset as any).assignment_notes}"</p>
                            </div>
                          )}
                          {(asset as any).return_notes && (
                            <div className="bg-amber-50/30 p-3 rounded-xl border border-amber-100">
                               <div className="flex items-center space-x-2 mb-1.5">
                                 <ArrowUturnLeftIcon className="h-4 w-4 text-amber-500" />
                                 <p className="text-[10px] font-bold text-amber-600 uppercase tracking-tight">Ghi chú thu hồi gần nhất</p>
                               </div>
                               <p className="text-sm text-amber-800 italic font-medium ml-6">"{(asset as any).return_notes}"</p>
                            </div>
                          )}
                        </div>
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
                    
                    {/* SIM Information */}
                    {asset.asset_type === 'SIM' && asset.specifications && (
                      <div className="md:col-span-2 space-y-4">
                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b pb-2">Thông tin SIM</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="flex items-center space-x-3 bg-green-50 p-3 rounded-xl border border-green-100">
                            <div className="bg-green-100 p-2 rounded-lg">
                              <BoltIcon className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">Số điện thoại</p>
                              <p className="text-sm font-bold text-gray-900">{(asset.specifications as any).phone_number || '-'}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3 bg-green-50 p-3 rounded-xl border border-green-100">
                            <div className="bg-green-100 p-2 rounded-lg">
                              <BuildingOfficeIcon className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">Nhà mạng</p>
                              <p className="text-sm font-bold text-gray-900">{(asset.specifications as any).network_provider || '-'}</p>
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
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
