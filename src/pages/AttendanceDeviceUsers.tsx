import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  FingerPrintIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  XMarkIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { employeesAPI, type Employee } from '../utils/api';
import { SelectBox, type SelectOption } from '../components/LandingLayout/SelectBox';
import {
  attendanceDeviceService,
  type DeviceEmployee,
  type DeviceMapping,
  type PendingDeviceCode,
} from '../services/attendanceDevice.service';

/**
 * Mã chấm công trên máy ZKTeco ↔ nhân viên.
 * HCNS lấy vân tay trên máy (máy cấp mã) → lượt quẹt của mã chưa gán hiện ở tab "Chờ gán"
 * → gán cho nhân viên thì các lượt đó tự ghi vào công. Sửa/xoá mapping không tính lại công cũ.
 */

const getApiError = (error: any) => {
  const data = error?.response?.data;
  if (!data) return 'Có lỗi xảy ra. Vui lòng thử lại.';
  if (typeof data === 'string') return data;
  const first = Object.values(data)[0];
  return Array.isArray(first) ? String(first[0]) : String(first || data.detail || 'Dữ liệu không hợp lệ.');
};

/** "2026-10-05T08:01:00" → "05/10/2026 08:01" (giờ máy chấm công, không đổi múi giờ) */
const formatPunch = (iso?: string) => {
  if (!iso) return '—';
  const [d, t = ''] = iso.split('T');
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y} ${t.slice(0, 5)}`.trim();
};

const formatDateTime = (iso?: string) => (iso ? new Date(iso).toLocaleString('vi-VN') : '—');

type Tab = 'pending' | 'mapped';

/** Modal gán / đổi nhân viên cho 1 mã chấm công */
interface AssignTarget {
  mode: 'pending' | 'create' | 'edit';
  deviceCode: string;
  pending?: PendingDeviceCode;
  mapping?: DeviceMapping;
}

export default function AttendanceDeviceUsers() {
  const [tab, setTab] = useState<Tab>('pending');
  const [pending, setPending] = useState<PendingDeviceCode[]>([]);
  const [mappings, setMappings] = useState<DeviceMapping[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [busyCode, setBusyCode] = useState<string | null>(null);

  const [target, setTarget] = useState<AssignTarget | null>(null);
  const [targetCode, setTargetCode] = useState('');
  const [targetEmployeeId, setTargetEmployeeId] = useState<number | null>(null);
  const [targetError, setTargetError] = useState<string | null>(null);
  const [targetLoading, setTargetLoading] = useState(false);

  const employeeOptions = useMemo<SelectOption<number>[]>(
    () =>
      employees.map((e) => ({
        value: e.id,
        label:
          `${e.full_name} (${e.employee_id})` +
          (e.employment_status === 'INACTIVE' && e.end_date
            ? ` · đã nghỉ ${e.end_date.split('-').reverse().join('/')}`
            : ''),
      })),
    [employees]
  );

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [pendingRes, mappingRes] = await Promise.all([
        attendanceDeviceService.getPendingCodes(),
        attendanceDeviceService.getMappings(),
      ]);
      setPending(pendingRes.items);
      setMappings(mappingRes.items);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    if (employees.length > 0) return;
    try {
      // Bộ lọc employment_status của /employees/ (backend SK): ACTIVE = "Đang làm việc",
      // ĐÃ GỒM người đang thử việc (PROBATION chỉ là tập con) → không cần gọi riêng PROBATION.
      // Thêm người đã nghỉ từ đầu tháng trước: vừa nghỉ nhưng vẫn còn lượt quẹt chờ gán
      // của tháng đang chấm công. Không lấy người nghỉ lâu để tránh gán nhầm người trùng tên.
      const now = new Date();
      const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endDateFrom = `${prevMonthStart.getFullYear()}-${String(prevMonthStart.getMonth() + 1).padStart(2, '0')}-01`;
      const [active, left] = await Promise.all([
        employeesAPI.list({ employment_status: 'ACTIVE', page_size: 2000, ordering: 'full_name' }),
        // include_inactive: danh sách mặc định chỉ trả is_active=True — người đã nghỉ có thể
        // đã bị tắt is_active nên phải mở ra mới thấy hết.
        employeesAPI.list({
          employment_status: 'INACTIVE', include_inactive: true, end_date_from: endDateFrom,
          page_size: 2000, ordering: 'full_name',
        }),
      ]);
      const byId = new Map<number, Employee>();
      active.results.forEach((e) => byId.set(e.id, e));
      // employment_status lưu trong DB của người vừa nghỉ thường vẫn là ACTIVE → gắn INACTIVE để hiện nhãn.
      left.results.forEach((e) => {
        // Lọc lại ngày nghỉ ở đây: backend chưa hỗ trợ end_date_from thì vẫn trả mọi người đã nghỉ.
        if (!e.end_date || e.end_date < endDateFrom) return;
        if (!byId.has(e.id)) byId.set(e.id, { ...e, employment_status: 'INACTIVE' });
      });
      setEmployees([...byId.values()].sort((a, b) => a.full_name.localeCompare(b.full_name, 'vi')));
    } catch (err) {
      setTargetError(getApiError(err));
    }
  };

  useEffect(() => { loadData(); }, []);

  const q = search.trim().toLowerCase();
  const filteredPending = useMemo(
    () =>
      !q
        ? pending
        : pending.filter(
            (p) =>
              p.device_code.toLowerCase().includes(q) ||
              p.device_user_names.some((n) => n.toLowerCase().includes(q))
          ),
    [pending, q]
  );
  const filteredMappings = useMemo(
    () =>
      !q
        ? mappings
        : mappings.filter(
            (m) =>
              m.device_code.toLowerCase().includes(q) ||
              m.device_user_name.toLowerCase().includes(q) ||
              m.employee.full_name.toLowerCase().includes(q) ||
              m.employee.employee_id.toLowerCase().includes(q)
          ),
    [mappings, q]
  );

  const openTarget = (t: AssignTarget) => {
    setTarget(t);
    setTargetCode(t.deviceCode);
    setTargetEmployeeId(t.mapping?.employee.id ?? null);
    setTargetError(null);
    setSuccess('');
    loadEmployees();
  };

  const pickSuggestion = (s: DeviceEmployee) => {
    // Gợi ý có thể chưa nằm trong danh sách đã tải (vd đang tạm nghỉ) → thêm vào để hiện được tên
    if (!employees.some((e) => e.id === s.id)) {
      setEmployees((prev) => [...prev, { id: s.id, employee_id: s.employee_id, full_name: s.full_name } as Employee]);
    }
    setTargetEmployeeId(s.id);
  };

  const handleSaveTarget = async () => {
    if (!target) return;
    const code = targetCode.trim();
    if (!code) {
      setTargetError('Vui lòng nhập mã chấm công trên máy');
      return;
    }
    if (!targetEmployeeId) {
      setTargetError('Vui lòng chọn nhân viên');
      return;
    }
    const employee = employees.find((e) => e.id === targetEmployeeId);
    setTargetError(null);
    setTargetLoading(true);
    try {
      if (target.mode === 'edit' && target.mapping) {
        await attendanceDeviceService.updateMapping(target.mapping.id, { employee: targetEmployeeId });
        setSuccess(`Đã đổi mã ${code} sang ${employee?.full_name ?? 'nhân viên mới'}. Công đã ghi trước đây không thay đổi.`);
      } else {
        const res =
          target.mode === 'pending'
            ? await attendanceDeviceService.assign(code, targetEmployeeId)
            : await attendanceDeviceService.createMapping({ device_code: code, employee: targetEmployeeId });
        setSuccess(
          `Đã gán mã ${code} cho ${res.mapping.employee.full_name} (${res.mapping.employee.employee_id})` +
            (res.punches_applied
              ? ` — ghi ${res.punches_applied} lượt quẹt đang chờ, cập nhật ${res.days_updated} ngày công.`
              : '.')
        );
      }
      setTarget(null);
      await loadData();
    } catch (err) {
      setTargetError(getApiError(err));
    } finally {
      setTargetLoading(false);
    }
  };

  const handleIgnore = async (p: PendingDeviceCode) => {
    if (
      !window.confirm(
        `Bỏ qua ${p.punches} lượt quẹt của mã ${p.device_code}? Dùng cho vân tay thử / không phải nhân viên. ` +
          'Nếu mã này quẹt tiếp, lượt mới vẫn hiện lại ở đây.'
      )
    ) {
      return;
    }
    setBusyCode(p.device_code);
    setSuccess('');
    try {
      await attendanceDeviceService.ignore(p.device_code);
      await loadData();
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setBusyCode(null);
    }
  };

  const handleDelete = async (m: DeviceMapping) => {
    if (
      !window.confirm(
        `Xoá gán mã ${m.device_code} → ${m.employee.full_name}? Công đã ghi không thay đổi; lượt quẹt mới của mã này sẽ vào "Chờ gán".`
      )
    ) {
      return;
    }
    setBusyCode(m.device_code);
    setSuccess('');
    try {
      await attendanceDeviceService.deleteMapping(m.id);
      await loadData();
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setBusyCode(null);
    }
  };

  const tabClass = (t: Tab) =>
    `rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
      tab === t ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'
    }`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Mã chấm công</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gán mã trên máy chấm công cho nhân viên. Lượt quẹt của mã chưa gán được giữ lại và tự ghi vào công khi gán.
          </p>
        </div>
        <button
          onClick={() => openTarget({ mode: 'create', deviceCode: '' })}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
        >
          <PlusIcon className="h-5 w-5" /> Gán mã trước
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex gap-1 rounded-xl border border-gray-200 bg-white p-1">
          <button className={tabClass('pending')} onClick={() => setTab('pending')}>
            Chờ gán{pending.length > 0 && <span className="ml-1.5 rounded-full bg-red-500 px-1.5 py-0.5 text-xs text-white">{pending.length}</span>}
          </button>
          <button className={tabClass('mapped')} onClick={() => setTab('mapped')}>
            Đã gán ({mappings.length})
          </button>
        </div>
        <div className="relative w-full max-w-md">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tab === 'pending' ? 'Tìm theo mã, tên trên máy...' : 'Tìm theo mã, tên trên máy, tên / mã nhân viên...'}
            className="w-full rounded-xl border-gray-300 pl-9 text-sm"
          />
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {success && (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircleIcon className="h-5 w-5 shrink-0" /> {success}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-sm text-gray-500">Đang tải dữ liệu...</div>
        ) : tab === 'pending' ? (
          filteredPending.length === 0 ? (
            <div className="py-16 text-center">
              <FingerPrintIcon className="mx-auto h-10 w-10 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">
                {pending.length === 0 ? 'Không có mã nào chờ gán.' : 'Không tìm thấy kết quả phù hợp.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-5 py-3">Mã trên máy</th>
                    <th className="px-5 py-3">Tên trên máy</th>
                    <th className="px-5 py-3">Máy</th>
                    <th className="px-5 py-3">Quẹt lần đầu</th>
                    <th className="px-5 py-3">Quẹt gần nhất</th>
                    <th className="px-5 py-3 text-right">Số lượt chờ</th>
                    <th className="px-5 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredPending.map((p) => (
                    <tr key={p.device_code} className="hover:bg-gray-50">
                      <td className="px-5 py-4">
                        <p className="font-mono font-semibold text-gray-900">{p.device_code}</p>
                        {p.mapped_employee && (
                          <p className="mt-0.5 text-[11px] text-amber-700">
                            Đang gán cho {p.mapped_employee.full_name} ({p.mapped_employee.employee_id}) — đã nghỉ
                            {p.mapped_employee.end_date ? ` ${formatPunch(p.mapped_employee.end_date)}` : ''}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4 text-gray-700">{p.device_user_names.join(', ') || '—'}</td>
                      <td className="px-5 py-4 text-xs text-gray-600">{p.devices.join(', ') || '—'}</td>
                      <td className="px-5 py-4 text-gray-700">{formatPunch(p.first_punch)}</td>
                      <td className="px-5 py-4 text-gray-700">{formatPunch(p.last_punch)}</td>
                      <td className="px-5 py-4 text-right font-semibold text-gray-900">{p.punches}</td>
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => openTarget({ mode: 'pending', deviceCode: p.device_code, pending: p })}
                            className="rounded-lg border border-primary-200 bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700 hover:bg-primary-100"
                          >
                            Gán nhân viên
                          </button>
                          <button
                            onClick={() => handleIgnore(p)}
                            disabled={busyCode === p.device_code}
                            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                          >
                            Bỏ qua
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : filteredMappings.length === 0 ? (
          <div className="py-16 text-center">
            <FingerPrintIcon className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-2 text-sm text-gray-500">
              {mappings.length === 0 ? 'Chưa gán mã nào.' : 'Không tìm thấy kết quả phù hợp.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-3">Mã trên máy</th>
                  <th className="px-5 py-3">Nhân viên</th>
                  <th className="px-5 py-3">Tên trên máy</th>
                  <th className="px-5 py-3">Cập nhật</th>
                  <th className="px-5 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredMappings.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4 font-mono font-semibold text-gray-900">{m.device_code}</td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900">{m.employee.full_name}</p>
                      <p className="mt-0.5 text-xs text-gray-500">{m.employee.employee_id}</p>
                    </td>
                    <td className="px-5 py-4 text-gray-700">{m.device_user_name || '—'}</td>
                    <td className="px-5 py-4 text-xs text-gray-500">
                      {formatDateTime(m.updated_at)}
                      {(m.updated_by || m.created_by) && <span> · {m.updated_by || m.created_by}</span>}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => openTarget({ mode: 'edit', deviceCode: m.device_code, mapping: m })}
                          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          Đổi nhân viên
                        </button>
                        <button
                          onClick={() => handleDelete(m)}
                          disabled={busyCode === m.device_code}
                          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                        >
                          Xoá
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal gán / đổi nhân viên ──
          z-[100]: trên header/sidebar (≤ z-50) nhưng dưới danh sách thả xuống của
          SelectBox portal (Headless UI anchor, z-[200]) — cao hơn thì danh sách bị che. */}
      {target && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">
                {target.mode === 'edit' ? `Đổi nhân viên cho mã ${target.deviceCode}` : target.mode === 'pending' ? `Gán mã ${target.deviceCode}` : 'Gán mã chấm công'}
              </h3>
              <button onClick={() => setTarget(null)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              {target.mode === 'create' ? (
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    Mã chấm công trên máy <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={targetCode}
                    onChange={(e) => setTargetCode(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                    placeholder="VD: 1750"
                    autoComplete="off"
                  />
                  <p className="mt-1 text-[11px] text-gray-500">Mã máy cấp khi lấy vân tay. Cùng 1 mã dùng chung cho mọi máy chấm công.</p>
                </div>
              ) : target.pending ? (
                <div className="rounded-xl bg-gray-50 px-4 py-3 text-xs text-gray-600">
                  <p>
                    Tên trên máy: <span className="font-semibold text-gray-900">{target.pending.device_user_names.join(', ') || '—'}</span>
                  </p>
                  <p className="mt-1">
                    {target.pending.punches} lượt chờ, từ {formatPunch(target.pending.first_punch)} đến {formatPunch(target.pending.last_punch)}
                  </p>
                  {target.pending.mapped_employee && (
                    <p className="mt-1 text-amber-700">
                      Mã đang gán cho {target.pending.mapped_employee.full_name} ({target.pending.mapped_employee.employee_id}),
                      người này đã nghỉ — máy đã cấp lại mã cho người khác. Gán lại cho người đang dùng mã.
                    </p>
                  )}
                </div>
              ) : null}

              {target.pending && target.pending.suggestions.length > 0 && (
                <div>
                  <p className="mb-1 text-xs font-medium text-gray-700">Gợi ý (cùng tên gọi, chưa có mã):</p>
                  <div className="flex flex-wrap gap-1.5">
                    {target.pending.suggestions.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => pickSuggestion(s)}
                        className={`rounded-full border px-2.5 py-1 text-xs ${
                          targetEmployeeId === s.id
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {s.full_name} ({s.employee_id})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <SelectBox<number>
                label="Nhân viên"
                value={targetEmployeeId ?? 0}
                options={employeeOptions}
                onChange={(v) => setTargetEmployeeId(v || null)}
                placeholder={employees.length ? 'Tìm và chọn nhân viên...' : 'Đang tải danh sách nhân viên...'}
                searchable
                portal
                maxResults={500}
              />
              {target.mode === 'edit' && (
                <p className="text-[11px] text-gray-500">Chỉ áp dụng cho lượt quẹt từ nay; công đã ghi trước đây không thay đổi.</p>
              )}
              {targetError && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{targetError}</p>}
            </div>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setTarget(null)}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveTarget}
                disabled={targetLoading}
                className="flex-1 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
              >
                {targetLoading ? 'Đang lưu...' : target.mode === 'edit' ? 'Lưu' : 'Gán'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
