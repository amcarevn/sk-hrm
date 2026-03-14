  // ==========================================
  // FILE: pages/Onboarding/OnboardingList.tsx
  // Rewritten without antd — uses MUI + Tailwind only
  // ==========================================

  import React, { useState, useEffect } from 'react';
  import { useNavigate } from 'react-router-dom';
  import {
    Button,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Chip,
    IconButton,
    Tooltip,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Typography,
    Popover,
  } from '@mui/material';
  import {
    Add,
    Send,
    Link as LinkIcon,
    CheckCircle,
    Schedule,
    Warning,
    ContentCopy,
    Refresh,
    Visibility,
    FilterList,
  } from '@mui/icons-material';

  // ============================================
  // TYPES
  // ============================================

  interface OnboardingRecord {
    id: number;
    onboarding_code: string;
    full_name: string;
    candidate_email: string;
    position_title: string;
    department_name: string;
    start_date: string;
    token_status: 'not_generated' | 'active' | 'expired';
    employee_info_completed: boolean;
    progress_percentage: number;
    employee_form_url?: string;
  }

  interface CreateFormValues {
    candidate_name: string;
    candidate_email: string;
    start_date: string;
    position: string;
    department: string;
  }

  // ============================================
  // MAIN COMPONENT
  // ============================================

  export const OnboardingList: React.FC = () => {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [onboardings, setOnboardings] = useState<OnboardingRecord[]>([]);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [toast, setToast] = useState<{ type: 'success' | 'error' | 'warning'; msg: string } | null>(null);

    // Popover for "active" token actions
    const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null);
    const [popoverRecord, setPopoverRecord] = useState<OnboardingRecord | null>(null);

    // Link modal (when email not configured)
    const [linkModalOpen, setLinkModalOpen] = useState(false);
    const [linkModalUrl, setLinkModalUrl] = useState('');

    const [formValues, setFormValues] = useState<CreateFormValues>({
      candidate_name: '', candidate_email: '', start_date: '', position: '', department: '',
    });
    const [formErrors, setFormErrors] = useState<Partial<CreateFormValues>>({});

    const showToast = (type: 'success' | 'error' | 'warning', msg: string) => {
      setToast({ type, msg });
      setTimeout(() => setToast(null), 4000);
    };

    // ===== FETCH =====
    useEffect(() => { fetchOnboardings(); }, []);

    const fetchOnboardings = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api-hrm/onboardings/', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        const data = await response.json();
        setOnboardings(Array.isArray(data) ? data : data.results ?? []);
      } catch {
        showToast('error', 'Không thể tải danh sách onboarding');
      } finally {
        setLoading(false);
      }
    };

    // ===== CREATE =====
    const validateForm = (): boolean => {
      const errors: Partial<CreateFormValues> = {};
      if (!formValues.candidate_name.trim()) errors.candidate_name = 'Vui lòng nhập họ tên';
      if (!formValues.candidate_email.trim()) errors.candidate_email = 'Vui lòng nhập email';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formValues.candidate_email))
        errors.candidate_email = 'Email không hợp lệ';
      if (!formValues.start_date) errors.start_date = 'Vui lòng chọn ngày bắt đầu';
      if (!formValues.position) errors.position = 'Vui lòng chọn vị trí';
      if (!formValues.department) errors.department = 'Vui lòng chọn phòng ban';
      setFormErrors(errors);
      return Object.keys(errors).length === 0;
    };

    const handleCreateOnboarding = async () => {
      if (!validateForm()) return;
      setSubmitting(true);
      try {
        const response = await fetch('/api-hrm/onboardings/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            candidate_name: formValues.candidate_name,
            candidate_email: formValues.candidate_email,
            start_date: formValues.start_date,
            position: formValues.position,
            department: formValues.department,
          }),
        });

        if (!response.ok) throw new Error('Tạo onboarding thất bại');

        const data = await response.json();
        showToast('success', 'Đã tạo onboarding!');
        setCreateModalOpen(false);
        setFormValues({ candidate_name: '', candidate_email: '', start_date: '', position: '', department: '' });
        fetchOnboardings();
      } catch {
        showToast('error', 'Lỗi khi tạo onboarding');
      } finally {
        setSubmitting(false);
      }
    };

    const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      showToast('success', 'Đã copy link!');
    };

    // ===== TOKEN STATUS CELL =====
    const renderTokenStatus = (record: OnboardingRecord) => {
      if (record.employee_info_completed) {
        return (
          <Chip
            icon={<CheckCircle sx={{ fontSize: 16 }} />}
            label="Đã điền thông tin"
            color="success" size="small" variant="filled"
          />
        );
      }

      switch (record.token_status) {
        case 'active':
          return (
            <>
              <Chip
                icon={<Schedule sx={{ fontSize: 14 }} />}
                label="Chờ nhân viên điền"
                color="primary" size="small" variant="outlined"
                onClick={(e) => { setPopoverAnchor(e.currentTarget); setPopoverRecord(record); }}
                sx={{ cursor: 'pointer' }}
              />
              <Popover
                open={popoverRecord?.id === record.id && Boolean(popoverAnchor)}
                anchorEl={popoverAnchor}
                onClose={() => { setPopoverAnchor(null); setPopoverRecord(null); }}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              >
                <div className="p-2 flex flex-col gap-1 min-w-[160px]">
                  <Button
                    size="small" startIcon={<LinkIcon sx={{ fontSize: 14 }} />}
                    onClick={() => { copyToClipboard(record.employee_form_url ?? ''); setPopoverAnchor(null); setPopoverRecord(null); }}
                  >
                    Copy link
                  </Button>
                </div>
              </Popover>
            </>
          );

        case 'expired':
          return (
            <Tooltip title="Token đã hết hạn. Click để tạo lại">
              <Button
                size="small" variant="text" color="error"
                startIcon={<Warning sx={{ fontSize: 14 }} />}
                sx={{ fontSize: 12 }}
              >
                Tạo lại link
              </Button>
            </Tooltip>
          );

        default:
          return <Chip label="Không xác định" size="small" />;
      }
    };

    // ===== STATS =====
    const stats = {
      total: onboardings.length,
      waiting: onboardings.filter((o) => o.token_status === 'active').length,
      completed: onboardings.filter((o) => o.employee_info_completed).length,
      expired: onboardings.filter((o) => o.token_status === 'expired').length,
    };

    // ===== FILTER =====
    const filteredOnboardings = onboardings.filter((o) => {
      if (statusFilter === 'completed') return o.employee_info_completed;
      if (statusFilter === 'waiting') return o.token_status === 'active' && !o.employee_info_completed;
      if (statusFilter === 'expired') return o.token_status === 'expired';
      if (statusFilter === 'not_generated') return o.token_status === 'not_generated';
      return true; // 'all'
    });

    // ============================================
    // RENDER
    // ============================================

    return (
      <div className="p-6">
        {/* Toast */}
        {toast && (
          <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white text-sm max-w-sm
            ${toast.type === 'success' ? 'bg-green-500' : toast.type === 'error' ? 'bg-red-500' : 'bg-amber-500'}`}>
            {toast.msg}
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Onboard nhân sự</h1>
            <p className="text-gray-500 text-sm mt-1">
              Quản lý quy trình tuyển dụng và onboarding nhân viên mới.
            </p>
          </div>
          <div className="flex gap-2">
            <Tooltip title="Làm mới">
              <IconButton onClick={fetchOnboardings} disabled={loading}>
                <Refresh />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained" startIcon={<Add />}
              onClick={() => setCreateModalOpen(true)}
            >
              Tạo onboarding mới
            </Button>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Tổng số', value: stats.total, color: 'text-gray-800', bg: 'bg-gray-50', filterKey: 'all' },
            { label: 'Chờ điền thông tin', value: stats.waiting, color: 'text-blue-600', bg: 'bg-blue-50', filterKey: 'waiting' },
            { label: 'Đã điền thông tin', value: stats.completed, color: 'text-green-600', bg: 'bg-green-50', filterKey: 'completed' },
            { label: 'Token hết hạn', value: stats.expired, color: 'text-red-500', bg: 'bg-red-50', filterKey: 'expired' },
          ].map(({ label, value, color, bg, filterKey }) => (
            <div
              key={label}
              role="button"
              tabIndex={0}
              aria-label={`Lọc theo: ${label}`}
              aria-pressed={statusFilter === filterKey}
              className={`${bg} rounded-xl p-4 border text-center cursor-pointer transition-all hover:shadow-md
                ${statusFilter === filterKey ? 'border-blue-400 ring-2 ring-blue-200' : 'border-gray-100'}`}
              onClick={() => { setStatusFilter(filterKey); setPage(0); }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setStatusFilter(filterKey); setPage(0); } }}
            >
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel>
              <span className="flex items-center gap-1">
                <FilterList sx={{ fontSize: 16 }} /> Lọc theo trạng thái
              </span>
            </InputLabel>
            <Select
              value={statusFilter}
              label={<span className="flex items-center gap-1"><FilterList sx={{ fontSize: 16 }} /> Lọc theo trạng thái</span>}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
            >
              <MenuItem value="all">Tất cả trạng thái</MenuItem>
              <MenuItem value="waiting">Chờ điền thông tin</MenuItem>
              <MenuItem value="completed">Đã điền thông tin</MenuItem>
              <MenuItem value="expired">Token hết hạn</MenuItem>
              <MenuItem value="not_generated">Chưa tạo link</MenuItem>
            </Select>
          </FormControl>
          {statusFilter !== 'all' && (
            <Button
              size="small" variant="outlined"
              onClick={() => { setStatusFilter('all'); setPage(0); }}
            >
              Xóa bộ lọc
            </Button>
          )}
          <Typography variant="body2" color="text.secondary">
            Hiển thị {filteredOnboardings.length} / {onboardings.length} onboarding
          </Typography>
        </div>

        {/* Table */}
        <Paper elevation={1} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f9fafb' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Mã Onboarding</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Ứng viên</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Vị trí</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Phòng ban</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Ngày bắt đầu</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Trạng thái form</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Tiến độ</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                      <CircularProgress size={32} />
                    </TableCell>
                  </TableRow>
                ) : onboardings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 6, color: '#9ca3af' }}>
                      Chưa có dữ liệu onboarding
                    </TableCell>
                  </TableRow>
                ) : filteredOnboardings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 6, color: '#9ca3af' }}>
                      Không có onboarding nào khớp với bộ lọc
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOnboardings
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((record) => (
                      <TableRow key={record.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace" color="text.secondary">
                            {record.onboarding_code}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium text-gray-800">{record.full_name}</p>
                            <p className="text-xs text-gray-400">{record.candidate_email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{record.position_title || '—'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{record.department_name || '—'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {record.start_date
                              ? new Date(record.start_date).toLocaleDateString('vi-VN') : '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>{renderTokenStatus(record)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all
                                  ${record.progress_percentage === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                                style={{ width: `${record.progress_percentage}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 whitespace-nowrap">
                              {record.progress_percentage}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Xem chi tiết">
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/onboarding/${record.id}`)}
                            >
                              <Visibility sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={filteredOnboardings.length}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
            rowsPerPageOptions={[10, 25, 50]}
            labelRowsPerPage="Hàng/trang:"
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} / ${count}`}
          />
        </Paper>

        {/* ===== CREATE MODAL ===== */}
        <Dialog open={createModalOpen} onClose={() => setCreateModalOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 700 }}>Tạo onboarding mới</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
            <TextField
              fullWidth label="Họ và tên ứng viên" size="small" required
              value={formValues.candidate_name}
              onChange={(e) => setFormValues((v) => ({ ...v, candidate_name: e.target.value }))}
              error={!!formErrors.candidate_name} helperText={formErrors.candidate_name}
              placeholder="Nguyễn Văn A"
            />
            <TextField
              fullWidth label="Email" size="small" required type="email"
              value={formValues.candidate_email}
              onChange={(e) => setFormValues((v) => ({ ...v, candidate_email: e.target.value }))}
              error={!!formErrors.candidate_email} helperText={formErrors.candidate_email}
              placeholder="nva@example.com"
            />
            <TextField
              fullWidth label="Ngày bắt đầu" size="small" required type="date"
              value={formValues.start_date}
              onChange={(e) => setFormValues((v) => ({ ...v, start_date: e.target.value }))}
              error={!!formErrors.start_date} helperText={formErrors.start_date}
              InputLabelProps={{ shrink: true }}
            />
            <FormControl fullWidth size="small" required error={!!formErrors.position}>
              <InputLabel>Vị trí</InputLabel>
              <Select
                value={formValues.position} label="Vị trí"
                onChange={(e) => setFormValues((v) => ({ ...v, position: e.target.value }))}
              >
                <MenuItem value=""><em>-- Chọn vị trí --</em></MenuItem>
                <MenuItem value="1">Software Engineer</MenuItem>
                <MenuItem value="2">Product Manager</MenuItem>
              </Select>
              {formErrors.position && (
                <Typography variant="caption" color="error" sx={{ ml: 1.5, mt: 0.5 }}>
                  {formErrors.position}
                </Typography>
              )}
            </FormControl>
            <FormControl fullWidth size="small" required error={!!formErrors.department}>
              <InputLabel>Phòng ban</InputLabel>
              <Select
                value={formValues.department} label="Phòng ban"
                onChange={(e) => setFormValues((v) => ({ ...v, department: e.target.value }))}
              >
                <MenuItem value=""><em>-- Chọn phòng ban --</em></MenuItem>
                <MenuItem value="1">IT</MenuItem>
                <MenuItem value="2">HR</MenuItem>
              </Select>
              {formErrors.department && (
                <Typography variant="caption" color="error" sx={{ ml: 1.5, mt: 0.5 }}>
                  {formErrors.department}
                </Typography>
              )}
            </FormControl>
            <Typography variant="caption" color="text.secondary">
              💡 Sau khi tạo, hệ thống sẽ tự động gửi link cho nhân viên để điền thông tin chi tiết.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button
              variant="outlined"
              onClick={() => { setCreateModalOpen(false); setFormErrors({}); }}
              disabled={submitting}
            >
              Hủy
            </Button>
            <Button
              variant="contained"
              onClick={handleCreateOnboarding}
              disabled={submitting}
              startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <Send />}
            >
              {submitting ? 'Đang tạo...' : 'Tạo và gửi link'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ===== LINK MODAL (khi email chưa cấu hình) ===== */}
        <Dialog open={linkModalOpen} onClose={() => setLinkModalOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 700 }}>Link cho nhân viên</DialogTitle>
          <DialogContent sx={{ pt: '16px !important' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Email chưa được cấu hình. Vui lòng gửi link này cho nhân viên:
            </Typography>
            <div className="flex gap-2 items-center">
              <TextField
                fullWidth size="small" value={linkModalUrl}
                InputProps={{ readOnly: true }}
              />
              <Tooltip title="Copy link">
                <IconButton onClick={() => copyToClipboard(linkModalUrl)}>
                  <ContentCopy />
                </IconButton>
              </Tooltip>
            </div>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button variant="outlined" onClick={() => setLinkModalOpen(false)}>Đóng</Button>
            <Button
              variant="contained"
              onClick={() => { copyToClipboard(linkModalUrl); setLinkModalOpen(false); }}
              startIcon={<ContentCopy />}
            >
              Copy & Đóng
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    );
  };