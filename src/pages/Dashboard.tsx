import React, { useEffect, useState } from 'react';
import { usePieAnimation } from '@/hooks/usePieAnimation';
import { useDebounce } from '@/hooks/useDebounce';
import {
  CurrencyDollarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  UserPlusIcon,
  UsersIcon,
  ComputerDesktopIcon,
  UserMinusIcon,
  WrenchScrewdriverIcon,
  ArchiveBoxIcon,
  Squares2X2Icon,
  UserGroupIcon,
  ChartPieIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Label,
} from 'recharts';
import { dashboardAPI, departmentsAPI, type Department } from '@/utils/api';
import HRStats from '../components/HRStats';
import { AnimatedNum } from '../components/AnimatedNum';
import { DonutCenter } from '../components/DonutCenter';
import { ProgressBar } from '../components/ProgressBar';

interface RecruitmentEmployee {
  id: number;
  employee_code: string;
  full_name: string;
  start_date: string | null;
  end_date: string | null;
  contract_start_date?: string | null;
  contract_type?: string;
  department_name: string;
  position_title: string;
  is_currently_working: boolean;
  recruiter_employee_id?: string | null;
  recruiter_full_name?: string | null;
}

interface RecruitmentStats {
  total_hired: number;
  currently_working: number;
  left_within_3_days: number;
  left_from_4_to_7_days: number;
  left_after_7_days: number;
  passed_7_days: number;
  passed_1_month: number;
  pass_probation: number;
  official_contracts: number;
  total_candidates: number;
  avg_days_before_exit: number;
  by_position: Array<{
    position_id: number | null;
    position_title: string;
    position_code: string;
    hired_count: number;
    currently_working: number;
    left_within_3_days: number;
    left_from_4_to_7_days: number;
    left_within_7_days: number;
    passed_7_days: number;
    passed_1_month: number;
    pass_probation: number;
    early_turnover_rate: number;
    pass_rate: number;
    employees: RecruitmentEmployee[];
  }>;
  by_department: Array<{
    department_id: number | null;
    department_name: string;
    department_code: string;
    hired_count: number;
    left_within_7_days: number;
    left_within_1_month: number;
    left_within_2_months: number;
    early_turnover_rate: number;
  }>;
  by_recruiter: Array<{
    recruiter_id: number | null;
    recruiter_name: string;
    candidate_count: number;
  }>;
  by_recruiter_position: Array<{
    recruiter_id: number | null;
    recruiter_name: string;
    hired_count: number;
    passed_3_days: number;
    passed_7_days: number;
    passed_1_month: number;
    official_contracts: number;
    employees: RecruitmentEmployee[];
    positions: Array<{
      position_id: number | null;
      position_title: string;
      hired_count: number;
      employees: RecruitmentEmployee[];
    }>;
  }>;
  risky_positions: Array<{
    position_id: number | null;
    position_title: string;
    position_code: string;
    hired_count: number;
    left_within_7_days: number;
    early_turnover_rate: number;
    pass_probation: number;
    pass_rate: number;
    employees: RecruitmentEmployee[];
  }>;
  monthly_cohorts: Array<{
    month: string;
    hired_count: number;
    currently_working: number;
    left_within_7_days: number;
    passed_7_days: number;
    passed_1_month: number;
    pass_probation: number;
    official_contracts: number;
    pass_rate: number;
  }>;
  employee_lists: Record<string, RecruitmentEmployee[]>;
}

interface SocialInsuranceCounts {
  participating: number;
  not_participating: number;
  suspended: number;
  unspecified: number;
  missing_number: number;
  missing_tax_code: number;
  missing_household_code: number;
  missing_contribution: number;
  contribution_level_total: number;
  participation_rate: number;
}

interface SocialInsuranceStats {
  summary: SocialInsuranceCounts & {
    total_active: number;
    new_participation_in_period: number;
    contribution_level_average: number;
  };
  by_department: Array<SocialInsuranceCounts & {
    department_id: number | null;
    department_name: string;
    department_code: string;
    active_count: number;
  }>;
}

interface HRMDashboardStats {
  employee_stats: {
    total: number;
    active: number;
    probation: number;
    inactive: number;
    new_last_30_days: number;
    recent_hires: number;
    gender_distribution: { male: number; female: number; other: number };
  };
  department_stats: Array<{ id: number; name: string; code: string; employee_count: number }>;
  // Chỉ Admin / HCNS mới nhận 2 khối này (backend tự lọc theo quyền).
  recruitment_stats?: RecruitmentStats;
  social_insurance_stats?: SocialInsuranceStats;
  asset_stats: {
    total: number;
    in_use: number;
    idle: number;
    under_maintenance: number;
    total_value: number;
    current_assignments: number;
    upcoming_maintenance: number;
    type_distribution: Array<{ type: string; display_name: string; count: number }>;
  };
  recent_activities: { asset_assignments: number; asset_returns: number; maintenance: number };
  trends: { employee_growth: number; asset_growth: number };
}

const CHART_COLORS = [
  '#1B65B8', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#84cc16',
];

const formatNumber = (n: number) =>
  n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

const formatCurrency = (n: number) => `${formatNumber(Math.round(n))} VNĐ`;
const formatPercent = (n: number) => `${Number.isFinite(n) ? n.toFixed(1) : '0.0'}%`;

const formatShortDate = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${date.getFullYear()}`;
};

const toDateInputValue = (date: Date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const getDefaultStartDate = () => {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return toDateInputValue(date);
};

const NO_DATA = [{ name: 'Chưa có dữ liệu', value: 1, color: '#e5e7eb' }];

const formatDate = (d: Date | string) => {
  const date = typeof d === 'string' ? new Date(d) : d;
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
};

// Modern custom tooltip
const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="bg-gray-900/95 backdrop-blur rounded-xl px-3 py-2 shadow-xl text-xs">
      <p className="text-white/60 mb-0.5">{p.name}</p>
      <p className="text-white font-bold text-sm">{formatNumber(p.value ?? 0)}</p>
    </div>
  );
};

// Modern donut chart card with side legend
const DonutCard = ({
  title,
  sub,
  data,
  centerValue,
  centerLabel,
}: {
  title: string;
  sub?: string;
  data: { name: string; value: number; color: string }[];
  centerValue: string | number;
  centerLabel: string;
}) => {
  const total = data.reduce((s, d) => s + d.value, 0);
  const numericCenter = typeof centerValue === 'number' ? centerValue : 0;
  const { endAngle, startAngle, animationDuration } = usePieAnimation();

  return (
    <div className="bg-white rounded-2xl border border-gray-100 border-l-4 border-l-primary-500 shadow-sm p-5">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-gray-900">{title}</h3>
        {sub && <p className="text-xs text-gray-600 mt-0.5">{sub}</p>}
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-5">
        {/* Donut */}
        <div className="flex-shrink-0">
          <ResponsiveContainer width={160} height={160}>
            <PieChart key={numericCenter}>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={76}
                paddingAngle={3}
                dataKey="value"
                nameKey="name"
                strokeWidth={0}
                startAngle={startAngle}
                endAngle={endAngle}
                isAnimationActive={true}
                animationBegin={0}
                animationDuration={animationDuration}
                animationEasing="ease-out"
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
                <Label
                  content={({ viewBox }) => {
                    const { cx, cy } = viewBox as any;
                    return <DonutCenter value={numericCenter} label={centerLabel} cx={cx} cy={cy} />;
                  }}
                  position="center"
                />
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="w-full sm:w-auto sm:flex-1 space-y-2.5 min-w-0">
          {data.filter(d => d.value > 0).map((item) => {
            const pct = total > 0 ? (item.value / total) * 100 : 0;
            return (
              <div key={item.name}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-[11px] text-gray-600 truncate">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span className="text-[11px] font-bold text-gray-900 tabular-nums">
                      <AnimatedNum value={item.value} />
                    </span>
                    <span className="text-[10px] text-gray-400 w-8 text-right tabular-nums">
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                </div>
                <ProgressBar pct={pct} color={item.color} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({
  name,
  rawValue,
  formatter,
  subtext,
  icon: Icon,
  iconBg,
  trend,
  onClick,
}: {
  name: string;
  rawValue: number;
  formatter: (v: number) => string;
  subtext: string;
  icon: React.ElementType;
  iconBg: string;
  trend: number | null;
  onClick?: () => void;
}) => {
  const cardClass = 'bg-white rounded-2xl border border-gray-100 border-l-4 border-l-primary-500 shadow-sm p-4 sm:p-5';
  const content = (
    <>
      <div className="flex items-start justify-between mb-3">
        <div className={`h-9 w-9 ${iconBg} rounded-xl flex items-center justify-center`}>
          <Icon className="h-5 w-5" />
        </div>
        {trend !== null && trend !== undefined && (
          <span className={`inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${
            trend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
          }`}>
            {trend >= 0 ? <ArrowUpIcon className="h-3 w-3" /> : <ArrowDownIcon className="h-3 w-3" />}
            {Math.abs(trend)}
          </span>
        )}
      </div>
      <p className="text-[11px] font-medium text-gray-600 uppercase tracking-wide">{name}</p>
      <p className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight mt-0.5 break-words sm:truncate">
        {formatter(rawValue)}
      </p>
      <p className="text-xs text-gray-600 mt-1">{subtext}</p>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${cardClass} w-full text-left transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500`}
      >
        {content}
      </button>
    );
  }
  return <div className={cardClass}>{content}</div>;
};

type TabKey = 'overview' | 'employee' | 'recruitment' | 'insurance' | 'asset';

// hrOnly: dữ liệu chỉ trả về cho Admin / HCNS — người khác không thấy tab.
const TABS: { key: TabKey; label: string; icon: React.ElementType; hrOnly?: boolean }[] = [
  { key: 'overview', label: 'Tổng quan', icon: Squares2X2Icon },
  { key: 'employee', label: 'Nhân viên', icon: UserGroupIcon },
  { key: 'recruitment', label: 'Tuyển dụng', icon: UserPlusIcon, hrOnly: true },
  { key: 'insurance', label: 'BHXH', icon: ShieldCheckIcon, hrOnly: true },
  { key: 'asset', label: 'Tài sản', icon: ChartPieIcon },
];

type RecruiterBreakdown = {
  recruiterName: string;
  positions: RecruitmentStats['by_recruiter_position'][number]['positions'];
};

const Dashboard = () => {
  const [stats, setStats] = useState<HRMDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedRecruitmentList, setSelectedRecruitmentList] = useState<{
    title: string;
    employees: RecruitmentEmployee[];
  } | null>(null);
  const [selectedRecruiterBreakdown, setSelectedRecruiterBreakdown] = useState<RecruiterBreakdown | null>(null);
  const [filters, setFilters] = useState({
    start_date: getDefaultStartDate(),
    end_date: toDateInputValue(new Date()),
    department_id: '',
    all_time: false,
  });
  const debouncedFilters = useDebounce(filters, 400);
  const hasHRStats = !!stats?.recruitment_stats && !!stats?.social_insurance_stats;

  useEffect(() => {
    setLoading(true);
    setError(null);
    dashboardAPI.getHRMStats({
      start_date: debouncedFilters.all_time ? undefined : debouncedFilters.start_date,
      end_date: debouncedFilters.all_time ? undefined : debouncedFilters.end_date,
      department_id: debouncedFilters.department_id ? Number(debouncedFilters.department_id) : '',
      all_time: debouncedFilters.all_time,
    })
      .then(setStats)
      .catch((err: any) => setError(err?.response?.data?.detail || err.message || 'Lỗi khi tải dashboard'))
      .finally(() => setLoading(false));
  }, [debouncedFilters]);

  useEffect(() => {
    if (!hasHRStats) return;
    departmentsAPI.list({ page_size: 1000 })
      .then((response) => setDepartments(response.results || []))
      .catch(() => setDepartments([]));
  }, [hasHRStats]);

  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        <p className="text-sm text-gray-500">Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <p className="text-sm font-semibold text-red-500">Lỗi tải dữ liệu</p>
          <p className="text-xs text-gray-400 mt-1">{error ?? 'Không có dữ liệu'}</p>
        </div>
      </div>
    );
  }

  // ── Dữ liệu charts ──
  const genderData = [
    { name: 'Nam', value: stats.employee_stats.gender_distribution.male, color: '#1B65B8' },
    { name: 'Nữ', value: stats.employee_stats.gender_distribution.female, color: '#ec4899' },
    { name: 'Khác', value: stats.employee_stats.gender_distribution.other, color: '#8b5cf6' },
  ];

  const activityData = [
    { name: 'Gán tài sản', value: stats.recent_activities.asset_assignments, color: '#10b981' },
    { name: 'Trả tài sản', value: stats.recent_activities.asset_returns, color: '#f59e0b' },
    { name: 'Bảo trì', value: stats.recent_activities.maintenance, color: '#1B65B8' },
  ];
  const totalActivities = activityData.reduce((s, d) => s + d.value, 0);
  const safeActivityData = activityData.filter(d => d.value > 0).length > 0
    ? activityData
    : [{ name: 'Không có dữ liệu', value: 1, color: '#e5e7eb' }];

  const assetStatusData = [
    { name: 'Đang sử dụng', value: stats.asset_stats.in_use, color: '#10b981' },
    { name: 'Không sử dụng', value: stats.asset_stats.idle, color: '#6b7280' },
    { name: 'Bảo trì', value: stats.asset_stats.under_maintenance, color: '#f59e0b' },
  ];

  const sortedDepts = [...stats.department_stats].sort((a, b) => b.employee_count - a.employee_count);
  const deptDonutData = [
    ...sortedDepts.slice(0, 5).map((d, i) => ({ name: d.name, value: d.employee_count, color: CHART_COLORS[i] })),
    ...(sortedDepts.length > 5
      ? [{ name: 'Khác', value: sortedDepts.slice(5).reduce((s, d) => s + d.employee_count, 0), color: '#9ca3af' }]
      : []),
  ];

  const deptBarData = [...stats.department_stats]
    .sort((a, b) => b.employee_count - a.employee_count)
    .slice(0, 6)
    .map((d, i) => ({ name: d.name, value: d.employee_count, color: CHART_COLORS[i % CHART_COLORS.length] }));

  const assetTypeData = [...stats.asset_stats.type_distribution]
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
    .map((t, i) => ({ name: t.display_name, value: t.count, color: CHART_COLORS[i % CHART_COLORS.length] }));

  const visibleTabs = TABS.filter(tab => !tab.hrOnly || hasHRStats);
  const recruitmentStats = stats.recruitment_stats;
  const socialInsuranceStats = stats.social_insurance_stats;
  const topSix = (items: { name: string; value: number }[]) => {
    const data = items.slice(0, 6).map((item, i) => ({ ...item, color: CHART_COLORS[i % CHART_COLORS.length] }));
    return data.some(item => item.value > 0) ? data : NO_DATA;
  };
  const recruitmentPositionData = topSix((recruitmentStats?.by_position || [])
    .map(position => ({ name: position.position_title, value: position.hired_count })));
  const recruitmentRecruiterData = topSix((recruitmentStats?.by_recruiter || [])
    .map(recruiter => ({ name: recruiter.recruiter_name, value: recruiter.candidate_count })));
  const socialInsuranceStatusData = (() => {
    const summary = socialInsuranceStats?.summary;
    const data = [
      { name: 'Đang tham gia', value: summary?.participating || 0, color: '#10b981' },
      { name: 'Đã dừng tham gia', value: summary?.not_participating || 0, color: '#6b7280' },
      { name: 'Tạm dừng', value: summary?.suspended || 0, color: '#f59e0b' },
      { name: 'Chưa có hồ sơ BHXH', value: summary?.unspecified || 0, color: '#ef4444' },
    ];
    return data.some(item => item.value > 0) ? data : NO_DATA;
  })();
  const socialInsuranceDeptData = topSix([...(socialInsuranceStats?.by_department || [])]
    .sort((a, b) => b.participating - a.participating)
    .map(department => ({ name: department.department_name, value: department.participating })));
  const recruiterBreakdownData = (selectedRecruiterBreakdown?.positions || [])
    .slice(0, 6)
    .map((position, i) => ({
      name: position.position_title,
      value: position.hired_count,
      color: CHART_COLORS[i % CHART_COLORS.length],
      employees: position.employees,
    }));
  const safeRecruiterBreakdownData = recruiterBreakdownData.some(item => item.value > 0)
    ? recruiterBreakdownData
    : NO_DATA.map(item => ({ ...item, employees: [] as RecruitmentEmployee[] }));

  const openRecruitmentList = (key: string, title: string) => {
    setSelectedRecruitmentList({ title, employees: recruitmentStats?.employee_lists?.[key] || [] });
  };
  const openPositionList = (position: { position_title: string; employees: RecruitmentEmployee[] }) => {
    setSelectedRecruitmentList({ title: `Danh sách vị trí ${position.position_title}`, employees: position.employees || [] });
  };
  const openRecruiterPositionList = (positionTitle: string, employees: RecruitmentEmployee[]) => {
    setSelectedRecruiterBreakdown(null);
    setSelectedRecruitmentList({
      title: `${selectedRecruiterBreakdown?.recruiterName || ''} - ${positionTitle}`,
      employees,
    });
  };

  const statsFilterPanel = (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="mb-3 flex items-center gap-2">
        <div>
          <h2 className="text-sm font-bold text-gray-900">Bộ lọc thống kê nhân sự</h2>
          <p className="text-xs text-gray-600 mt-0.5">Áp dụng cho tab Tuyển dụng và BHXH</p>
        </div>
        {loading && (
          <span className="flex items-center gap-1.5 text-xs text-primary-600">
            <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary-600" />
            Đang cập nhật...
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
        <label className="block">
          <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Từ ngày</span>
          <input
            type="date"
            value={filters.start_date}
            disabled={filters.all_time}
            onChange={(event) => setFilters(prev => ({ ...prev, start_date: event.target.value }))}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 disabled:bg-gray-50 disabled:text-gray-400 focus:border-primary-500 focus:ring-primary-500"
          />
        </label>
        <label className="block">
          <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Đến ngày</span>
          <input
            type="date"
            value={filters.end_date}
            disabled={filters.all_time}
            onChange={(event) => setFilters(prev => ({ ...prev, end_date: event.target.value }))}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 disabled:bg-gray-50 disabled:text-gray-400 focus:border-primary-500 focus:ring-primary-500"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Phạm vi</span>
          <select
            value={filters.department_id}
            onChange={(event) => setFilters(prev => ({ ...prev, department_id: event.target.value }))}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500"
          >
            <option value="">Cả công ty</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.code ? `${department.code} - ${department.name}` : department.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 md:mt-5">
          <input
            type="checkbox"
            checked={filters.all_time}
            onChange={(event) => setFilters(prev => ({ ...prev, all_time: event.target.checked }))}
            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-sm font-semibold text-gray-700">Từ trước tới nay</span>
        </label>
      </div>
    </div>
  );

  const tableCard = (title: string, sub: string, children: React.ReactNode, action?: React.ReactNode) => (
    <div className="bg-white rounded-2xl border border-gray-100 border-l-4 border-l-primary-500 shadow-sm p-4 sm:p-5 overflow-hidden">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-600 mt-0.5">{sub}</p>
        </div>
        {action}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">{children}</table>
      </div>
    </div>
  );
  const th = 'py-2 px-3 font-semibold text-right whitespace-nowrap';
  const headRow = 'text-left text-[11px] uppercase tracking-wide text-gray-500 border-b border-gray-100';
  const emptyRow = (colSpan: number, text = 'Chưa có dữ liệu trong khoảng lọc') => (
    <tr>
      <td colSpan={colSpan} className="py-8 text-center text-sm text-gray-500">{text}</td>
    </tr>
  );

  return (
    <div className="flex flex-col gap-5 min-h-[calc(100vh-7rem)]">
      {/* Header */}
      <div className="flex flex-col items-center text-center gap-2 sm:flex-row sm:items-center sm:justify-between sm:text-left">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Dashboard HRM</h1>
          <p className="text-sm text-gray-900 mt-0.5">Tổng quan nhân sự & tài sản</p>
        </div>
        <span className="text-[11px] text-gray-600 bg-white border border-gray-200 rounded-lg px-3 py-1.5 flex-shrink-0">
          {formatDate(new Date())}
        </span>
      </div>

      {/* Tabs */}
      {/* shrink-0: khung cuộn trong cột flex bị co chiều cao về 0 khi nội dung tab dài */}
      <div className="flex shrink-0 gap-1 bg-gray-100 rounded-xl p-1 w-full sm:w-fit overflow-x-auto sm:overflow-visible">
        {visibleTabs.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-xs font-semibold whitespace-nowrap px-2 sm:px-4 py-2 rounded-lg transition-all ${
                active
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Tab: Tổng quan ── */}
      {activeTab === 'overview' && (
        <div className="flex flex-col gap-5 flex-1">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard name="Tổng nhân viên" rawValue={stats.employee_stats.total} formatter={formatNumber}
              subtext={`${formatNumber(stats.employee_stats.active)} đang làm việc`}
              icon={UsersIcon} iconBg="bg-primary-100 text-primary-600" trend={stats.trends.employee_growth} />
            <StatCard name="Thử việc" rawValue={stats.employee_stats.probation} formatter={formatNumber}
              subtext={`${formatNumber(stats.employee_stats.new_last_30_days)} mới / 30 ngày`}
              icon={UserPlusIcon} iconBg="bg-amber-100 text-amber-600" trend={null} />
            <StatCard name="Tài sản đang dùng" rawValue={stats.asset_stats.in_use} formatter={formatNumber}
              subtext={`${formatNumber(stats.asset_stats.total)} tổng tài sản`}
              icon={ComputerDesktopIcon} iconBg="bg-emerald-100 text-emerald-600" trend={stats.trends.asset_growth} />
            <StatCard name="Giá trị tài sản" rawValue={stats.asset_stats.total_value} formatter={formatCurrency}
              subtext={`${formatNumber(stats.asset_stats.current_assignments)} đang gán`}
              icon={CurrencyDollarIcon} iconBg="bg-violet-100 text-violet-600" trend={null} />
          </div>
          <div className="flex-1">
            <HRStats />
          </div>
        </div>
      )}

      {/* ── Tab: Nhân viên ── */}
      {activeTab === 'employee' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard name="Đang làm việc" rawValue={stats.employee_stats.active} formatter={formatNumber}
              subtext={`Tổng ${formatNumber(stats.employee_stats.total)} nhân viên`}
              icon={UsersIcon} iconBg="bg-primary-100 text-primary-600" trend={stats.trends.employee_growth} />
            <StatCard name="Thử việc" rawValue={stats.employee_stats.probation} formatter={formatNumber}
              subtext={`${formatNumber(stats.employee_stats.new_last_30_days)} mới / 30 ngày`}
              icon={UserPlusIcon} iconBg="bg-amber-100 text-amber-600" trend={null} />
            <StatCard name="Mới tuyển dụng" rawValue={stats.employee_stats.recent_hires} formatter={formatNumber}
              subtext="Trong 30 ngày gần nhất"
              icon={UserGroupIcon} iconBg="bg-emerald-100 text-emerald-600" trend={null} />
            <StatCard name="Nghỉ việc" rawValue={stats.employee_stats.inactive} formatter={formatNumber}
              subtext="Không còn làm việc"
              icon={UserMinusIcon} iconBg="bg-red-100 text-red-500" trend={null} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <DonutCard title="Phân bố giới tính" data={genderData}
              centerValue={stats.employee_stats.total} centerLabel="Nhân viên" />
            <DonutCard title="Tóm tắt phòng ban" sub="Top 5 phòng ban" data={deptDonutData}
              centerValue={stats.employee_stats.active} centerLabel="Đang làm" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <DonutCard title="Phân bố nhân sự theo phòng ban" sub="Top 6 phòng ban" data={deptBarData}
              centerValue={stats.employee_stats.total} centerLabel="Tổng NV" />
            <DonutCard title="Hoạt động gần đây" sub="7 ngày qua" data={safeActivityData}
              centerValue={totalActivities} centerLabel="Hoạt động" />
          </div>
        </div>
      )}

      {/* ── Tab: Tuyển dụng ── */}
      {activeTab === 'recruitment' && recruitmentStats && (
        <div className="space-y-5">
          {statsFilterPanel}

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            <StatCard name="Tuyển vào" rawValue={recruitmentStats.total_hired} formatter={formatNumber}
              subtext="Theo bộ lọc phía trên"
              icon={UserPlusIcon} iconBg="bg-emerald-100 text-emerald-600" trend={null}
              onClick={() => openRecruitmentList('total_hired', 'Danh sách tuyển vào')} />
            <StatCard name="Đang làm việc" rawValue={recruitmentStats.currently_working} formatter={formatNumber}
              subtext="Trong danh sách vừa tuyển vào"
              icon={UsersIcon} iconBg="bg-teal-100 text-teal-600" trend={null}
              onClick={() => openRecruitmentList('currently_working', 'Danh sách nhân sự tuyển vào đang làm việc')} />
            <StatCard name="Nghỉ ≤ 3 ngày" rawValue={recruitmentStats.left_within_3_days} formatter={formatNumber}
              subtext="Ngày nghỉ trong 3 ngày đầu"
              icon={UserMinusIcon} iconBg="bg-red-100 text-red-500" trend={null}
              onClick={() => openRecruitmentList('left_within_3_days', 'Danh sách nghỉ trong 3 ngày đầu')} />
            <StatCard name="Nghỉ 4-7 ngày" rawValue={recruitmentStats.left_from_4_to_7_days} formatter={formatNumber}
              subtext="Ngày nghỉ từ ngày 4 đến 7"
              icon={UserMinusIcon} iconBg="bg-orange-100 text-orange-600" trend={null}
              onClick={() => openRecruitmentList('left_from_4_to_7_days', 'Danh sách nghỉ từ ngày 4 đến 7')} />
            <StatCard name="Nghỉ > 7 ngày" rawValue={recruitmentStats.left_after_7_days} formatter={formatNumber}
              subtext="Có ngày nghỉ sau tuần đầu"
              icon={UserMinusIcon} iconBg="bg-gray-100 text-gray-600" trend={null}
              onClick={() => openRecruitmentList('left_after_7_days', 'Danh sách nghỉ sau 7 ngày')} />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard name="Qua 7 ngày" rawValue={recruitmentStats.passed_7_days} formatter={formatNumber}
              subtext="Không nghỉ trong tuần đầu"
              icon={CheckCircleIcon} iconBg="bg-cyan-100 text-cyan-600" trend={null}
              onClick={() => openRecruitmentList('passed_7_days', 'Danh sách qua 7 ngày')} />
            <StatCard name="Qua 1 tháng" rawValue={recruitmentStats.passed_1_month} formatter={formatNumber}
              subtext="Không nghỉ trong tháng đầu"
              icon={CheckCircleIcon} iconBg="bg-indigo-100 text-indigo-600" trend={null}
              onClick={() => openRecruitmentList('passed_1_month', 'Danh sách qua 1 tháng')} />
            <StatCard name="Qua 2 tháng" rawValue={recruitmentStats.pass_probation} formatter={formatNumber}
              subtext="Mốc pass thử việc"
              icon={CheckCircleIcon} iconBg="bg-primary-100 text-primary-600" trend={null}
              onClick={() => openRecruitmentList('pass_probation', 'Danh sách pass thử việc')} />
            <StatCard name="Lên chính thức (HĐLĐ)" rawValue={recruitmentStats.official_contracts} formatter={formatNumber}
              subtext="HĐ 12T / 24T / vô thời hạn, theo ngày bắt đầu HĐ"
              icon={ShieldCheckIcon} iconBg="bg-emerald-100 text-emerald-600" trend={null}
              onClick={() => openRecruitmentList('official_contracts', 'Danh sách lên chính thức ký HĐLĐ')} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-4">
              <DonutCard title="Tuyển vào theo vị trí" sub="Top 6 vị trí" data={recruitmentPositionData}
                centerValue={recruitmentStats.total_hired} centerLabel="Tuyển vào" />
              <DonutCard title="Ứng viên theo nhân viên tuyển dụng" sub="Top 6 nhân viên tuyển dụng" data={recruitmentRecruiterData}
                centerValue={recruitmentStats.total_candidates} centerLabel="Ứng viên" />
            </div>
            {tableCard('Chi tiết theo vị trí', 'Tổng tuyển vào và kết quả thử việc', (
              <>
                <thead>
                  <tr className={headRow}>
                    <th className="py-2 pr-3 font-semibold">Vị trí</th>
                    <th className={th}>Tuyển</th>
                    <th className={th}>Đang làm việc</th>
                    <th className={th}>≤ 3 ngày</th>
                    <th className={th}>4-7 ngày</th>
                    <th className={th}>Qua 7 ngày</th>
                    <th className={th}>Qua 1T</th>
                    <th className={th}>Pass</th>
                  </tr>
                </thead>
                <tbody>
                  {recruitmentStats.by_position.length > 0 ? recruitmentStats.by_position.map((position) => (
                    <tr
                      key={position.position_id ?? 'none'}
                      onClick={() => openPositionList(position)}
                      className="cursor-pointer border-b border-gray-50 transition hover:bg-primary-50/50 last:border-0"
                    >
                      <td className="py-2.5 pr-3">
                        <p className="max-w-[220px] truncate font-semibold text-primary-700">{position.position_title}</p>
                        {position.position_code && <p className="text-[11px] text-gray-500">{position.position_code}</p>}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-gray-900">{formatNumber(position.hired_count)}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-600">{formatNumber(position.currently_working)}</td>
                      <td className="py-2.5 px-3 text-right text-red-600">{formatNumber(position.left_within_3_days)}</td>
                      <td className="py-2.5 px-3 text-right text-orange-600">{formatNumber(position.left_from_4_to_7_days)}</td>
                      <td className="py-2.5 px-3 text-right text-cyan-600">{formatNumber(position.passed_7_days)}</td>
                      <td className="py-2.5 px-3 text-right text-indigo-600">{formatNumber(position.passed_1_month)}</td>
                      <td className="py-2.5 px-3 text-right text-primary-600">{formatNumber(position.pass_probation)}</td>
                    </tr>
                  )) : emptyRow(8)}
                </tbody>
              </>
            ))}
          </div>

          {tableCard('Ứng viên tuyển vào theo nhân viên tuyển dụng', 'Người tạo hồ sơ onboarding — bấm 1 dòng để xem theo vị trí', (
            <>
              <thead>
                <tr className={headRow}>
                  <th className="py-2 pr-3 font-semibold">NV tuyển dụng</th>
                  <th className={th}>Tuyển vào</th>
                  <th className={th}>Pass 3 ngày</th>
                  <th className={th}>Pass 7 ngày</th>
                  <th className={th}>Pass 1 tháng</th>
                  <th className={th}>Ký HĐLĐ chính thức</th>
                </tr>
              </thead>
              <tbody>
                {recruitmentStats.by_recruiter_position.length > 0 ? recruitmentStats.by_recruiter_position.map((row) => (
                  <tr
                    key={row.recruiter_id ?? 'none'}
                    onClick={() => setSelectedRecruiterBreakdown({ recruiterName: row.recruiter_name, positions: row.positions || [] })}
                    className="cursor-pointer border-b border-gray-50 transition hover:bg-primary-50/50 last:border-0"
                  >
                    <td className="py-2.5 pr-3">
                      <p className="max-w-[220px] truncate font-semibold text-primary-700">{row.recruiter_name}</p>
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-gray-900">{formatNumber(row.hired_count)}</td>
                    <td className="py-2.5 px-3 text-right text-cyan-600">{formatNumber(row.passed_3_days)}</td>
                    <td className="py-2.5 px-3 text-right text-indigo-600">{formatNumber(row.passed_7_days)}</td>
                    <td className="py-2.5 px-3 text-right text-purple-600">{formatNumber(row.passed_1_month)}</td>
                    <td className="py-2.5 px-3 text-right text-primary-600">{formatNumber(row.official_contracts)}</td>
                  </tr>
                )) : emptyRow(6)}
              </tbody>
            </>
          ))}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <StatCard name="Ngày làm trung bình trước khi nghỉ" rawValue={recruitmentStats.avg_days_before_exit}
              formatter={(value) => `${value.toFixed(1)} ngày`}
              subtext="Tính trên nhân sự đã có ngày nghỉ"
              icon={UserMinusIcon} iconBg="bg-slate-100 text-slate-600" trend={null} />
            <div className="lg:col-span-2">
              {tableCard('Tỷ lệ nghỉ sớm theo phòng ban', 'Sắp xếp theo tỷ lệ nghỉ trong 7 ngày đầu', (
                <>
                  <thead>
                    <tr className={headRow}>
                      <th className="py-2 pr-3 font-semibold">Phòng ban</th>
                      <th className={th}>Tuyển</th>
                      <th className={th}>Nghỉ ≤ 7 ngày</th>
                      <th className={th}>Nghỉ dưới 1T</th>
                      <th className={th}>Nghỉ dưới 2T</th>
                      <th className={th}>Tỷ lệ sớm</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recruitmentStats.by_department.length > 0 ? recruitmentStats.by_department.slice(0, 8).map((department) => (
                      <tr key={department.department_id ?? 'none'} className="border-b border-gray-50 last:border-0">
                        <td className="py-2.5 pr-3">
                          <p className="font-semibold text-gray-900 truncate max-w-[220px]">{department.department_name}</p>
                          {department.department_code && <p className="text-[11px] text-gray-500">{department.department_code}</p>}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-gray-900">{formatNumber(department.hired_count)}</td>
                        <td className="py-2.5 px-3 text-right text-red-600">{formatNumber(department.left_within_7_days)}</td>
                        <td className="py-2.5 px-3 text-right text-orange-600">{formatNumber(department.left_within_1_month)}</td>
                        <td className="py-2.5 px-3 text-right text-gray-600">{formatNumber(department.left_within_2_months)}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-red-600">{formatPercent(department.early_turnover_rate)}</td>
                      </tr>
                    )) : emptyRow(6)}
                  </tbody>
                </>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {tableCard('Top vị trí có rủi ro cao', 'Theo tỷ lệ nghỉ trong 7 ngày đầu', (
              <>
                <thead>
                  <tr className={headRow}>
                    <th className="py-2 pr-3 font-semibold">Vị trí</th>
                    <th className={th}>Tuyển</th>
                    <th className={th}>Nghỉ ≤ 7 ngày</th>
                    <th className={th}>Rủi ro</th>
                    <th className={th}>Pass</th>
                  </tr>
                </thead>
                <tbody>
                  {recruitmentStats.risky_positions.length > 0 ? recruitmentStats.risky_positions.slice(0, 8).map((position) => (
                    <tr
                      key={position.position_id ?? 'none'}
                      onClick={() => openPositionList(position)}
                      className="cursor-pointer border-b border-gray-50 transition hover:bg-primary-50/50 last:border-0"
                    >
                      <td className="py-2.5 pr-3">
                        <p className="font-semibold text-primary-700 truncate max-w-[220px]">{position.position_title}</p>
                        {position.position_code && <p className="text-[11px] text-gray-500">{position.position_code}</p>}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-gray-900">{formatNumber(position.hired_count)}</td>
                      <td className="py-2.5 px-3 text-right text-red-600">{formatNumber(position.left_within_7_days)}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-red-600">{formatPercent(position.early_turnover_rate)}</td>
                      <td className="py-2.5 px-3 text-right text-primary-600">{formatPercent(position.pass_rate)}</td>
                    </tr>
                  )) : emptyRow(5)}
                </tbody>
              </>
            ))}
            {tableCard('Cohort tuyển dụng theo tháng', 'Tuyển/pass theo ngày vào; HĐLĐ theo ngày bắt đầu hợp đồng', (
              <>
                <thead>
                  <tr className={headRow}>
                    <th className="py-2 pr-3 font-semibold">Tháng</th>
                    <th className={th}>Tuyển</th>
                    <th className={th}>Đang làm việc</th>
                    <th className={th}>Nghỉ ≤ 7 ngày</th>
                    <th className={th}>Qua 7 ngày</th>
                    <th className={th}>Qua 1T</th>
                    <th className={th}>Pass 2T</th>
                    <th className={th}>HĐLĐ</th>
                  </tr>
                </thead>
                <tbody>
                  {recruitmentStats.monthly_cohorts.length > 0 ? recruitmentStats.monthly_cohorts.map((cohort) => (
                    <tr key={cohort.month} className="border-b border-gray-50 last:border-0">
                      <td className="py-2.5 pr-3 font-semibold text-gray-900">{cohort.month}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-gray-900">{formatNumber(cohort.hired_count)}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-600">{formatNumber(cohort.currently_working)}</td>
                      <td className="py-2.5 px-3 text-right text-red-600">{formatNumber(cohort.left_within_7_days)}</td>
                      <td className="py-2.5 px-3 text-right text-cyan-600">{formatNumber(cohort.passed_7_days)}</td>
                      <td className="py-2.5 px-3 text-right text-indigo-600">{formatNumber(cohort.passed_1_month)}</td>
                      <td className="py-2.5 px-3 text-right text-primary-600 whitespace-nowrap">
                        {formatNumber(cohort.pass_probation)} <span className="text-[11px] text-gray-400">({formatPercent(cohort.pass_rate)})</span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-600">{formatNumber(cohort.official_contracts)}</td>
                    </tr>
                  )) : emptyRow(8)}
                </tbody>
              </>
            ))}
          </div>
        </div>
      )}

      {/* ── Tab: BHXH ── */}
      {activeTab === 'insurance' && socialInsuranceStats && (
        <div className="space-y-5">
          {statsFilterPanel}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard name="Đang tham gia BHXH" rawValue={socialInsuranceStats.summary.participating} formatter={formatNumber}
              subtext={`${formatPercent(socialInsuranceStats.summary.participation_rate)} trên nhân sự đang làm việc`}
              icon={ShieldCheckIcon} iconBg="bg-emerald-100 text-emerald-600" trend={null} />
            <StatCard name="Chưa có mã BHXH" rawValue={socialInsuranceStats.summary.missing_number} formatter={formatNumber}
              subtext="Hồ sơ NV và trang Quản lý BHXH đều trống"
              icon={ExclamationTriangleIcon} iconBg="bg-amber-100 text-amber-600" trend={null} />
            <StatCard name="Chưa có mã số thuế" rawValue={socialInsuranceStats.summary.missing_tax_code} formatter={formatNumber}
              subtext="Cột mã số thuế còn trống"
              icon={ExclamationTriangleIcon} iconBg="bg-orange-100 text-orange-600" trend={null} />
            <StatCard name="Chưa có mã hộ GĐ" rawValue={socialInsuranceStats.summary.missing_household_code} formatter={formatNumber}
              subtext="Cột mã hộ gia đình còn trống"
              icon={ExclamationTriangleIcon} iconBg="bg-rose-100 text-rose-600" trend={null} />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard name="Căn cứ đóng BHXH" rawValue={socialInsuranceStats.summary.contribution_level_total} formatter={formatCurrency}
              subtext="Tổng lương đóng BHXH của người đang tham gia"
              icon={CurrencyDollarIcon} iconBg="bg-violet-100 text-violet-600" trend={null} />
            <StatCard name="Mức đóng bình quân" rawValue={socialInsuranceStats.summary.contribution_level_average} formatter={formatCurrency}
              subtext="Bình quân trên nhân sự đang tham gia"
              icon={CurrencyDollarIcon} iconBg="bg-cyan-100 text-cyan-600" trend={null} />
            <StatCard name="Thiếu mức đóng" rawValue={socialInsuranceStats.summary.missing_contribution} formatter={formatNumber}
              subtext="Đang tham gia nhưng lương đóng trống hoặc bằng 0"
              icon={ExclamationTriangleIcon} iconBg="bg-red-100 text-red-600" trend={null} />
            <StatCard name="Báo tăng trong kỳ" rawValue={socialInsuranceStats.summary.new_participation_in_period} formatter={formatNumber}
              subtext="Theo ngày bắt đầu tham gia BHXH"
              icon={UserPlusIcon} iconBg="bg-primary-100 text-primary-600" trend={null} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <DonutCard title="Trạng thái tham gia BHXH" sub="Nhân sự đang làm việc" data={socialInsuranceStatusData}
              centerValue={socialInsuranceStats.summary.total_active} centerLabel="Nhân sự" />
            <DonutCard title="BHXH theo phòng ban" sub="Top 6 phòng ban theo số đang tham gia" data={socialInsuranceDeptData}
              centerValue={socialInsuranceStats.summary.participating} centerLabel="Tham gia" />
          </div>

          {tableCard('Tình trạng BHXH theo phòng ban', 'Tổng hợp từ dữ liệu trang Quản lý BHXH', (
            <>
              <thead>
                <tr className={headRow}>
                  <th className="py-2 pr-3 font-semibold">Phòng ban</th>
                  <th className={th}>Đang làm</th>
                  <th className={th}>Tham gia</th>
                  <th className={th}>Tỷ lệ</th>
                  <th className={th}>Dừng/Tạm dừng</th>
                  <th className={th}>Chưa có hồ sơ</th>
                  <th className={th}>Thiếu mã</th>
                  <th className={th}>Thiếu MST</th>
                  <th className={th}>Thiếu mã hộ</th>
                  <th className={th}>Thiếu mức</th>
                  <th className={th}>Căn cứ đóng</th>
                </tr>
              </thead>
              <tbody>
                {socialInsuranceStats.by_department.length > 0 ? socialInsuranceStats.by_department.map((department) => (
                  <tr key={department.department_id ?? 'none'} className="border-b border-gray-50 last:border-0">
                    <td className="py-2.5 pr-3">
                      <p className="font-semibold text-gray-900 truncate max-w-[220px]">{department.department_name}</p>
                      {department.department_code && <p className="text-[11px] text-gray-500">{department.department_code}</p>}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-gray-900">{formatNumber(department.active_count)}</td>
                    <td className="py-2.5 px-3 text-right text-emerald-600">{formatNumber(department.participating)}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-600">{formatPercent(department.participation_rate)}</td>
                    <td className="py-2.5 px-3 text-right text-gray-600">{formatNumber(department.not_participating + department.suspended)}</td>
                    <td className="py-2.5 px-3 text-right text-orange-600">{formatNumber(department.unspecified)}</td>
                    <td className="py-2.5 px-3 text-right text-amber-600">{formatNumber(department.missing_number)}</td>
                    <td className="py-2.5 px-3 text-right text-orange-600">{formatNumber(department.missing_tax_code)}</td>
                    <td className="py-2.5 px-3 text-right text-rose-600">{formatNumber(department.missing_household_code)}</td>
                    <td className="py-2.5 px-3 text-right text-red-600">{formatNumber(department.missing_contribution)}</td>
                    <td className="py-2.5 px-3 text-right font-semibold text-gray-900 whitespace-nowrap">
                      {formatCurrency(department.contribution_level_total)}
                    </td>
                  </tr>
                )) : emptyRow(11, 'Chưa có dữ liệu BHXH trong phạm vi lọc')}
              </tbody>
            </>
          ), (
            <a
              href="/dashboard/social-insurance"
              className="inline-flex items-center justify-center rounded-lg border border-primary-200 px-3 py-2 text-xs font-semibold text-primary-700 transition hover:bg-primary-50"
            >
              Mở Quản lý BHXH
            </a>
          ))}
        </div>
      )}

      {selectedRecruitmentList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 px-4 py-6">
          <div className="w-full max-w-6xl max-h-[85vh] overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">{selectedRecruitmentList.title}</h3>
                <p className="text-xs text-gray-600 mt-0.5">
                  {formatNumber(selectedRecruitmentList.employees.length)} nhân sự
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecruitmentList(null)}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[calc(85vh-5rem)] overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 bg-gray-50">
                  <tr className="text-left text-[11px] uppercase tracking-wide text-gray-500 whitespace-nowrap">
                    <th className="px-5 py-3 font-semibold">Mã NV</th>
                    <th className="px-3 py-3 font-semibold">Họ tên</th>
                    <th className="px-3 py-3 font-semibold">NV tuyển dụng</th>
                    <th className="px-3 py-3 font-semibold">Ngày vào</th>
                    <th className="px-3 py-3 font-semibold">Ngày nghỉ</th>
                    <th className="px-3 py-3 font-semibold">Trạng thái</th>
                    <th className="px-3 py-3 font-semibold">Ngày ký HĐLĐ</th>
                    <th className="px-3 py-3 font-semibold">Phòng ban</th>
                    <th className="px-5 py-3 font-semibold">Vị trí</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedRecruitmentList.employees.length > 0 ? selectedRecruitmentList.employees.map((employee) => (
                    <tr key={employee.id} className="border-t border-gray-100 odd:bg-white even:bg-gray-50/70 transition-colors hover:bg-primary-50">
                      <td className="px-5 py-3 font-bold text-gray-900">{employee.employee_code}</td>
                      <td className="px-3 py-3 font-semibold text-gray-900 whitespace-nowrap">{employee.full_name}</td>
                      <td className="px-3 py-3 text-gray-600 whitespace-nowrap">
                        {employee.recruiter_employee_id || employee.recruiter_full_name
                          ? `${employee.recruiter_employee_id ? `${employee.recruiter_employee_id} - ` : ''}${employee.recruiter_full_name || ''}`
                          : '-'}
                      </td>
                      <td className="px-3 py-3 text-gray-600">{formatShortDate(employee.start_date)}</td>
                      <td className="px-3 py-3 text-gray-600">{formatShortDate(employee.end_date)}</td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex whitespace-nowrap rounded-full px-2 py-1 text-xs font-semibold ${
                          employee.is_currently_working ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {employee.is_currently_working ? 'Đang làm việc' : 'Đã nghỉ / tạm dừng'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-gray-600">{formatShortDate(employee.contract_start_date)}</td>
                      <td className="px-3 py-3 text-gray-600">{employee.department_name || '-'}</td>
                      <td className="px-5 py-3 text-gray-600">{employee.position_title || '-'}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={9} className="px-5 py-10 text-center text-sm text-gray-500">Chưa có nhân sự trong thống kê này</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {selectedRecruiterBreakdown && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 px-4 py-6">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">{selectedRecruiterBreakdown.recruiterName}</h3>
                <p className="text-xs text-gray-600 mt-0.5">Tuyển vào theo vị trí — bấm vào 1 vị trí để xem danh sách ứng viên</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecruiterBreakdown(null)}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5">
              <div className="flex flex-col sm:flex-row items-center gap-5">
                <div className="flex-shrink-0">
                  <ResponsiveContainer width={160} height={160}>
                    <PieChart>
                      <Pie
                        data={safeRecruiterBreakdownData}
                        cx="50%"
                        cy="50%"
                        innerRadius={52}
                        outerRadius={76}
                        paddingAngle={3}
                        dataKey="value"
                        nameKey="name"
                        strokeWidth={0}
                        isAnimationActive={true}
                      >
                        {safeRecruiterBreakdownData.map((entry, i) => (
                          <Cell
                            key={i}
                            fill={entry.color}
                            className={entry.employees.length > 0 ? 'cursor-pointer' : undefined}
                            onClick={() => entry.employees.length > 0 && openRecruiterPositionList(entry.name, entry.employees)}
                          />
                        ))}
                        <Label
                          content={({ viewBox }) => {
                            const { cx, cy } = viewBox as any;
                            return (
                              <DonutCenter
                                value={selectedRecruiterBreakdown.positions.reduce((s, p) => s + p.hired_count, 0)}
                                label="Tuyển vào" cx={cx} cy={cy}
                              />
                            );
                          }}
                          position="center"
                        />
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full sm:flex-1 space-y-2 min-w-0">
                  {selectedRecruiterBreakdown.positions.length > 0 ? selectedRecruiterBreakdown.positions.map((position, i) => (
                    <button
                      key={position.position_id ?? 'none'}
                      type="button"
                      onClick={() => openRecruiterPositionList(position.position_title, position.employees)}
                      className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-primary-50"
                    >
                      <span className="flex items-center gap-1.5 min-w-0">
                        <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                        <span className="text-xs text-gray-700 truncate">{position.position_title}</span>
                      </span>
                      <span className="text-xs font-bold text-gray-900 flex-shrink-0">{formatNumber(position.hired_count)}</span>
                    </button>
                  )) : (
                    <p className="text-sm text-gray-500">Chưa có dữ liệu</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Tài sản ── */}
      {activeTab === 'asset' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard name="Đang sử dụng" rawValue={stats.asset_stats.in_use} formatter={formatNumber}
              subtext={`Tổng ${formatNumber(stats.asset_stats.total)} tài sản`}
              icon={ComputerDesktopIcon} iconBg="bg-emerald-100 text-emerald-600" trend={stats.trends.asset_growth} />
            <StatCard name="Không sử dụng" rawValue={stats.asset_stats.idle} formatter={formatNumber}
              subtext="Chưa được gán"
              icon={ArchiveBoxIcon} iconBg="bg-amber-100 text-amber-600" trend={null} />
            <StatCard name="Đang bảo trì" rawValue={stats.asset_stats.under_maintenance} formatter={formatNumber}
              subtext={`${formatNumber(stats.asset_stats.upcoming_maintenance)} sắp bảo trì`}
              icon={WrenchScrewdriverIcon} iconBg="bg-red-100 text-red-500" trend={null} />
            <StatCard name="Giá trị tài sản" rawValue={stats.asset_stats.total_value} formatter={formatCurrency}
              subtext={`${formatNumber(stats.asset_stats.current_assignments)} đang gán`}
              icon={CurrencyDollarIcon} iconBg="bg-violet-100 text-violet-600" trend={null} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <DonutCard title="Trạng thái tài sản" data={assetStatusData}
              centerValue={stats.asset_stats.total} centerLabel="Tổng TS" />
            <DonutCard title="Phân bố loại tài sản" sub="Top 6 loại tài sản" data={assetTypeData}
              centerValue={stats.asset_stats.total} centerLabel="Tổng TS" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <DonutCard title="Hoạt động tài sản" sub="7 ngày qua" data={safeActivityData}
              centerValue={totalActivities} centerLabel="Hoạt động" />
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
