import React, { useState, useEffect } from 'react';
import { approvalService } from '../services/approval.service';

const Approvals: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'pending' | 'approved' | 'rejected'
  >('pending');
  const [attendanceExplanations, setAttendanceExplanations] = useState<any[]>(
    []
  );
  const [approvedExplanations, setApprovedExplanations] = useState<any[]>([]);
  const [rejectedExplanations, setRejectedExplanations] = useState<any[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [overtimeRequests, setOvertimeRequests] = useState<any[]>([]);
  const [currentEmployee, setCurrentEmployee] = useState<any>(null);
  const [selectedExplanation, setSelectedExplanation] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [stats, setStats] = useState({
    pending_leave: 0,
    pending_overtime: 0,
    pending_explanation: 0,
    total_approved: 0,
    total_rejected: 0,
  });

  useEffect(() => {
    fetchCurrentEmployee();
    fetchRequests();
  }, [activeTab]);

  const fetchRequests = async () => {
    if (activeTab === 'pending') {
      await fetchPendingRequests();
    } else if (activeTab === 'approved') {
      await fetchApprovedRequests();
    } else if (activeTab === 'rejected') {
      await fetchRejectedRequests();
    }
  };

  const fetchCurrentEmployee = async () => {
    try {
      const employee = await approvalService.getCurrentEmployee();
      setCurrentEmployee(employee);
    } catch (error) {
      console.error('Error fetching current employee:', error);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      const result = await approvalService.getAllPendingRequests();
      setAttendanceExplanations(result.attendance_explanations);
      setLeaveRequests(result.leave_requests);
      setOvertimeRequests(result.overtime_requests);

      // Cập nhật stats
      setStats((prev) => ({
        ...prev,
        pending_leave: result.leave_requests.length,
        pending_overtime: result.overtime_requests.length,
        pending_explanation: result.attendance_explanations.length,
      }));
    } catch (error) {
      console.error('Error fetching pending requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApprovedRequests = async () => {
    try {
      setLoading(true);
      const result = await approvalService.getAllApprovedRequests();
      setApprovedExplanations(result.attendance_explanations);
      setLeaveRequests(result.leave_requests);
      setOvertimeRequests(result.overtime_requests);

      // Cập nhật stats với số đếm thực tế
      setStats((prev) => ({
        ...prev,
        total_approved: result.attendance_explanations.length,
      }));
    } catch (error) {
      console.error('Error fetching approved requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRejectedRequests = async () => {
    try {
      setLoading(true);
      const result = await approvalService.getAllRejectedRequests();
      setRejectedExplanations(result.attendance_explanations);
      setLeaveRequests(result.leave_requests);
      setOvertimeRequests(result.overtime_requests);

      // Cập nhật stats với số đếm thực tế
      setStats((prev) => ({
        ...prev,
        total_rejected: result.attendance_explanations.length,
      }));
    } catch (error) {
      console.error('Error fetching rejected requests:', error);
    } finally {
      setLoading(false);
    }
  };

  // Kiểm tra xem người dùng hiện tại có quyền duyệt giải trình không
  const canApproveExplanation = (explanation: any): boolean => {
    if (!currentEmployee) {
      console.log('canApproveExplanation: currentEmployee is null');
      return false;
    }

    // Người tạo đơn không thể duyệt đơn của chính mình
    if (explanation.employee_id === currentEmployee.id) {
      console.log('canApproveExplanation: Cannot approve own request', {
        explanationId: explanation.id,
        employee_id: explanation.employee_id,
        currentEmployeeId: currentEmployee.id,
      });
      return false;
    }

    // Kiểm tra nếu đã được duyệt hoặc từ chối
    if (explanation.status !== 'PENDING') {
      console.log('canApproveExplanation: Status is not PENDING', {
        explanationId: explanation.id,
        status: explanation.status,
      });
      return false;
    }

    // Kiểm tra quyền dựa trên vai trò và cấp bậc
    const isAdmin =
      currentEmployee.user?.is_staff || currentEmployee.user?.is_superuser;
    const isHR =
      currentEmployee.position?.title?.includes('HR') ||
      currentEmployee.position?.title?.includes('Nhân sự') ||
      currentEmployee.department?.name?.includes('HR') ||
      currentEmployee.department?.name?.includes('Nhân sự');

    // Kiểm tra quyền can_approve_attendance từ permissions
    const hasApprovalPermission =
      currentEmployee.permissions?.can_approve_attendance || false;

    // Admin, HR, và người có quyền can_approve_attendance có quyền duyệt tất cả
    if (isAdmin || isHR || hasApprovalPermission) {
      console.log('canApproveExplanation: User has approval permission', {
        explanationId: explanation.id,
        isAdmin,
        isHR,
        hasApprovalPermission,
        currentEmployeeId: currentEmployee.id,
        permissions: currentEmployee.permissions,
      });
      return true;
    }

    // Kiểm tra nếu là quản lý trực tiếp
    if (explanation.employee_manager_id === currentEmployee.id) {
      // Nếu quản lý trực tiếp đã duyệt rồi thì không thể duyệt nữa
      if (explanation.direct_manager_approved) {
        console.log('canApproveExplanation: Direct manager already approved', {
          explanationId: explanation.id,
          direct_manager_approved: explanation.direct_manager_approved,
          currentEmployeeId: currentEmployee.id,
          employee_manager_id: explanation.employee_manager_id,
          explanationData: explanation,
        });
        return false;
      }
      console.log(
        'canApproveExplanation: User is direct manager and can approve',
        {
          explanationId: explanation.id,
          currentEmployeeId: currentEmployee.id,
          employee_manager_id: explanation.employee_manager_id,
        }
      );
      return true;
    }

    // Kiểm tra nếu là trưởng phòng của nhân viên
    if (explanation.employee_department_manager_id === currentEmployee.id) {
      console.log('canApproveExplanation: User is department manager', {
        explanationId: explanation.id,
        currentEmployeeId: currentEmployee.id,
        employee_department_manager_id:
          explanation.employee_department_manager_id,
      });
      return true;
    }

    // Kiểm tra nếu là quản lý cấp cao hơn
    if (currentEmployee.is_manager && currentEmployee.management_level >= 2) {
      console.log('canApproveExplanation: User is higher level manager', {
        explanationId: explanation.id,
        currentEmployeeId: currentEmployee.id,
        is_manager: currentEmployee.is_manager,
        management_level: currentEmployee.management_level,
      });
      return true;
    }

    console.log('canApproveExplanation: No permission', {
      explanationId: explanation.id,
      currentEmployeeId: currentEmployee.id,
      employee_manager_id: explanation.employee_manager_id,
      employee_department_manager_id:
        explanation.employee_department_manager_id,
      is_manager: currentEmployee.is_manager,
      management_level: currentEmployee.management_level,
      hasApprovalPermission,
      permissions: currentEmployee.permissions,
    });
    return false;
  };

  const handleApprove = async (explanationId: number) => {
    try {
      await approvalService.approveAttendanceExplanation(
        explanationId,
        'Đã duyệt'
      );
      fetchRequests(); // Refresh data
    } catch (error) {
      console.error('Error approving:', error);
    }
  };

  const handleReject = async (explanationId: number) => {
    try {
      await approvalService.rejectAttendanceExplanation(
        explanationId,
        'Đã từ chối'
      );
      fetchRequests(); // Refresh data
    } catch (error) {
      console.error('Error rejecting:', error);
    }
  };

  const handleViewDetails = (explanation: any) => {
    setSelectedExplanation(explanation);
    setShowDetailModal(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            Chờ duyệt
          </span>
        );
      case 'APPROVED':
        return (
          <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            Đã duyệt
          </span>
        );
      case 'REJECTED':
        return (
          <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            Đã từ chối
          </span>
        );
      default:
        return (
          <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {status}
          </span>
        );
    }
  };

  const getRequestTypeBadge = (type: string) => {
    switch (type) {
      case 'LEAVE':
        return (
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            Nghỉ phép
          </span>
        );
      case 'OVERTIME':
        return (
          <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            Làm thêm giờ
          </span>
        );
      case 'ATTENDANCE_EXPLANATION':
        return (
          <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            Giải trình
          </span>
        );
      default:
        return (
          <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {type}
          </span>
        );
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN');
  };

  const getApprovalWorkflow = (explanation: any) => {
    const workflow = [];
    let currentStep = 1;

    // Bước 1: Quản lý trực tiếp
    const hasManager =
      explanation.employee_manager_name &&
      explanation.employee_manager_name !== 'None';
    const managerApproved = explanation.direct_manager_approved || false;
    const managerStatus = managerApproved
      ? 'Đã duyệt'
      : explanation.status === 'REJECTED'
        ? 'Đã từ chối'
        : 'Chưa duyệt';

    workflow.push({
      step: currentStep++,
      role: 'Quản lý trực tiếp',
      approver: hasManager
        ? explanation.employee_manager_name
        : 'Chưa xác định',
      status: managerStatus,
      date: explanation.direct_manager_approved_at || null,
      note: explanation.approval_note || '',
      approved_by: explanation.direct_manager_approved_by_name || null,
    });

    // Bước 2: Trưởng phòng (nếu có)
    const hasDeptManager =
      explanation.employee_department_manager_name &&
      explanation.employee_department_manager_name !== 'None';
    if (hasDeptManager) {
      const deptManagerStatus =
        explanation.status === 'PENDING'
          ? 'Chưa duyệt'
          : explanation.status === 'APPROVED'
            ? 'Đã duyệt'
            : explanation.status === 'REJECTED'
              ? 'Đã từ chối'
              : 'Chưa duyệt';

      workflow.push({
        step: currentStep++,
        role: 'Trưởng phòng',
        approver: explanation.employee_department_manager_name,
        status: deptManagerStatus,
        date: explanation.approved_at || null,
        note: explanation.approval_note || '',
      });
    }

    // Bước 3: Nhân sự HR
    const hrApproved = explanation.hr_approved || false;
    const hrStatus = hrApproved
      ? 'Đã duyệt'
      : explanation.status === 'REJECTED'
        ? 'Đã từ chối'
        : 'Chưa duyệt';

    workflow.push({
      step: currentStep++,
      role: 'Nhân sự HR',
      approver: explanation.hr_approved_by_name || 'Phòng Nhân sự',
      status: hrStatus,
      date: explanation.hr_approved_at || null,
      note: explanation.approval_note || '',
      approved_by: explanation.hr_approved_by_name || null,
    });

    // Bước 4: Tổng hợp trạng thái cuối cùng
    if (
      explanation.status === 'APPROVED' ||
      explanation.status === 'REJECTED'
    ) {
      const finalStatus =
        explanation.status === 'APPROVED' ? 'Đã duyệt' : 'Đã từ chối';
      const finalApprover =
        explanation.approved_by_name ||
        explanation.direct_manager_approved_by_name ||
        explanation.hr_approved_by_name ||
        'Hệ thống';

      workflow.push({
        step: currentStep++,
        role: 'Kết quả cuối cùng',
        approver: finalApprover,
        status: finalStatus,
        date: explanation.approved_at || explanation.updated_at,
        note: explanation.approval_note || '',
      });
    }

    return workflow;
  };

  const getCurrentExplanations = () => {
    if (activeTab === 'pending') return attendanceExplanations;
    if (activeTab === 'approved') return approvedExplanations;
    return rejectedExplanations;
  };

  const getCurrentTitle = () => {
    if (activeTab === 'pending') return 'Yêu cầu chờ duyệt';
    if (activeTab === 'approved') return 'Yêu cầu đã duyệt';
    return 'Yêu cầu đã từ chối';
  };

  const getCurrentCount = () => {
    const explanations = getCurrentExplanations();
    return explanations.length + leaveRequests.length + overtimeRequests.length;
  };

  const totalPending =
    stats.pending_leave + stats.pending_overtime + stats.pending_explanation;
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Phê duyệt</h1>
        <p className="text-gray-600 mt-2">
          Duyệt các đơn xin nghỉ phép, làm thêm giờ, giải trình chấm công và các
          yêu cầu khác.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {getCurrentTitle()}
            </h2>
            <p className="text-gray-500 text-sm">
              Có {getCurrentCount()} yêu cầu
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={fetchRequests}
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors"
            >
              Làm mới
            </button>
            <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors">
              Lịch sử duyệt
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'pending'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Chờ duyệt
              <span className="ml-2 bg-gray-100 text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full">
                {stats.pending_explanation}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('approved')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'approved'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Đã duyệt
              <span className="ml-2 bg-green-100 text-green-600 text-xs font-medium px-2 py-0.5 rounded-full">
                {stats.total_approved}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('rejected')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'rejected'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Đã từ chối
              <span className="ml-2 bg-red-100 text-red-600 text-xs font-medium px-2 py-0.5 rounded-full">
                {stats.total_rejected}
              </span>
            </button>
          </nav>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-blue-900">Nghỉ phép</h3>
                <p className="text-3xl font-bold text-blue-700 mt-2">
                  {stats.pending_leave}
                </p>
              </div>
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                Chờ duyệt
              </span>
            </div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-purple-900">Làm thêm giờ</h3>
                <p className="text-3xl font-bold text-purple-700 mt-2">
                  {stats.pending_overtime}
                </p>
              </div>
              <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                Chờ duyệt
              </span>
            </div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-yellow-900">Giải trình</h3>
                <p className="text-3xl font-bold text-yellow-700 mt-2">
                  {stats.pending_explanation}
                </p>
              </div>
              <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                Chờ duyệt
              </span>
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-green-900">Đã duyệt</h3>
                <p className="text-3xl font-bold text-green-700 mt-2">
                  {stats.total_approved}
                </p>
              </div>
              <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                Tháng này
              </span>
            </div>
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Loại đơn
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Người gửi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày gửi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thời gian
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : getCurrentExplanations().length === 0 &&
                  leaveRequests.length === 0 &&
                  overtimeRequests.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      <div className="flex flex-col items-center">
                        <svg
                          className="w-12 h-12 text-gray-400 mb-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <p className="text-lg font-medium text-gray-900">
                          Không có yêu cầu nào chờ duyệt
                        </p>
                        <p className="text-gray-500 mt-1">
                          Tất cả yêu cầu đã được xử lý
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <>
                    {/* Hiển thị attendance explanations theo tab hiện tại */}
                    {getCurrentExplanations().map((explanation) => (
                      <tr key={`explanation-${explanation.id}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center">
                              <svg
                                className="h-5 w-5 text-yellow-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                Giải trình chấm công
                              </div>
                              <div className="text-sm text-gray-500">
                                {explanation.reason}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {explanation.employee_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {explanation.employee_code}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(explanation.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(explanation.attendance_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(explanation.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            {activeTab === 'pending' ? (
                              canApproveExplanation(explanation) ? (
                                <>
                                  <button
                                    onClick={() =>
                                      handleApprove(explanation.id)
                                    }
                                    className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-md text-sm"
                                  >
                                    Duyệt
                                  </button>
                                  <button
                                    onClick={() => handleReject(explanation.id)}
                                    className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md text-sm"
                                  >
                                    Từ chối
                                  </button>
                                </>
                              ) : (
                                <span className="text-gray-500 text-sm italic">
                                  {explanation.employee_id ===
                                  currentEmployee?.id
                                    ? 'Không thể duyệt đơn của chính mình'
                                    : 'Không có quyền duyệt'}
                                </span>
                              )
                            ) : (
                              <span className="text-gray-500 text-sm italic">
                                {activeTab === 'approved'
                                  ? 'Đã được duyệt'
                                  : 'Đã bị từ chối'}
                              </span>
                            )}
                            <button
                              onClick={() => handleViewDetails(explanation)}
                              className="text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 px-3 py-1 rounded-md text-sm"
                            >
                              Chi tiết
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {/* Hiển thị leave requests (tạm thời chưa có API) */}
                    {leaveRequests.map((request) => (
                      <tr key={`leave-${request.id}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <svg
                                className="h-5 w-5 text-blue-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                Nghỉ phép
                              </div>
                              <div className="text-sm text-gray-500">
                                {request.reason}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {request.employee_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {request.employee_code}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(request.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(request.start_date)} -{' '}
                          {formatDate(request.end_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(request.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-md text-sm">
                              Duyệt
                            </button>
                            <button className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md text-sm">
                              Từ chối
                            </button>
                            <button
                              onClick={() => handleViewDetails(request)}
                              className="text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 px-3 py-1 rounded-md text-sm"
                            >
                              Chi tiết
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {/* Hiển thị overtime requests (tạm thời chưa có API) */}
                    {overtimeRequests.map((request) => (
                      <tr key={`overtime-${request.id}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                              <svg
                                className="h-5 w-5 text-purple-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                Làm thêm giờ
                              </div>
                              <div className="text-sm text-gray-500">
                                {request.reason}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {request.employee_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {request.employee_code}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(request.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(request.overtime_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(request.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-md text-sm">
                              Duyệt
                            </button>
                            <button className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md text-sm">
                              Từ chối
                            </button>
                            <button
                              onClick={() => handleViewDetails(request)}
                              className="text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 px-3 py-1 rounded-md text-sm"
                            >
                              Chi tiết
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quy trình duyệt của bạn
          </h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-gray-700">
                  Bạn có quyền duyệt các đơn:{' '}
                  <span className="font-medium">
                    Nghỉ phép, Làm thêm giờ, Giải trình chấm công
                  </span>
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  Cấp duyệt: Quản lý trực tiếp • Thời gian xử lý: 24 giờ
                </p>
              </div>
              <button className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors">
                Cấu hình quy trình
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal chi tiết */}
      {showDetailModal && selectedExplanation && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  Chi tiết giải trình
                </h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">
                    Thông tin nhân viên
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center mb-3">
                      <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <svg
                          className="h-5 w-5 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {selectedExplanation.employee_name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {selectedExplanation.employee_code}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Phòng ban:
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {selectedExplanation.employee_department || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Quản lý trực tiếp:
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {selectedExplanation.employee_manager_name || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Trưởng phòng:
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {selectedExplanation.employee_department_manager_name ||
                            'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">
                    Thông tin giải trình
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Ngày chấm công:
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatDate(selectedExplanation.attendance_date)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Trạng thái gốc:
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {selectedExplanation.original_status}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Trạng thái mong muốn:
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {selectedExplanation.expected_status}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Trạng thái hiện tại:
                        </span>
                        <span>
                          {getStatusBadge(selectedExplanation.status)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Quản lý trực tiếp đã duyệt:
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {selectedExplanation.direct_manager_approved
                            ? '✓ Đã duyệt'
                            : '✗ Chưa duyệt'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Nhân sự HR đã duyệt:
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {selectedExplanation.hr_approved
                            ? '✓ Đã duyệt'
                            : '✗ Chưa duyệt'}
                        </span>
                      </div>
                      {selectedExplanation.direct_manager_approved_at && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">
                            QL trực tiếp duyệt lúc:
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {formatDateTime(
                              selectedExplanation.direct_manager_approved_at
                            )}
                          </span>
                        </div>
                      )}
                      {selectedExplanation.hr_approved_at && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">
                            Nhân sự duyệt lúc:
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {formatDateTime(selectedExplanation.hr_approved_at)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Ngày tạo:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatDateTime(selectedExplanation.created_at)}
                        </span>
                      </div>
                      {selectedExplanation.approved_at && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">
                            Ngày duyệt cuối cùng:
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {formatDateTime(selectedExplanation.approved_at)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-500 mb-2">
                  Lý do giải trình
                </h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700">{selectedExplanation.reason}</p>
                </div>
              </div>

              {selectedExplanation.approval_note && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">
                    Ghi chú duyệt
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700">
                      {selectedExplanation.approval_note}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">
                  Quy trình duyệt
                </h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="space-y-4">
                    {getApprovalWorkflow(selectedExplanation).map((step) => (
                      <div key={step.step} className="flex items-start">
                        <div
                          className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center mr-3 ${
                            step.status === 'Đã duyệt'
                              ? 'bg-green-100'
                              : step.status === 'Đã từ chối'
                                ? 'bg-red-100'
                                : 'bg-gray-100'
                          }`}
                        >
                          <span
                            className={`text-sm font-medium ${
                              step.status === 'Đã duyệt'
                                ? 'text-green-600'
                                : step.status === 'Đã từ chối'
                                  ? 'text-red-600'
                                  : 'text-gray-600'
                            }`}
                          >
                            {step.step}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {step.role}
                              </p>
                              <p className="text-sm text-gray-500">
                                Người duyệt: {step.approver}
                              </p>
                            </div>
                            <span
                              className={`text-xs font-medium px-2 py-1 rounded-full ${
                                step.status === 'Đã duyệt'
                                  ? 'bg-green-100 text-green-800'
                                  : step.status === 'Đã từ chối'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {step.status}
                            </span>
                          </div>
                          {step.date && (
                            <p className="text-xs text-gray-500 mt-1">
                              Ngày duyệt: {formatDateTime(step.date)}
                            </p>
                          )}
                          {step.note && (
                            <p className="text-xs text-gray-600 mt-1 bg-white p-2 rounded border border-gray-200">
                              Ghi chú: {step.note}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Đóng
                </button>
                {activeTab === 'pending' &&
                  canApproveExplanation(selectedExplanation) && (
                    <>
                      <button
                        onClick={() => {
                          handleApprove(selectedExplanation.id);
                          setShowDetailModal(false);
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                      >
                        Duyệt
                      </button>
                      <button
                        onClick={() => {
                          handleReject(selectedExplanation.id);
                          setShowDetailModal(false);
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                      >
                        Từ chối
                      </button>
                    </>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Approvals;
