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
  EyeIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  TableCellsIcon,
} from '@heroicons/react/24/outline';

// Define interface for navigation items
interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  roles: string[];
  departments?: string[]; // Optional department codes
}

// Define navigation items with role requirements
const navigationItems: NavigationItem[] = [
  {
    name: 'Trang chủ',
    href: '/home',
    icon: Squares2X2Icon,
    roles: ['ADMIN', 'USER', 'CUSTOMER'], // ← thêm CUSTOMER
  },
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: ChartBarIcon,
    roles: ['ADMIN', 'USER', 'CUSTOMER'], // ← thêm CUSTOMER
  },
  {
    name: 'Me',
    href: '/dashboard/me',
    icon: UserCircleIcon,
    roles: ['ADMIN', 'USER', 'CUSTOMER'], // ← thêm CUSTOMER
  },
  {
    name: 'Quản lý nhân viên',
    href: '/dashboard/employees',
    icon: UserIcon,
    roles: ['ADMIN', 'USER'],
  },
  {
    name: 'Phân quyền',
    href: '/dashboard/roles',
    icon: ShieldCheckIcon,
    roles: ['ADMIN'],
  },
  {
    name: 'Quản lý phòng ban',
    href: '/dashboard/departments',
    icon: BuildingOfficeIcon,
    roles: ['ADMIN', 'HR'],
  },
  {
    name: 'Quản lý vị trí',
    href: '/dashboard/positions',
    icon: BriefcaseIcon,
    roles: ['ADMIN', 'HR'],
  },
  {
    name: 'Chấm công',
    href: '/dashboard/attendance',
    icon: ClockIcon,
    roles: ['ADMIN', 'USER', 'CUSTOMER'], // ← thêm CUSTOMER
  },
  {
    name: 'Quản lý chấm công',
    href: '/dashboard/attendance/upload',
    icon: CloudArrowUpIcon,
    roles: ['ADMIN', 'HR'],
    departments: ['HCNS'], // Thêm điều kiện department_code
  },
  {
    name: 'Quản lý tài sản',
    href: '/dashboard/assets',
    icon: ComputerDesktopIcon,
    roles: ['ADMIN', 'HR'],
  },
  {
    name: 'Cấu hình công ty',
    href: '/dashboard/company-configs',
    icon: Cog6ToothIcon,
    roles: ['ADMIN'],
  },
  {
    name: 'Phê duyệt',
    href: '/dashboard/approvals',
    icon: CheckCircleIcon,
    roles: ['ADMIN', 'USER', 'CUSTOMER'], // ← thêm CUSTOMER
  },
  {
    name: 'Sơ đồ tổ chức',
    href: '/dashboard/organization-chart',
    icon: EyeIcon,
    roles: ['ADMIN', 'USER', 'CUSTOMER'], // ← thêm CUSTOMER
  },
  {
    name: 'Onboard nhân sự',
    href: '/dashboard/onboarding',
    icon: UserPlusIcon,
    roles: ['ADMIN', 'HR'],
    // Trưởng phòng (is_management=true) được thêm qua isManager check bên dưới
  },
  {
    name: 'Offboard nhân sự',
    href: '/dashboard/offboarding',
    icon: UserMinusIcon,
    roles: ['ADMIN'],
  },
  {
    name: 'Chốt công',
    href: '/dashboard/work-finalization',
    icon: TableCellsIcon,
    roles: ['ADMIN', 'HR'],
  },
];

interface SidebarProps {
  onCollapseChange?: (isCollapsed: boolean) => void;
}

export default function Sidebar({ onCollapseChange }: SidebarProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const { user, loading } = useAuth();
  
  // If still loading auth data, show minimal sidebar
  if (loading) {
    return (
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-white border-r border-gray-200">
          <div className="flex h-16 items-center px-4">
            <div className="h-8 w-8 rounded-lg bg-gray-200 animate-pulse"></div>
            <div className="ml-2 h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 bg-gray-100 rounded-md animate-pulse"></div>
            ))}
          </nav>
        </div>
      </div>
    );
  }

  // Filter navigation items based on user role and department
  // Convert user role to uppercase to match navigation item roles
  const userRole = user?.role ? user.role.toUpperCase() : 'USER';
  const isSuperAdmin = user?.is_super_admin || false;

  const MANAGER_POSITIONS = ['Trưởng phòng', 'Leader', 'Phó giám đốc', 'Giám đốc', 'Phó phòng'];
  const userPosition = user?.employee_profile?.position || user?.hrm_user?.position || null;
  const isManager = userPosition ? MANAGER_POSITIONS.includes(userPosition) : false;
  
  // Debug: Log user object to check department_code
  console.log('Sidebar - User object:', user);
  console.log('Sidebar - Employee profile:', user?.employee_profile);
  console.log('Sidebar - HRM user:', user?.hrm_user);
  console.log('Sidebar - Is manager:', isManager);
  
  // Get user's department code from various possible locations in user object
  const userDepartmentCode = (
    user?.employee_profile?.department_code ||
    user?.hrm_user?.department_code ||
    (user as any)?.department_code ||
    null
  );
  
  console.log('Sidebar - Department code found:', userDepartmentCode);
  console.log('Sidebar - User role:', userRole);
  console.log('Sidebar - Is super admin:', isSuperAdmin);
  
  // If user is super admin, show all navigation items
  // Otherwise, filter based on user role and department (case-insensitive comparison)
  let navigation = isSuperAdmin 
    ? navigationItems 
    : navigationItems.filter((item) => {
        // Check if user has access based on department
        if (item.departments && userDepartmentCode) {
          const hasDepartmentAccess = item.departments.includes(userDepartmentCode);
          if (hasDepartmentAccess) {
            return true;
          }
        }

        // ← MỚI: Trưởng phòng (is_management) được xem Onboarding
        if (isManager && item.name === 'Onboard nhân sự') {
          return true;
        }
        
        // Check if user has access based on role
        return item.roles.some(role => role.toUpperCase() === userRole);
      });
  
  // Special handling for staff role
  if (userRole === 'STAFF') {
    // Staff should see specific USER items: Home, Me, Attendance, Organization Chart, Approvals
    // PLUS any items they have department access to (e.g., "Quản lý chấm công" for HCNS)
    const allowedStaffItems = ['Trang chủ', 'Me', 'Chấm công', 'Sơ đồ tổ chức', 'Phê duyệt', 'Onboard nhân sự']; // ← thêm Onboard nhân sự cho STAFF nếu là trưởng phòng
    
    // Debug: Log staff handling
    console.log('Sidebar - STAFF role handling:');
    console.log('Sidebar - userDepartmentCode:', userDepartmentCode);
    console.log('Sidebar - allowedStaffItems:', allowedStaffItems);
    
    // First, get items that staff are allowed to see based on role
    let staffNavigation = navigationItems.filter((item) => 
      allowedStaffItems.includes(item.name)
    );
    
    console.log('Sidebar - Initial staff navigation (based on role):', staffNavigation.map(item => item.name));
    
    // Then, add any items that staff have department access to
    navigationItems.forEach((item) => {
      if (!staffNavigation.some(navItem => navItem.name === item.name)) {
        // Check if staff has department access to this item
        if (item.departments && userDepartmentCode && item.departments.includes(userDepartmentCode)) {
          console.log('Sidebar - Adding item with department access:', item.name, 'departments:', item.departments);
          staffNavigation.push(item);
        }
        // ← MỚI: Trưởng phòng trong STAFF cũng xem được Onboarding
        if (isManager && item.name === 'Onboard nhân sự') {
          staffNavigation.push(item);
        }
      }
    });
    
    console.log('Sidebar - Final staff navigation:', staffNavigation.map(item => item.name));
    navigation = staffNavigation;
  }

  // ← MỚI: Special handling for CUSTOMER role (nhân viên thường có role=CUSTOMER)
  if (userRole === 'CUSTOMER') {
    const allowedCustomerItems = ['Trang chủ', 'Me', 'Chấm công', 'Sơ đồ tổ chức', 'Phê duyệt', 'Onboard nhân sự'];
    let customerNavigation = navigationItems.filter((item) =>
      allowedCustomerItems.includes(item.name)
    );
    // Trưởng phòng trong CUSTOMER cũng xem được Onboarding
    if (isManager) {
      const onboardingItem = navigationItems.find(item => item.name === 'Onboard nhân sự');
      if (onboardingItem && !customerNavigation.some(n => n.name === 'Onboard nhân sự')) {
        customerNavigation.push(onboardingItem);
      }
    }
    navigation = customerNavigation;
  }
  
  // Special handling for HR role - HR should see all STAFF items plus HR-specific items
  if (userRole === 'HR') {
    // First, get all items that STAFF would see
    const allowedStaffItems = ['Trang chủ', 'Me', 'Chấm công', 'Sơ đồ tổ chức', 'Phê duyệt'];
    
    // Debug: Log HR handling
    console.log('Sidebar - HR role handling:');
    console.log('Sidebar - userDepartmentCode:', userDepartmentCode);
    console.log('Sidebar - allowedStaffItems for HR:', allowedStaffItems);
    
    // Start with items that STAFF can see
    let hrNavigation = navigationItems.filter((item) => 
      allowedStaffItems.includes(item.name)
    );
    
    console.log('Sidebar - Initial HR navigation (STAFF items):', hrNavigation.map(item => item.name));
    
    // Then add all HR-specific items (items where HR is in roles)
    navigationItems.forEach((item) => {
      if (!hrNavigation.some(navItem => navItem.name === item.name)) {
        // Check if item has HR role access
        if (item.roles.some(role => role.toUpperCase() === 'HR')) {
          console.log('Sidebar - Adding HR-specific item:', item.name, 'roles:', item.roles);
          hrNavigation.push(item);
        }
      }
    });
    
    // Also add any items that HR has department access to
    navigationItems.forEach((item) => {
      if (!hrNavigation.some(navItem => navItem.name === item.name)) {
        // Check if HR has department access to this item
        if (item.departments && userDepartmentCode && item.departments.includes(userDepartmentCode)) {
          console.log('Sidebar - Adding item with department access for HR:', item.name, 'departments:', item.departments);
          hrNavigation.push(item);
        }
      }
    });
    
    console.log('Sidebar - Final HR navigation:', hrNavigation.map(item => item.name));
    navigation = hrNavigation;
  }
  
  // Debug: Log filtered navigation items
  console.log('Sidebar - Filtered navigation items:', navigation.map(item => ({
    name: item.name,
    hasDepartmentAccess: item.departments && userDepartmentCode ? item.departments.includes(userDepartmentCode) : false,
    hasRoleAccess: item.roles.some(role => role.toUpperCase() === userRole),
    departments: item.departments,
    roles: item.roles
  })));

  const handleCollapseToggle = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    onCollapseChange?.(newCollapsedState);
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
                AI HRM
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
              <Link to="/dashboard/settings" className="block">
                <div className="flex items-center space-x-3 hover:bg-gray-50 p-2 rounded-lg transition-colors">
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
                          userRole === 'ADMIN'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {userRole}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          )}

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
                  AI HRM
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
              <Link to="/dashboard/settings" className="block">
                <div className="flex items-center space-x-3 hover:bg-gray-50 p-2 rounded-lg transition-colors">
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
                          userRole === 'ADMIN'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {userRole}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          )}

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
              AI HRM
            </span>
          </Link>
        </div>
      </div>
    </>
  );
}