import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Always check staff access restrictions
  if (user) {
    const userRole = user.role ? user.role.toUpperCase() : '';
    const isSuperAdmin = user.is_super_admin || false;
    
    // Super admin can access everything
    if (!isSuperAdmin && userRole === 'STAFF') {
      // Staff can only access specific routes
      // These routes correspond to: Home, Me, Attendance, Organization Chart, Approvals
      const currentPath = window.location.pathname;
      
      // Define allowed paths for staff
      const isAllowedForStaff = 
        // Home page
        currentPath === '/home' ||
        // Me/profile page
        currentPath === '/dashboard/me' ||
        // Attendance pages (but not upload)
        (currentPath === '/dashboard/attendance' || currentPath === '/dashboard/attendance/view') ||
        // Organization chart
        currentPath === '/dashboard/organization-chart' ||
        // Approvals
        currentPath === '/dashboard/approvals';
      
      if (!isAllowedForStaff) {
        return <Navigate to="/home" replace />;
      }
    }
  }

  // Check role-based access if allowedRoles is provided
  if (allowedRoles && user) {
    const userRole = user.role ? user.role.toUpperCase() : '';
    const isSuperAdmin = user.is_super_admin || false;
    
    // Super admin can access everything
    if (!isSuperAdmin && userRole !== 'STAFF') {
      // For non-staff users, check allowedRoles normally
      const hasAccess = allowedRoles.some(role => 
        role.toUpperCase() === userRole
      );
      
      if (!hasAccess) {
        // Redirect to home page if user doesn't have required role
        return <Navigate to="/home" replace />;
      }
    }
  }

  return <>{children}</>;
}
