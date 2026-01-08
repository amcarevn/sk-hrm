import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  KeyIcon,
  Squares2X2Icon,
  UserGroupIcon,
  XMarkIcon,
  Bars3Icon,
  GlobeAltIcon,
  ArrowRightOnRectangleIcon,
  UsersIcon,
  ShieldCheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline';

// Define navigation items with role requirements
const navigationItems = [
  {
    name: 'Bảng điều khiển',
    href: '/dashboard',
    icon: Squares2X2Icon,
    roles: ['ADMIN', 'USER'],
  },
  {
    name: 'Trợ lý AI',
    href: '/dashboard/chatbots',
    icon: ChatBubbleLeftRightIcon,
    roles: ['ADMIN', 'USER'],
  },
  {
    name: 'Cuộc trò chuyện',
    href: '/dashboard/conversations',
    icon: UserGroupIcon,
    roles: ['ADMIN', 'USER'],
  },
  {
    name: 'Tài liệu',
    href: '/dashboard/documents',
    icon: DocumentTextIcon,
    roles: ['ADMIN', 'USER'],
  },
  {
    name: 'Trang Facebook',
    href: '/dashboard/facebook-pages',
    icon: GlobeAltIcon,
    roles: ['ADMIN', 'USER'],
  },
  {
    name: 'API Keys',
    href: '/dashboard/api-keys',
    icon: KeyIcon,
    roles: ['ADMIN', 'USER'],
  },
  {
    name: 'Quản lý người dùng',
    href: '/dashboard/users',
    icon: UsersIcon,
    roles: ['ADMIN'],
  },
  {
    name: 'Quản lý vai trò',
    href: '/dashboard/roles',
    icon: ShieldCheckIcon,
    roles: ['ADMIN'],
  },
  {
    name: 'Phân quyền Bot',
    href: '/dashboard/bot-permissions',
    icon: UserPlusIcon,
    roles: ['ADMIN'],
  },
  {
    name: 'Cài đặt',
    href: '/dashboard/settings',
    icon: Cog6ToothIcon,
    roles: ['ADMIN', 'USER'],
  },
];

interface SidebarProps {
  onCollapseChange?: (isCollapsed: boolean) => void;
}

export default function Sidebar({ onCollapseChange }: SidebarProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  // Filter navigation items based on user role
  const navigation = navigationItems.filter((item) =>
    item.roles.includes(user?.role || 'USER')
  );

  const handleCollapseToggle = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    onCollapseChange?.(newCollapsedState);
  };

  const handleLogout = async () => {
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất?')) {
      setIsLoggingOut(true);
      try {
        logout();
      } catch (error) {
        console.error('Lỗi đăng xuất:', error);
        setIsLoggingOut(false);
      }
    }
  };

  return (
    <>
      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}
      >
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75"
          onClick={() => setSidebarOpen(false)}
        />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4">
            <Link to="/" className="flex items-center">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center">
                <img src="/bot-logo.png" alt="Logo" className="h-full w-full" />
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">
                Chatbot AI
              </span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-primary-100 text-primary-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon
                    className={`h-6 w-6 flex-shrink-0 ${
                      isActive
                        ? 'text-primary-500'
                        : 'text-gray-400 group-hover:text-gray-500'
                    } mr-3`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User Info Section */}
          {user && (
            <div className="border-t border-gray-200 px-2 py-4">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {user.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.username}
                  </p>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'ADMIN'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {user.role}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Logout Button */}
          <div className="border-t border-gray-200 px-2 py-4">
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="group flex w-full items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowRightOnRectangleIcon className="h-6 w-6 flex-shrink-0 text-gray-400 group-hover:text-gray-500 mr-3" />
              {isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div
        className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col transition-all duration-300 ${isCollapsed ? 'lg:w-16' : 'lg:w-64'}`}
      >
        <div className="flex min-h-0 flex-1 flex-col bg-white border-r border-gray-200">
          <div className="flex h-16 items-center px-4 justify-between">
            {!isCollapsed && (
              <Link to="/" className="flex items-center">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center">
                  <img
                    src="/bot-logo.png"
                    alt="Logo"
                    className="h-full w-full"
                  />
                </div>
                <span className="ml-2 text-xl font-bold text-gray-900">
                  Chatbot AI
                </span>
              </Link>
            )}
            {isCollapsed && (
              <div className="flex items-center justify-center w-full">
                <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <svg
                    className="h-5 w-5 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            )}
            <button
              onClick={handleCollapseToggle}
              className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <ChevronRightIcon className="h-5 w-5" />
              ) : (
                <ChevronLeftIcon className="h-5 w-5" />
              )}
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-primary-100 text-primary-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } ${isCollapsed ? 'justify-center' : ''}`}
                  title={isCollapsed ? item.name : undefined}
                >
                  <item.icon
                    className={`h-6 w-6 flex-shrink-0 ${
                      isActive
                        ? 'text-primary-500'
                        : 'text-gray-400 group-hover:text-gray-500'
                    } ${isCollapsed ? '' : 'mr-3'}`}
                  />
                  {!isCollapsed && item.name}
                </Link>
              );
            })}
          </nav>

          {/* User Info Section */}
          {!isCollapsed && user && (
            <div className="border-t border-gray-200 px-2 py-4">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {user.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.username}
                  </p>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'ADMIN'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {user.role}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Logout Button */}
          <div className="border-t border-gray-200 px-2 py-4">
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className={`group flex w-full items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed ${isCollapsed ? 'justify-center' : ''}`}
              title={
                isCollapsed
                  ? isLoggingOut
                    ? 'Đang đăng xuất...'
                    : 'Đăng xuất'
                  : undefined
              }
            >
              <ArrowRightOnRectangleIcon
                className={`h-6 w-6 flex-shrink-0 text-gray-400 group-hover:text-gray-500 ${isCollapsed ? '' : 'mr-3'}`}
              />
              {!isCollapsed &&
                (isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất')}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu button */}
      <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:hidden">
        <button
          type="button"
          className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <Bars3Icon className="h-6 w-6" />
        </button>
        <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
          <Link to="/" className="flex items-center">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center">
              <img src="/bot-logo.png" alt="Logo" className="h-full w-full" />
            </div>
            <span className="ml-2 text-lg font-semibold text-gray-900">
              Chatbot AI
            </span>
          </Link>
        </div>
      </div>
    </>
  );
}
