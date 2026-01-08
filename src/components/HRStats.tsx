import React, { useState, useEffect } from 'react';
import { employeesAPI } from '../utils/api';
import {
  UserGroupIcon,
  UserPlusIcon,
  UserMinusIcon,
  ClockIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CalendarIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

interface HRStatsData {
  daily: {
    new_hires: number;
    terminations: number;
    net_change: number;
    attendance_rate: number;
  };
  weekly: {
    new_hires: number;
    terminations: number;
    net_change: number;
    avg_attendance: number;
  };
  monthly: {
    total_employees: number;
    active_employees: number;
    probation_employees: number;
    inactive_employees: number;
    turnover_rate: number;
    avg_attendance: number;
  };
  trends: {
    daily_trend: { percentage: number; isUp: boolean };
    weekly_trend: { percentage: number; isUp: boolean };
    monthly_trend: { percentage: number; isUp: boolean };
  };
}

const HRStats: React.FC = () => {
  const [stats, setStats] = useState<HRStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  useEffect(() => {
    fetchHRStats();
  }, []);

  const fetchHRStats = async () => {
    try {
      setLoading(true);
      // In a real implementation, this would call a specific HR stats API
      // For now, we'll use the existing employee stats and simulate additional data
      const employeeStats = await employeesAPI.stats();
      
      // Simulate HR stats data (in a real app, this would come from backend)
      const simulatedStats: HRStatsData = {
        daily: {
          new_hires: 2,
          terminations: 1,
          net_change: 1,
          attendance_rate: 95.5,
        },
        weekly: {
          new_hires: 8,
          terminations: 3,
          net_change: 5,
          avg_attendance: 94.2,
        },
        monthly: {
          total_employees: employeeStats.total,
          active_employees: employeeStats.active,
          probation_employees: employeeStats.probation,
          inactive_employees: employeeStats.inactive,
          turnover_rate: 3.2,
          avg_attendance: 93.8,
        },
        trends: {
          daily_trend: { percentage: 2.5, isUp: true },
          weekly_trend: { percentage: 1.8, isUp: true },
          monthly_trend: { percentage: -0.5, isUp: false },
        },
      };
      
      setStats(simulatedStats);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching HR stats:', err);
      setError('Không thể tải thống kê nhân sự. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const getPeriodStats = () => {
    if (!stats) return null;
    
    switch (period) {
      case 'daily':
        return {
          title: 'Hôm nay',
          icon: CalendarIcon,
          stats: stats.daily,
          trend: stats.trends.daily_trend,
        };
      case 'weekly':
        return {
          title: 'Tuần này',
          icon: ChartBarIcon,
          stats: stats.weekly,
          trend: stats.trends.weekly_trend,
        };
      case 'monthly':
        return {
          title: 'Tháng này',
          icon: UserGroupIcon,
          stats: stats.monthly,
          trend: stats.trends.monthly_trend,
        };
    }
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-red-600">
          <p>{error}</p>
          <button
            onClick={fetchHRStats}
            className="mt-2 text-sm text-primary-600 hover:text-primary-800"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  const periodStats = getPeriodStats();
  if (!periodStats || !stats) return null;

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Thống kê nhân sự</h3>
            <p className="text-sm text-gray-500">Theo dõi biến động nhân sự</p>
          </div>
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setPeriod('daily')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                period === 'daily'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Ngày
            </button>
            <button
              onClick={() => setPeriod('weekly')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                period === 'weekly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Tuần
            </button>
            <button
              onClick={() => setPeriod('monthly')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                period === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Tháng
            </button>
          </div>
        </div>

        {/* Period Overview */}
        <div className="mb-6">
          <div className="flex items-center mb-2">
            <periodStats.icon className="h-5 w-5 text-gray-400 mr-2" />
            <span className="text-sm font-medium text-gray-700">{periodStats.title}</span>
            <div className={`ml-2 flex items-center text-sm ${periodStats.trend.isUp ? 'text-green-600' : 'text-red-600'}`}>
              {periodStats.trend.isUp ? (
                <ArrowUpIcon className="h-4 w-4 mr-1" />
              ) : (
                <ArrowDownIcon className="h-4 w-4 mr-1" />
              )}
              {periodStats.trend.percentage}%
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {period === 'monthly' ? (
            <>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <UserGroupIcon className="h-6 w-6 text-blue-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Tổng nhân viên</p>
                    <p className="text-2xl font-bold text-blue-700">{stats.monthly.total_employees}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <UserGroupIcon className="h-6 w-6 text-green-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-green-900">Đang làm việc</p>
                    <p className="text-2xl font-bold text-green-700">{stats.monthly.active_employees}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <ClockIcon className="h-6 w-6 text-yellow-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-yellow-900">Đang thử việc</p>
                    <p className="text-2xl font-bold text-yellow-700">{stats.monthly.probation_employees}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <UserMinusIcon className="h-6 w-6 text-red-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-red-900">Đã nghỉ việc</p>
                    <p className="text-2xl font-bold text-red-700">{stats.monthly.inactive_employees}</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <UserPlusIcon className="h-6 w-6 text-green-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-green-900">Tuyển mới</p>
                    <p className="text-2xl font-bold text-green-700">
                      {period === 'daily' ? stats.daily.new_hires : stats.weekly.new_hires}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <UserMinusIcon className="h-6 w-6 text-red-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-red-900">Nghỉ việc</p>
                    <p className="text-2xl font-bold text-red-700">
                      {period === 'daily' ? stats.daily.terminations : stats.weekly.terminations}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <UserGroupIcon className="h-6 w-6 text-blue-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Thay đổi ròng</p>
                    <p className="text-2xl font-bold text-blue-700">
                      {period === 'daily' ? stats.daily.net_change : stats.weekly.net_change}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <ClockIcon className="h-6 w-6 text-purple-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-purple-900">Tỷ lệ chấm công</p>
                    <p className="text-2xl font-bold text-purple-700">
                      {formatPercentage(period === 'daily' ? stats.daily.attendance_rate : stats.weekly.avg_attendance)}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Additional Monthly Stats */}
        {period === 'monthly' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center">
                <ChartBarIcon className="h-6 w-6 text-orange-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-orange-900">Tỷ lệ thay thế</p>
                  <p className="text-2xl font-bold text-orange-700">
                    {formatPercentage(stats.monthly.turnover_rate)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-indigo-50 p-4 rounded-lg">
              <div className="flex items-center">
                <ClockIcon className="h-6 w-6 text-indigo-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-indigo-900">Chấm công trung bình</p>
                  <p className="text-2xl font-bold text-indigo-700">
                    {formatPercentage(stats.monthly.avg_attendance)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Tóm tắt</h4>
          <p className="text-sm text-gray-600">
            {period === 'daily' && `Hôm nay có ${stats.daily.new_hires} nhân viên mới và ${stats.daily.terminations} nhân viên nghỉ việc. Tỷ lệ chấm công đạt ${formatPercentage(stats.daily.attendance_rate)}.`}
            {period === 'weekly' && `Tuần này có ${stats.weekly.new_hires} nhân viên mới và ${stats.weekly.terminations} nhân viên nghỉ việc. Tỷ lệ chấm công trung bình đạt ${formatPercentage(stats.weekly.avg_attendance)}.`}
            {period === 'monthly' && `Tháng này có tổng cộng ${stats.monthly.total_employees} nhân viên, trong đó ${stats.monthly.active_employees} đang làm việc, ${stats.monthly.probation_employees} đang thử việc và ${stats.monthly.inactive_employees} đã nghỉ việc.`}
          </p>
        </div>
      </div>
    </div>
  );
};

export default HRStats;
