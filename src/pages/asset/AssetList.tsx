import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { assetsAPI } from '../../utils/api';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ComputerDesktopIcon,
  UserIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  UserPlusIcon,
  ArrowPathRoundedSquareIcon,
} from '@heroicons/react/24/outline';
import AssetCreateModal from './AssetCreateModal';
import AssetEditModal from './AssetEditModal';
import AssetDetailModal from './AssetDetailModal';
import AssetAssignModal from './AssetAssignModal';
import AssetReturnModal from './AssetReturnModal';
import { Asset, AssetStats } from '../../utils/api';
import { SelectBox, SelectOption } from '../../components/LandingLayout/SelectBox';

const ASSET_TYPE_OPTIONS: SelectOption<string>[] = [
  { value: 'all', label: 'Tất cả loại' },
  { value: 'LAPTOP', label: 'Laptop' },
  { value: 'DESKTOP', label: 'Máy tính để bàn' },
  { value: 'MONITOR', label: 'Màn hình' },
  { value: 'PHONE', label: 'Điện thoại' },
  { value: 'TABLET', label: 'Máy tính bảng' },
  { value: 'PRINTER', label: 'Máy in' },
  { value: 'SCANNER', label: 'Máy scan' },
  { value: 'NETWORK', label: 'Thiết bị mạng' },
  { value: 'SERVER', label: 'Máy chủ' },
  { value: 'SIM', label: 'Sim' },
  { value: 'FURNITURE', label: 'Nội thất' },
  { value: 'VEHICLE', label: 'Phương tiện' },
  { value: 'OTHER', label: 'Khác' },
];

const ASSET_STATUS_OPTIONS: SelectOption<string>[] = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'NEW', label: 'Sẵn dùng (Mới 100%)' },
  { value: 'IN_USE', label: 'Đang sử dụng' },
  { value: 'IDLE', label: 'Sẵn dùng (Trong kho)' },
  { value: 'UNDER_MAINTENANCE', label: 'Đang sửa chữa / Bảo hành' },
  { value: 'DAMAGED', label: 'Lỗi / Chờ thanh lý' },
  { value: 'RETIRED', label: 'Đã thanh lý' },
  { value: 'LOST', label: 'Bị mất' },
];

const ASSET_CONDITION_OPTIONS: SelectOption<string>[] = [
  { value: 'all', label: 'Tất cả tình trạng' },
  { value: 'EXCELLENT', label: 'Mới 100%' },
  { value: 'GOOD', label: 'Cũ (Chất lượng tốt)' },
  { value: 'FAIR', label: 'Cũ (Trầy xước / Cấn móp)' },
  { value: 'POOR', label: 'Cũ (Kém / Lỗi chức năng)' },
  { value: 'BROKEN', label: 'Hỏng (Không hoạt động)' },
];

export default function AssetList() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [stats, setStats] = useState<AssetStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [conditionFilter, setConditionFilter] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<number | null>(null);


  useEffect(() => {
    fetchAssets();
    fetchStats();
  }, []);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const data = await assetsAPI.list({});
      setAssets(data.results || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching assets:', err);
      setError('Không thể tải danh sách tài sản. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await assetsAPI.stats();
      setStats(data);
    } catch (err: any) {
      console.error('Error fetching asset stats:', err);
    }
  };

  const confirmDelete = (id: number) => {
    setAssetToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (assetToDelete === null) return;

    try {
      await assetsAPI.delete(assetToDelete);
      setAssets(assets.filter(asset => asset.id !== assetToDelete));
      fetchStats(); // Refresh stats after deletion
      setIsDeleteDialogOpen(false);
      setAssetToDelete(null);
    } catch (err: any) {
      console.error('Error deleting asset:', err);
      alert('Không thể xóa tài sản. Vui lòng thử lại sau.');
    }
  };



  const filteredAssets = assets.filter(asset => {
    const matchesSearch = 
      asset.asset_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.model.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || asset.status === statusFilter;
    const matchesType = typeFilter === 'all' || asset.asset_type === typeFilter;
    const matchesCondition = conditionFilter === 'all' || asset.condition === conditionFilter;
    
    return matchesSearch && matchesStatus && matchesType && matchesCondition;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const handleEditClick = (asset: Asset) => {
    setEditingAsset(asset);
    setIsEditModalOpen(true);
  };

  const handleDetailClick = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsDetailModalOpen(true);
  };

  const handleAssignClick = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsAssignModalOpen(true);
  };

  const handleReturnClick = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsReturnModalOpen(true);
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
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'EXCELLENT':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'GOOD':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'FAIR':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'POOR':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'BROKEN':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'LAPTOP':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'DESKTOP':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'MONITOR':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'PHONE':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'SIM':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'NETWORK':
      case 'SERVER':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'FURNITURE':
        return 'bg-stone-100 text-stone-800 border-stone-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading && assets.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải danh sách tài sản...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý tài sản</h1>
          <p className="mt-1 text-sm text-gray-600">
            Quản lý tất cả tài sản công ty, theo dõi trạng thái và người sử dụng
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Thêm tài sản mới
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ComputerDesktopIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tổng số tài sản</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Đang sử dụng</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.in_use}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ShieldCheckIcon className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Hết hạn bảo hành</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.expired_warranty}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700">
              Tìm kiếm
            </label>
            <input
              type="text"
              id="search"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              placeholder="Tìm theo mã, tên, thương hiệu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <SelectBox
            label="Trạng thái vận hành"
            value={statusFilter}
            options={ASSET_STATUS_OPTIONS}
            onChange={(val) => setStatusFilter(val)}
          />
          
          <SelectBox
            label="Tình trạng vật lý"
            value={conditionFilter}
            options={ASSET_CONDITION_OPTIONS}
            onChange={(val) => setConditionFilter(val)}
          />

          <SelectBox
            label="Loại tài sản"
            value={typeFilter}
            options={ASSET_TYPE_OPTIONS}
            onChange={(val) => setTypeFilter(val)}
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}



      {/* Assets Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tên tài sản
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Model
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Loại tài sản
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái vận hành
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tình trạng vật lý
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quản lý kho
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Người sử dụng
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thông tin mua
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nhà cung cấp
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <ComputerDesktopIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">
                        Không có tài sản nào
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                          ? 'Không tìm thấy tài sản phù hợp với bộ lọc.'
                          : 'Bắt đầu bằng cách thêm tài sản mới.'
                        }
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-primary-700 bg-primary-50 px-2 py-1 rounded inline-block">
                        {asset.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 font-medium">
                        {asset.model || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getTypeColor(asset.asset_type)} uppercase tracking-tight`}>
                        {asset.asset_type === 'OTHER' && (asset.specifications as any)?.type_name 
                          ? `Khác (${(asset.specifications as any).type_name})` 
                          : asset.asset_type_display}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getStatusColor(asset.status)} uppercase tracking-tight`}>
                        {asset.status_display}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getConditionColor(asset.condition)} uppercase tracking-tight`}>
                        {asset.condition_display}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {asset.managed_by_name || asset.department_name ? (
                        <>
                          {asset.managed_by_name && (
                            <div className="text-sm font-medium text-gray-900">{asset.managed_by_name}</div>
                          )}
                          {asset.department_name && (
                            <div className="text-sm text-gray-500">{asset.department_name}</div>
                          )}
                        </>
                      ) : (
                        <span className="text-sm text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {asset.assigned_to_name ? (
                        <div className="flex flex-col">
                          <div className="text-sm font-medium text-green-700 bg-green-50 inline-flex rounded-full px-2 py-0.5 w-fit">
                            {asset.assigned_to_name}
                          </div>
                          {asset.assigned_to_department_name && (
                            <div className="text-sm text-gray-500">
                              {asset.assigned_to_department_name}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Chưa bàn giao</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatDate(asset.purchase_date)}
                      </div>
                      {asset.warranty_expiry && (
                        <div className="text-xs text-gray-500 mt-1">
                          BH: {formatDate(asset.warranty_expiry)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-[200px] truncate" title={asset.supplier || ''}>
                      {asset.supplier || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {/* Chi tiết */}
                        <button
                          onClick={() => handleDetailClick(asset)}
                          className="inline-flex items-center space-x-1 px-2 py-1 rounded-md text-primary-600 bg-primary-50 hover:bg-primary-100 transition-all font-bold text-[10px] uppercase tracking-tight"
                          title="Xem chi tiết"
                        >
                          <EyeIcon className="h-3.5 w-3.5" />
                          <span>Chi tiết</span>
                        </button>
                        
                        {/* Sửa */}
                        <button
                          onClick={() => handleEditClick(asset)}
                          className="inline-flex items-center space-x-1 px-2 py-1 rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all font-bold text-[10px] uppercase tracking-tight"
                          title="Chỉnh sửa thông tin"
                        >
                          <PencilIcon className="h-3.5 w-3.5" />
                          <span>Sửa</span>
                        </button>

                        {/* Bàn giao */}
                        <button
                          onClick={() => handleAssignClick(asset)}
                          className="inline-flex items-center space-x-1 px-2 py-1 rounded-md text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-all font-bold text-[10px] uppercase tracking-tight"
                          title="Bàn giao người dùng"
                        >
                          <UserPlusIcon className="h-3.5 w-3.5" />
                          <span>Bàn giao</span>
                        </button>

                        {/* Thu hồi */}
                        <button
                          onClick={() => handleReturnClick(asset)}
                          className="inline-flex items-center space-x-1 px-2 py-1 rounded-md text-amber-600 bg-amber-50 hover:bg-amber-100 transition-all font-bold text-[10px] uppercase tracking-tight"
                          title="Thu hồi về kho"
                        >
                          <ArrowPathRoundedSquareIcon className="h-3.5 w-3.5" />
                          <span>Thu hồi</span>
                        </button>

                        {/* Xóa */}
                        <button
                          onClick={() => confirmDelete(asset.id)}
                          className="inline-flex items-center space-x-1 px-2 py-1 rounded-md text-red-600 bg-red-50 hover:bg-red-100 transition-all font-bold text-[10px] uppercase tracking-tight"
                          title="Xóa tài sản"
                        >
                          <TrashIcon className="h-3.5 w-3.5" />
                          <span>Xóa</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <AssetCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          fetchAssets();
          fetchStats();
        }}
      />

      <AssetEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingAsset(null);
        }}
        onSuccess={() => {
          fetchAssets();
          fetchStats();
        }}
        asset={editingAsset}
      />

      <AssetDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedAsset(null);
        }}
        asset={selectedAsset}
      />

      {selectedAsset && (
        <AssetAssignModal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          onSuccess={() => {
            fetchAssets();
            fetchStats();
          }}
          asset={selectedAsset}
        />
      )}

      {selectedAsset && (
        <AssetReturnModal
          isOpen={isReturnModalOpen}
          onClose={() => setIsReturnModalOpen(false)}
          onSuccess={() => {
            fetchAssets();
            fetchStats();
          }}
          asset={selectedAsset}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {isDeleteDialogOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setIsDeleteDialogOpen(false)}></div>

            {/* This element is to trick the browser into centering the modal contents. */}
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Xác nhận xóa tài sản
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Bạn có chắc chắn muốn xóa tài sản này không? Hành động này không thể hoàn tác.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleDelete}
                >
                  Xóa
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setIsDeleteDialogOpen(false)}
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
