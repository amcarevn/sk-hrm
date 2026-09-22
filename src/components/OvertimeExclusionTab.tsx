import React, { useEffect, useState } from 'react';
import {
  BuildingOfficeIcon,
  BriefcaseIcon,
  UserIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { departmentsAPI, employeesAPI, positionsAPI } from '../utils/api';
import { Department, Position, Employee } from '../utils/api/types';
import {
  getOvertimeExclusionConfig,
  updateOvertimeExclusionConfig,
} from '../services/permission-config.service';

function toggleId(arr: number[], id: number): number[] {
  return arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id];
}

const OvertimeExclusionTab: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [departmentIds, setDepartmentIds] = useState<number[]>([]);
  const [positionIds, setPositionIds] = useState<number[]>([]);
  const [employeeIds, setEmployeeIds] = useState<number[]>([]);

  const [deptSearch, setDeptSearch] = useState('');
  const [posSearch, setPosSearch] = useState('');
  const [empSearch, setEmpSearch] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [deptRes, posRes, empRes, config] = await Promise.all([
        departmentsAPI.list({ page_size: 500 }),
        positionsAPI.list({ page_size: 500 }),
        employeesAPI.list({ page_size: 1000, is_active: true }),
        getOvertimeExclusionConfig(),
      ]);
      setDepartments(deptRes.results);
      setPositions(posRes.results);
      setEmployees(empRes.results);
      setDepartmentIds(config.excluded_departments);
      setPositionIds(config.excluded_positions);
      setEmployeeIds(config.excluded_employees);
    } catch (err: any) {
      setError(err?.response?.data?.detail || err.message || 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await updateOvertimeExclusionConfig({
        excluded_employees: employeeIds,
        excluded_positions: positionIds,
        excluded_departments: departmentIds,
      });
      setSavedAt(Date.now());
      setTimeout(() => setSavedAt(null), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.detail || err.message || 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const filteredDepartments = departments.filter(
    d => !deptSearch || d.name.toLowerCase().includes(deptSearch.toLowerCase())
  );
  const filteredPositions = positions.filter(
    p => !posSearch || p.title.toLowerCase().includes(posSearch.toLowerCase())
  );
  const filteredEmployees = employees.filter(
    e =>
      !empSearch ||
      e.full_name.toLowerCase().includes(empSearch.toLowerCase()) ||
      e.employee_id.toLowerCase().includes(empSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <p className="mt-4 text-sm text-gray-500">Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        <p className="text-sm font-medium text-amber-800">Loại trừ tăng ca</p>
        <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
          Nhân viên/vị trí/phòng ban được chọn bên dưới sẽ KHÔNG được tính tăng ca tự động phát
          hiện — vẫn có thể tự tạo đơn tăng ca để quản lý trực tiếp và HR duyệt. Chọn phòng ban sẽ
          loại trừ TẤT CẢ nhân viên trong phòng ban đó, bao gồm cả trưởng phòng.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
          <ExclamationCircleIcon className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Phòng ban */}
        <div className="border border-gray-100 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-violet-100 text-violet-600 rounded-xl flex items-center justify-center shrink-0">
              <BuildingOfficeIcon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Phòng ban</p>
              <p className="text-xs text-gray-400">Đã chọn: {departmentIds.length}</p>
            </div>
          </div>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm phòng ban..."
              value={deptSearch}
              onChange={e => setDeptSearch(e.target.value)}
              className="input-field pl-9"
            />
          </div>
          <div className="border border-gray-100 rounded-xl overflow-y-auto max-h-[320px] divide-y divide-gray-50 bg-white">
            {filteredDepartments.map(d => (
              <label
                key={d.id}
                className="flex items-center gap-2.5 px-3 py-2 hover:bg-primary-50 cursor-pointer text-sm transition-colors"
              >
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-400"
                  checked={departmentIds.includes(d.id)}
                  onChange={() => setDepartmentIds(prev => toggleId(prev, d.id))}
                />
                <span className="font-medium text-gray-800 truncate">{d.name}</span>
              </label>
            ))}
            {filteredDepartments.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-6">Không có kết quả</p>
            )}
          </div>
        </div>

        {/* Vị trí */}
        <div className="border border-gray-100 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-sky-100 text-sky-600 rounded-xl flex items-center justify-center shrink-0">
              <BriefcaseIcon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Vị trí</p>
              <p className="text-xs text-gray-400">Đã chọn: {positionIds.length}</p>
            </div>
          </div>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm vị trí..."
              value={posSearch}
              onChange={e => setPosSearch(e.target.value)}
              className="input-field pl-9"
            />
          </div>
          <div className="border border-gray-100 rounded-xl overflow-y-auto max-h-[320px] divide-y divide-gray-50 bg-white">
            {filteredPositions.map(p => (
              <label
                key={p.id}
                className="flex items-center gap-2.5 px-3 py-2 hover:bg-primary-50 cursor-pointer text-sm transition-colors"
              >
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-400"
                  checked={positionIds.includes(p.id)}
                  onChange={() => setPositionIds(prev => toggleId(prev, p.id))}
                />
                <span className="text-gray-800 truncate">{p.title}</span>
              </label>
            ))}
            {filteredPositions.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-6">Không có kết quả</p>
            )}
          </div>
        </div>

        {/* Nhân viên */}
        <div className="border border-gray-100 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-teal-100 text-teal-600 rounded-xl flex items-center justify-center shrink-0">
              <UserIcon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Nhân viên</p>
              <p className="text-xs text-gray-400">Đã chọn: {employeeIds.length}</p>
            </div>
          </div>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm tên hoặc mã NV..."
              value={empSearch}
              onChange={e => setEmpSearch(e.target.value)}
              className="input-field pl-9"
            />
          </div>
          <div className="border border-gray-100 rounded-xl overflow-y-auto max-h-[320px] divide-y divide-gray-50 bg-white">
            {filteredEmployees.map(e => (
              <label
                key={e.id}
                className="flex items-center gap-2.5 px-3 py-2 hover:bg-primary-50 cursor-pointer text-sm transition-colors"
              >
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-400"
                  checked={employeeIds.includes(e.id)}
                  onChange={() => setEmployeeIds(prev => toggleId(prev, e.id))}
                />
                <span className="font-mono text-[11px] text-gray-400 w-14 shrink-0">{e.employee_id}</span>
                <span className="font-medium text-gray-800 truncate">{e.full_name}</span>
              </label>
            ))}
            {filteredEmployees.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-6">Không có kết quả</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        {savedAt && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-600">
            <CheckCircleIcon className="h-4 w-4" />
            Đã lưu
          </span>
        )}
        <button type="button" onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-50">
          {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </div>
    </div>
  );
};

export default OvertimeExclusionTab;
