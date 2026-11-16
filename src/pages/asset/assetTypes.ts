// "Phân loại" tài sản là text tự do (SK yêu cầu 2026-10-12): gõ gì lưu nấy, không
// còn quy giá trị lạ về "Khác". Các mã dưới đây chỉ là loại CHUẨN có hành vi
// riêng (SIM, cấu hình máy...) — cùng danh sách với backend hrm.models.ASSET_TYPE.
import type { SelectOption } from '../../components/LandingLayout/SelectBox';
import type { Asset } from '../../utils/api';
import type { AssetResignedHolder } from '../../utils/api/types';

export const STANDARD_ASSET_TYPES = [
  'LAPTOP', 'DESKTOP', 'MONITOR', 'SIM', 'PHONE', 'TABLET', 'PRINTER',
  'SCANNER', 'NETWORK', 'SERVER', 'FURNITURE', 'VEHICLE', 'OTHER',
];

export const ASSET_TYPE_MAX_LENGTH = 100;

/**
 * Loại có Số lượng + bàn giao cho nhiều người: Màn hình, Khác, và mọi Phân loại
 * gõ tự do (trước đây bị quy về "Khác" nên giữ đúng hành vi của "Khác").
 * Khớp backend Asset.is_multi_holder_type().
 */
export const isMultiHolderType = (assetType?: string | null): boolean =>
  !!assetType && (assetType === 'MONITOR' || assetType === 'OTHER' || !STANDARD_ASSET_TYPES.includes(assetType));

/** Lựa chọn lọc theo Phân loại, lấy từ chính dữ liệu đang có (gồm cả loại tự do). */
export const assetTypeOptionsFrom = (
  items: Array<{ asset_type?: string | null; asset_type_display?: string | null }>,
): SelectOption<string>[] => {
  const labels = new Map<string, string>();
  items.forEach((it) => {
    if (it.asset_type && !labels.has(it.asset_type)) {
      labels.set(it.asset_type, it.asset_type_display || it.asset_type);
    }
  });
  return Array.from(labels, ([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label, 'vi'));
};

/** "2026-11-16" → "16/11/2026" (cắt chuỗi, không qua Date để khỏi lệch múi giờ). */
export const isoToVnDate = (iso?: string | null): string => {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
};

const leftSince = (h: AssetResignedHolder) => (h.end_date ? ` (nghỉ từ ${isoToVnDate(h.end_date)})` : '');

/**
 * Cảnh báo người đang giữ tài sản đã nghỉ việc — backend trả `resigned_holders` theo ngày nghỉ
 * việc của nhân viên, nên tới ngày nghỉ là tự hiện (SK 2026-11-16: hotline của người nghỉ phải
 * báo "không ai dùng"). null = không có gì cần cảnh báo.
 */
export const resignedHolderWarning = (asset: Pick<Asset, 'asset_type' | 'resigned_holders'>): string | null => {
  const people = asset.resigned_holders || [];
  if (people.length === 0) return null;
  if (!isMultiHolderType(asset.asset_type)) {
    return `Không ai dùng — ${people[0].name}${leftSince(people[0])} đã nghỉ việc. Thu hồi hoặc bàn giao cho người khác.`;
  }
  const names = people.map((h) => `${h.name}${leftSince(h)}`).join(', ');
  return `${names} đã nghỉ việc nhưng vẫn đang giữ tài sản này — thu hồi phần của họ.`;
};
