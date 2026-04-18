import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  TrophyIcon,
  ArrowPathIcon,
  CalendarIcon,
  UserIcon,
  ClockIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { attendanceService, AttendanceRankingEntry } from '../services/attendance.service';

const MONTH_NAMES = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',
  'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8',
  'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
];

const AttendanceRanking: React.FC = () => {
  const { user } = useAuth();
  const now = new Date();

  const [year, setYear] = useState<number>(now.getFullYear());
  const [month, setMonth] = useState<number>(now.getMonth() + 1);
  const [rankType, setRankType] = useState<'early' | 'on_time'>('early');
  const [top, setTop] = useState<number>(10);
  const [rankings, setRankings] = useState<AttendanceRankingEntry[]>([]);
  const [myRanking, setMyRanking] = useState<AttendanceRankingEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [computing, setComputing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [computeMessage, setComputeMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [sortField, setSortField] = useState<'rank_early' | 'rank_on_time' | 'early_days' | 'total_early_minutes' | 'on_time_days'>('rank_early');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const userRole = user?.role?.toUpperCase() ?? 'USER';
  const isSuperAdmin = user?.is_super_admin || (user as any)?.is_superuser || false;
  const isHR = isSuperAdmin || userRole === 'ADMIN' || userRole === 'HR';

  const employeeId: number | undefined = (user as any)?.employee_profile?.id ?? (user as any)?.hrm_user?.id;

  const fetchRankings = async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, myData] = await Promise.all([
        attendanceService.getRanking({ year, month, type: rankType, top: top > 0 ? top : undefined }),
        employeeId
          ? attendanceService.getRanking({ year, month, type: rankType, employee_id: employeeId })
          : Promise.resolve([] as AttendanceRankingEntry[]),
      ]);
      setRankings(Array.isArray(data) ? data : []);
      const myEntry = Array.isArray(myData) && myData.length > 0 ? myData[0] : null;
      setMyRanking(myEntry);
    } catch {
      setError('Không thể tải dữ liệu bảng xếp hạng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRankings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month, rankType, top]);

  const handleCompute = async () => {
    setComputing(true);
    setComputeMessage(null);
    try {
      await attendanceService.computeRanking(year, month);
      setComputeMessage({ type: 'success', text: `Đã tính xếp hạng cho tháng ${month}/${year} thành công!` });
      await fetchRankings();
    } catch {
      setComputeMessage({ type: 'error', text: 'Tính xếp hạng thất bại. Vui lòng thử lại.' });
    } finally {
      setComputing(false);
    }
  };

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const sortedRankings = [...rankings].sort((a, b) => {
    const aVal = a[sortField] ?? Infinity;
    const bVal = b[sortField] ?? Infinity;
    return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
  });

  const getRankDisplay = (rank: number | null | undefined) => {
    if (rank === null || rank === undefined) return '—';
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const SortIcon: React.FC<{ field: typeof sortField }> = ({ field }) => {
    if (sortField !== field) return <ChevronUpIcon className="h-3 w-3 text-gray-300 inline ml-1" />;
    return sortDir === 'asc'
      ? <ChevronUpIcon className="h-3 w-3 text-indigo-500 inline ml-1" />
      : <ChevronDownIcon className="h-3 w-3 text-indigo-500 inline ml-1" />;
  };

  const yearOptions = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-yellow-100 rounded-lg">
          <TrophyIcon className="h-6 w-6 text-yellow-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Bảng xếp hạng chấm công</h1>
          <p className="text-sm text-gray-500">Thống kê nhân viên đi sớm và đúng giờ theo tháng</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex flex-wrap gap-4 items-end">
          {/* Year */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              <CalendarIcon className="h-3.5 w-3.5 inline mr-1" />Năm
            </label>
            <select
              value={year}
              onChange={e => setYear(Number(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {yearOptions.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Month */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              <CalendarIcon className="h-3.5 w-3.5 inline mr-1" />Tháng
            </label>
            <select
              value={month}
              onChange={e => setMonth(Number(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {MONTH_NAMES.map((name, idx) => (
                <option key={idx + 1} value={idx + 1}>{name}</option>
              ))}
            </select>
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              <ClockIcon className="h-3.5 w-3.5 inline mr-1" />Loại xếp hạng
            </label>
            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
              <button
                onClick={() => setRankType('early')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${rankType === 'early' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                🌅 Đi sớm
              </button>
              <button
                onClick={() => setRankType('on_time')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${rankType === 'on_time' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                ✅ Đúng giờ
              </button>
            </div>
          </div>

          {/* Top N */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Top N
            </label>
            <select
              value={top}
              onChange={e => setTop(Number(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value={5}>Top 5</option>
              <option value={10}>Top 10</option>
              <option value={20}>Top 20</option>
              <option value={50}>Top 50</option>
              <option value={0}>Tất cả</option>
            </select>
          </div>

          {/* Refresh button */}
          <button
            onClick={fetchRankings}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>

          {/* Compute button - HR/admin only */}
          {isHR && (
            <button
              onClick={handleCompute}
              disabled={computing || loading}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              <TrophyIcon className={`h-4 w-4 ${computing ? 'animate-pulse' : ''}`} />
              {computing ? 'Đang tính...' : 'Tính xếp hạng'}
            </button>
          )}
        </div>

        {/* Compute message */}
        {computeMessage && (
          <div
            className={`mt-3 px-4 py-2 rounded-lg text-sm font-medium ${
              computeMessage.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}
          >
            {computeMessage.text}
          </div>
        )}
      </div>

      {/* My ranking card */}
      {myRanking && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 p-4">
          <h2 className="text-sm font-semibold text-indigo-900 mb-2 flex items-center gap-2">
            <UserIcon className="h-4 w-4" />
            Xếp hạng của bạn — {MONTH_NAMES[month - 1]} {year}
          </h2>
          <div className="flex flex-wrap gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-700">
                {getRankDisplay(myRanking.rank_early)}
              </div>
              <div className="text-xs text-gray-600 mt-0.5">Hạng đi sớm</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-700">
                {getRankDisplay(myRanking.rank_on_time)}
              </div>
              <div className="text-xs text-gray-600 mt-0.5">Hạng đúng giờ</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-800">{myRanking.early_days}</div>
              <div className="text-xs text-gray-600 mt-0.5">Ngày đi sớm</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-800">{myRanking.total_early_minutes}</div>
              <div className="text-xs text-gray-600 mt-0.5">Phút đi sớm</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-800">{myRanking.on_time_days}</div>
              <div className="text-xs text-gray-600 mt-0.5">Ngày đúng giờ</div>
            </div>
          </div>
        </div>
      )}

      {/* Rankings table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">
            {rankType === 'early' ? '🌅 Bảng xếp hạng đi sớm' : '✅ Bảng xếp hạng đúng giờ'} — {MONTH_NAMES[month - 1]} {year}
          </h2>
          <span className="text-xs text-gray-500">{rankings.length} nhân viên</span>
        </div>

        {error && (
          <div className="px-5 py-4 text-sm text-red-600 bg-red-50">{error}</div>
        )}

        {loading ? (
          <div className="px-5 py-10 text-center text-sm text-gray-500">
            <ArrowPathIcon className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-400" />
            Đang tải dữ liệu...
          </div>
        ) : rankings.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-gray-500">
            <TrophyIcon className="h-10 w-10 mx-auto mb-3 text-gray-300" />
            <p>Chưa có dữ liệu xếp hạng cho tháng này.</p>
            {isHR && (
              <p className="mt-1 text-xs text-gray-400">Nhấn <strong>Tính xếp hạng</strong> để tạo dữ liệu.</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort(rankType === 'early' ? 'rank_early' : 'rank_on_time')}
                  >
                    Hạng <SortIcon field={rankType === 'early' ? 'rank_early' : 'rank_on_time'} />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Nhân viên
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Phòng ban
                  </th>
                  {rankType === 'early' ? (
                    <>
                      <th
                        className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('early_days')}
                      >
                        Ngày đi sớm <SortIcon field="early_days" />
                      </th>
                      <th
                        className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('total_early_minutes')}
                      >
                        Tổng phút sớm <SortIcon field="total_early_minutes" />
                      </th>
                    </>
                  ) : (
                    <th
                      className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('on_time_days')}
                    >
                      Ngày đúng giờ <SortIcon field="on_time_days" />
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {sortedRankings.map((entry, idx) => {
                  const rank = rankType === 'early' ? entry.rank_early : entry.rank_on_time;
                  const isTopThree = rank !== null && rank !== undefined && rank <= 3;
                  return (
                    <tr
                      key={entry.id}
                      className={`${isTopThree ? 'bg-yellow-50' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-indigo-50 transition-colors`}
                    >
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                        <span className={`text-lg ${isTopThree ? '' : 'text-gray-600'}`}>
                          {getRankDisplay(rank)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{entry.employee_name}</div>
                        <div className="text-xs text-gray-500">{entry.employee_code}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {entry.department_name ?? '—'}
                      </td>
                      {rankType === 'early' ? (
                        <>
                          <td className="px-4 py-3 text-right text-sm font-medium text-indigo-700">
                            {entry.early_days} ngày
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-medium text-purple-700">
                            {entry.total_early_minutes} phút
                          </td>
                        </>
                      ) : (
                        <td className="px-4 py-3 text-right text-sm font-medium text-green-700">
                          {entry.on_time_days} ngày
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceRanking;
