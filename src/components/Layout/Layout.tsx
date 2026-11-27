import { ReactNode, useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import NotificationDrawer from './NotificationDrawer';
import MandatoryAnnouncementPopup from './MandatoryAnnouncementPopup';
import { NotificationDrawerProvider, useNotificationDrawer } from '@/contexts/NotificationDrawerContext';

function LayoutInner({ children, fullBleed = false }: { children: ReactNode; fullBleed?: boolean }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { drawerOpen, drawerInitialItem, unreadIds, markRead, closeDrawer } = useNotificationDrawer();

  return (
    <div className="h-full flex flex-col bg-primary-100">
      <Sidebar
        onCollapseChange={setIsSidebarCollapsed}
        mobileOpen={mobileNavOpen}
        onMobileOpenChange={setMobileNavOpen}
      />

      <div className={`flex flex-col flex-1 min-h-0 transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'}`}>
        <Header onOpenMobileNav={() => setMobileNavOpen(true)} />

        {/* fullBleed: trang tự lo khoảng cách + nền phủ kín vùng nội dung (vd trang YEP) — bỏ padding mặc định */}
        <main className={`flex flex-col flex-1 min-h-0 overflow-y-auto ${fullBleed ? '' : 'py-4 sm:py-6'}`}>
          <div className={`flex flex-col flex-1 min-h-0 w-full min-w-0 ${fullBleed ? '' : 'px-4 sm:px-6'}`}>{children}</div>
        </main>
      </div>

      <NotificationDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        initialItem={drawerInitialItem}
        unreadIds={unreadIds}
        onMarkRead={markRead}
      />

      {/* Thông báo mới chưa đọc → popup bắt buộc đọc ngay khi vào HRM (HCNS SK 2026-11-27) */}
      <MandatoryAnnouncementPopup />
    </div>
  );
}

interface LayoutProps {
  children: ReactNode;
  /** Bỏ padding quanh nội dung để trang phủ nền kín vùng nội dung (trang tự thêm khoảng cách bên trong). */
  fullBleed?: boolean;
}

export default function Layout({ children, fullBleed = false }: LayoutProps) {
  return (
    <NotificationDrawerProvider>
      <LayoutInner fullBleed={fullBleed}>{children}</LayoutInner>
    </NotificationDrawerProvider>
  );
}
