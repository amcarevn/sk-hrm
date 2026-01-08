import { useEffect } from 'react';
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
} from '@heroicons/react/24/outline';

export default function LandingPage() {
  const { isAuthenticated, loading } = useAuth();

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
      <div id="demo" className="py-16 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
              Trải nghiệm thực tế
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Xem hệ thống quản lý nhân sự hoạt động như thế nào trong thực tế
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-4xl">
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                <h3 className="text-lg font-semibold text-white">
                  Demo Hệ Thống HRM
                </h3>
              </div>
              <div className="p-8">
                <div className="bg-gray-100 rounded-lg p-6 min-h-[400px] flex items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                      <UserGroupIcon className="h-8 w-8 text-blue-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      Demo Quản Lý Nhân Sự
                    </h4>
                    <p className="text-gray-600 mb-4">
                      Trải nghiệm hệ thống HRM thông minh với đầy đủ tính năng
                    </p>
                    <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      <PlayIcon className="h-5 w-5 mr-2" />
                      Khởi chạy Demo
                    </button>
                  </div>
                </div>
              </div>
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
