import React, { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { assetsAPI, departmentsAPI, employeesAPI } from '../../utils/api';
import { SelectBox, SelectOption } from '../../components/LandingLayout/SelectBox';

interface AssetCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
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

export default function AssetCreateModal({ isOpen, onClose, onSuccess }: AssetCreateModalProps) {
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<SelectOption<string>[]>([]);
  const [employees, setEmployees] = useState<SelectOption<string>[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    asset_type: 'LAPTOP',
    model: '',
    condition: 'EXCELLENT',
    purchase_date: '',
    warranty_period: '12',
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
  });

  /**
   * Khởi chạy khi Modal được mở, thực hiện lấy danh sách Phòng ban
   */
  useEffect(() => {
    if (isOpen) {
      fetchDepartments();
    }
  }, [isOpen]);

  /**
   * Tự động lọc danh sách Nhân viên mỗi khi Phòng ban quản lý thay đổi
   */
  useEffect(() => {
    if (isOpen && formData.department) {
      fetchEmployees(formData.department);
      setFormData(prev => ({ ...prev, assigned_to: '' }));
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

      // Set default department to HCNS if found
      const hcnsDept = options.find(opt => 
        opt.label.toUpperCase().includes('HCNS')
      );
      if (hcnsDept && !formData.department) {
        setFormData(prev => ({ ...prev, department: hcnsDept.value }));
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  /**
   * Lấy danh sách Nhân viên, hỗ trợ lọc theo phòng ban
   * @param departmentId ID của phòng ban cần lọc
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

  /**
   * Xử lý thay đổi dữ liệu trong các ô Input văn bản
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /**
   * Kiểm tra xem các trường bắt buộc đã được điền đầy đủ chưa
   * Hiện tại chỉ yêu cầu Mã tài sản (asset_code)
   */
  const isFormValid = () => {
    return formData.name.trim() !== '';
  };

  /**
   * Xử lý thay đổi dữ liệu cho các ô SelectBox tùy chỉnh
   */
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /**
   * Gửi dữ liệu form lên Server để tạo tài sản mới
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Split technical specs into a separate object if it's a Desktop
      const { cpu, mainboard, ram, storage, vga, power_supply, ...baseData } = formData;
      
      const payload = {
        ...baseData,
        purchase_date: formData.purchase_date || null,
        warranty_period: parseInt(formData.warranty_period) || 0,
        department: formData.department ? parseInt(formData.department) : null,
        managed_by: formData.managed_by ? parseInt(formData.managed_by) : null,
        specifications: formData.asset_type === 'DESKTOP' ? {
          cpu,
          mainboard,
          ram,
          storage,
          vga,
          power_supply
        } : {}
      };
      
      console.log('--- Gửi yêu cầu tạo tài sản mới ---');
      console.log('Payload:', JSON.stringify(payload, null, 2));
      
      const response = await assetsAPI.create(payload as any);
      
      console.log('--- Phản hồi từ Server ---');
      console.log('Data:', response);
      
      onSuccess();
      onClose();
      // Reset form
      setFormData({
        name: '',
        asset_type: 'LAPTOP',
        model: '',
        condition: 'EXCELLENT',
        purchase_date: '',
        warranty_period: '12',
        supplier: '',
        department: '',
        description: '',
        cpu: '',
        mainboard: '',
        ram: '',
        storage: '',
        vga: '',
        power_supply: '',
        managed_by: '',
      });
    } catch (error) {
      console.error('Error creating asset:', error);
      alert('Có lỗi xảy ra khi thêm tài sản. Vui lòng kiểm tra lại.');
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
                      Thêm tài sản mới
                    </Dialog.Title>
                    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                      <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                            Tên tài sản
                          </label>
                          <input
                            type="text"
                            name="name"
                            id="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                            placeholder="Tên tài sản (VD: Laptop Gaming MSI, Màn hình Dell...)"
                          />
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
                              <label htmlFor="cpu" className="block text-sm font-medium text-gray-700">
                                Cpu
                              </label>
                              <input
                                type="text"
                                name="cpu"
                                id="cpu"
                                value={formData.cpu}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                placeholder="VD: Core i7-13700K"
                              />
                            </div>

                            {/* Mainboard */}
                            <div>
                              <label htmlFor="mainboard" className="block text-sm font-medium text-gray-700">
                                Main
                              </label>
                              <input
                                type="text"
                                name="mainboard"
                                id="mainboard"
                                value={formData.mainboard}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                placeholder="VD: ASUS Z790-P"
                              />
                            </div>

                            {/* RAM */}
                            <div>
                              <label htmlFor="ram" className="block text-sm font-medium text-gray-700">
                                Ram
                              </label>
                              <input
                                type="text"
                                name="ram"
                                id="ram"
                                value={formData.ram}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                placeholder="VD: 32GB (16GBx2) DDR5"
                              />
                            </div>

                            {/* Storage */}
                            <div>
                              <label htmlFor="storage" className="block text-sm font-medium text-gray-700">
                                Ổ cứng
                              </label>
                              <input
                                type="text"
                                name="storage"
                                id="storage"
                                value={formData.storage}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                placeholder="VD: SSD 1TB Samsung 980 Pro"
                              />
                            </div>

                            {/* VGA */}
                            <div>
                              <label htmlFor="vga" className="block text-sm font-medium text-gray-700">
                                Vga
                              </label>
                              <input
                                type="text"
                                name="vga"
                                id="vga"
                                value={formData.vga}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                placeholder="VD: RTX 4070 Ti 12GB"
                              />
                            </div>

                            {/* Power Supply */}
                            <div>
                              <label htmlFor="power_supply" className="block text-sm font-medium text-gray-700">
                                Nguồn
                              </label>
                              <input
                                type="text"
                                name="power_supply"
                                id="power_supply"
                                value={formData.power_supply}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                placeholder="VD: Corsair RM850e 850W"
                              />
                            </div>
                          </div>
                        )}

                        {/* Model */}
                        <div>
                          <label htmlFor="model" className="block text-sm font-medium text-gray-700">
                            Model
                          </label>
                          <input
                            type="text"
                            name="model"
                            id="model"
                            value={formData.model}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                            placeholder="VD: M2 Pro, XPS 15..."
                          />
                        </div>

                        {/* Nhà cung cấp */}
                        <div>
                          <label htmlFor="supplier" className="block text-sm font-medium text-gray-700">
                            Nhà cung cấp
                          </label>
                          <input
                            type="text"
                            name="supplier"
                            id="supplier"
                            value={formData.supplier}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                            placeholder="Tên đơn vị cung cấp"
                          />
                        </div>

                        {/* Ngày mua */}
                        <div>
                          <label htmlFor="purchase_date" className="block text-sm font-medium text-gray-700">
                            Ngày mua
                          </label>
                          <input
                            type="date"
                            name="purchase_date"
                            id="purchase_date"
                            value={formData.purchase_date}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          />
                        </div>

                        {/* Thời hạn bảo hành */}
                        <div>
                          <label htmlFor="warranty_period" className="block text-sm font-medium text-gray-700">
                            Bảo hành (tháng)
                          </label>
                          <input
                            type="number"
                            name="warranty_period"
                            id="warranty_period"
                            value={formData.warranty_period}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                            placeholder="VD: 12, 24..."
                          />
                        </div>

                        {/* Phòng ban quản lý */}
                        <SelectBox
                          label="Phòng ban quản lý"
                          value={formData.department}
                          options={departments}
                          onChange={(val) => handleSelectChange('department', val)}
                          placeholder="-- Chọn phòng ban --"
                        />

                        {/* Người quản lý (Kho) */}
                        {formData.department && (
                          <SelectBox
                            label="Người quản lý (Kho)"
                            value={formData.managed_by}
                            options={employees}
                            onChange={(val) => handleSelectChange('managed_by', val)}
                            placeholder="-- Chọn người quản lý kho --"
                          />
                        )}

                        {/* Mô tả / Ghi chú */}
                        <div className="sm:col-span-2">
                          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                            Mô tả / Ghi chú
                          </label>
                          <textarea
                            id="description"
                            name="description"
                            rows={3}
                            value={formData.description}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                            placeholder="Nhập thêm thông tin chi tiết hoặc lưu ý..."
                          />
                        </div>
                      </div>

                      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse space-x-reverse space-x-3">
                        <button
                          type="submit"
                          disabled={loading || !isFormValid()}
                          className={`inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm sm:ml-3 sm:w-auto transition-all ${
                            isFormValid() 
                              ? 'bg-primary-600 hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600' 
                              : 'bg-gray-300 cursor-not-allowed opacity-70'
                          }`}
                          title={!isFormValid() ? 'Vui lòng điền đầy đủ các thông tin bắt buộc (*)' : ''}
                        >
                          {loading ? (
                            <span className="flex items-center gap-2">
                              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Đang thêm...
                            </span>
                          ) : 'Thêm tài sản'}
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
