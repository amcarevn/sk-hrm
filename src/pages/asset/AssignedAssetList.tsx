import { useState, useEffect } from 'react';
import { assetsAPI, Asset } from '../../utils/api';
import { ComputerDesktopIcon, EyeIcon, ShieldCheckIcon, ArrowPathRoundedSquareIcon, SparklesIcon } from '@heroicons/react/24/outline';
import AssetDetailModal from './AssetDetailModal';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'IN_USE':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'IDLE':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'UNDER_MAINTENANCE':
      return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    case 'DAMAGED':
      return 'bg-rose-100 text-rose-800 border-rose-200';
    case 'RETIRED':
      return 'bg-slate-100 text-slate-800 border-slate-200';
    case 'LOST':
      return 'bg-black text-white border-black';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getConditionColor = (condition: string) => {
  switch (condition) {
    case 'EXCELLENT':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'GOOD':
      return 'bg-blue-100 text-blue-800 border-blue-200';
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
    case 'LAPTOP': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
    case 'DESKTOP': return 'bg-blue-50 text-blue-700 border-blue-100';
    case 'MONITOR': return 'bg-cyan-50 text-cyan-700 border-cyan-100';
    case 'PHONE': return 'bg-rose-50 text-rose-700 border-rose-100';
    case 'PRINTER': return 'bg-orange-50 text-orange-700 border-orange-100';
    case 'NETWORK': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    default: return 'bg-gray-50 text-gray-700 border-gray-100';
  }
};

function formatDate(dateStr?: string) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('vi-VN');
}

function isWarrantyExpiringSoon(expiryDate?: string): boolean {
  if (!expiryDate) return false;
  const today = new Date();
  const expiry = new Date(expiryDate);
  const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return daysLeft > 0 && daysLeft <= 30;
}

function isWarrantyExpired(expiryDate?: string): boolean {
  if (!expiryDate) return false;
  return new Date(expiryDate) < new Date();
}

export default function AssignedAssetList() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  useEffect(() => {
    fetchAssignedAssets();
  }, []);

  const fetchAssignedAssets = async () => {
    try {
      setLoading(true);
      const data = await assetsAPI.assignedAssets();
      setAssets(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching assigned assets:', err);
      setError('Không thể tải danh sách tài sản. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const filteredAssets = assets.filter(asset => {
    const q = searchTerm.toLowerCase();
    return (
      asset.asset_code.toLowerCase().includes(q) ||
      asset.name.toLowerCase().includes(q) ||
      (asset.brand?.toLowerCase() || '').includes(q) ||
      (asset.model?.toLowerCase() || '').includes(q)
    );
  });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-1">
          <ComputerDesktopIcon className="h-7 w-7 text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-900">Thiết bị bàn giao</h1>
        </div>
        <p className="text-sm text-gray-500">Danh sách thiết bị, tài sản công ty đã bàn giao cho bạn sử dụng.</p>
      </div>

      {/* Stats banner */}
      <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Tổng thiết bị</p>
          <p className="text-2xl font-bold text-gray-900">{assets.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Đang sử dụng</p>
          <p className="text-2xl font-bold text-green-600">{assets.filter(a => a.status === 'IN_USE').length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Bảo hành còn hạn</p>
          <p className="text-2xl font-bold text-blue-600">
            {assets.filter(a => a.warranty_expiry && !isWarrantyExpired(a.warranty_expiry)).length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Sắp hết bảo hành</p>
          <p className="text-2xl font-bold text-amber-500">
            {assets.filter(a => isWarrantyExpiringSoon(a.warranty_expiry)).length}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Tìm theo mã, tên, hãng, model..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full sm:w-80 px-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 rounded-lg text-sm text-red-700">{error}</div>
      )}

      {/* Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Tên tài sản</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Model</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Loại tài sản</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Trạng thái vận hành</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Tình trạng vật lý</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Quản lý kho</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Ngày nhận</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Trạng thái bàn giao</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Ghi chú</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(11)].map((__, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredAssets.length === 0 ? (
                <tr> 
                  <td colSpan={11} className="px-6 py-16 text-center">
                    <ComputerDesktopIcon className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                    <p className="text-gray-500 font-medium">Bạn chưa được bàn giao tài sản nào.</p>
                    <p className="text-sm text-gray-400 mt-1">Liên hệ phòng IT để được hỗ trợ.</p>
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset) => {
                  const isReturned = asset.status === 'IDLE' || asset.status === 'RETIRED';
                  const isUnderMaintenance = asset.status === 'UNDER_MAINTENANCE';
                  
                  return (
                    <tr key={asset.id} className={`hover:bg-gray-50 transition-colors ${(isReturned || isUnderMaintenance) ? 'bg-gray-50/50 opacity-50 grayscale-[0.5]' : ''}`}>
                      {/* Tên tài sản */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-primary-700 bg-primary-50 px-2 py-1 rounded inline-block">
                          {asset.name}
                        </div>
                      </td>
                      {/* Model */}
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 font-medium">
                          {asset.model || '-'}
                        </div>
                      </td>
                      {/* Loại tài sản */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getTypeColor(asset.asset_type)} uppercase tracking-tight`}>
                          {asset.asset_type === 'OTHER' && (asset as any).other_type_name 
                            ? `Khác (${(asset as any).other_type_name})` 
                            : asset.asset_type_display}
                        </span>
                      </td>
                      {/* Trạng thái vận hành */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getStatusColor(asset.status)} uppercase tracking-tight`}>
                          {asset.status_display}
                        </span>
                      </td>
                      {/* Tình trạng vật lý */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getConditionColor(asset.condition)} uppercase tracking-tight`}>
                          {asset.condition_display}
                        </span>
                      </td>
                      {/* Quản lý kho nội bộ */}
                      <td className="px-6 py-4">
                        {asset.managed_by_name || asset.department_name ? (
                          <>
                            {asset.managed_by_name && (
                              <div className="text-sm font-medium text-gray-900">{asset.managed_by_name}</div>
                            )}
                            {asset.department_name && (
                              <div className="text-sm text-gray-400">{asset.department_name}</div>
                            )}
                          </>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(asset.assigned_date)}
                      </td>
                      {/* Trạng thái bàn giao */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {isReturned ? (
                          <div className="flex flex-col">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-tight w-fit">
                              Đã thu hồi
                            </span>
                          </div>
                        ) : isUnderMaintenance ? (
                          <div className="flex flex-col">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-tight w-fit">
                              Đang bảo hành
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 uppercase tracking-tight w-fit">
                              Đang sử dụng
                            </span>
                          </div>
                        )}
                      </td>
                      {/* Ghi chú */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2 max-w-sm">
                          {asset.description && (
                            <div className="flex items-start space-x-1.5 opacity-80" title="Mô tả kỹ thuật/Lưu ý vật lý">
                              <span className="mt-0.5"><SparklesIcon className="h-3 w-3 text-slate-400" /></span>
                              <p className="text-[10px] text-gray-500 italic leading-relaxed line-clamp-2">
                                {asset.description}
                              </p>
                            </div>
                          )}
                          <div className="flex items-start space-x-1.5" title={isReturned ? (asset as any).return_notes : (asset as any).assignment_notes}>
                            <span className="mt-0.5">
                              {isReturned ? (
                                <ArrowPathRoundedSquareIcon className="h-3 w-3 text-amber-500" />
                              ) : (
                                <ShieldCheckIcon className="h-3 w-3 text-green-500" />
                              )}
                            </span>
                            <div className="text-xs">
                              {isReturned ? (
                                <span className="text-amber-600 line-clamp-2 font-medium">Thu hồi: {(asset as any).return_notes || '-'}</span>
                              ) : (
                                <span className="text-green-700 line-clamp-2 font-semibold">Bàn giao: {(asset as any).assignment_notes || '-'}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      {/* Thao tác */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => { setSelectedAsset(asset); setIsDetailModalOpen(true); }}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-indigo-600 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-700 transition-all font-bold text-[11px] uppercase tracking-wide shadow-sm hover:shadow active:scale-95"
                        >
                          <EyeIcon className="h-4 w-4" />
                          <span>Chi tiết</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      <AssetDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => { setIsDetailModalOpen(false); setSelectedAsset(null); }}
        asset={selectedAsset}
      />
    </div>
  );
}
