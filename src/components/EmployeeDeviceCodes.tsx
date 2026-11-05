import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FingerPrintIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { attendanceDeviceService, type DeviceMapping } from '../services/attendanceDevice.service';

const getApiError = (error: any) => {
  const data = error?.response?.data;
  if (!data) return 'Có lỗi xảy ra. Vui lòng thử lại.';
  if (typeof data === 'string') return data;
  const first = Object.values(data)[0];
  return Array.isArray(first) ? String(first[0]) : String(first || data.detail || 'Dữ liệu không hợp lệ.');
};

/**
 * Card "Mã chấm công" trong hồ sơ nhân viên (chỉ HR): mã trên máy chấm công đã gán cho
 * nhân viên này, thêm / gỡ mã. Gọi API riêng, không đi qua form sửa hồ sơ.
 */
export default function EmployeeDeviceCodes({ employeeId }: { employeeId: number }) {
  const [items, setItems] = useState<DeviceMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [code, setCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await attendanceDeviceService.getMappings({ employee: employeeId });
      setItems(res.items);
    } catch (err: any) {
      if (err?.response?.status === 403) setForbidden(true);
      else setMessage({ type: 'error', text: getApiError(err) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [employeeId]);

  const handleAdd = async () => {
    const value = code.trim();
    if (!value) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await attendanceDeviceService.createMapping({ device_code: value, employee: employeeId });
      setCode('');
      const from = res.reassigned_from
        ? ` (lấy lại từ ${res.reassigned_from.full_name} - ${res.reassigned_from.employee_id}, đã nghỉ)`
        : '';
      setMessage({
        type: 'success',
        text: res.punches_applied
          ? `Đã gán mã ${value}${from} — ghi ${res.punches_applied} lượt quẹt đang chờ, cập nhật ${res.days_updated} ngày công.`
          : `Đã gán mã ${value}${from}.`,
      });
      await load();
    } catch (err) {
      setMessage({ type: 'error', text: getApiError(err) });
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (m: DeviceMapping) => {
    if (!window.confirm(`Gỡ mã ${m.device_code} khỏi nhân viên này? Công đã ghi không thay đổi.`)) return;
    setMessage(null);
    try {
      await attendanceDeviceService.deleteMapping(m.id);
      await load();
    } catch (err) {
      setMessage({ type: 'error', text: getApiError(err) });
    }
  };

  if (forbidden) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center">
            <FingerPrintIcon className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-bold text-gray-900">Mã chấm công trên máy</h3>
        </div>
        <Link to="/dashboard/attendance/device-users" className="text-xs font-medium text-primary-600 hover:text-primary-800">
          Mã chờ gán →
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Đang tải...</p>
      ) : items.length === 0 ? (
        <p className="text-sm italic text-gray-400">Chưa gán mã nào — lượt quẹt vân tay của nhân viên này chưa lên công.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((m) => (
            <span key={m.id} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-sm">
              <span className="font-mono font-semibold text-gray-900">{m.device_code}</span>
              {m.device_user_name && <span className="text-xs text-gray-500">({m.device_user_name})</span>}
              <button onClick={() => handleRemove(m)} className="text-gray-400 hover:text-red-600" title="Gỡ mã">
                <TrashIcon className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
          placeholder="Mã trên máy, VD: 1750"
          className="w-48 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
        />
        <button
          onClick={handleAdd}
          disabled={saving || !code.trim()}
          className="inline-flex items-center gap-1 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
        >
          <PlusIcon className="h-4 w-4" /> {saving ? 'Đang gán...' : 'Gán mã'}
        </button>
      </div>
      {message && (
        <p className={`mt-2 rounded-lg px-3 py-2 text-xs ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
