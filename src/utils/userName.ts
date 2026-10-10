import type { User } from './api/types';

/**
 * Họ tên hiển thị của tài khoản đang đăng nhập.
 *
 * User Django lưu tên kiểu Việt Nam tách đôi: first_name = tên (từ cuối),
 * last_name = họ + đệm. Ghép `${firstName} ${lastName}` ra tên bị đảo
 * ("Thùy Nguyễn Thị Phương"). Ưu tiên họ tên đầy đủ của hồ sơ nhân viên (như
 * Sidebar đang làm), thiếu thì ghép đúng thứ tự họ trước tên.
 */
export const userDisplayName = (user?: User | null): string =>
  user?.employee_profile?.full_name ||
  user?.hrm_user?.full_name ||
  [user?.lastName, user?.firstName].filter(Boolean).join(' ').trim() ||
  user?.username ||
  '';
