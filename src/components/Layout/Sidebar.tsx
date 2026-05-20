import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Cog6ToothIcon,
  Squares2X2Icon,
  XMarkIcon,
  Bars3Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserIcon,
  ClockIcon,
  CheckCircleIcon,
  UserPlusIcon,
  UserMinusIcon,
  BuildingOfficeIcon,
  CloudArrowUpIcon,
  ComputerDesktopIcon,
  UserCircleIcon,
  BriefcaseIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  TableCellsIcon,
  DocumentTextIcon,
  KeyIcon,
  SparklesIcon,
  ClipboardDocumentListIcon,
  CurrencyDollarIcon,
  TrophyIcon,
  GiftIcon,
  MagnifyingGlassIcon,
  MegaphoneIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  roles: string[];
  departments?: string[];
  employeePermission?: string;
  children?: NavigationItem[];
  hidden?: boolean;
}

const navigationItems: NavigationItem[] = [
  // --- Tổng quan ---
  {
    name: 'Trang chủ',
    href: '/home',
    icon: Squares2X2Icon,
    roles: ['ADMIN', 'USER', 'CUSTOMER', 'STAFF', 'HR'],
  },
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: ChartBarIcon,
    roles: ['ADMIN', 'USER', 'CUSTOMER'],
  },
  {
    name: 'Bảng thông báo',
    href: '/dashboard/announcements',
    icon: MegaphoneIcon,
    roles: ['ADMIN', 'HR'],
  },
  {
    name: 'Me',
    href: '/dashboard/me',
    icon: UserCircleIcon,
    roles: ['ADMIN', 'USER', 'CUSTOMER', 'STAFF', 'HR'],
  },

  // --- Nhân sự ---
  {
    name: 'Nhân sự',
    href: '/dashboard/employees',
    icon: UserIcon,
    roles: ['ADMIN','HR'],
    children: [
      {
        name: 'Quản lý nhân viên',
        href: '/dashboard/employees',
        icon: UserIcon,
        roles: ['ADMIN', 'HR'],
      },
      {
        name: 'Onboard nhân sự',
        href: '/dashboard/onboarding',
        icon: UserPlusIcon,
        roles: ['ADMIN', 'HR'],
      },
      {
        name: 'Offboard nhân sự',
        href: '/dashboard/offboarding',
        icon: UserMinusIcon,
        roles: ['ADMIN', 'HR'],
      },
      {
        name: 'Quản lý phân quyền',
        href: '/dashboard/roles',
        icon: ShieldCheckIcon,
        roles: ['ADMIN', 'HR'],
      },
      {
        name: 'Cấp lại mật khẩu',
        href: '/dashboard/password-reset',
        icon: KeyIcon,
        roles: ['ADMIN', 'HR'],
      },
    ],
  },

  // --- Cơ cấu tổ chức ---
  {
    name: 'Cơ cấu tổ chức',
    href: '/dashboard/departments',
    icon: BuildingOfficeIcon,
    roles: ['ADMIN'],
    children: [
      {
        name: 'Quản lý đơn vị',
        href: '/dashboard/company-units',
        icon: BuildingOfficeIcon,
        hidden: true,
        roles: ['ADMIN'],
        employeePermission: 'can_manage_company_config',
      },
      {
        name: 'Quản lý phòng ban',
        href: '/dashboard/departments',
        icon: BuildingOfficeIcon,
        roles: ['ADMIN'],
        employeePermission: 'can_manage_departments',
      },
      {
        name: 'Quản lý bộ phận',
        href: '/dashboard/sections',
        icon: BuildingOfficeIcon,
        roles: ['ADMIN'],
        employeePermission: 'can_manage_departments',
      },
      {
        name: 'Quản lý vị trí',
        href: '/dashboard/positions',
        icon: BriefcaseIcon,
        roles: ['ADMIN'],
        employeePermission: 'can_manage_positions',
      },
    ],
  },

  // --- Chấm công ---
  {
    name: 'Chấm công',
    href: '/dashboard/attendance',
    icon: ClockIcon,
    roles: ['ADMIN', 'USER', 'CUSTOMER', 'STAFF', 'HR'],
    children: [
      {
        name: 'Chấm công',
        href: '/dashboard/attendance',
        icon: ClockIcon,
        roles: ['ADMIN', 'USER', 'CUSTOMER', 'STAFF', 'HR'],
      },
      {
        name: 'Upload chấm công',
        href: '/dashboard/attendance/upload',
        icon: CloudArrowUpIcon,
        roles: ['ADMIN', 'HR'],
        departments: ['HCNS'],
      },
      {
        name: 'Cấu hình ca làm',
        href: '/dashboard/shift-configuration',
        icon: ClockIcon,
        roles: ['ADMIN', 'HR'],
      },
      {
        name: 'Chốt công',
        href: '/dashboard/work-finalization',
        icon: TableCellsIcon,
        roles: ['ADMIN', 'HR'],
      },
      {
        name: 'Phê duyệt chốt công',
        href: '/dashboard/work-finalization/approvals',
        icon: CheckCircleIcon,
        roles: ['ADMIN', 'HR'],
      },
    ],
  },

  // --- Khen thưởng & Kỷ luật ---
  {
    name: 'Khen thưởng & Kỷ luật',
    href: '/dashboard/rewards',
    icon: GiftIcon,
    roles: ['ADMIN', 'HR'],
    children: [
      {
        name: 'Xếp hạng chấm công',
        href: '/dashboard/attendance/ranking',
        icon: TrophyIcon,
        roles: ['ADMIN', 'HR'],
      },
    ],
  },

  // --- Lương ---
  {
    name: 'Quản lý tính lương',
    href: '/dashboard/salary-management/config',
    icon: CurrencyDollarIcon,
    roles: ['ADMIN', 'HR'],
    children: [
      {
        name: 'Bảng lương',
        href: '/dashboard/salary-management/payroll',
        icon: TableCellsIcon,
        roles: ['ADMIN'],
      },
      {
        name: 'Cấu hình tính lương',
        href: '/dashboard/salary-management/config',
        icon: CurrencyDollarIcon,
        roles: ['ADMIN'],
      },
      {
        name: 'Dữ liệu',
        href: '/dashboard/salary-management/penalty',
        icon: ExclamationCircleIcon,
        roles: ['ADMIN' ],
      },
      {
        name: 'Cấu hình tăng ca',
        href: '/dashboard/salary-management/overtime',
        icon: ClockIcon,
        roles: ['ADMIN'],
      },
    ],
  },

  // --- Tài sản ---
  {
    name: 'Tài sản',
    href: '/dashboard/assigned-assets',
    icon: ComputerDesktopIcon,
    roles: ['ADMIN', 'USER', 'CUSTOMER', 'STAFF', 'HR'],
    children: [
      {
        name: 'Tài sản được bàn giao',
        href: '/dashboard/assigned-assets',
        icon: ComputerDesktopIcon,
        roles: ['ADMIN', 'USER', 'CUSTOMER', 'STAFF', 'HR'],
      },
      {
        name: 'Quản lý tài sản',
        href: '/dashboard/assets',
        icon: ComputerDesktopIcon,
        roles: ['ADMIN', 'HR'],
      },
    ],
  },

  // --- Đơn từ & Phê duyệt ---
  {
    name: 'Đơn từ & Phê duyệt',
    href: '/dashboard/my-requests',
    icon: ClipboardDocumentListIcon,
    roles: ['ADMIN', 'USER', 'CUSTOMER', 'STAFF', 'HR'],
    children: [
      {
        name: 'Yêu cầu & Đơn từ',
        href: '/dashboard/my-requests',
        icon: ClipboardDocumentListIcon,
        roles: ['ADMIN', 'USER', 'CUSTOMER', 'STAFF', 'HR'],
      },
      {
        name: 'Phê duyệt',
        href: '/dashboard/approvals',
        icon: CheckCircleIcon,
        roles: ['ADMIN', 'USER', 'CUSTOMER', 'STAFF', 'HR'],
      },
      {
        name: 'Template đơn từ',
        href: '/dashboard/request-templates',
        icon: DocumentTextIcon,
        roles: ['ADMIN', 'HR'],
      },
      {
        name: 'Template hợp đồng',
        href: '/dashboard/contract-templates',
        icon: DocumentTextIcon,
        roles: ['ADMIN', 'HR'],
      },
      {
        name: 'Hợp đồng hàng loạt',
        href: '/dashboard/bulk-contracts',
        icon: DocumentTextIcon,
        roles: ['ADMIN', 'HR'],
      },
      {
        name: 'Template tài liệu',
        href: '/dashboard/document-templates',
        icon: DocumentTextIcon,
        roles: ['ADMIN', 'HR'],
      },
    ],
  },

  // --- Tuyển dụng ---
  {
    name: 'Tuyển dụng',
    href: '/dashboard/recruitment',
    icon: MagnifyingGlassIcon,
    roles: ['ADMIN', 'HR'],
    children: [
      {
        name: 'Nhu cầu tuyển dụng',
        href: '/dashboard/recruitment/needs',
        icon: DocumentTextIcon,
        roles: ['ADMIN', 'HR'],
      },
      {
        name: 'Quản lý JD',
        href: '/dashboard/recruitment/jobs',
        icon: BriefcaseIcon,
        roles: ['ADMIN', 'HR'],
      },
      {
        name: 'Ứng viên',
        href: '/dashboard/recruitment/candidates',
        icon: UserIcon,
        roles: ['ADMIN', 'HR'],
      },
    ],
  },

  // --- Cấu hình ---
  {
    name: 'Cấu hình công ty',
    href: '/dashboard/company-configs',
    icon: Cog6ToothIcon,
    roles: ['ADMIN'],
  },

  // --- AI ---
  {
    name: 'AI',
    href: '/dashboard/ai',
    icon: SparklesIcon,
    roles: ['ADMIN', 'USER', 'CUSTOMER', 'STAFF', 'HR'],
  },
];

interface SidebarProps {
  onCollapseChange?: (isCollapsed: boolean) => void;
}

export default function Sidebar({ onCollapseChange }: SidebarProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [collapsedByUser, setCollapsedByUser] = useState<Set<string>>(new Set());
  const location = useLocation();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-primary-900">
          <div className="flex h-16 items-center px-4">
            <div className="h-8 w-8 rounded-lg bg-primary-800 animate-pulse"></div>
            <div className="ml-2 h-6 w-32 bg-primary-800 rounded animate-pulse"></div>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 bg-primary-800 rounded-lg animate-pulse"></div>
            ))}
          </nav>
        </div>
      </div>
    );
  }

  const userRole = user?.role ? user.role.toUpperCase() : 'USER';
  const isSuperAdmin = user?.is_super_admin || (user as any)?.is_superuser || false;
  const isManager = user?.is_manager || false;

  const userDepartmentCode = (
    user?.employee_profile?.department_code ||
    user?.hrm_user?.department_code ||
    (user as any)?.department_code ||
    null
  );

  const employeePermission = user?.employee_permission;

  const canAccessItem = (item: NavigationItem): boolean => {
    if (item.hidden) return false;
    if (item.employeePermission && employeePermission?.[item.employeePermission as keyof typeof employeePermission]) {
      return true;
    }
    if (item.departments && userDepartmentCode) {
      if (item.departments.includes(userDepartmentCode)) {
        return item.roles.some(role => role.toUpperCase() === userRole);
      }
    }
    if (isManager && item.name === 'Onboard nhân sự') {
      return true;
    }
    return item.roles.some(role => role.toUpperCase() === userRole);
  };

  const navigation = isSuperAdmin
    ? navigationItems
    : navigationItems.filter(canAccessItem);

  const toggleGroup = (name: string, currentlyExpanded: boolean) => {
    if (currentlyExpanded) {
      setExpandedGroups(prev => { const next = new Set(prev); next.delete(name); return next; });
      setCollapsedByUser(prev => new Set(prev).add(name));
    } else {
      setExpandedGroups(prev => new Set(prev).add(name));
      setCollapsedByUser(prev => { const next = new Set(prev); next.delete(name); return next; });
    }
  };

  const isGroupActive = (item: NavigationItem) =>
    item.children?.some(child => location.pathname.startsWith(child.href)) ?? false;

  const handleCollapseToggle = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    onCollapseChange?.(newCollapsedState);
  };

  const renderNavItem = (item: NavigationItem, collapsed: boolean) => {
    if (item.children && item.children.length > 0) {
      const visibleChildren = isSuperAdmin ? item.children : item.children.filter(canAccessItem);
      if (visibleChildren.length === 0) return null;
      const active = isGroupActive(item);
      const expanded = collapsedByUser.has(item.name) ? false : (expandedGroups.has(item.name) || active);
      return (
        <div key={item.name}>
          <button
            onClick={collapsed ? undefined : () => toggleGroup(item.name, expanded)}
            className={`w-full group flex items-center px-2 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${
              active
                ? 'bg-primary-700 text-white'
                : 'text-white hover:bg-primary-800'
            } ${collapsed ? 'justify-center' : 'justify-between'}`}
            title={collapsed ? item.name : undefined}
          >
            <span className="flex items-center">
              <item.icon
                className={`h-5 w-5 flex-shrink-0 ${
                  active ? 'text-white' : 'text-white/70 group-hover:text-white'
                } ${collapsed ? '' : 'mr-3'}`}
              />
              {!collapsed && item.name}
            </span>
            {!collapsed && (
              <ChevronRightIcon
                className={`h-4 w-4 transition-transform duration-200 ${
                  active ? 'text-white/80' : 'text-white/40'
                } ${expanded ? 'rotate-90' : ''}`}
              />
            )}
          </button>
          {!collapsed && expanded && (
            <div className="ml-4 mt-0.5 space-y-0.5 border-l border-primary-700/60 pl-3">
              {visibleChildren.map(child => {
                const childActive = location.pathname.startsWith(child.href);
                return (
                  <Link
                    key={child.name}
                    to={child.href}
                    className={`group flex items-center px-2 py-1.5 text-sm rounded-lg transition-all duration-150 ${
                      childActive
                        ? 'bg-primary-600 text-white font-semibold'
                        : 'text-white/90 hover:bg-primary-800 hover:text-white font-medium'
                    }`}
                  >
                    <child.icon
                      className={`h-4 w-4 flex-shrink-0 mr-2 transition-colors ${
                        childActive ? 'text-white' : 'text-white/70 group-hover:text-white'
                      }`}
                    />
                    {child.name}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    const isActive = location.pathname === item.href;
    return (
      <Link
        key={item.name}
        to={item.href}
        className={`group flex items-center px-2 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${
          isActive
            ? 'bg-primary-600 text-white'
            : 'text-white hover:bg-primary-800'
        } ${collapsed ? 'justify-center' : ''}`}
        title={collapsed ? item.name : undefined}
      >
        <item.icon
          className={`h-5 w-5 flex-shrink-0 ${
            isActive ? 'text-white' : 'text-white/70 group-hover:text-white'
          } ${collapsed ? '' : 'mr-3'}`}
        />
        {!collapsed && item.name}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile sidebar overlay */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div
          className="fixed inset-0 bg-primary-950/80 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-primary-900">
          <div className="relative flex h-16 items-center justify-center border-b border-primary-800/60 px-10">
            <img
              src="/logo_sk.png"
              alt="SK Dental Clinic"
              className="h-12 w-auto max-w-[140px] object-contain brightness-[400]"
            />
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute right-3 p-1 rounded-md text-primary-500 hover:text-white hover:bg-primary-800 transition-colors"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto scrollbar-hide space-y-1 px-2 py-4">
            {navigation.map((item) => renderNavItem(item, false))}
          </nav>

          {user && (
            <div className="border-t border-primary-800 bg-primary-950 px-2 py-3">
              <Link to="/dashboard/settings" className="block">
                <div className="flex items-center space-x-3 hover:bg-primary-800 p-2 rounded-lg transition-colors">
                  {user.hrm_user?.avatar_url ? (
                    <img
                      src={user.hrm_user.avatar_url}
                      alt="Avatar"
                      className="h-8 w-8 rounded-full object-cover ring-2 ring-primary-700"
                    />
                  ) : (
                    <div className="h-8 w-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center ring-2 ring-primary-700">
                      <span className="text-sm font-semibold text-white">
                        {user.username?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {user.username}
                    </p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-0.5 ${
                      userRole === 'ADMIN'
                        ? 'bg-red-900/60 text-red-300'
                        : 'bg-primary-700 text-primary-200'
                    }`}>
                      {userRole}
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Desktop sidebar */}
      <div
        className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col lg:h-screen transition-all duration-300 ${isCollapsed ? 'lg:w-16' : 'lg:w-64'}`}
      >
        <div className="flex h-full min-h-0 flex-col bg-primary-900 overflow-hidden">
          {/* Logo area */}
          <div className="relative flex h-16 items-center justify-center border-b border-primary-800/60 px-10">
            {!isCollapsed && (
              <img
                src="/logo_sk.png"
                alt="SK Dental Clinic"
                className="h-12 w-auto max-w-[140px] object-contain drop-shadow-sm  brightness-[400]"
              />
            )}
            <button
              onClick={handleCollapseToggle}
              className="absolute right-2 p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-primary-800 transition-all duration-150"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <ChevronRightIcon className="h-4 w-4" />
              ) : (
                <ChevronLeftIcon className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto scrollbar-hide space-y-0.5 px-2 py-4">
            {navigation.map((item) => renderNavItem(item, isCollapsed))}
          </nav>

          {/* User section */}
          {!isCollapsed && user && (
            <div className="border-t border-primary-800 bg-primary-950 px-2 py-3">
              <Link to="/dashboard/settings" className="block">
                <div className="flex items-center space-x-3 hover:bg-primary-800 p-2 rounded-lg transition-colors">
                  {user.hrm_user?.avatar_url ? (
                    <img
                      src={user.hrm_user.avatar_url}
                      alt="Avatar"
                      className="h-8 w-8 rounded-full object-cover ring-2 ring-primary-700 flex-shrink-0"
                    />
                  ) : (
                    <div className="h-8 w-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center ring-2 ring-primary-700 flex-shrink-0">
                      <span className="text-sm font-semibold text-white">
                        {(user.employee_profile?.full_name || user.hrm_user?.full_name || user.firstName || user.username)?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {user.employee_profile?.full_name || user.hrm_user?.full_name || user.firstName || user.username}
                    </p>
                    <p className="text-xs text-primary-400 truncate">{user.username}</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-0.5 ${
                      userRole === 'ADMIN'
                        ? 'bg-red-900/60 text-red-300'
                        : 'bg-primary-700 text-primary-200'
                    }`}>
                      {userRole}
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center border-b border-primary-800/60 bg-primary-900 px-4 shadow-sm lg:hidden">
        <button
          type="button"
          className="p-1.5 text-primary-400 hover:text-white transition-colors"
          onClick={() => setSidebarOpen(true)}
        >
          <Bars3Icon className="h-5 w-5" />
        </button>
        <div className="flex flex-1 items-center justify-center">
          <img
            src="/logo_sk.png"
            alt="SK Dental Clinic"
            className="h-12 w-auto max-w-[120px] object-contain brightness-[400]"
          />
        </div>
        <div className="w-8" />
      </div>
    </>
  );
}
