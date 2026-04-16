import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BellIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
  KeyIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import ChangePasswordModal from '@/components/Layout/ChangePasswordModal';

export default function Header() {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [changePasswordModalKey, setChangePasswordModalKey] = useState(0);  // ✅ Đã có rồi
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    // ✅ THÊM: Reset modal key khi logout
    setChangePasswordModalKey(0);
  };

  // ✅ SỬA: Tăng key để force re-mount modal
  const handleOpenChangePassword = () => {
    setUserMenuOpen(false);
    setChangePasswordModalKey(prev => prev + 1);  // ← THÊM dòng này
    setShowChangePasswordModal(true);
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6">
        <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center">
                <img src="/bot-logo.png" alt="Logo" className="h-full w-full" />
              </div>
              <span className="ml-2 text-lg font-bold text-gray-900">
                AI HRM
              </span>
            </Link>
          </div>
          <form className="relative flex flex-1" action="#" method="GET">
            <label htmlFor="search-field" className="sr-only">
              Tìm kiếm
            </label>
            <MagnifyingGlassIcon
              className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-400"
              aria-hidden="true"
            />
            <input
              id="search-field"
              className="block h-full w-full border-0 py-0 pl-8 pr-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm"
              placeholder="Search..."
              type="search"
              name="search"
            />
          </form>
          <div className="flex items-center gap-x-4 lg:gap-x-6">
            <button
              type="button"
              className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500"
            >
              <span className="sr-only">Xem thông báo</span>
              <BellIcon className="h-6 w-6" aria-hidden="true" />
            </button>

            {/* Separator */}
            <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" />

            {/* Profile dropdown */}
            <div className="relative">
              <button
                type="button"
                className="-m-1.5 flex items-center p-1.5"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                <span className="sr-only">Mở menu người dùng</span>
                {user?.hrm_user?.avatar_url ? (
                  <img
                    src={user.hrm_user.avatar_url}
                    alt="Avatar"
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <UserCircleIcon
                    className="h-8 w-8 text-gray-400"
                    aria-hidden="true"
                  />
                )}
              </button>

              {userMenuOpen && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  
                  {/* Dropdown */}
                  <div className="absolute right-0 z-20 mt-2.5 w-56 origin-top-right rounded-lg bg-white py-1 shadow-lg ring-1 ring-gray-900/5">
                    
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="font-medium text-sm text-gray-900">
                        {user?.firstName} {user?.lastName}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{user?.email}</div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                      {/* Change Password */}
                      <button
                        onClick={handleOpenChangePassword}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <KeyIcon className="h-4 w-4 mr-3 text-gray-400" />
                        Đổi mật khẩu
                      </button>

                      {/* Logout */}
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3 text-red-500" />
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <ChangePasswordModal
          key={changePasswordModalKey}
          onClose={() => setShowChangePasswordModal(false)}
          onSuccess={() => {
            setShowChangePasswordModal(false);
            // Optionally logout after password change
            // logout();
          }}
        />
      )}
    </>
  );
}