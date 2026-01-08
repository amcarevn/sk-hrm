import { useEffect, useState } from 'react';
import {
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  KeyIcon,
  UserGroupIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
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

interface CTODashboardStats {
  overview: {
    totalChatbots: number;
    activeChatbots: number;
    totalConversations: number;
    conversationsToday: number;
    conversationsThisWeek: number;
    conversationsThisMonth: number;
    totalDocuments: number;
    documentsProcessing: number;
    totalApiKeys: number;
    activeApiKeys: number;
    totalUsers: number;
    activeUsers: number;
    trends: {
      chatbotTrend: { percentage: number; isUp: boolean };
      conversationTrend: { percentage: number; isUp: boolean };
      documentTrend: { percentage: number; isUp: boolean };
      apiKeyTrend: { percentage: number; isUp: boolean };
    };
  };
  performance: {
    averageResponseTime: number;
    errorRate: number;
    systemHealth: string;
    backgroundJobs: {
      pending: number;
      running: number;
      completed: number;
      failed: number;
    };
  };
  trends: {
    conversationGrowth: Array<{ date: string; count: number }>;
    userGrowth: Array<{ date: string; count: number }>;
    chatbotUsage: Array<{ name: string; conversations: number }>;
  };
  platform: {
    facebookPages: number;
    telegramBots: number;
    webWidgets: number;
  };
}

const Dashboard = () => {
  const [stats, setStats] = useState<CTODashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await dashboardAPI.getCTOStats();
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

  // Helper function to safely get trend data
  const getTrendData = (trendKey: string) => {
    const trends = stats.overview.trends;
    if (!trends || !trends[trendKey as keyof typeof trends]) {
      return { percentage: 0, isUp: false };
    }
    return trends[trendKey as keyof typeof trends];
  };

  const overviewStats = [
    {
      name: 'Tổng số trợ lý AI',
      value: stats.overview.totalChatbots,
      subtext: `${stats.overview.activeChatbots} đang hoạt động`,
      icon: ChatBubbleLeftRightIcon,
      color: 'bg-blue-500',
      trend: (() => {
        const trend = getTrendData('chatbotTrend');
        return `${trend.isUp ? '+' : ''}${trend.percentage}%`;
      })(),
      trendUp: getTrendData('chatbotTrend').isUp,
    },
    {
      name: 'Cuộc hội thoại hôm nay',
      value: stats.overview.conversationsToday,
      subtext: `${stats.overview.conversationsThisWeek} tuần này`,
      icon: UserGroupIcon,
      color: 'bg-green-500',
      trend: (() => {
        const trend = getTrendData('conversationTrend');
        return `${trend.isUp ? '+' : ''}${trend.percentage}%`;
      })(),
      trendUp: getTrendData('conversationTrend').isUp,
    },
    {
      name: 'Tài liệu đang xử lý',
      value: stats.overview.documentsProcessing,
      subtext: `${stats.overview.totalDocuments} tổng cộng`,
      icon: DocumentTextIcon,
      color: 'bg-yellow-500',
      trend: (() => {
        const trend = getTrendData('documentTrend');
        return `${trend.isUp ? '+' : ''}${trend.percentage}%`;
      })(),
      trendUp: getTrendData('documentTrend').isUp,
    },
    {
      name: 'API Keys hoạt động',
      value: stats.overview.activeApiKeys,
      subtext: `${stats.overview.totalApiKeys} tổng cộng`,
      icon: KeyIcon,
      color: 'bg-purple-500',
      trend: (() => {
        const trend = getTrendData('apiKeyTrend');
        return `${trend.isUp ? '+' : ''}${trend.percentage}%`;
      })(),
      trendUp: getTrendData('apiKeyTrend').isUp,
    },
  ];

  const performanceStats = [
    {
      name: 'Thời gian phản hồi',
      value: `${stats.performance.averageResponseTime}ms`,
      subtext: 'Trung bình',
      icon: ClockIcon,
      color:
        stats.performance.averageResponseTime < 300
          ? 'bg-green-500'
          : 'bg-yellow-500',
    },
    {
      name: 'Tỷ lệ lỗi',
      value: `${(stats.performance.errorRate * 100).toFixed(2)}%`,
      subtext: 'Trong 7 ngày gần nhất',
      icon: ExclamationTriangleIcon,
      color: stats.performance.errorRate < 0.05 ? 'bg-green-500' : 'bg-red-500',
    },
    {
      name: 'Tình trạng hệ thống',
      value:
        stats.performance.systemHealth === 'healthy'
          ? 'Bình thường'
          : 'Có vấn đề',
      subtext: 'Trong 7 ngày gần nhất',
      icon:
        stats.performance.systemHealth === 'healthy'
          ? CheckCircleIcon
          : XCircleIcon,
      color:
        stats.performance.systemHealth === 'healthy'
          ? 'bg-green-500'
          : 'bg-red-500',
    },
  ];

  const backgroundJobData = [
    {
      name: 'Pending',
      value: stats.performance.backgroundJobs.pending,
      color: '#f59e0b',
    },
    {
      name: 'Running',
      value: stats.performance.backgroundJobs.running,
      color: '#3b82f6',
    },
    {
      name: 'Completed',
      value: stats.performance.backgroundJobs.completed,
      color: '#10b981',
    },
    {
      name: 'Failed',
      value: stats.performance.backgroundJobs.failed,
      color: '#ef4444',
    },
  ];

  const platformData = [
    { name: 'Facebook Pages', value: stats.platform.facebookPages },
    { name: 'Telegram Bots', value: stats.platform.telegramBots },
    { name: 'Web Widgets', value: stats.platform.webWidgets },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard CTO</h1>
          <p className="mt-1 text-sm text-gray-500">
            Tổng quan hệ thống và hiệu suất
          </p>
        </div>
        <div className="text-sm text-gray-500">
          Cập nhật lần cuối: {new Date().toLocaleString('vi-VN')}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {overviewStats.map((item) => (
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
                      {item.value.toLocaleString()}
                    </dd>
                    <dd className="text-sm text-gray-500">{item.subtext}</dd>
                  </dl>
                </div>
              </div>
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
            </div>
          </div>
        ))}
      </div>

      {/* Performance Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {performanceStats.map((item) => (
          <div key={item.name} className="card p-6 shadow-none">
            <div className="flex items-center">
              <div className={`flex-shrink-0 ${item.color} rounded-md p-3`}>
                <item.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {item.name}
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {item.value}
                  </dd>
                  <dd className="text-sm text-gray-500">{item.subtext}</dd>
                </dl>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Conversation Growth */}
        <div className="card p-6 shadow-none">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Tăng trưởng cuộc hội thoại (30 ngày)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={stats.trends.conversationGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* User Growth */}
        <div className="card p-6 shadow-none">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Tăng trưởng người dùng (30 ngày)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.trends.userGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#10b981"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Chatbot Usage */}
        <div className="card p-6 shadow-none">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Sử dụng trợ lý AI (Top 10)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.trends.chatbotUsage}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="conversations" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Background Jobs */}
        <div className="card p-6 shadow-none">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Trạng thái Background Jobs
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={backgroundJobData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#3b82f6"
                dataKey="value"
              >
                {backgroundJobData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Platform Distribution */}
      <div className="card p-6 shadow-none">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Phân bố nền tảng
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {platformData.map((platform) => (
            <div key={platform.name} className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {platform.value}
              </div>
              <div className="text-sm text-gray-500">{platform.name}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
