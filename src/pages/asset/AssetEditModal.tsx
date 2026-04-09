import React, { Fragment, useState, useEffect } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { assetsAPI, departmentsAPI, employeesAPI, Asset } from '../../utils/api';
import { SelectBox, SelectOption } from '../../components/LandingLayout/SelectBox';

interface AssetEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  asset: Asset | null;
}

const ASSET_TYPES: SelectOption<string>[] = [
  { value: 'LAPTOP', label: 'Laptop' },
  { value: 'DESKTOP', label: 'Máy tính để bàn' },
  { value: 'MONITOR', label: 'Màn hình' },
  { value: 'SIM', label: 'Sim' },
  { value: 'PHONE', label: 'Điện thoại' },
  { value: 'TABLET', label: 'Máy tính bảng' },
  { value: 'PRINTER', label: 'Máy in' },
  { value: 'SCANNER', label: 'Máy scan' },
  { value: 'NETWORK', label: 'Thiết bị mạng' },
  { value: 'SERVER', label: 'Máy chủ' },
  { value: 'FURNITURE', label: 'Nội thất' },
  { value: 'VEHICLE', label: 'Phương tiện' },
  { value: 'OTHER', label: 'Khác' },
];

const ASSET_CONDITIONS: SelectOption<string>[] = [
  { value: 'EXCELLENT', label: 'Mới 100%' },
  { value: 'GOOD', label: 'Cũ (Chất lượng tốt)' },
  { value: 'FAIR', label: 'Cũ (Trầy xước / Cấn móp)' },
  { value: 'POOR', label: 'Cũ (Kém / Lỗi chức năng)' },
  { value: 'BROKEN', label: 'Hỏng (Không hoạt động)' },
];

const ASSET_STATUSES: SelectOption<string>[] = [
  { value: 'NEW', label: 'Sẵn dùng (Mới 100%)' },
  { value: 'IDLE', label: 'Sẵn dùng (Trong kho)' },
  { value: 'IN_USE', label: 'Đang sử dụng' },
  { value: 'UNDER_MAINTENANCE', label: 'Đang sửa chữa / Bảo hành' },
  { value: 'DAMAGED', label: 'Lỗi / Chờ thanh lý' },
  { value: 'RETIRED', label: 'Đã thanh lý' },
  { value: 'LOST', label: 'Bị mất' },
];

const NETWORK_PROVIDERS: SelectOption<string>[] = [
  { value: 'Viettel', label: 'Viettel' },
  { value: 'Vinaphone', label: 'Vinaphone' },
  { value: 'Mobifone', label: 'Mobifone' },
  { value: 'Vietnamobile', label: 'Vietnamobile' },
];

export default function AssetEditModal({ isOpen, onClose, onSuccess, asset }: AssetEditModalProps) {
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<SelectOption<string>[]>([]);
  const [employees, setEmployees] = useState<SelectOption<string>[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    asset_type: 'LAPTOP',
    model: '',
    status: 'NEW',
    condition: 'EXCELLENT',
    purchase_date: '',
    supplier: '',
    department: '',
    managed_by: '',
    description: '',
    // Desktop specific fields
    cpu: '',
    mainboard: '',
    ram: '',
    storage: '',
    vga: '',
    power_supply: '',
    // MONITOR specific fields
    monitor_quantity: '',
    // SIM specific fields
    phone_number: '',
    network_provider: '',
    // OTHER specific fields
    other_type_name: '',
  });

  /**
   * Khởi chạy khi Modal được mở, gán dữ liệu từ prop asset vào form
   */
  useEffect(() => {
    if (isOpen && asset) {
      setLoading(true);
      assetsAPI.getById(asset.id)
        .then((fullAsset) => {
          const specs = fullAsset.specifications || {};
          setFormData({
            name: fullAsset.name || '',
            asset_type: fullAsset.asset_type || 'LAPTOP',
            model: fullAsset.model || '',
            status: fullAsset.status || 'NEW',
            condition: fullAsset.condition || 'EXCELLENT',
            purchase_date: fullAsset.purchase_date || '',
            supplier: fullAsset.supplier || '',
            department: fullAsset.department ? String(fullAsset.department) : '',
            managed_by: fullAsset.managed_by ? String(fullAsset.managed_by) : '',
            description: fullAsset.description || '',
            // Specs fields
            cpu: specs.cpu || '',
            mainboard: specs.mainboard || '',
            ram: specs.ram || '',
            storage: specs.storage || '',
            vga: specs.vga || '',
            power_supply: specs.power_supply || '',
            monitor_quantity: String((specs as any).quantity || ''),
            phone_number: (specs as any).phone_number || '',
            network_provider: (specs as any).network_provider || '',
            other_type_name: (specs as any).type_name || '',
          });
        })
        .catch((error) => {
          console.error('Error fetching asset details:', error);
          const specs = asset.specifications || {};
          setFormData({
            name: asset.name || '',
            asset_type: asset.asset_type || 'LAPTOP',
            model: asset.model || '',
            status: asset.status || 'NEW',
            condition: asset.condition || 'EXCELLENT',
            purchase_date: asset.purchase_date || '',
            supplier: asset.supplier || '',
            department: '',
            managed_by: '',
            description: asset.description || '',
            cpu: specs.cpu || '',
            mainboard: specs.mainboard || '',
            ram: specs.ram || '',
            storage: specs.storage || '',
            vga: specs.vga || '',
            power_supply: specs.power_supply || '',
            monitor_quantity: String((specs as any).quantity || ''),
            phone_number: (specs as any).phone_number || '',
            network_provider: (specs as any).network_provider || '',
            other_type_name: (specs as any).type_name || '',
          });
        })
        .finally(() => {
          setLoading(false);
        });
      
      fetchDepartments();
    }
  }, [isOpen, asset]);

  /**
   * Tự động lọc danh sách Nhân viên mỗi khi Phòng ban quản lý thay đổi
   */
  useEffect(() => {
    if (isOpen && formData.department) {
      fetchEmployees(formData.department);
    } else if (isOpen && !formData.department) {
      setEmployees([]);
    }
  }, [formData.department, isOpen]);

  /**
   * Lấy danh sách Phòng ban từ API
   */
  const fetchDepartments = async () => {
    try {
      const data = await departmentsAPI.list({ page_size: 100 });
      const options = (data.results || []).map(dept => ({
        value: String(dept.id),
        label: dept.name
      }));
      setDepartments(options);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  /**
   * Lấy danh sách Nhân viên, hỗ trợ lọc theo phòng ban
   */
  const fetchEmployees = async (departmentId?: string) => {
    try {
      const params: any = { page_size: 200, is_active: true };
      if (departmentId) {
        params.department = parseInt(departmentId);
      }
      
      const data = await employeesAPI.list(params);
      const options = (data.results || []).map(emp => ({
        value: String(emp.id),
        label: `${emp.full_name} (${emp.employee_id})`
      }));
      setEmployees(options);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const isFormValid = () => {
    return formData.name && formData.name.trim() !== '';
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /**
   * Gửi dữ liệu cập nhật lên Server
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset) return;
    
    setLoading(true);
    try {
      const { cpu, mainboard, ram, storage, vga, power_supply, monitor_quantity, phone_number, network_provider, other_type_name, ...baseData } = formData;

      let specifications = {};
      if (formData.asset_type === 'DESKTOP') {
        specifications = { cpu, mainboard, ram, storage, vga, power_supply };
      } else if (formData.asset_type === 'MONITOR') {
        specifications = { quantity: parseInt(monitor_quantity) || 0 };
      } else if (formData.asset_type === 'SIM') {
        specifications = { phone_number, network_provider };
      } else if (formData.asset_type === 'OTHER') {
        specifications = { type_name: other_type_name };
      }

      const payload = {
        ...baseData,
        purchase_date: formData.purchase_date || null,
        department_id: formData.department ? parseInt(formData.department) : null,
        managed_by_id: formData.managed_by ? parseInt(formData.managed_by) : null,
        specifications
      };
      
      console.log('--- Cập nhật tài sản ---');
      console.log('Payload:', JSON.stringify(payload, null, 2));
      
      const response = await assetsAPI.update(asset.id, payload as any);
      
      console.log('--- Phản hồi từ Server ---');
      console.log('Data:', response);
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating asset:', error);
      alert('Có lỗi xảy ra khi cập nhật tài sản. Vui lòng kiểm tra lại.');
    } finally {
      setLoading(false);
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
              <DialogPanel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 w-full text-center sm:mt-0 sm:text-left">
                    <DialogTitle as="h3" className="text-lg font-semibold leading-6 text-gray-900 border-b pb-3">
                      Chỉnh sửa tài sản
                    </DialogTitle>
                    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                      <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                        <div className="sm:col-span-1">
                          <label className="block text-sm font-medium text-gray-500">Mã</label>
                          <div className="mt-1 block w-full px-3 py-2 bg-gray-100 rounded-md text-gray-700 sm:text-sm border border-gray-200">
                            {asset?.asset_code}
                          </div>
                        </div>

                        <div className="sm:col-span-1">
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Mã thiết bị (Dán nhãn)</label>
                          <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" placeholder="Nhập mã thiết bị (VD: TA0123...)" />
                        </div>

                        {/* Thay đổi Loại tài sản thành Tên tài sản */}
                        <SelectBox
                          label="Tên tài sản (Phân loại)"
                          value={formData.asset_type}
                          options={ASSET_TYPES}
                          onChange={(val) => handleSelectChange('asset_type', val)}
                        />

                        {/* Tình trạng */}
                        <SelectBox
                          label="Tình trạng (Vật lý)"
                          value={formData.condition}
                          options={ASSET_CONDITIONS}
                          onChange={(val) => handleSelectChange('condition', val)}
                        />

                        {/* Trạng thái */}
                        <SelectBox
                          label="Trạng thái (Vận hành)"
                          value={formData.status}
                          options={ASSET_STATUSES}
                          onChange={(val) => handleSelectChange('status', val)}
                        />

                        {/* Desktop Specific Fields (CPU, MAIN, RAM, Ổ CỨNG, VGA, NGUỒN) */}
                        {formData.asset_type === 'DESKTOP' && (
                          <div className="sm:col-span-2 grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2 bg-blue-50/50 p-4 rounded-xl border border-blue-100 mb-4">
                            <div className="sm:col-span-2">
                              <h4 className="text-sm font-semibold text-blue-900 flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                Cấu hình chi tiết (Máy tính để bàn)
                              </h4>
                            </div>
                            
                            {/* CPU */}
                            <div>
                              <label htmlFor="cpu" className="block text-sm font-medium text-gray-700">Cpu</label>
                              <input type="text" name="cpu" id="cpu" value={formData.cpu} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" placeholder="VD: Core i7-13700K" />
                            </div>

                            {/* Mainboard */}
                            <div>
                              <label htmlFor="mainboard" className="block text-sm font-medium text-gray-700">Main</label>
                              <input type="text" name="mainboard" id="mainboard" value={formData.mainboard} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" placeholder="VD: ASUS Z790-P" />
                            </div>

                            {/* RAM */}
                            <div>
                              <label htmlFor="ram" className="block text-sm font-medium text-gray-700">Ram</label>
                              <input type="text" name="ram" id="ram" value={formData.ram} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" placeholder="VD: 32GB (16GBx2) DDR5" />
                            </div>

                            {/* Storage */}
                            <div>
                              <label htmlFor="storage" className="block text-sm font-medium text-gray-700">Ổ cứng</label>
                              <input type="text" name="storage" id="storage" value={formData.storage} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" placeholder="VD: SSD 1TB Samsung 980 Pro" />
                            </div>

                            {/* VGA */}
                            <div>
                              <label htmlFor="vga" className="block text-sm font-medium text-gray-700">Vga</label>
                              <input type="text" name="vga" id="vga" value={formData.vga} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" placeholder="VD: RTX 4070 Ti 12GB" />
                            </div>

                            {/* Power Supply */}
                            <div>
                              <label htmlFor="power_supply" className="block text-sm font-medium text-gray-700">Nguồn</label>
                              <input type="text" name="power_supply" id="power_supply" value={formData.power_supply} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" placeholder="VD: Corsair RM850e 850W" />
                            </div>
                          </div>
                        )}

                        {/* MONITOR Specific Fields (Số lượng) */}
                        {formData.asset_type === 'MONITOR' && (
                          <div className="sm:col-span-2 bg-purple-50/60 p-4 rounded-xl border border-purple-100 mb-4">
                            <h4 className="text-xs font-semibold uppercase tracking-wide text-purple-500 mb-3 flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                              Thông tin Màn hình
                            </h4>
                            <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                              <div>
                                <label htmlFor="monitor_quantity" className="block text-sm font-medium text-gray-700">Số lượng</label>
                                <input type="number" name="monitor_quantity" id="monitor_quantity" min="1" step="1"
                                  value={formData.monitor_quantity} onChange={handleChange}
                                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                  placeholder="VD: 1, 2, 3..." />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* SIM Specific Fields (Số điện thoại, Nhà mạng) */}
                        {formData.asset_type === 'SIM' && (
                          <div className="sm:col-span-2 grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2 bg-green-50/50 p-4 rounded-xl border border-green-100 mb-4">
                            <div className="sm:col-span-2">
                              <h4 className="text-sm font-semibold text-green-900 flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                Thông tin Sim
                              </h4>
                            </div>
                            
                            <div>
                              <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700">Số điện thoại</label>
                              <input type="text" name="phone_number" id="phone_number" value={(formData as any).phone_number} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" placeholder="VD: 0912345678" />
                            </div>

                            <SelectBox
                              label="Nhà mạng"
                              value={(formData as any).network_provider}
                              options={NETWORK_PROVIDERS}
                              onChange={(val) => handleSelectChange('network_provider', val)}
                            />
                          </div>
                        )}

                        {/* OTHER Specific Fields (Tên loại chi tiết) */}
                        {formData.asset_type === 'OTHER' && (
                          <div className="sm:col-span-2 grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2 bg-gray-50/50 p-4 rounded-xl border border-gray-200 mb-4">
                            <div className="sm:col-span-2">
                              <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-1">
                                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                                Tên loại tài sản (Khác)
                              </h4>
                            </div>
                            <div className="sm:col-span-2">
                              <input
                                type="text"
                                name="other_type_name"
                                id="other_type_name"
                                value={(formData as any).other_type_name}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                placeholder="Ví dụ: Máy chiếu, Camera, Bàn làm việc..."
                              />
                            </div>
                          </div>
                        )}


                        {/* Model */}
                        <div>
                          <label htmlFor="model" className="block text-sm font-medium text-gray-700">Model</label>
                          <input type="text" name="model" id="model" value={formData.model} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
                        </div>

                        {/* Nhà cung cấp */}
                        <div>
                          <label htmlFor="supplier" className="block text-sm font-medium text-gray-700">Nhà cung cấp</label>
                          <input type="text" name="supplier" id="supplier" value={formData.supplier} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
                        </div>

                        {/* Ngày mua */}
                        <div>
                          <label htmlFor="purchase_date" className="block text-sm font-medium text-gray-700">Ngày mua</label>
                          <input type="date" name="purchase_date" id="purchase_date" value={formData.purchase_date} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
                        </div>

                        {/* Thời hạn bảo hành */}

                        {/* Phòng ban quản lý */}
                        <SelectBox label="Phòng ban quản lý" value={formData.department} options={departments} onChange={(val) => handleSelectChange('department', val)} placeholder="-- Chọn phòng ban --" />

                        {/* Người quản lý (Kho) */}
                        {formData.department && (
                          <SelectBox label="Người quản lý (Kho)" value={formData.managed_by} options={employees} onChange={(val) => handleSelectChange('managed_by', val)} placeholder="-- Chọn người quản lý --" />
                        )}

                        {/* Mô tả / Ghi chú */}
                        <div className="sm:col-span-2">
                          <label htmlFor="description" className="block text-sm font-medium text-gray-700">Mô tả / Ghi chú</label>
                          <textarea id="description" name="description" rows={3} value={formData.description} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
                        </div>
                      </div>

                      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse space-x-reverse space-x-3">
                        <button
                          type="submit"
                          disabled={loading || !isFormValid()}
                          className={`inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm sm:ml-3 sm:w-auto transition-all ${isFormValid() ? 'bg-primary-600 hover:bg-primary-700' : 'bg-gray-300 curson-not-allowed'}`}
                        >
                          {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </button>
                        <button type="button" className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto" onClick={onClose}>Hủy</button>
                      </div>
                    </form>
                  </div>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
