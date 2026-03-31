import React, { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
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
  { value: 'EXCELLENT', label: 'Rất tốt' },
  { value: 'GOOD', label: 'Tốt' },
  { value: 'FAIR', label: 'Khá' },
  { value: 'POOR', label: 'Kém' },
  { value: 'BROKEN', label: 'Hỏng' },
];

export default function AssetEditModal({ isOpen, onClose, onSuccess, asset }: AssetEditModalProps) {
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<SelectOption<string>[]>([]);
  const [employees, setEmployees] = useState<SelectOption<string>[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    model: '',
    condition: 'EXCELLENT',
    purchase_date: '',
    warranty_period: '12',
    supplier: '',
    department: '',
    assigned_to: '',
    description: '',
    // Desktop specific fields
    cpu: '',
    mainboard: '',
    ram: '',
    storage: '',
    vga: '',
    power_supply: '',
  });

  /**
   * Khởi chạy khi Modal được mở, gán dữ liệu từ prop asset vào form
   */
  useEffect(() => {
    if (isOpen && asset) {
      const specs = asset.specifications || {};
      setFormData({
        name: asset.name || '',
        asset_type: asset.asset_type || 'LAPTOP',
        model: asset.model || '',
        condition: asset.condition || 'EXCELLENT',
        purchase_date: asset.purchase_date || '',
        warranty_period: String(asset.warranty_period || '12'),
        supplier: asset.supplier || '',
        department: asset.department ? String(asset.department) : '',
        assigned_to: asset.assigned_to ? String(asset.assigned_to) : '',
        description: asset.description || '',
        // Desktop specific fields từ JSON specifications
        cpu: specs.cpu || '',
        mainboard: specs.mainboard || '',
        ram: specs.ram || '',
        storage: specs.storage || '',
        vga: specs.vga || '',
        power_supply: specs.power_supply || '',
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
      const { cpu, mainboard, ram, storage, vga, power_supply, ...baseData } = formData;
      
      const payload = {
        ...baseData,
        warranty_period: parseInt(formData.warranty_period),
        department: formData.department ? parseInt(formData.department) : null,
        assigned_to: formData.assigned_to ? parseInt(formData.assigned_to) : null,
        specifications: formData.asset_type === 'DESKTOP' ? {
          cpu,
          mainboard,
          ram,
          storage,
          vga,
          power_supply
        } : {}
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
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
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 border-b pb-3">
                      Chỉnh sửa tài sản
                    </Dialog.Title>
                    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                      <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                        <div className="sm:col-span-1">
                          <label className="block text-sm font-medium text-gray-500">Mã</label>
                          <div className="mt-1 block w-full px-3 py-2 bg-gray-100 rounded-md text-gray-700 sm:text-sm border border-gray-200">
                            {asset?.asset_code}
                          </div>
                        </div>

                        <div className="sm:col-span-1">
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Tên tài sản</label>
                          <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" placeholder="Nhập tên tài sản (vd: Laptop MSI, Màn hình Dell,...)" />
                        </div>

                        {/* Loại tài sản */}
                        <SelectBox
                          label="Loại tài sản"
                          value={formData.asset_type}
                          options={ASSET_TYPES}
                          onChange={(val) => handleSelectChange('asset_type', val)}
                        />

                        {/* Tình trạng */}
                        <SelectBox
                          label="Tình trạng"
                          value={formData.condition}
                          options={ASSET_CONDITIONS}
                          onChange={(val) => handleSelectChange('condition', val)}
                        />

                        {/* Desktop Specific Fields */}
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
                              <input type="text" name="cpu" id="cpu" value={formData.cpu} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
                            </div>

                            {/* Mainboard */}
                            <div>
                              <label htmlFor="mainboard" className="block text-sm font-medium text-gray-700">Main</label>
                              <input type="text" name="mainboard" id="mainboard" value={formData.mainboard} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
                            </div>

                            {/* RAM */}
                            <div>
                              <label htmlFor="ram" className="block text-sm font-medium text-gray-700">Ram</label>
                              <input type="text" name="ram" id="ram" value={formData.ram} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
                            </div>

                            {/* Storage */}
                            <div>
                              <label htmlFor="storage" className="block text-sm font-medium text-gray-700">Ổ cứng</label>
                              <input type="text" name="storage" id="storage" value={formData.storage} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
                            </div>

                            {/* VGA */}
                            <div>
                              <label htmlFor="vga" className="block text-sm font-medium text-gray-700">Vga</label>
                              <input type="text" name="vga" id="vga" value={formData.vga} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
                            </div>

                            {/* Power Supply */}
                            <div>
                              <label htmlFor="power_supply" className="block text-sm font-medium text-gray-700">Nguồn</label>
                              <input type="text" name="power_supply" id="power_supply" value={formData.power_supply} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
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
                        <div>
                          <label htmlFor="warranty_period" className="block text-sm font-medium text-gray-700">Bảo hành (tháng)</label>
                          <input type="number" name="warranty_period" id="warranty_period" value={formData.warranty_period} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
                        </div>

                        {/* Người sử dụng/quản lý */}
                        <SelectBox label="Người sử dụng/quản lý" value={formData.assigned_to} options={employees} onChange={(val) => handleSelectChange('assigned_to', val)} placeholder="-- Chọn nhân viên --" />

                        {/* Phòng ban quản lý */}
                        <SelectBox label="Phòng ban quản lý" value={formData.department} options={departments} onChange={(val) => handleSelectChange('department', val)} placeholder="-- Chọn phòng ban --" />

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
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
