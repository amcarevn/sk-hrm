import { useEffect, useState } from 'react';
import {
  UserGroupIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  WrenchScrewdriverIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  UserPlusIcon,
  UserMinusIcon,
  ChartBarIcon,
  UsersIcon,
  BriefcaseIcon,
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  PrinterIcon,
  ServerIcon,
  TruckIcon,
  HomeModernIcon,
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import { dashboardAPI } from '@/utils/api';
import HRStats from '../components/HRStats';

interface HRMDashboardStats {
  employee_stats: {
    total: number;
    active: number;
    probation: number;
    inactive: number;
    new_last_30_days: number;
    recent_hires: number;
    gender_distribution: {
      male: number;
      female: number;
      other: number;
    };
  };
  department_stats: Array<{
    id: number;
    name: string;
    code: string;
    employee_count: number;
  }>;
  asset_stats: {
    total: number;
    in_use: number;
    idle: number;
    under_maintenance: number;
    total_value: number;
    current_assignments: number;
    upcoming_maintenance: number;
    type_distribution: Array<{
      type: string;
      display_name: string;
      count: number;
    }>;
  };
  recent_activities: {
    asset_assignments: number;
    asset_returns: number;
    maintenance: number;
  };
  trends: {
    employee_growth: number;
    asset_growth: number;
  };
}

const Dashboard = () => {
  const [stats, setStats] = useState<HRMDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await dashboardAPI.getHRMStats();
        setStats(response);
      } catch (err: any) {
        setError(err.message || 'Lỗi khi tải dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-600 text-lg font-medium">
          Error loading dashboard: {error}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6">
        <div className="text-gray-600 text-lg">Không có dữ liệu</div>
      </div>
    );
  }

  // Employee overview stats
  const employeeStats = [
    {
      name: 'Tổng nhân viên',
      value: stats.employee_stats.total,
      subtext: `${stats.employee_stats.active} đang làm việc`,
      icon: UsersIcon,
      color: 'bg-blue-500',
      trend: stats.trends.employee_growth > 0 ? `+${stats.trends.employee_growth}` : `${stats.trends.employee_growth}`,
      trendUp: stats.trends.employee_growth > 0,
    },
    {
      name: 'Nhân viên thử việc',
      value: stats.employee_stats.probation,
      subtext: `${stats.employee_stats.new_last_30_days} mới trong 30 ngày`,
      icon: UserPlusIcon,
      color: 'bg-yellow-500',
      trend: '',
      trendUp: true,
    },
    {
      name: 'Tài sản đang sử dụng',
      value: stats.asset_stats.in_use,
      subtext: `${stats.asset_stats.total} tổng tài sản`,
      icon: ComputerDesktopIcon,
      color: 'bg-green-500',
      trend: stats.trends.asset_growth > 0 ? `+${stats.trends.asset_growth}` : `${stats.trends.asset_growth}`,
      trendUp: stats.trends.asset_growth > 0,
    },
    {
      name: 'Giá trị tài sản',
      value: `$${stats.asset_stats.total_value.toLocaleString('vi-VN')}`,
      subtext: `${stats.asset_stats.current_assignments} đang được gán`,
      icon: CurrencyDollarIcon,
      color: 'bg-purple-500',
      trend: '',
      trendUp: true,
    },
  ];

  // Department stats for chart
  const departmentChartData = stats.department_stats
    .sort((a, b) => b.employee_count - a.employee_count)
    .slice(0, 8)
    .map(dept => ({
      name: dept.name,
      employees: dept.employee_count,
    }));

  // Asset type distribution for chart
  const assetTypeChartData = stats.asset_stats.type_distribution
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
    .map(type => ({
      name: type.display_name,
      count: type.count,
    }));

  // Gender distribution for pie chart
  const genderData = [
    { name: 'Nam', value: stats.employee_stats.gender_distribution.male, color: '#3b82f6' },
    { name: 'Nữ', value: stats.employee_stats.gender_distribution.female, color: '#ec4899' },
    { name: 'Khác', value: stats.employee_stats.gender_distribution.other, color: '#8b5cf6' },
  ];

  // Recent activities
  const activityData = [
    { name: 'Gán tài sản', value: stats.recent_activities.asset_assignments, color: '#10b981' },
    { name: 'Trả tài sản', value: stats.recent_activities.asset_returns, color: '#f59e0b' },
    { name: 'Bảo trì', value: stats.recent_activities.maintenance, color: '#3b82f6' },
  ];

  // Asset status data
  const assetStatusData = [
    { name: 'Đang sử dụng', value: stats.asset_stats.in_use, color: '#10b981' },
    { name: 'Không sử dụng', value: stats.asset_stats.idle, color: '#6b7280' },
    { name: 'Đang bảo trì', value: stats.asset_stats.under_maintenance, color: '#f59e0b' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard HRM</h1>
          <p className="mt-1 text-sm text-gray-500">
            Tổng quan nhân sự và tài sản
          </p>
        </div>
        <div className="text-sm text-gray-500">
          Cập nhật lần cuối: {new Date().toLocaleString('vi-VN')}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {employeeStats.map((item) => (
          <div key={item.name} className="card p-6 shadow-none">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`flex-shrink-0 ${item.color} rounded-md p-3`}>
                  <item.icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {item.name}
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900">
                      {item.value.toLocaleString('vi-VN')}
                    </dd>
                    <dd className="text-sm text-gray-500">{item.subtext}</dd>
                  </dl>
                </div>
              </div>
              {item.trend && (
                <div
                  className={`flex items-center text-sm ${item.trendUp ? 'text-green-600' : 'text-red-600'}`}
                >
                  {item.trendUp ? (
                    <ArrowUpIcon className="h-4 w-4 mr-1" />
                  ) : (
                    <ArrowDownIcon className="h-4 w-4 mr-1" />
                  )}
                  {item.trend}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* HR Stats Component */}
      <HRStats />

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Department Distribution */}
        <div className="card p-6 shadow-none">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Phân bố nhân sự theo phòng ban (Top 8)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={departmentChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="employees" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Asset Type Distribution */}
        <div className="card p-6 shadow-none">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Phân bố loại tài sản (Top 6)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={assetTypeChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gender Distribution */}
        <div className="card p-6 shadow-none">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Phân bố giới tính
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={genderData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#3b82f6"
                dataKey="value"
              >
                {genderData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Activities */}
        <div className="card p-6 shadow-none">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Hoạt động gần đây (7 ngày)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Asset Status and Department Stats */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Asset Status */}
        <div className="card p-6 shadow-none">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Trạng thái tài sản
          </h3>
          <div className="space-y-4">
            {assetStatusData.map((status) => (
              <div key={status.name} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-3"
                    style={{ backgroundColor: status.color }}
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {status.name}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-lg font-bold text-gray-900 mr-2">
                    {status.value}
                  </span>
                  <span className="text-sm text-gray-500">
                    ({((status.value / stats.asset_stats.total) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Department Summary */}
        <div className="card p-6 shadow-none">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Tóm tắt phòng ban
          </h3>
          <div className="space-y-3">
            {stats.department_stats
              .sort((a, b) => b.employee_count - a.employee_count)
              .slice(0, 5)
              .map((dept) => (
                <div key={dept.id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {dept.name}
                      </div>
                      <div className="text-xs text-gray-500">{dept.code}</div>
                    </div>
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    {dept.employee_count}
                  </div>
                </div>
              ))}
          </div>
          {stats.department_stats.length > 5 && (
            <div className="mt-4 text-sm text-gray-500 text-center">
              +{stats.department_stats.length - 5} phòng ban khác
            </div>
          )}
        </div>
      </div>

      {/* Asset Type Details */}
      <div className="card p-6 shadow-none">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Chi tiết loại tài sản
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {stats.asset_stats.type_distribution.map((type) => {
            // Map asset types to icons
            const getIcon = (typeName: string) => {
              switch (typeName) {
                case 'LAPTOP':
                  return ComputerDesktopIcon;
                case 'DESKTOP':
                  return ComputerDesktopIcon;
                case 'PHONE':
                  return DevicePhoneMobileIcon;
                case 'PRINTER':
                  return PrinterIcon;
                case 'SERVER':
                  return ServerIcon;
                case 'VEHICLE':
                  return TruckIcon;
                case 'FURNITURE':
                  return HomeModernIcon;
                default:
                  return BriefcaseIcon;
              }
            };

            const Icon = getIcon(type.type);
            const percentage = (type.count / stats.asset_stats.total) * 100;

            return (
              <div key={type.type} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600 mb-2">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {type.display_name}
                </div>
                <div className="text-lg font-bold text-gray-900">
                  {type.count}
                </div>
                <div className="text-xs text-gray-500">
                  {percentage.toFixed(1)}%
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
