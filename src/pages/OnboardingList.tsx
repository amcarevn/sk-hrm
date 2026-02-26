// ==========================================
// FILE: pages/Onboarding/OnboardingList.tsx
// Trang quản lý onboarding cho HR
// ==========================================

import React, { useState, useEffect } from 'react';
import { 
  Button, 
  Table, 
  Space, 
  Tag, 
  Card, 
  Modal, 
  Form, 
  Input, 
  DatePicker,
  Select,
  message,
  Tooltip,
  Popover,
  Typography
} from 'antd';
import { 
  PlusOutlined, 
  SendOutlined,
  LinkOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Text } = Typography;

export const OnboardingList: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [onboardings, setOnboardings] = useState([]);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [form] = Form.useForm();

  // ===== FETCH ONBOARDINGS =====
  useEffect(() => {
    fetchOnboardings();
  }, []);

  const fetchOnboardings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api-hrm/onboardings/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setOnboardings(data);
    } catch (error) {
      message.error('Không thể tải danh sách onboarding');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // ===== CREATE ONBOARDING (CHỈ THÔNG TIN CƠ BẢN) =====
  const handleCreateOnboarding = async (values: any) => {
    try {
      const response = await fetch('/api-hrm/onboardings/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          candidate_name: values.candidate_name,
          candidate_email: values.candidate_email,
          start_date: values.start_date.format('YYYY-MM-DD'),
          position: values.position,
          department: values.department,
          // Chỉ tạo với thông tin cơ bản - nhân viên sẽ điền chi tiết sau
        })
      });

      if (!response.ok) throw new Error('Không thể tạo onboarding');

      const data = await response.json();
      message.success('Đã tạo onboarding!');
      setCreateModalVisible(false);
      form.resetFields();
      
      // Tự động gửi email cho nhân viên
      await sendEmployeeEmail(data.id);
      
      fetchOnboardings();
    } catch (error) {
      message.error('Lỗi khi tạo onboarding');
      console.error(error);
    }
  };

  // ===== GỬI EMAIL CHO NHÂN VIÊN =====
  const sendEmployeeEmail = async (onboardingId: number) => {
    try {
      const response = await fetch(
        `/api-hrm/onboardings/${onboardingId}/send-employee-email/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      const data = await response.json();
      
      if (data.success) {
        // Nếu email được gửi thành công
        if (data.message.includes('email')) {
          message.success(`Đã gửi email đến nhân viên!`);
        } else {
          // Nếu email chưa cấu hình, hiện link để copy
          Modal.info({
            title: 'Link cho nhân viên',
            content: (
              <div>
                <Text>Email chưa được cấu hình. Vui lòng gửi link này cho nhân viên:</Text>
                <Input.TextArea 
                  value={data.employee_form_url}
                  autoSize
                  style={{ marginTop: 8 }}
                />
                <Button 
                  type="link"
                  onClick={() => {
                    navigator.clipboard.writeText(data.employee_form_url);
                    message.success('Đã copy link!');
                  }}
                >
                  Copy link
                </Button>
              </div>
            )
          });
        }
      }
    } catch (error) {
      console.error('Error sending email:', error);
      message.warning('Không thể gửi email. Vui lòng gửi link thủ công.');
    }
  };

  // ===== GỬI LẠI EMAIL =====
  const handleResendEmail = async (record: any) => {
    await sendEmployeeEmail(record.id);
  };

  // ===== RENDER TOKEN STATUS =====
  const renderTokenStatus = (record: any) => {
    const { token_status, employee_info_completed } = record;

    if (employee_info_completed) {
      return (
        <Tag icon={<CheckCircleOutlined />} color="success">
          Đã điền thông tin
        </Tag>
      );
    }

    switch (token_status) {
      case 'not_generated':
        return (
          <Tooltip title="Click để gửi link cho nhân viên">
            <Button 
              type="link" 
              size="small"
              icon={<SendOutlined />}
              onClick={() => sendEmployeeEmail(record.id)}
            >
              Gửi link
            </Button>
          </Tooltip>
        );
      
      case 'active':
        return (
          <Popover
            content={
              <Space direction="vertical">
                <Button 
                  type="link" 
                  size="small"
                  icon={<LinkOutlined />}
                  onClick={() => {
                    navigator.clipboard.writeText(record.employee_form_url);
                    message.success('Đã copy link!');
                  }}
                >
                  Copy link
                </Button>
                <Button 
                  type="link" 
                  size="small"
                  icon={<SendOutlined />}
                  onClick={() => handleResendEmail(record)}
                >
                  Gửi lại email
                </Button>
              </Space>
            }
            trigger="click"
          >
            <Tag 
              icon={<ClockCircleOutlined />} 
              color="processing"
              style={{ cursor: 'pointer' }}
            >
              Chờ nhân viên điền
            </Tag>
          </Popover>
        );
      
      case 'expired':
        return (
          <Tooltip title="Token đã hết hạn. Click để tạo lại">
            <Button 
              type="link" 
              size="small"
              danger
              icon={<ExclamationCircleOutlined />}
              onClick={() => sendEmployeeEmail(record.id)}
            >
              Tạo lại link
            </Button>
          </Tooltip>
        );
      
      default:
        return <Tag color="default">Không xác định</Tag>;
    }
  };

  // ===== TABLE COLUMNS =====
  const columns = [
    {
      title: 'Mã Onboarding',
      dataIndex: 'onboarding_code',
      key: 'onboarding_code',
      width: 150,
    },
    {
      title: 'Ứng viên',
      dataIndex: 'full_name',
      key: 'full_name',
      render: (text: string, record: any) => (
        <div>
          <div><strong>{text}</strong></div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.candidate_email}
          </Text>
        </div>
      )
    },
    {
      title: 'Vị trí',
      dataIndex: 'position_title',
      key: 'position_title',
    },
    {
      title: 'Phòng ban',
      dataIndex: 'department_name',
      key: 'department_name',
    },
    {
      title: 'Ngày bắt đầu',
      dataIndex: 'start_date',
      key: 'start_date',
      render: (date: string) => new Date(date).toLocaleDateString('vi-VN')
    },
    {
      title: 'Trạng thái điền form',
      key: 'token_status',
      width: 180,
      render: (_: any, record: any) => renderTokenStatus(record)
    },
    {
      title: 'Tiến độ',
      dataIndex: 'progress_percentage',
      key: 'progress_percentage',
      render: (progress: number) => (
        <Tag color={progress === 100 ? 'success' : 'processing'}>
          {progress}%
        </Tag>
      )
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button 
            type="link" 
            onClick={() => navigate(`/onboarding/${record.id}`)}
          >
            Chi tiết
          </Button>
        </Space>
      ),
    },
  ];

  // ===== RENDER =====
  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <Card>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 24
        }}>
          <div>
            <h1 style={{ margin: 0 }}>Onboard nhân sự</h1>
            <Text type="secondary">
              Quản lý quy trình tuyển dụng và onboarding nhân viên mới.
            </Text>
          </div>
          
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setCreateModalVisible(true)}
          >
            Tạo onboarding mới
          </Button>
        </div>

        {/* Info boxes */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: 16,
          marginBottom: 24
        }}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold' }}>
                {onboardings.length}
              </div>
              <Text type="secondary">Tổng số</Text>
            </div>
          </Card>
          
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
                {onboardings.filter((o: any) => o.token_status === 'active').length}
              </div>
              <Text type="secondary">Chờ điền thông tin</Text>
            </div>
          </Card>
          
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
                {onboardings.filter((o: any) => o.employee_info_completed).length}
              </div>
              <Text type="secondary">Đã điền thông tin</Text>
            </div>
          </Card>
          
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#ff4d4f' }}>
                {onboardings.filter((o: any) => o.token_status === 'expired').length}
              </div>
              <Text type="secondary">Token hết hạn</Text>
            </div>
          </Card>
        </div>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={onboardings}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Modal: Tạo Onboarding Mới */}
      <Modal
        title="Tạo onboarding mới"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText="Tạo và gửi link"
        cancelText="Hủy"
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateOnboarding}
        >
          <Form.Item
            label="Họ và tên ứng viên"
            name="candidate_name"
            rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
          >
            <Input placeholder="Nguyễn Văn A" />
          </Form.Item>

          <Form.Item
            label="Email"
            name="candidate_email"
            rules={[
              { required: true, message: 'Vui lòng nhập email' },
              { type: 'email', message: 'Email không hợp lệ' }
            ]}
          >
            <Input placeholder="nva@example.com" />
          </Form.Item>

          <Form.Item
            label="Ngày bắt đầu"
            name="start_date"
            rules={[{ required: true, message: 'Vui lòng chọn ngày bắt đầu' }]}
          >
            <DatePicker style={{ width: '100%' }} placeholder="Chọn ngày" />
          </Form.Item>

          <Form.Item
            label="Vị trí"
            name="position"
            rules={[{ required: true, message: 'Vui lòng chọn vị trí' }]}
          >
            <Select placeholder="Chọn vị trí">
              {/* Load from API */}
              <Select.Option value={1}>Software Engineer</Select.Option>
              <Select.Option value={2}>Product Manager</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Phòng ban"
            name="department"
            rules={[{ required: true, message: 'Vui lòng chọn phòng ban' }]}
          >
            <Select placeholder="Chọn phòng ban">
              {/* Load from API */}
              <Select.Option value={1}>IT</Select.Option>
              <Select.Option value={2}>HR</Select.Option>
            </Select>
          </Form.Item>
        </Form>

        <Text type="secondary" style={{ fontSize: 12 }}>
          💡 Sau khi tạo, hệ thống sẽ tự động gửi link cho nhân viên để điền thông tin chi tiết.
        </Text>
      </Modal>
    </div>
  );
};

// ==========================================
// GIẢI THÍCH THAY ĐỔI
// ==========================================

/*
TRƯỚC:
- Nút "+ Điền thông tin cá nhân" → HR điền form đầy đủ

SAU:
- Nút "+ Tạo onboarding mới" → HR chỉ điền thông tin cơ bản
- Hệ thống tự động gửi link cho nhân viên
- Nhân viên mở link công khai và điền thông tin đầy đủ

LUỒNG MỚI:
1. HR: Click "Tạo onboarding mới"
2. HR: Điền họ tên, email, ngày bắt đầu, vị trí (4 field)
3. System: Tự động gửi email với link cho nhân viên
4. Nhân viên: Mở link (không cần login)
5. Nhân viên: Điền form đầy đủ 35+ fields
6. System: Auto-complete 4 tasks đầu tiên
7. HR: Xem trạng thái "Đã điền thông tin"

TOKEN STATUS:
- "Gửi link" (xám) → Chưa tạo token, click để gửi
- "Chờ nhân viên điền" (xanh) → Token active, nhân viên chưa điền
- "Đã điền thông tin" (xanh lá) → Nhân viên đã hoàn thành
- "Tạo lại link" (đỏ) → Token hết hạn
*/