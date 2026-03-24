import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  UserGroupIcon,
  ClockIcon,
  CurrencyDollarIcon,
  AcademicCapIcon,
  ChartBarIcon,
  GiftIcon,
  BriefcaseIcon,
  CheckIcon,
  StarIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
  BoltIcon,
  GlobeAltIcon,
  ArrowRightIcon,
  PlayIcon,
  DocumentTextIcon,
  CogIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  HomeIcon,
  ArrowTrendingUpIcon,
  BellIcon,
  MagnifyingGlassIcon,
  EllipsisHorizontalIcon,
} from '@heroicons/react/24/outline';

export default function LandingPage() {
  const { isAuthenticated, loading } = useAuth();
  const [activeDemoTab, setActiveDemoTab] = useState<'dashboard' | 'employees' | 'attendance' | 'payroll'>('dashboard');

  // Redirect to dashboard if already authenticated
  if (!loading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative isolate overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
        </div>

        <div className="relative isolate px-6 pt-14 lg:px-8">
          <div className="mx-auto max-w-2xl py-16">
            <div className="text-center">
              {/* Badge */}
              <div className="inline-flex items-center rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 mb-8">
                <StarIcon className="h-4 w-4 mr-2" />
                Nền Tảng Quản Lý Nhân Sự Hiện Đại
              </div>

              <div className="flex justify-center text-center w-full gap-2 text-4xl font-bold text-gray-900">
                <div className="text-[48px] font-bold text-gray-900">
                  Hệ Thống Quản Lý
                </div>
                <div className="text-[48px] font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Hành Chính Nhân Sự
                </div>
              </div>

              <p className="mt-6 text-lg leading-8 text-gray-600 max-w-3xl mx-auto">
                Tối ưu hóa quy trình quản lý nhân sự, chấm công, tính lương và phúc lợi với nền tảng HRM hiện đại, giúp doanh nghiệp vận hành hiệu quả và tiết kiệm chi phí.
              </p>

              <div className="mt-10 flex items-center justify-center gap-x-6">
                <a
                  href="/login"
                  className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:bg-gradient-to-r hover:from-blue-700 hover:to-purple-700 transform hover:-translate-y-1 transition-all duration-200"
                >
                  Dùng thử miễn phí
                  <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </a>
                <a
                  href="#demo"
                  className="group inline-flex items-center px-6 py-4 text-lg font-semibold text-gray-900 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
                >
                  <PlayIcon className="mr-2 h-5 w-5 text-blue-600" />
                  Xem demo
                </a>
              </div>

              {/* Stats */}
              <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">500+</div>
                  <div className="text-sm text-gray-600">
                    Doanh nghiệp sử dụng
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    50K+
                  </div>
                  <div className="text-sm text-gray-600">Nhân viên quản lý</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">99%</div>
                  <div className="text-sm text-gray-600">Hài lòng</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <div className="inline-flex items-center rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 mb-8">
              <RocketLaunchIcon className="h-4 w-4 mr-2" />
              Tính năng nổi bật
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
              Mọi công cụ bạn cần để
              <span className="block text-blue-600 mt-2">
                quản lý nhân sự hiệu quả
              </span>
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Nền tảng HRM toàn diện với các tính năng tiên tiến giúp doanh nghiệp quản lý nhân sự chuyên nghiệp và hiệu quả.
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              <div className="group relative bg-white p-8 rounded-2xl hover:bg-gray-50 transition-all duration-300 hover:-translate-y-2 border border-gray-100">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600">
                    <UserGroupIcon className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div className="pt-8">
                  <dt className="text-xl font-semibold leading-7 text-gray-900 text-center mb-4">
                    Quản lý Nhân sự
                  </dt>
                  <dd className="text-base leading-7 text-gray-600 text-center">
                    Quản lý thông tin nhân viên, hợp đồng, phòng ban và vị trí công việc một cách hệ thống và chính xác.
                  </dd>
                </div>
              </div>

              <div className="group relative bg-white p-8 rounded-2xl hover:bg-gray-50 transition-all duration-300 hover:-translate-y-2 border border-gray-100">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-green-600 to-blue-600">
                    <ClockIcon className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div className="pt-8">
                  <dt className="text-xl font-semibold leading-7 text-gray-900 text-center mb-4">
                    Chấm công & Tính lương
                  </dt>
                  <dd className="text-base leading-7 text-gray-600 text-center">
                    Tự động hóa chấm công, tính lương, phụ cấp, bảo hiểm và thuế theo quy định pháp luật.
                  </dd>
                </div>
              </div>

              <div className="group relative bg-white p-8 rounded-2xl hover:bg-gray-50 transition-all duration-300 hover:-translate-y-2 border border-gray-100">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-pink-600">
                    <AcademicCapIcon className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div className="pt-8">
                  <dt className="text-xl font-semibold leading-7 text-gray-900 text-center mb-4">
                    Đào tạo & Phát triển
                  </dt>
                  <dd className="text-base leading-7 text-gray-600 text-center">
                    Quản lý đào tạo, đánh giá năng lực và lộ trình phát triển nghề nghiệp cho nhân viên.
                  </dd>
                </div>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* How it Works Section */}
      <div className="py-16 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
              Cách hoạt động
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Chỉ cần 3 bước đơn giản để triển khai hệ thống quản lý nhân sự chuyên nghiệp
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="relative">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-600 text-white text-2xl font-bold mx-auto mb-6">
                  1
                </div>
                <h3 className="text-xl font-semibold text-gray-900 text-center mb-4">
                  Đăng ký & Thiết lập
                </h3>
                <p className="text-gray-600 text-center">
                  Đăng ký tài khoản và thiết lập thông tin công ty, phòng ban, chức vụ
                </p>
              </div>

              <div className="relative">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-purple-600 text-white text-2xl font-bold mx-auto mb-6">
                  2
                </div>
                <h3 className="text-xl font-semibold text-gray-900 text-center mb-4">
                  Nhập dữ liệu Nhân sự
                </h3>
                <p className="text-gray-600 text-center">
                  Import hoặc nhập thủ công thông tin nhân viên, hợp đồng và chính sách
                </p>
              </div>

              <div className="relative">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-green-600 text-white text-2xl font-bold mx-auto mb-6">
                  3
                </div>
                <h3 className="text-xl font-semibold text-gray-900 text-center mb-4">
                  Vận hành & Quản lý
                </h3>
                <p className="text-gray-600 text-center">
                  Bắt đầu sử dụng các tính năng quản lý, chấm công, tính lương và báo cáo
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
              Lợi ích vượt trội
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Tại sao doanh nghiệp nên chọn hệ thống quản lý nhân sự của chúng tôi
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                      <CheckIcon className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Tiết kiệm thời gian
                    </h3>
                    <p className="text-gray-600">
                      Giảm 80% thời gian xử lý thủ công các công việc hành chính nhân sự
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                      <BoltIcon className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Tự động hóa
                    </h3>
                    <p className="text-gray-600">
                      Tự động tính lương, chấm công, báo cáo và cảnh báo
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
                      <ChartBarIcon className="h-5 w-5 text-purple-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Báo cáo chi tiết
                    </h3>
                    <p className="text-gray-600">
                      Hệ thống báo cáo đa chiều, real-time hỗ trợ ra quyết định
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100">
                      <ShieldCheckIcon className="h-5 w-5 text-yellow-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Tuân thủ pháp luật
                    </h3>
                    <p className="text-gray-600">
                      Luôn cập nhật các quy định mới nhất về lao động, bảo hiểm, thuế
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                      <CurrencyDollarIcon className="h-5 w-5 text-red-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Tối ưu chi phí
                    </h3>
                    <p className="text-gray-600">
                      Giảm chi phí quản lý, tránh sai sót và phạt không đáng có
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100">
                      <GlobeAltIcon className="h-5 w-5 text-indigo-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Đa nền tảng
                    </h3>
                    <p className="text-gray-600">
                      Truy cập trên web, mobile app, tích hợp với các hệ thống hiện có
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Section */}
      <div id="demo" className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center mb-16">
            <div className="inline-flex items-center rounded-full bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700 ring-1 ring-inset ring-purple-700/10 mb-6">
              <PlayIcon className="h-4 w-4 mr-2" />
              Xem thử ngay
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
              Trải nghiệm{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                thực tế
              </span>
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Khám phá giao diện trực quan và đầy đủ tính năng của hệ thống quản lý nhân sự
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex bg-white rounded-xl p-1.5 shadow-md border border-gray-200 gap-1">
              {[
                { key: 'dashboard', label: 'Tổng quan', icon: HomeIcon },
                { key: 'employees', label: 'Nhân viên', icon: UserGroupIcon },
                { key: 'attendance', label: 'Chấm công', icon: ClockIcon },
                { key: 'payroll', label: 'Lương', icon: CurrencyDollarIcon },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveDemoTab(key as typeof activeDemoTab)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeDemoTab === key
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Browser Frame Mockup */}
          <div className="mx-auto max-w-5xl">
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
              {/* Browser Chrome */}
              <div className="bg-gray-100 border-b border-gray-200 px-4 py-3 flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-400" />
                  <div className="h-3 w-3 rounded-full bg-yellow-400" />
                  <div className="h-3 w-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-white rounded-md px-3 py-1.5 flex items-center gap-2 text-xs text-gray-400 border border-gray-200">
                    <ShieldCheckIcon className="h-3.5 w-3.5 text-green-500" />
                    <span>app.hrm-system.vn/dashboard</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <BellIcon className="h-4 w-4" />
                  <MagnifyingGlassIcon className="h-4 w-4" />
                </div>
              </div>

              {/* App Shell */}
              <div className="flex bg-gray-50" style={{ minHeight: 480 }}>
                {/* Sidebar */}
                <div className="w-52 bg-gray-900 flex-shrink-0 flex flex-col">
                  <div className="px-4 py-4 border-b border-gray-700">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                        <BriefcaseIcon className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-white font-semibold text-sm">AI HRM</span>
                    </div>
                  </div>
                  <nav className="flex-1 px-3 py-4 space-y-1">
                    {[
                      { icon: HomeIcon, label: 'Tổng quan', active: activeDemoTab === 'dashboard' },
                      { icon: UserGroupIcon, label: 'Nhân viên', active: activeDemoTab === 'employees' },
                      { icon: ClockIcon, label: 'Chấm công', active: activeDemoTab === 'attendance' },
                      { icon: CurrencyDollarIcon, label: 'Tiền lương', active: activeDemoTab === 'payroll' },
                      { icon: CalendarIcon, label: 'Nghỉ phép', active: false },
                      { icon: ChartBarIcon, label: 'Báo cáo', active: false },
                      { icon: CogIcon, label: 'Cài đặt', active: false },
                    ].map(({ icon: Icon, label, active }) => (
                      <div
                        key={label}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs cursor-default transition-colors ${
                          active ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                        }`}
                      >
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        <span>{label}</span>
                      </div>
                    ))}
                  </nav>
                  <div className="px-3 py-4 border-t border-gray-700">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center text-xs text-white font-semibold">
                        HT
                      </div>
                      <div>
                        <div className="text-xs text-white font-medium">HR Manager</div>
                        <div className="text-xs text-gray-400">Quản trị viên</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-hidden">
                  {/* Top Bar */}
                  <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">
                        {activeDemoTab === 'dashboard' && 'Tổng quan hệ thống'}
                        {activeDemoTab === 'employees' && 'Quản lý nhân viên'}
                        {activeDemoTab === 'attendance' && 'Bảng chấm công tháng 3/2026'}
                        {activeDemoTab === 'payroll' && 'Bảng lương tháng 3/2026'}
                      </h3>
                      <p className="text-xs text-gray-500">Cập nhật lúc 11:30 AM, 24/03/2026</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 bg-gray-100 rounded-lg px-3 py-1.5 text-xs text-gray-500">
                        <MagnifyingGlassIcon className="h-3.5 w-3.5" />
                        <span>Tìm kiếm...</span>
                      </div>
                      <div className="relative">
                        <BellIcon className="h-5 w-5 text-gray-400" />
                        <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center">3</span>
                      </div>
                    </div>
                  </div>

                  {/* Dashboard Tab */}
                  {activeDemoTab === 'dashboard' && (
                    <div className="p-5 space-y-4">
                      <div className="grid grid-cols-4 gap-3">
                        {[
                          { label: 'Tổng nhân viên', value: '248', change: '+12', iconBg: 'bg-blue-50', iconColor: 'text-blue-600', changeColor: 'text-blue-600', icon: UserGroupIcon },
                          { label: 'Đang làm việc', value: '231', change: '+5', iconBg: 'bg-green-50', iconColor: 'text-green-600', changeColor: 'text-green-600', icon: BriefcaseIcon },
                          { label: 'Nghỉ phép hôm nay', value: '17', change: '-3', iconBg: 'bg-yellow-50', iconColor: 'text-yellow-600', changeColor: 'text-yellow-600', icon: CalendarIcon },
                          { label: 'Tổng lương tháng', value: '4.2 tỷ', change: '+8%', iconBg: 'bg-purple-50', iconColor: 'text-purple-600', changeColor: 'text-purple-600', icon: CurrencyDollarIcon },
                        ].map(({ label, value, change, iconBg, iconColor, changeColor, icon: Icon }) => (
                          <div key={label} className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-gray-500">{label}</span>
                              <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${iconBg}`}>
                                <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
                              </div>
                            </div>
                            <div className="text-lg font-bold text-gray-900">{value}</div>
                            <div className={`text-xs ${changeColor} flex items-center gap-0.5 mt-0.5`}>
                              <ArrowTrendingUpIcon className="h-3 w-3" />
                              {change} so với tháng trước
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        {/* Recent Activity */}
                        <div className="col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                          <h4 className="text-sm font-semibold text-gray-800 mb-3">Hoạt động gần đây</h4>
                          <div className="space-y-2.5">
                            {[
                              { avatar: 'NT', name: 'Nguyễn Thành', action: 'đã xác nhận chấm công', time: '5 phút trước', avatarCls: 'bg-blue-100 text-blue-700' },
                              { avatar: 'LH', name: 'Lê Hương', action: 'đã gửi đơn nghỉ phép', time: '23 phút trước', avatarCls: 'bg-purple-100 text-purple-700' },
                              { avatar: 'TM', name: 'Trần Minh', action: 'đã hoàn thành onboarding', time: '1 giờ trước', avatarCls: 'bg-green-100 text-green-700' },
                              { avatar: 'PL', name: 'Phạm Lan', action: 'cập nhật hồ sơ nhân viên', time: '2 giờ trước', avatarCls: 'bg-yellow-100 text-yellow-700' },
                            ].map(({ avatar, name, action, time, avatarCls }) => (
                              <div key={name} className="flex items-center gap-3">
                                <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${avatarCls}`}>
                                  {avatar}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <span className="text-xs font-medium text-gray-900">{name} </span>
                                  <span className="text-xs text-gray-500">{action}</span>
                                </div>
                                <span className="text-xs text-gray-400 flex-shrink-0">{time}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Dept breakdown */}
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                          <h4 className="text-sm font-semibold text-gray-800 mb-3">Theo phòng ban</h4>
                          <div className="space-y-2.5">
                            {[
                              { dept: 'Kỹ thuật', count: 82, pct: 33 },
                              { dept: 'Kinh doanh', count: 65, pct: 26 },
                              { dept: 'Marketing', count: 41, pct: 17 },
                              { dept: 'Kế toán', count: 30, pct: 12 },
                              { dept: 'Hành chính', count: 30, pct: 12 },
                            ].map(({ dept, count, pct }) => (
                              <div key={dept}>
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="text-gray-600">{dept}</span>
                                  <span className="font-medium text-gray-800">{count}</span>
                                </div>
                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Employees Tab */}
                  {activeDemoTab === 'employees' && (
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-500">
                            <MagnifyingGlassIcon className="h-3.5 w-3.5" />
                            <span>Tìm nhân viên...</span>
                          </div>
                          <button className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-600">Phòng ban ▾</button>
                          <button className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-600">Trạng thái ▾</button>
                        </div>
                        <button className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1">
                          + Thêm nhân viên
                        </button>
                      </div>
                      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-gray-100 bg-gray-50">
                              <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Nhân viên</th>
                              <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Phòng ban</th>
                              <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Chức vụ</th>
                              <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Ngày vào</th>
                              <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Trạng thái</th>
                              <th className="px-4 py-2.5" />
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {[
                              { initials: 'NT', name: 'Nguyễn Thành', email: 'thanh.nv@company.vn', dept: 'Kỹ thuật', role: 'Senior Dev', date: '15/03/2022', status: 'Đang làm', avatarCls: 'bg-blue-100 text-blue-700' },
                              { initials: 'LH', name: 'Lê Thị Hương', email: 'huong.lt@company.vn', dept: 'Kinh doanh', role: 'Sales Manager', date: '01/07/2021', status: 'Đang làm', avatarCls: 'bg-green-100 text-green-700' },
                              { initials: 'TM', name: 'Trần Văn Minh', email: 'minh.tv@company.vn', dept: 'Marketing', role: 'Content Lead', date: '20/01/2023', status: 'Nghỉ phép', avatarCls: 'bg-yellow-100 text-yellow-700' },
                              { initials: 'PL', name: 'Phạm Thị Lan', email: 'lan.pt@company.vn', dept: 'Kế toán', role: 'Accountant', date: '05/09/2020', status: 'Đang làm', avatarCls: 'bg-purple-100 text-purple-700' },
                              { initials: 'HQ', name: 'Hoàng Quân', email: 'quan.hd@company.vn', dept: 'Hành chính', role: 'HR Specialist', date: '12/11/2023', status: 'Đang làm', avatarCls: 'bg-indigo-100 text-indigo-700' },
                            ].map(({ initials, name, email, dept, role, date, status, avatarCls }) => (
                              <tr key={name} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-2.5">
                                  <div className="flex items-center gap-2.5">
                                    <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${avatarCls}`}>
                                      {initials}
                                    </div>
                                    <div>
                                      <div className="font-medium text-gray-900">{name}</div>
                                      <div className="text-gray-400">{email}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-2.5 text-gray-600">{dept}</td>
                                <td className="px-4 py-2.5 text-gray-600">{role}</td>
                                <td className="px-4 py-2.5 text-gray-500">{date}</td>
                                <td className="px-4 py-2.5">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                    status === 'Đang làm' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                  }`}>
                                    {status}
                                  </span>
                                </td>
                                <td className="px-4 py-2.5 text-gray-400 text-right">
                                  <EllipsisHorizontalIcon className="h-4 w-4 ml-auto" />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Attendance Tab */}
                  {activeDemoTab === 'attendance' && (
                    <div className="p-5">
                      <div className="grid grid-cols-4 gap-3 mb-4">
                        {[
                          { label: 'Đúng giờ', value: '218', icon: CheckIcon, cardCls: 'bg-green-50 border-green-100', iconCls: 'text-green-600', textCls: 'text-green-700', subCls: 'text-green-500' },
                          { label: 'Đi muộn', value: '13', icon: ClockIcon, cardCls: 'bg-yellow-50 border-yellow-100', iconCls: 'text-yellow-600', textCls: 'text-yellow-700', subCls: 'text-yellow-500' },
                          { label: 'Vắng mặt', value: '6', icon: BriefcaseIcon, cardCls: 'bg-red-50 border-red-100', iconCls: 'text-red-600', textCls: 'text-red-700', subCls: 'text-red-500' },
                          { label: 'Nghỉ phép', value: '11', icon: CalendarIcon, cardCls: 'bg-blue-50 border-blue-100', iconCls: 'text-blue-600', textCls: 'text-blue-700', subCls: 'text-blue-500' },
                        ].map(({ label, value, icon: Icon, cardCls, iconCls, textCls, subCls }) => (
                          <div key={label} className={`border rounded-xl p-3 ${cardCls}`}>
                            <div className="flex items-center gap-2 mb-1">
                              <Icon className={`h-4 w-4 ${iconCls}`} />
                              <span className={`text-xs font-medium ${textCls}`}>{label}</span>
                            </div>
                            <div className={`text-2xl font-bold ${textCls}`}>{value}</div>
                            <div className={`text-xs mt-0.5 ${subCls}`}>nhân viên hôm nay</div>
                          </div>
                        ))}
                      </div>
                      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-gray-100 bg-gray-50">
                              <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Nhân viên</th>
                              <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Vào ca</th>
                              <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Ra ca</th>
                              <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Giờ làm</th>
                              <th className="text-left px-4 py-2.5 font-semibold text-gray-600">OT</th>
                              <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Trạng thái</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {[
                              { initials: 'NT', name: 'Nguyễn Thành', avatarCls: 'bg-blue-100 text-blue-700', checkin: '07:58', checkout: '17:05', hours: '8h 07m', ot: '-', status: 'Đúng giờ', statusCls: 'bg-green-100 text-green-700' },
                              { initials: 'LH', name: 'Lê Thị Hương', avatarCls: 'bg-green-100 text-green-700', checkin: '08:34', checkout: '18:00', hours: '9h 26m', ot: '1h', status: 'Đi muộn', statusCls: 'bg-yellow-100 text-yellow-700' },
                              { initials: 'TM', name: 'Trần Văn Minh', avatarCls: 'bg-yellow-100 text-yellow-700', checkin: '-', checkout: '-', hours: '-', ot: '-', status: 'Nghỉ phép', statusCls: 'bg-blue-100 text-blue-700' },
                              { initials: 'PL', name: 'Phạm Thị Lan', avatarCls: 'bg-purple-100 text-purple-700', checkin: '08:00', checkout: '17:00', hours: '8h 00m', ot: '-', status: 'Đúng giờ', statusCls: 'bg-green-100 text-green-700' },
                              { initials: 'HQ', name: 'Hoàng Quân', avatarCls: 'bg-indigo-100 text-indigo-700', checkin: '07:55', checkout: '19:30', hours: '11h 35m', ot: '2.5h', status: 'Đúng giờ', statusCls: 'bg-green-100 text-green-700' },
                            ].map(({ initials, name, avatarCls, checkin, checkout, hours, ot, status, statusCls }) => (
                              <tr key={name} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-2.5">
                                  <div className="flex items-center gap-2">
                                    <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold ${avatarCls}`}>
                                      {initials}
                                    </div>
                                    <span className="font-medium text-gray-900">{name}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-2.5 text-gray-700 font-mono">{checkin}</td>
                                <td className="px-4 py-2.5 text-gray-700 font-mono">{checkout}</td>
                                <td className="px-4 py-2.5 text-gray-700">{hours}</td>
                                <td className="px-4 py-2.5 text-orange-600 font-medium">{ot}</td>
                                <td className="px-4 py-2.5">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusCls}`}>
                                    {status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Payroll Tab */}
                  {activeDemoTab === 'payroll' && (
                    <div className="p-5">
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        {[
                          { label: 'Tổng quỹ lương', value: '4,234,500,000 ₫', sub: '+8.2% so với tháng trước', labelCls: 'text-blue-600' },
                          { label: 'Đã thanh toán', value: '3,980,000,000 ₫', sub: '94% nhân viên', labelCls: 'text-green-600' },
                          { label: 'Còn lại', value: '254,500,000 ₫', sub: '14 nhân viên chờ duyệt', labelCls: 'text-yellow-600' },
                        ].map(({ label, value, sub, labelCls }) => (
                          <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3">
                            <div className={`text-xs font-medium mb-1 ${labelCls}`}>{label}</div>
                            <div className="text-base font-bold text-gray-900 truncate">{value}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{sub}</div>
                          </div>
                        ))}
                      </div>
                      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-gray-100 bg-gray-50">
                              <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Nhân viên</th>
                              <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Lương cơ bản</th>
                              <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Phụ cấp</th>
                              <th className="text-left px-4 py-2.5 font-semibold text-gray-600">OT</th>
                              <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Khấu trừ</th>
                              <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Thực lĩnh</th>
                              <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Trạng thái</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {[
                              { initials: 'NT', name: 'Nguyễn Thành', avatarCls: 'bg-blue-100 text-blue-700', base: '25,000,000', allowance: '3,500,000', ot: '850,000', deduct: '2,375,000', net: '26,975,000', paid: true },
                              { initials: 'LH', name: 'Lê Thị Hương', avatarCls: 'bg-green-100 text-green-700', base: '22,000,000', allowance: '2,000,000', ot: '600,000', deduct: '2,088,000', net: '22,512,000', paid: true },
                              { initials: 'TM', name: 'Trần Văn Minh', avatarCls: 'bg-yellow-100 text-yellow-700', base: '18,000,000', allowance: '1,500,000', ot: '0', deduct: '1,710,000', net: '17,790,000', paid: false },
                              { initials: 'PL', name: 'Phạm Thị Lan', avatarCls: 'bg-purple-100 text-purple-700', base: '20,000,000', allowance: '1,800,000', ot: '0', deduct: '1,900,000', net: '19,900,000', paid: true },
                              { initials: 'HQ', name: 'Hoàng Quân', avatarCls: 'bg-indigo-100 text-indigo-700', base: '16,000,000', allowance: '1,200,000', ot: '1,200,000', deduct: '1,520,000', net: '16,880,000', paid: false },
                            ].map(({ initials, name, avatarCls, base, allowance, ot, deduct, net, paid }) => (
                              <tr key={name} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-2.5">
                                  <div className="flex items-center gap-2">
                                    <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold ${avatarCls}`}>
                                      {initials}
                                    </div>
                                    <span className="font-medium text-gray-900">{name}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-2.5 text-gray-700">{base} ₫</td>
                                <td className="px-4 py-2.5 text-green-600">+{allowance} ₫</td>
                                <td className="px-4 py-2.5 text-orange-600">{ot !== '0' ? `+${ot} ₫` : '-'}</td>
                                <td className="px-4 py-2.5 text-red-500">-{deduct} ₫</td>
                                <td className="px-4 py-2.5 font-semibold text-gray-900">{net} ₫</td>
                                <td className="px-4 py-2.5">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                    paid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                  }`}>
                                    {paid ? 'Đã thanh toán' : 'Chờ duyệt'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Bar */}
              <div className="bg-gray-800 px-4 py-1.5 flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-400 inline-block" /> Hệ thống hoạt động bình thường</span>
                  <span>248 nhân viên đang hoạt động</span>
                </div>
                <span>© 2026 AI HRM System</span>
              </div>
            </div>

            {/* CTA below demo */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500 mb-4">Muốn trải nghiệm đầy đủ tính năng?</p>
              <a
                href="#contact"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <RocketLaunchIcon className="h-5 w-5" />
                Đăng ký dùng thử miễn phí
                <ArrowRightIcon className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div id="contact" className="py-24 sm:py-32 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
              Liên hệ với chúng tôi
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Hãy để lại thông tin, chúng tôi sẽ liên hệ lại trong thời gian sớm nhất
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-xl">
            <form className="space-y-6">
              <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="first-name"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    Họ và tên
                  </label>
                  <div className="mt-2">
                    <input
                      type="text"
                      name="first-name"
                      id="first-name"
                      className="block w-full rounded-lg border-0 py-3 px-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                      placeholder="Nhập họ và tên"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    Email
                  </label>
                  <div className="mt-2">
                    <input
                      type="email"
                      name="email"
                      id="email"
                      className="block w-full rounded-lg border-0 py-3 px-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                      placeholder="Nhập email"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label
                  htmlFor="company"
                  className="block text-sm font-medium leading-6 text-gray-900"
                >
                  Công ty
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    name="company"
                    id="company"
                    className="block w-full rounded-lg border-0 py-3 px-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                    placeholder="Nhập tên công ty"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium leading-6 text-gray-900"
                >
                  Tin nhắn
                </label>
                <div className="mt-2">
                  <textarea
                    name="message"
                    id="message"
                    rows={4}
                    className="block w-full rounded-lg border-0 py-3 px-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                    placeholder="Mô tả nhu cầu của bạn..."
                  />
                </div>
              </div>
              <div>
                <button
                  type="submit"
                  className="flex w-full justify-center rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-lg font-semibold text-white hover:from-blue-700 hover:to-purple-700 transform hover:-translate-y-1 transition-all duration-200"
                >
                  Gửi tin nhắn
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* CTA Section with Enhanced Design */}
      <div className="relative isolate overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5" />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 2px, transparent 2px)`,
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8 relative z-10">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Sẵn sàng bắt đầu?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-blue-100">
              Đăng ký ngay hôm nay để trải nghiệm sức mạnh của hệ thống quản lý nhân sự và tối ưu hóa vận hành doanh nghiệp của bạn.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <a
                href="/login"
                className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-blue-600 bg-white rounded-xl hover:bg-gray-50 transform hover:-translate-y-1 transition-all duration-200"
              >
                Dùng thử miễn phí
                <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a
                href="#contact"
                className="group inline-flex items-center px-6 py-4 text-lg font-semibold text-white border-2 border-white rounded-xl hover:bg-white hover:text-blue-600 transition-all duration-200"
              >
                Liên hệ tư vấn
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
