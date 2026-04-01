import { useState, useEffect } from 'react';
import { assetsAPI, Asset } from '../../utils/api';
import { ComputerDesktopIcon, EyeIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import AssetDetailModal from './AssetDetailModal';

const STATUS_COLORS: Record<string, string> = {
  IN_USE: 'bg-green-100 text-green-800',
  IDLE: 'bg-gray-100 text-gray-700',
  UNDER_MAINTENANCE: 'bg-yellow-100 text-yellow-800',
  DAMAGED: 'bg-red-100 text-red-800',
  RETIRED: 'bg-purple-100 text-purple-700',
};

const STATUS_LABELS: Record<string, string> = {
  IN_USE: 'Đang dùng',
  IDLE: 'Chờ cấp',
  UNDER_MAINTENANCE: 'Bảo trì',
  DAMAGED: 'Hỏng',
  RETIRED: 'Thanh lý',
};

const CONDITION_COLORS: Record<string, string> = {
  EXCELLENT: 'bg-emerald-100 text-emerald-800',
  GOOD: 'bg-blue-100 text-blue-800',
  FAIR: 'bg-yellow-100 text-yellow-800',
  POOR: 'bg-orange-100 text-orange-800',
  BROKEN: 'bg-red-100 text-red-800',
};

const CONDITION_LABELS: Record<string, string> = {
  EXCELLENT: 'Mới tốt',
  GOOD: 'Tốt',
  FAIR: 'Trung bình',
  POOR: 'Yếu',
  BROKEN: 'Hỏng',
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã TS</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên tài sản</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tình trạng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày nhận</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bảo hành đến</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kiểm soát</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(9)].map((__, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center">
                    <ComputerDesktopIcon className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                    <p className="text-gray-500 font-medium">Bạn chưa được bàn giao tài sản nào.</p>
                    <p className="text-sm text-gray-400 mt-1">Liên hệ phòng IT để được hỗ trợ.</p>
                  </td>
                </tr>
              ) : (
                filteredAssets.map(asset => {
                  const warrantyExpiring = isWarrantyExpiringSoon(asset.warranty_expiry);
                  const warrantyExpired = isWarrantyExpired(asset.warranty_expiry);
                  return (
                    <tr key={asset.id} className="hover:bg-gray-50 transition-colors">
                      {/* Mã TS */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-mono font-semibold text-gray-700">{asset.asset_code}</span>
                      </td>
                      {/* Tên tài sản */}
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{asset.name}</div>
                        {asset.brand && <div className="text-xs text-gray-400">{asset.brand}</div>}
                      </td>
                      {/* Model */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{asset.model || '-'}</td>
                      {/* Trạng thái */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[asset.status] || 'bg-gray-100 text-gray-600'}`}>
                          {STATUS_LABELS[asset.status] || asset.status}
                        </span>
                      </td>
                      {/* Tình trạng */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${CONDITION_COLORS[asset.condition] || 'bg-gray-100 text-gray-600'}`}>
                          {CONDITION_LABELS[asset.condition] || asset.condition}
                        </span>
                      </td>
                      {/* Ngày nhận */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(asset.assigned_date)}
                      </td>
                      {/* Bảo hành đến */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${warrantyExpired ? 'text-red-500 font-medium' : warrantyExpiring ? 'text-amber-500 font-medium' : 'text-gray-600'}`}>
                          {formatDate(asset.warranty_expiry)}
                        </div>
                        {warrantyExpiring && !warrantyExpired && (
                          <div className="text-xs text-amber-500 flex items-center gap-1 mt-0.5">
                            <ShieldCheckIcon className="h-3 w-3" /> Sắp hết hạn
                          </div>
                        )}
                        {warrantyExpired && (
                          <div className="text-xs text-red-400 mt-0.5">Đã hết hạn</div>
                        )}
                      </td>
                      {/* Người kiểm soát kho */}
                      <td className="px-6 py-4">
                        {asset.managed_by_name ? (
                          <>
                            <div className="text-sm font-medium text-gray-900">{asset.managed_by_name}</div>
                            {asset.department_name && <div className="text-xs text-gray-400">{asset.department_name}</div>}
                          </>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      {/* Thao tác */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => { setSelectedAsset(asset); setIsDetailModalOpen(true); }}
                          className="text-indigo-600 hover:text-indigo-900 transition-colors"
                          title="Xem chi tiết"
                        >
                          <EyeIcon className="h-5 w-5" />
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
