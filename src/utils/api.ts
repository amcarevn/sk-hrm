import axios, { AxiosInstance, AxiosResponse } from 'axios';

// API Configuration
//const API_BASE_URL = "https://beautycare.amcare.vn"
const API_BASE_URL = 'http://localhost:8000';
// Create axios instance for Management API
export const managementApi: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for Management API
managementApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for Management API
managementApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, clear tokens but don't redirect
      // Let ProtectedRoute handle the redirect
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
    return Promise.reject(error);
  }
);

// Types
export interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
  role: string;
  isActive: boolean;
  lastLoginAt?: string;
  loginCount: number;
  invitedBy?: string;
  invitedAt?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: string;
  updatedAt: string;
  userRoles?: UserRole[];
  permissions?: Permission[];
  is_super_admin?: boolean;
  
  // Additional fields from HRM backend
  employee_profile?: {
    id?: number;
    employee_id?: string;
    full_name?: string;
    department?: string;
    department_code?: string;
    [key: string]: any;
  };
  hrm_user?: {
    employee_id?: string;
    full_name?: string;
    department?: string;
    department_code?: string;
    [key: string]: any;
  };
  [key: string]: any; // Allow additional properties
}

export interface Permission {
  id: string;
  name: string;
  description?: string;
  resource: string;
  action: string;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
  rolePermissions?: { permission: Permission }[];
}

export interface UserRole {
  userId: string;
  roleId: string;
  assignedBy?: string;
  assignedAt: string;
  role: Role;
}

export interface Chatbot {
  id: string;
  name: string;
  description?: string;
  instructions?: string;
  avatarUrl?: string;
  isActive: boolean;
  userId: string;
  goal?: string;
  facebookPages?: FacebookPage[];
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  name: string;
  file_key: string;
  file_url?: string;
  file_size: number;
  document_type: string;
  mime_type: string;
  status: string;
  chatbot?: string;
  chatbot_name?: string;
  user: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  documentDomains?: DocumentDomain[];
}

export interface UserProfile {
  id: string;
  platform: string;
  externalId: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  profilePicUrl?: string;
  profilePicPath?: string;
  metadata?: any;
}

export interface Conversation {
  id: string;
  title: string;
  userId: string;
  chatbotId?: string;
  chatbot?: Chatbot;
  messages?: Message[];
  lastMessage?: Message;
  autoReply: boolean;
  contextSummary?: string;
  platform?: string;
  externalId?: string;
  platformMetadata?: any;
  userProfile?: UserProfile;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  metadata?: any;
  createdAt: string;
}

export interface ChatRequest {
  message: string;
  conversationId?: string;
}

export interface ChatResponse {
  response: string;
  conversationId: string;
  messageId: string;
  metadata?: any;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthResponse {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

// Authentication API
export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response: AxiosResponse<{ access: string; refresh: string; user: any; hrm_user?: any; employee_profile?: any }> =
      await managementApi.post('/api-hrm/users/token/', credentials);
    
    // Debug: Log the full response from backend
    console.log('authAPI.login - Full response:', response.data);
    console.log('authAPI.login - Backend user:', response.data.user);
    console.log('authAPI.login - Employee profile (from user):', response.data.user?.employee_profile);
    console.log('authAPI.login - HRM user (from user):', response.data.user?.hrm_user);
    console.log('authAPI.login - HRM user (top level):', response.data.hrm_user);
    console.log('authAPI.login - Employee profile (top level):', response.data.employee_profile);
    
    // Convert the response to match the expected AuthResponse format
    // Preserve all user data from backend including employee_profile and hrm_user
    const backendUser = response.data.user;
    
    // Get hrm_user and employee_profile from top level if available, otherwise from user object
    const hrmUser = response.data.hrm_user || backendUser.hrm_user;
    const employeeProfile = response.data.employee_profile || backendUser.employee_profile;
    
    const user: User = {
      id: backendUser.id.toString(),
      username: backendUser.username,
      email: backendUser.email || '',
      firstName: backendUser.first_name || '',
      lastName: backendUser.last_name || '',
      phone: backendUser.phone_number || '',
      role: backendUser.role || 'user',
      isActive: backendUser.is_active !== undefined ? backendUser.is_active : true,
      lastLoginAt: new Date().toISOString(),
      loginCount: 0,
      emailVerified: false,
      phoneVerified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      is_super_admin: backendUser.is_super_admin || false,
      // Preserve additional fields from backend
      employee_profile: employeeProfile,
      hrm_user: hrmUser,
      // Copy all other properties from backend user
      ...backendUser,
    };
    
    console.log('authAPI.login - Processed user:', user);
    console.log('authAPI.login - Processed employee_profile:', user.employee_profile);
    console.log('authAPI.login - Processed hrm_user:', user.hrm_user);
    
    // Store login response in localStorage for getProfile to use
    try {
      localStorage.setItem('login_response', JSON.stringify({
        employee_profile: employeeProfile,
        hrm_user: hrmUser,
        ...backendUser
      }));
    } catch (e) {
      console.error('Error storing login response in localStorage:', e);
    }
    
    return {
      user,
      tokens: {
        accessToken: response.data.access,
        refreshToken: response.data.refresh,
      },
    };
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response: AxiosResponse<{ success: boolean; data: AuthResponse }> =
      await managementApi.post('/auth/register', data);
    return response.data.data;
  },

  getProfile: async (): Promise<{ user: User }> => {
    const response: AxiosResponse<any> =
      await managementApi.get('/api/users/profile/');
    
    // Debug: Log the full response from backend
    console.log('authAPI.getProfile - Full response:', response.data);
    console.log('authAPI.getProfile - Employee profile:', response.data.employee_profile);
    console.log('authAPI.getProfile - HRM user:', response.data.hrm_user);
    
    // The API returns user fields directly at the top level, not wrapped in a 'user' object
    const userData = response.data;
    
    // If employee_profile or hrm_user are not in the response, try to get them from nested structure
    // or use the data from login response stored in localStorage
    let employeeProfile = userData.employee_profile;
    let hrmUser = userData.hrm_user;
    
    // If not found in direct response, check nested structures
    if (!employeeProfile && userData.user && userData.user.employee_profile) {
      employeeProfile = userData.user.employee_profile;
    }
    if (!hrmUser && userData.user && userData.user.hrm_user) {
      hrmUser = userData.user.hrm_user;
    }
    
    // If still not found, try to get from localStorage (from login response)
    if (!employeeProfile || !hrmUser) {
      try {
        const loginData = localStorage.getItem('login_response');
        if (loginData) {
          const parsedLoginData = JSON.parse(loginData);
          if (!employeeProfile && parsedLoginData.employee_profile) {
            employeeProfile = parsedLoginData.employee_profile;
          }
          if (!hrmUser && parsedLoginData.hrm_user) {
            hrmUser = parsedLoginData.hrm_user;
          }
        }
      } catch (e) {
        console.error('Error parsing login data from localStorage:', e);
      }
    }
    
    const user: User = {
      id: userData.user_id?.toString() || userData.id?.toString() || '',
      username: userData.username || '',
      email: userData.email || '',
      firstName: userData.first_name || '',
      lastName: userData.last_name || '',
      phone: userData.phone_number || userData.username || '',
      role: userData.role || 'user',
      isActive: userData.is_active !== undefined ? userData.is_active : true,
      lastLoginAt: new Date().toISOString(),
      loginCount: 0,
      emailVerified: false,
      phoneVerified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      is_super_admin: userData.is_super_admin || false,
      // Preserve additional fields from backend
      employee_profile: employeeProfile,
      hrm_user: hrmUser,
      // Copy all other properties from backend user
      ...userData,
    };
    
    console.log('authAPI.getProfile - Processed user:', user);
    console.log('authAPI.getProfile - Processed employee_profile:', user.employee_profile);
    console.log('authAPI.getProfile - Processed hrm_user:', user.hrm_user);
    
    return {
      user,
    };
  },

  logout: async (): Promise<void> => {
    // JWT doesn't have a server-side logout endpoint typically
    // Just clear tokens client-side in AuthContext
    // We'll return a resolved promise
    return Promise.resolve();
  },

  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<void> => {
    await managementApi.post('/api/users/change-password/', data);
  },
};

// Chatbots API
export const chatbotsAPI = {
  create: async (data: Partial<Chatbot>): Promise<Chatbot> => {
    const response: AxiosResponse<{ success: boolean; data: Chatbot }> =
      await managementApi.post('/chatbots/', data);
    return response.data.data;
  },

  list: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
  }): Promise<{
    chatbots: Chatbot[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> => {
    const response: AxiosResponse<{
      success: boolean;
      data: {
        chatbots: Chatbot[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }> = await managementApi.get('/chatbots/', { params });
    return response.data.data;
  },

  getById: async (id: string): Promise<Chatbot> => {
    const response: AxiosResponse<{ success: boolean; data: Chatbot }> =
      await managementApi.get(`/chatbots/${id}/`);
    return response.data.data;
  },

  update: async (id: string, data: Partial<Chatbot>): Promise<Chatbot> => {
    const response: AxiosResponse<{ success: boolean; data: Chatbot }> =
      await managementApi.put(`/chatbots/${id}/`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await managementApi.delete(`/chatbots/${id}/`);
  },

  toggleStatus: async (id: string, isActive: boolean): Promise<Chatbot> => {
    const response: AxiosResponse<{ success: boolean; data: Chatbot }> =
      await managementApi.patch(`/chatbots/${id}/status/`, { isActive });
    return response.data.data;
  },

  sendMessage: async (id: string, data: ChatRequest): Promise<ChatResponse> => {
    const response: AxiosResponse<{ success: boolean; data: ChatResponse }> =
      await managementApi.post(`/chatbots/${id}/chat`, data);
    return response.data.data;
  },

  processDocument: async (id: string, documentId: string): Promise<any> => {
    const response: AxiosResponse<{ success: boolean; data: any }> =
      await managementApi.post(`/chatbots/${id}/process-document`, {
        documentId,
      });
    return response.data.data;
  },

  vectorSearch: async (
    id: string,
    query: string,
    limit: number = 10,
    threshold: number = 0.7
  ): Promise<any> => {
    const response: AxiosResponse<{ success: boolean; data: any }> =
      await managementApi.post(`/chatbots/${id}/vector-search`, {
        query,
        limit,
        threshold,
      });
    return response.data.data;
  },

  getStatistics: async (id: string): Promise<any> => {
    const response: AxiosResponse<{ success: boolean; data: any }> =
      await managementApi.get(`/chatbots/${id}/statistics`);
    return response.data.data;
  },

  getListStatistics: async (): Promise<any> => {
    const response: AxiosResponse<{ success: boolean; data: any }> =
      await managementApi.get('/chatbots/statistics');
    return response.data.data;
  },
};

// Helper function to sanitize filename
const sanitizeFilename = (filename: string): string => {
  // Remove Vietnamese accents and special characters
  return filename
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
    .replace(/_+/g, '_') // Replace multiple underscores with single
    .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
};

// Documents API
export const documentsAPI = {
  upload: async (
    file: File,
    chatbotId?: string,
    metadata?: Record<string, any>
  ): Promise<Document> => {
    const formData = new FormData();

    // Create a new File object with sanitized filename
    const sanitizedName = sanitizeFilename(file.name);
    const sanitizedFile = new File([file], sanitizedName, { type: file.type });

    formData.append('file', sanitizedFile);
    if (chatbotId) formData.append('chatbot_id', chatbotId);
    if (metadata) formData.append('metadata', JSON.stringify(metadata));

    const response: AxiosResponse<{ success: boolean; data: Document }> =
      await managementApi.post('/documents/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    return response.data.data;
  },

  list: async (params?: {
    page?: number;
    limit?: number;
    chatbotId?: string;
    processingStatus?: string;
  }): Promise<{
    documents: Document[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> => {
    const response: AxiosResponse<{
      success: boolean;
      data: {
        documents: Document[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }> = await managementApi.get('/documents/', { params });
    return response.data.data;
  },

  getById: async (id: string): Promise<Document> => {
    const response: AxiosResponse<{ success: boolean; data: Document }> =
      await managementApi.get(`/documents/${id}/`);
    return response.data.data;
  },

  update: async (id: string, data: Partial<Document>): Promise<Document> => {
    const response: AxiosResponse<{ success: boolean; data: Document }> =
      await managementApi.put(`/documents/${id}/`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await managementApi.delete(`/documents/${id}/`);
  },

  updateProcessingStatus: async (
    id: string,
    status: string
  ): Promise<Document> => {
    const response: AxiosResponse<{ success: boolean; data: Document }> =
      await managementApi.patch(`/documents/${id}/status/`, { status });
    return response.data.data;
  },

  attachToChatbot: async (
    documentId: string,
    chatbotId: string
  ): Promise<void> => {
    await managementApi.post(`/documents/${documentId}/attach/`, { chatbotId });
  },

  detachFromChatbot: async (documentId: string): Promise<void> => {
    await managementApi.post(`/documents/${documentId}/detach/`);
  },

  download: async (id: string): Promise<void> => {
    const response = await managementApi.get(`/documents/${id}/download/`, {
      responseType: 'blob',
    });

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;

    // Get filename from response headers
    const contentDisposition = response.headers['content-disposition'];
    let filename = 'document';
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  // Index document via Redis stream
  index: async (documentId: string, chatbotId: string): Promise<any> => {
    const response: AxiosResponse<{ success: boolean; data: any }> =
      await managementApi.post('/documents/index/', {
        document_id: documentId,
        chatbot_id: chatbotId,
      });
    return response.data.data;
  },
};

// Conversations API
export const conversationsAPI = {
  create: async (data: {
    title?: string;
    chatbotId?: string;
  }): Promise<Conversation> => {
    const response: AxiosResponse<{ success: boolean; data: Conversation }> =
      await managementApi.post('/conversations/', data);
    return response.data.data;
  },

  list: async (params?: {
    page?: number;
    limit?: number;
    chatbotId?: string;
    search?: string;
  }): Promise<{
    conversations: Conversation[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> => {
    const response: AxiosResponse<{
      success: boolean;
      data: {
        conversations: Conversation[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }> = await managementApi.get('/conversations/', { params });
    return response.data.data;
  },

  getById: async (id: string): Promise<Conversation> => {
    const response: AxiosResponse<{ success: boolean; data: Conversation }> =
      await managementApi.get(`/conversations/${id}`);
    return response.data.data;
  },

  update: async (
    id: string,
    data: Partial<Conversation>
  ): Promise<Conversation> => {
    const response: AxiosResponse<{ success: boolean; data: Conversation }> =
      await managementApi.put(`/conversations/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await managementApi.delete(`/conversations/${id}`);
  },

  bulkDelete: async (
    conversationIds: string[]
  ): Promise<{
    deletedCount: number;
    failedCount: number;
    errors: string[];
  }> => {
    const response: AxiosResponse<{
      success: boolean;
      data: {
        deletedCount: number;
        failedCount: number;
        errors: string[];
      };
    }> = await managementApi.post('/conversations/bulk-delete', {
      conversationIds,
    });
    return response.data.data;
  },

  getMessages: async (
    id: string,
    limit?: number,
    offset?: number
  ): Promise<Message[]> => {
    const response: AxiosResponse<{ success: boolean; data: Message[] }> =
      await managementApi.get(`/conversations/${id}/messages`, {
        params: { limit, offset },
      });
    return response.data.data;
  },

  addMessage: async (
    id: string,
    data: { role: 'USER' | 'ASSISTANT'; content: string; metadata?: any }
  ): Promise<Message> => {
    const response: AxiosResponse<{ success: boolean; data: Message }> =
      await managementApi.post(`/conversations/${id}/messages`, data);
    return response.data.data;
  },

  toggleAutoReply: async (id: string): Promise<Conversation> => {
    const response: AxiosResponse<{ success: boolean; data: Conversation }> =
      await managementApi.patch(`/conversations/${id}/toggle-auto-reply`);
    return response.data.data;
  },
};

// Users API
export const usersAPI = {
  list: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    isActive?: boolean;
  }): Promise<{
    users: User[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> => {
    const response: AxiosResponse<{
      success: boolean;
      data: {
        users: User[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }> = await managementApi.get('/users', { params });
    return response.data.data;
  },

  getById: async (id: string): Promise<User> => {
    const response: AxiosResponse<{ success: boolean; data: User }> =
      await managementApi.get(`/users/${id}`);
    return response.data.data;
  },

  getByIdWithRoles: async (id: string): Promise<User> => {
    const response: AxiosResponse<{ success: boolean; data: User }> =
      await managementApi.get(`/users/${id}/with-roles`);
    return response.data.data;
  },

  create: async (data: Partial<User>): Promise<User> => {
    const response: AxiosResponse<{ success: boolean; data: User }> =
      await managementApi.post('/users', data);
    return response.data.data;
  },

  update: async (id: string, data: Partial<User>): Promise<User> => {
    const response: AxiosResponse<{ success: boolean; data: User }> =
      await managementApi.put(`/users/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await managementApi.delete(`/users/${id}`);
  },

  getStatistics: async (): Promise<any> => {
    const response: AxiosResponse<{ success: boolean; data: any }> =
      await managementApi.get('/users/statistics');
    return response.data.data;
  },

  // Bulk operations
  bulkDelete: async (userIds: string[]): Promise<void> => {
    await managementApi.post('/users/bulk-delete', { userIds });
  },

  bulkUpdate: async (userIds: string[], data: Partial<User>): Promise<void> => {
    await managementApi.post('/users/bulk-update', { userIds, data });
  },

  // Role management
  assignRole: async (userId: string, roleId: string): Promise<void> => {
    await managementApi.post(`/users/${userId}/roles`, { roleId });
  },

  removeRole: async (userId: string, roleId: string): Promise<void> => {
    await managementApi.delete(`/users/${userId}/roles/${roleId}`);
  },

  // Activity tracking
  getActivities: async (
    userId: string,
    params?: { period?: string }
  ): Promise<{
    activities: any[];
    total: number;
  }> => {
    const response: AxiosResponse<{ success: boolean; data: any }> =
      await managementApi.get(`/users/${userId}/activities`, { params });
    return response.data.data;
  },

  getActivityStats: async (userId: string): Promise<any> => {
    const response: AxiosResponse<{ success: boolean; data: any }> =
      await managementApi.get(`/users/${userId}/activity-stats`);
    return response.data.data;
  },
};

// Permissions API
export const permissionsAPI = {
  list: async (): Promise<Permission[]> => {
    const response: AxiosResponse<{ success: boolean; data: Permission[] }> =
      await managementApi.get('/permissions/permissions');
    return response.data.data;
  },

  getById: async (id: string): Promise<Permission> => {
    const response: AxiosResponse<{ success: boolean; data: Permission }> =
      await managementApi.get(`/permissions/permissions/${id}`);
    return response.data.data;
  },

  create: async (data: Partial<Permission>): Promise<Permission> => {
    const response: AxiosResponse<{ success: boolean; data: Permission }> =
      await managementApi.post('/permissions/permissions', data);
    return response.data.data;
  },
};

// Roles API
export const rolesAPI = {
  list: async (): Promise<Role[]> => {
    const response: AxiosResponse<{ success: boolean; data: Role[] }> =
      await managementApi.get('/permissions/roles');
    return response.data.data;
  },

  getById: async (id: string): Promise<Role> => {
    const response: AxiosResponse<{ success: boolean; data: Role }> =
      await managementApi.get(`/permissions/roles/${id}`);
    return response.data.data;
  },

  create: async (data: Partial<Role>): Promise<Role> => {
    const response: AxiosResponse<{ success: boolean; data: Role }> =
      await managementApi.post('/permissions/roles', data);
    return response.data.data;
  },

  update: async (id: string, data: Partial<Role>): Promise<Role> => {
    const response: AxiosResponse<{ success: boolean; data: Role }> =
      await managementApi.put(`/permissions/roles/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await managementApi.delete(`/permissions/roles/${id}`);
  },

  getStatistics: async (): Promise<any> => {
    const response: AxiosResponse<{ success: boolean; data: any }> =
      await managementApi.get('/permissions/statistics');
    return response.data.data;
  },

  // Role assignment
  assignToUser: async (userId: string, roleId: string): Promise<any> => {
    const response: AxiosResponse<{ success: boolean; data: any }> =
      await managementApi.post('/permissions/assign-role', { userId, roleId });
    return response.data.data;
  },

  removeFromUser: async (userId: string, roleId: string): Promise<void> => {
    await managementApi.delete(`/permissions/users/${userId}/roles/${roleId}`);
  },

  getUserRoles: async (userId: string): Promise<UserRole[]> => {
    const response: AxiosResponse<{ success: boolean; data: UserRole[] }> =
      await managementApi.get(`/permissions/users/${userId}/roles`);
    return response.data.data;
  },

  getUserPermissions: async (userId: string): Promise<Permission[]> => {
    const response: AxiosResponse<{ success: boolean; data: Permission[] }> =
      await managementApi.get(`/permissions/users/${userId}/permissions`);
    return response.data.data;
  },
};

// API Key interface
export interface ApiKey {
  id: string;
  name: string;
  key?: string; // Only present on creation
  user: string;
  chatbot?: string;
  chatbot_name?: string;
  status: 'active' | 'inactive' | 'revoked';
  last_used_at?: string;
  expires_at?: string;
  metadata: Record<string, any>;
  is_valid?: boolean;
  created_at: string;
  updated_at: string;
}

export interface FacebookPage {
  id: string;
  name: string;
  accessToken: string;
  category: string;
  categoryList?: Array<{
    id: string;
    name: string;
  }>;
  tasks?: string[];
  picture?: {
    data: {
      url: string;
    };
  };
  isActive: boolean;
  botId?: string;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface BotPermission {
  id: string;
  userId: string;
  chatbotId: string;
  permission: 'read' | 'write' | 'admin';
  assignedBy: string;
  assignedAt: string;
  isActive: boolean;
  expiresAt?: string;
  user?: User;
  chatbot?: Chatbot;
  assignedByUser?: User;
}

export interface FacebookConnection {
  id: string;
  userId: string;
  facebookUserId: string;
  facebookUserName: string;
  accessToken: string;
  tokenExpiresAt: string;
  isActive: boolean;
  pages: FacebookPage[];
  createdAt: string;
  updatedAt: string;
}

// API Keys API
export const apiKeysAPI = {
  list: async (params?: {
    page?: number;
    limit?: number;
    chatbot_id?: string;
    status?: string;
  }): Promise<{
    api_keys: ApiKey[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> => {
    const response: AxiosResponse<{
      success: boolean;
      data: {
        api_keys: ApiKey[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }> = await managementApi.get('/api-keys/', { params });
    return response.data.data;
  },

  create: async (data: {
    name: string;
    chatbot?: string;
    expires_at?: string;
  }): Promise<ApiKey> => {
    const response: AxiosResponse<{ success: boolean; data: ApiKey }> =
      await managementApi.post('/api-keys/', data);
    return response.data.data;
  },

  getById: async (id: string): Promise<ApiKey> => {
    const response: AxiosResponse<{ success: boolean; data: ApiKey }> =
      await managementApi.get(`/api-keys/${id}`);
    return response.data.data;
  },

  update: async (
    id: string,
    data: { name?: string; status?: string; expires_at?: string }
  ): Promise<ApiKey> => {
    const response: AxiosResponse<{ success: boolean; data: ApiKey }> =
      await managementApi.put(`/api-keys/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await managementApi.delete(`/api-keys/${id}`);
  },

  regenerate: async (id: string): Promise<ApiKey> => {
    const response: AxiosResponse<{ success: boolean; data: ApiKey }> =
      await managementApi.post(`/api-keys/${id}/regenerate`);
    return response.data.data;
  },

  toggleStatus: async (id: string): Promise<ApiKey> => {
    const response: AxiosResponse<{ success: boolean; data: ApiKey }> =
      await managementApi.post(`/api-keys/${id}/toggle_status`);
    return response.data.data;
  },

  revoke: async (id: string): Promise<ApiKey> => {
    const response: AxiosResponse<{ success: boolean; data: ApiKey }> =
      await managementApi.post(`/api-keys/${id}/revoke`);
    return response.data.data;
  },

  validate: async (key: string): Promise<{
    is_valid: boolean;
    api_key: {
      id: string;
      name: string;
      user_id: string;
      chatbot_id?: string;
      status: string;
      expires_at?: string;
      last_used_at?: string;
    };
  }> => {
    const response: AxiosResponse<{
      success: boolean;
      data: {
        is_valid: boolean;
        api_key: {
          id: string;
          name: string;
          user_id: string;
          chatbot_id?: string;
          status: string;
          expires_at?: string;
          last_used_at?: string;
        };
      };
    }> = await managementApi.get('/api-keys/validate/', { params: { key } });
    return response.data.data;
  },
};

// Health check
export const healthAPI = {
  check: async (): Promise<{
    status: string;
    timestamp: string;
    service: string;
    version: string;
  }> => {
    const response = await managementApi.get('/health');
    return response.data;
  },
};

// Facebook API
export const facebookAPI = {
  // Get current Facebook connection status
  getConnection: async (): Promise<FacebookConnection | null> => {
    try {
      const response: AxiosResponse<{
        success: boolean;
        data: FacebookConnection;
      }> = await managementApi.get('/facebook/connection/');
      return response.data.data;
    } catch (error: any) {
      // Return null for 404 (no connection) and 401 (unauthorized - treat as no connection)
      if (error.response?.status === 404 || error.response?.status === 401) {
        return null;
      }
      throw error;
    }
  },

  // Get Facebook pages with pagination
  getPages: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{
    pages: FacebookPage[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> => {
    try {
      const response: AxiosResponse<{
        success: boolean;
        data: {
          pages: FacebookPage[];
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        };
      }> = await managementApi.get('/facebook/pages/', { params });
      return response.data.data;
    } catch (error: any) {
      // Return empty result for 404 (no pages) and 401 (unauthorized - treat as no pages)
      if (error.response?.status === 404 || error.response?.status === 401) {
        return {
          pages: [],
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0,
        };
      }
      throw error;
    }
  },

  // Get Facebook authorization URL
  getAuthUrl: async (): Promise<{ authUrl: string }> => {
    const response: AxiosResponse<{
      success: boolean;
      data: { authUrl: string };
    }> = await managementApi.get('/facebook/auth-url/');
    return response.data.data;
  },

  // Handle Facebook OAuth callback
  handleCallback: async (code: string): Promise<FacebookConnection> => {
    const response: AxiosResponse<{
      success: boolean;
      data: FacebookConnection;
    }> = await managementApi.post('/facebook/callback/', { code });
    return response.data.data;
  },

  // Disconnect Facebook
  disconnect: async (): Promise<void> => {
    await managementApi.delete('/facebook/connection/');
  },

  // Refresh Facebook pages
  refreshPages: async (): Promise<FacebookPage[]> => {
    const response: AxiosResponse<{ success: boolean; data: FacebookPage[] }> =
      await managementApi.post('/facebook/refresh-pages/');
    return response.data.data;
  },

  // Get page insights
  getPageInsights: async (pageId: string): Promise<any> => {
    const response: AxiosResponse<{ success: boolean; data: any }> =
      await managementApi.get(`/facebook/pages/${pageId}/insights`);
    return response.data.data;
  },

  // Connect bot to page
  connectBot: async (pageId: string, botId: string): Promise<any> => {
    const response: AxiosResponse<{ success: boolean; data: any }> =
      await managementApi.post(`/facebook/pages/${pageId}/connect-bot`, {
        botId,
      });
    return response.data.data;
  },

  // Disconnect bot from page
  disconnectBot: async (pageId: string): Promise<any> => {
    const response: AxiosResponse<{ success: boolean; data: any }> =
      await managementApi.delete(`/facebook/pages/${pageId}/connect-bot`);
    return response.data.data;
  },
};

// Dashboard API
export const dashboardAPI = {
  getCTOStats: async (): Promise<any> => {
    const response: AxiosResponse<{ success: boolean; data: any }> =
      await managementApi.get('/dashboard/cto/');
    return response.data.data;
  },

  getHRMStats: async (): Promise<any> => {
    const response: AxiosResponse<any> =
      await managementApi.get('/api-hrm/dashboard/');
    return response.data;
  },

  clearCache: async (): Promise<void> => {
    await managementApi.post('/dashboard/cache/clear');
  },
};

// Media API
export interface Media {
  id: string;
  filename: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  mediaType: 'IMAGE';
  userId: string;
  chatbotId?: string;
  tags: string[];
  description?: string;
  isPublic: boolean;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  chatbot?: {
    id: string;
    name: string;
    description?: string;
  };
}

export const mediaAPI = {
  upload: async (
    file: File,
    chatbotId: string,
    tags?: string[],
    description?: string,
    isPublic?: boolean
  ): Promise<Media> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('chatbotId', chatbotId);
    if (tags) formData.append('tags', JSON.stringify(tags));
    if (description) formData.append('description', description);
    if (isPublic !== undefined)
      formData.append('isPublic', isPublic.toString());

    const response: AxiosResponse<{ success: boolean; data: Media }> =
      await managementApi.post('/media/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    return response.data.data;
  },

  list: async (params: {
    page?: number;
    limit?: number;
    chatbotId: string;
    tags?: string[];
    isPublic?: boolean;
    search?: string;
  }): Promise<{
    media: Media[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> => {
    const response: AxiosResponse<{
      success: boolean;
      data: {
        media: Media[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }> = await managementApi.get('/media', { params });
    return response.data.data;
  },

  getById: async (id: string): Promise<Media> => {
    const response: AxiosResponse<{ success: boolean; data: Media }> =
      await managementApi.get(`/media/${id}`);
    return response.data.data;
  },

  update: async (id: string, data: Partial<Media>): Promise<Media> => {
    const response: AxiosResponse<{ success: boolean; data: Media }> =
      await managementApi.put(`/media/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await managementApi.delete(`/media/${id}`);
  },

  getChatbotMedia: async (chatbotId: string): Promise<Media[]> => {
    const response: AxiosResponse<{ success: boolean; data: Media[] }> =
      await managementApi.get(`/media/chatbot/${chatbotId}`);
    return response.data.data;
  },
};

// Domain interfaces
export interface Domain {
  id: string;
  name: string;
  description?: string;
  chatbotId: string;
  isActive: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
  keywords?: DomainKeyword[];
  documentDomains?: DocumentDomain[];
  _count?: {
    keywords: number;
    documentDomains: number;
  };
}

export interface DomainKeyword {
  id: string;
  domainId: string;
  keyword: string;
  weight: number;
  keywordType: 'primary' | 'secondary' | 'synonym';
  createdAt: string;
}

export interface DocumentDomain {
  id: string;
  documentId: string;
  domainId: string;
  priority: number;
  isActive: boolean;
  assignedBy?: string;
  assignedAt: string;
  document?: Document;
  domain?: Domain;
}

// Domains API
export const domainsAPI = {
  create: async (data: {
    name: string;
    description?: string;
    chatbotId: string;
    isActive?: boolean;
    priority?: number;
  }): Promise<Domain> => {
    const response: AxiosResponse<{ success: boolean; data: Domain }> =
      await managementApi.post('/domains', data);
    return response.data.data;
  },

  list: async (params?: {
    chatbotId?: string;
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    domains: Domain[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> => {
    // Clean up parameters to avoid type conversion issues
    const processedParams: any = {};
    if (params) {
      if (params.chatbotId) processedParams.chatbotId = params.chatbotId;
      if (params.search) processedParams.search = params.search;
      if (params.page !== undefined) processedParams.page = params.page;
      if (params.limit !== undefined) processedParams.limit = params.limit;
      // Skip isActive parameter for now due to backend validation issues
      // Client-side filtering will be used instead
    }

    const response: AxiosResponse<{
      success: boolean;
      data: {
        domains: Domain[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }> = await managementApi.get('/domains', { params: processedParams });
    return response.data.data;
  },

  getById: async (id: string): Promise<Domain> => {
    const response: AxiosResponse<{ success: boolean; data: Domain }> =
      await managementApi.get(`/domains/${id}`);
    return response.data.data;
  },

  update: async (id: string, data: Partial<Domain>): Promise<Domain> => {
    const response: AxiosResponse<{ success: boolean; data: Domain }> =
      await managementApi.put(`/domains/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await managementApi.delete(`/domains/${id}`);
  },

  addKeywords: async (
    domainId: string,
    data: {
      keywords: string[];
      keywordType?: 'primary' | 'secondary' | 'synonym';
      weight?: number;
    }
  ): Promise<DomainKeyword[]> => {
    const response: AxiosResponse<{ success: boolean; data: DomainKeyword[] }> =
      await managementApi.post(`/domains/${domainId}/keywords`, data);
    return response.data.data;
  },

  removeKeyword: async (keywordId: string): Promise<void> => {
    await managementApi.delete(`/domains/keywords/${keywordId}`);
  },

  assignDocument: async (
    domainId: string,
    data: {
      documentId: string;
      priority?: number;
      isActive?: boolean;
    }
  ): Promise<DocumentDomain> => {
    const response: AxiosResponse<{ success: boolean; data: DocumentDomain }> =
      await managementApi.post(`/domains/${domainId}/documents`, data);
    return response.data.data;
  },

  bulkAssignDocuments: async (
    domainId: string,
    data: {
      documentIds: string[];
      priority?: number;
      isActive?: boolean;
    }
  ): Promise<{
    successful: DocumentDomain[];
    failed: any[];
    successCount: number;
    failedCount: number;
  }> => {
    const response: AxiosResponse<{
      success: boolean;
      data: {
        successful: DocumentDomain[];
        failed: any[];
        successCount: number;
        failedCount: number;
      };
    }> = await managementApi.post(`/domains/${domainId}/documents/bulk`, data);
    return response.data.data;
  },

  removeDocumentAssociation: async (associationId: string): Promise<void> => {
    await managementApi.delete(`/domains/associations/${associationId}`);
  },

  updateDocumentAssociation: async (
    associationId: string,
    data: {
      priority?: number;
      isActive?: boolean;
    }
  ): Promise<DocumentDomain> => {
    const response: AxiosResponse<{ success: boolean; data: DocumentDomain }> =
      await managementApi.put(`/domains/associations/${associationId}`, data);
    return response.data.data;
  },

  getStatistics: async (domainId: string): Promise<any> => {
    const response: AxiosResponse<{ success: boolean; data: any }> =
      await managementApi.get(`/domains/${domainId}/statistics`);
    return response.data.data;
  },
};

// Bot Permissions API
export const botPermissionsAPI = {
  create: async (data: {
    userId: string;
    chatbotId: string;
    permission: 'read' | 'write' | 'admin';
    expiresAt?: string;
  }): Promise<BotPermission> => {
    const response: AxiosResponse<{ success: boolean; data: BotPermission }> =
      await managementApi.post('/bot-permissions', data);
    return response.data.data;
  },

  list: async (params?: {
    userId?: string;
    chatbotId?: string;
    permission?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{
    permissions: BotPermission[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> => {
    const response: AxiosResponse<{
      success: boolean;
      data: {
        permissions: BotPermission[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }> = await managementApi.get('/bot-permissions', { params });
    return response.data.data;
  },

  getUserAccessibleChatbots: async (userId?: string): Promise<Chatbot[]> => {
    const url = userId
      ? `/bot-permissions/user/${userId}/chatbots`
      : '/bot-permissions/user/chatbots';
    const response: AxiosResponse<{ success: boolean; data: Chatbot[] }> =
      await managementApi.get(url);
    return response.data.data;
  },

  checkPermission: async (
    userId: string,
    chatbotId: string,
    permission: 'read' | 'write' | 'admin' = 'read'
  ): Promise<{
    hasPermission: boolean;
    userId: string;
    chatbotId: string;
    permission: string;
  }> => {
    const response: AxiosResponse<{ success: boolean; data: any }> =
      await managementApi.get(`/bot-permissions/check/${userId}/${chatbotId}`, {
        params: { permission },
      });
    return response.data.data;
  },

  update: async (
    id: string,
    data: {
      permission?: 'read' | 'write' | 'admin';
      isActive?: boolean;
      expiresAt?: string;
    }
  ): Promise<BotPermission> => {
    const response: AxiosResponse<{ success: boolean; data: BotPermission }> =
      await managementApi.put(`/bot-permissions/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await managementApi.delete(`/bot-permissions/${id}`);
  },

  getChatbotUsers: async (chatbotId: string): Promise<BotPermission[]> => {
    const response: AxiosResponse<{ success: boolean; data: BotPermission[] }> =
      await managementApi.get(`/bot-permissions/chatbot/${chatbotId}/users`);
    return response.data.data;
  },

  getById: async (id: string): Promise<BotPermission> => {
    const response: AxiosResponse<{ success: boolean; data: BotPermission }> =
      await managementApi.get(`/bot-permissions/${id}`);
    return response.data.data;
  },

  createBulk: async (data: {
    userId: string;
    chatbotIds: string[];
    permission: 'read' | 'write' | 'admin';
    expiresAt?: string;
  }): Promise<{
    created: number;
    updated: number;
    failed: number;
    errors: string[];
    permissions: BotPermission[];
  }> => {
    const response: AxiosResponse<{
      success: boolean;
      data: {
        created: number;
        updated: number;
        failed: number;
        errors: string[];
        permissions: BotPermission[];
      };
      message: string;
    }> = await managementApi.post('/bot-permissions/bulk', data);
    return response.data.data;
  },
};

// Employee API Types
export interface Employee {
  id: number;
  employee_id: string;
  full_name: string;
  gender: 'M' | 'F' | 'O';
  date_of_birth?: string;
  phone_number?: string;
  personal_email?: string;
  bank_name?: string;
  bank_account?: string;
  employment_status: 'ACTIVE' | 'INACTIVE' | 'PROBATION';
  start_date?: string;
  end_date?: string;
  position?: {
    id: number;
    title: string;
    code: string;
  };
  department?: {
    id: number;
    name: string;
    code: string;
  };
  manager?: {
    id: number;
    employee_id: string;
    full_name: string;
  };
  user?: {
    id: number;
    username: string;
    email?: string;
    first_name?: string;
    last_name?: string;
  };
  
  // New fields for onboarding and HR
  basic_salary?: number;
  contract_type?: string;
  contract_type_display?: string;
  probation_end_date?: string;
  probation_months?: number;
  file_status?: string;
  file_status_display?: string;
  file_submission_deadline?: string;
  file_submission_date?: string;
  file_review_notes?: string;
  training_presentation_viewed?: boolean;
  training_presentation_viewed_at?: string;
  vneid_screenshot?: string;
  cccd_number?: string;
  cccd_issue_date?: string;
  cccd_issue_place?: string;
  birth_place?: string;
  permanent_residence?: string;
  
  // HR employee flag
  is_hr?: boolean;
  
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: number;
  name: string;
  code: string;
  description?: string;
  parent_department?: number;
  manager?: number;
  created_at: string;
  updated_at: string;
}

export interface Position {
  id: number;
  title: string;
  code: string;
  description?: string;
  department?: {
    id: number;
    name: string;
    code: string;
  };
  level: number;
  parent_position?: number;
  is_management: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmployeeCreateData {
  employee_id: string;
  full_name: string;
  gender: 'M' | 'F' | 'O';
  date_of_birth?: string;
  phone_number?: string;
  personal_email?: string;
  bank_name?: string;
  bank_account?: string;
  employment_status?: 'ACTIVE' | 'INACTIVE' | 'PROBATION';
  start_date?: string;
  end_date?: string;
  username: string;
  password: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  position_id?: number;
  department_id?: number;
  manager_id?: number;
}

export interface EmployeeUpdateData {
  employee_id?: string;
  full_name?: string;
  gender?: 'M' | 'F' | 'O';
  date_of_birth?: string;
  phone_number?: string;
  personal_email?: string;
  bank_name?: string;
  bank_account?: string;
  employment_status?: 'ACTIVE' | 'INACTIVE' | 'PROBATION';
  start_date?: string;
  end_date?: string;
  user_id?: number;
  position_id?: number;
  department_id?: number;
  manager_id?: number;
}

// Employees API
export const employeesAPI = {
  list: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    employment_status?: string;
    department?: number;
    position?: number;
    gender?: string;
    ordering?: string;
  }): Promise<{
    count: number;
    next: string | null;
    previous: string | null;
    results: Employee[];
  }> => {
    const response: AxiosResponse<{
      count: number;
      next: string | null;
      previous: string | null;
      results: Employee[];
    }> = await managementApi.get('/api-hrm/employees/', { params });
    return response.data;
  },

  getById: async (id: number): Promise<Employee> => {
    const response: AxiosResponse<Employee> = await managementApi.get(`/api-hrm/employees/${id}/`);
    return response.data;
  },

  me: async (): Promise<Employee> => {
    const response: AxiosResponse<Employee> = await managementApi.get('/api-hrm/employees/me/');
    return response.data;
  },

  create: async (data: EmployeeCreateData): Promise<Employee> => {
    const response: AxiosResponse<Employee> = await managementApi.post('/api-hrm/employees/', data);
    return response.data;
  },

  update: async (id: number, data: EmployeeUpdateData): Promise<Employee> => {
    const response: AxiosResponse<Employee> = await managementApi.put(`/api-hrm/employees/${id}/`, data);
    return response.data;
  },

  partialUpdate: async (id: number, data: Partial<EmployeeUpdateData>): Promise<Employee> => {
    const response: AxiosResponse<Employee> = await managementApi.patch(`/api-hrm/employees/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await managementApi.delete(`/api-hrm/employees/${id}/`);
  },

  stats: async (): Promise<{
    total: number;
    active: number;
    inactive: number;
    probation: number;
    department_stats: Array<{
      department_id: number;
      department_name: string;
      count: number;
    }>;
    gender_stats: {
      male: number;
      female: number;
      other: number;
    };
  }> => {
    const response: AxiosResponse<{
      total: number;
      active: number;
      inactive: number;
      probation: number;
      department_stats: Array<{
        department_id: number;
        department_name: string;
        count: number;
      }>;
      gender_stats: {
        male: number;
        female: number;
        other: number;
      };
    }> = await managementApi.get('/api-hrm/employees/stats/');
    return response.data;
  },

  hr_employees: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    employment_status?: string;
    department?: number;
    gender?: string;
    ordering?: string;
  }): Promise<{
    count: number;
    next: string | null;
    previous: string | null;
    results: Employee[];
  }> => {
    const response: AxiosResponse<{
      count: number;
      next: string | null;
      previous: string | null;
      results: Employee[];
    }> = await managementApi.get('/api-hrm/employees/hr_employees/', { params });
    return response.data;
  },

  activate: async (id: number): Promise<Employee> => {
    const response: AxiosResponse<Employee> = await managementApi.post(`/api-hrm/employees/${id}/activate/`);
    return response.data;
  },

  deactivate: async (id: number): Promise<Employee> => {
    const response: AxiosResponse<Employee> = await managementApi.post(`/api-hrm/employees/${id}/deactivate/`);
    return response.data;
  },
};

// Departments API
export const departmentsAPI = {
  list: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    parent_department?: number;
  }): Promise<{
    count: number;
    next: string | null;
    previous: string | null;
    results: Department[];
  }> => {
    const response: AxiosResponse<{
      count: number;
      next: string | null;
      previous: string | null;
      results: Department[];
    }> = await managementApi.get('/api-hrm/departments/', { params });
    return response.data;
  },

  getById: async (id: number): Promise<Department> => {
    const response: AxiosResponse<Department> = await managementApi.get(`/api-hrm/departments/${id}/`);
    return response.data;
  },

  create: async (data: Partial<Department>): Promise<Department> => {
    const response: AxiosResponse<Department> = await managementApi.post('/api-hrm/departments/', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Department>): Promise<Department> => {
    const response: AxiosResponse<Department> = await managementApi.put(`/api-hrm/departments/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await managementApi.delete(`/api-hrm/departments/${id}/`);
  },

  employees: async (id: number, params?: {
    page?: number;
    page_size?: number;
  }): Promise<{
    count: number;
    next: string | null;
    previous: string | null;
    results: Employee[];
  }> => {
    const response: AxiosResponse<{
      count: number;
      next: string | null;
      previous: string | null;
      results: Employee[];
    }> = await managementApi.get(`/api-hrm/departments/${id}/employees/`, { params });
    return response.data;
  },
};

// Positions API
export const positionsAPI = {
  list: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    department?: number;
    is_management?: boolean;
    level?: number;
  }): Promise<{
    count: number;
    next: string | null;
    previous: string | null;
    results: Position[];
  }> => {
    const response: AxiosResponse<{
      count: number;
      next: string | null;
      previous: string | null;
      results: Position[];
    }> = await managementApi.get('/api-hrm/positions/', { params });
    return response.data;
  },

  getById: async (id: number): Promise<Position> => {
    const response: AxiosResponse<Position> = await managementApi.get(`/api-hrm/positions/${id}/`);
    return response.data;
  },

  create: async (data: Partial<Position>): Promise<Position> => {
    const response: AxiosResponse<Position> = await managementApi.post('/api-hrm/positions/', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Position>): Promise<Position> => {
    const response: AxiosResponse<Position> = await managementApi.put(`/api-hrm/positions/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await managementApi.delete(`/api-hrm/positions/${id}/`);
  },

  employees: async (id: number, params?: {
    page?: number;
    page_size?: number;
  }): Promise<{
    count: number;
    next: string | null;
    previous: string | null;
    results: Employee[];
  }> => {
    const response: AxiosResponse<{
      count: number;
      next: string | null;
      previous: string | null;
      results: Employee[];
    }> = await managementApi.get(`/api-hrm/positions/${id}/employees/`, { params });
    return response.data;
  },
};

// Asset API Types
export interface Asset {
  id: number;
  asset_code: string;
  name: string;
  asset_type: string;
  asset_type_display: string;
  brand: string;
  model: string;
  serial_number?: string;
  status: string;
  status_display: string;
  condition: string;
  condition_display: string;
  department?: number;
  department_name?: string;
  assigned_to?: number;
  assigned_to_name?: string;
  assigned_date?: string;
  purchase_date?: string;
  purchase_price: number;
  warranty_expiry?: string;
  invoice_number?: string;
  supplier?: string;
  location?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AssetAssignmentHistory {
  id: number;
  asset: number;
  asset_code: string;
  asset_name: string;
  assigned_to: number;
  assigned_to_name: string;
  assigned_date: string;
  assigned_condition: string;
  assigned_condition_display: string;
  assigned_notes?: string;
  returned_date?: string;
  returned_condition?: string;
  returned_condition_display?: string;
  returned_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AssetMaintenance {
  id: number;
  asset: number;
  asset_code: string;
  asset_name: string;
  maintenance_date: string;
  maintenance_type: string;
  maintenance_type_display: string;
  description: string;
  performed_by?: string;
  performed_by_employee?: number;
  performed_by_employee_name?: string;
  cost: number;
  result: string;
  next_maintenance_date?: string;
  created_at: string;
  updated_at: string;
}

export interface AssetStats {
  total: number;
  in_use: number;
  idle: number;
  under_maintenance: number;
  damaged: number;
  retired: number;
  total_value: number;
  expired_warranty: number;
  type_stats: Array<{
    asset_type: string;
    asset_type_display: string;
    count: number;
  }>;
  department_stats: Array<{
    department_id: number;
    department_name: string;
    count: number;
  }>;
}

// Assets API
export const assetsAPI = {
  list: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    asset_type?: string;
    status?: string;
    condition?: string;
    department?: number;
    assigned_to?: number;
    ordering?: string;
  }): Promise<{
    count: number;
    next: string | null;
    previous: string | null;
    results: Asset[];
  }> => {
    const response: AxiosResponse<{
      count: number;
      next: string | null;
      previous: string | null;
      results: Asset[];
    }> = await managementApi.get('/api-hrm/assets/', { params });
    return response.data;
  },

  getById: async (id: number): Promise<Asset> => {
    const response: AxiosResponse<Asset> = await managementApi.get(`/api-hrm/assets/${id}/`);
    return response.data;
  },

  create: async (data: Partial<Asset>): Promise<Asset> => {
    const response: AxiosResponse<Asset> = await managementApi.post('/api-hrm/assets/', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Asset>): Promise<Asset> => {
    const response: AxiosResponse<Asset> = await managementApi.put(`/api-hrm/assets/${id}/`, data);
    return response.data;
  },

  partialUpdate: async (id: number, data: Partial<Asset>): Promise<Asset> => {
    const response: AxiosResponse<Asset> = await managementApi.patch(`/api-hrm/assets/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await managementApi.delete(`/api-hrm/assets/${id}/`);
  },

  stats: async (): Promise<AssetStats> => {
    const response: AxiosResponse<AssetStats> = await managementApi.get('/api-hrm/assets/stats/');
    return response.data;
  },

  assign: async (id: number, data: {
    employee_id: number;
    assigned_date?: string;
    notes?: string;
  }): Promise<Asset> => {
    const response: AxiosResponse<Asset> = await managementApi.post(`/api-hrm/assets/${id}/assign/`, data);
    return response.data;
  },

  returnAsset: async (id: number, data: {
    return_date?: string;
    condition?: string;
    notes?: string;
  }): Promise<Asset> => {
    const response: AxiosResponse<Asset> = await managementApi.post(`/api-hrm/assets/${id}/return_asset/`, data);
    return response.data;
  },

  assignmentHistory: async (id: number, params?: {
    page?: number;
    page_size?: number;
  }): Promise<{
    count: number;
    next: string | null;
    previous: string | null;
    results: AssetAssignmentHistory[];
  }> => {
    const response: AxiosResponse<{
      count: number;
      next: string | null;
      previous: string | null;
      results: AssetAssignmentHistory[];
    }> = await managementApi.get(`/api-hrm/assets/${id}/assignment_history/`, { params });
    return response.data;
  },

  maintenanceHistory: async (id: number, params?: {
    page?: number;
    page_size?: number;
  }): Promise<{
    count: number;
    next: string | null;
    previous: string | null;
    results: AssetMaintenance[];
  }> => {
    const response: AxiosResponse<{
      count: number;
      next: string | null;
      previous: string | null;
      results: AssetMaintenance[];
    }> = await managementApi.get(`/api-hrm/assets/${id}/maintenance_history/`, { params });
    return response.data;
  },
};

// Asset Assignment History API
export const assetAssignmentsAPI = {
  list: async (params?: {
    page?: number;
    page_size?: number;
    asset?: number;
    assigned_to?: number;
    returned_date?: string;
  }): Promise<{
    count: number;
    next: string | null;
    previous: string | null;
    results: AssetAssignmentHistory[];
  }> => {
    const response: AxiosResponse<{
      count: number;
      next: string | null;
      previous: string | null;
      results: AssetAssignmentHistory[];
    }> = await managementApi.get('/api-hrm/asset-assignments/', { params });
    return response.data;
  },

  currentAssignments: async (params?: {
    page?: number;
    page_size?: number;
  }): Promise<{
    count: number;
    next: string | null;
    previous: string | null;
    results: AssetAssignmentHistory[];
  }> => {
    const response: AxiosResponse<{
      count: number;
      next: string | null;
      previous: string | null;
      results: AssetAssignmentHistory[];
    }> = await managementApi.get('/api-hrm/asset-assignments/current_assignments/', { params });
    return response.data;
  },

  employeeAssignments: async (employeeId: number, params?: {
    page?: number;
    page_size?: number;
  }): Promise<{
    count: number;
    next: string | null;
    previous: string | null;
    results: AssetAssignmentHistory[];
  }> => {
    const response: AxiosResponse<{
      count: number;
      next: string | null;
      previous: string | null;
      results: AssetAssignmentHistory[];
    }> = await managementApi.get(`/api-hrm/asset-assignments/employee_assignments/?employee_id=${employeeId}`, { params });
    return response.data;
  },
};

// Asset Maintenance API
export const assetMaintenanceAPI = {
  list: async (params?: {
    page?: number;
    page_size?: number;
    asset?: number;
    maintenance_type?: string;
    performed_by_employee?: number;
    search?: string;
  }): Promise<{
    count: number;
    next: string | null;
    previous: string | null;
    results: AssetMaintenance[];
  }> => {
    const response: AxiosResponse<{
      count: number;
      next: string | null;
      previous: string | null;
      results: AssetMaintenance[];
    }> = await managementApi.get('/api-hrm/asset-maintenance/', { params });
    return response.data;
  },

  getById: async (id: number): Promise<AssetMaintenance> => {
    const response: AxiosResponse<AssetMaintenance> = await managementApi.get(`/api-hrm/asset-maintenance/${id}/`);
    return response.data;
  },

  create: async (data: Partial<AssetMaintenance>): Promise<AssetMaintenance> => {
    const response: AxiosResponse<AssetMaintenance> = await managementApi.post('/api-hrm/asset-maintenance/', data);
    return response.data;
  },

  update: async (id: number, data: Partial<AssetMaintenance>): Promise<AssetMaintenance> => {
    const response: AxiosResponse<AssetMaintenance> = await managementApi.put(`/api-hrm/asset-maintenance/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await managementApi.delete(`/api-hrm/asset-maintenance/${id}/`);
  },

  upcomingMaintenance: async (params?: {
    page?: number;
    page_size?: number;
  }): Promise<{
    count: number;
    next: string | null;
    previous: string | null;
    results: AssetMaintenance[];
  }> => {
    const response: AxiosResponse<{
      count: number;
      next: string | null;
      previous: string | null;
      results: AssetMaintenance[];
    }> = await managementApi.get('/api-hrm/asset-maintenance/upcoming_maintenance/', { params });
    return response.data;
  },

  assetMaintenanceSummary: async (): Promise<any> => {
    const response: AxiosResponse<any> = await managementApi.get('/api-hrm/asset-maintenance/asset_maintenance_summary/');
    return response.data;
  },
};

// Company Configuration API Types
export interface CompanyConfig {
  id: number;
  code: string;
  name: string;
  description?: string;
  default_working_hours_per_day: number;
  default_working_days_per_week: number;
  overtime_multiplier_weekday: number;
  overtime_multiplier_weekend: number;
  overtime_multiplier_holiday: number;
  late_threshold_minutes: number;
  early_leave_threshold_minutes: number;
  half_day_threshold_hours: number;
  annual_leave_days_per_year: number;
  sick_leave_days_per_year: number;
  maternity_leave_days: number;
  paternity_leave_days: number;
  max_explanation_count_per_month: number;
  supplement_work_hours_per_month: number;
  is_active: boolean;
  effective_from: string;
  effective_to?: string;
  created_by?: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
  is_current?: boolean;
}

export interface ShiftConfig {
  id: number;
  code: string;
  name: string;
  description?: string;
  start_time: string;
  end_time: string;
  break_start_time?: string;
  break_end_time?: string;
  break_duration_minutes?: number;
  total_hours: number;
  working_hours: number;
  shift_type: string;
  shift_type_display: string;
  apply_to_departments?: number[];
  apply_to_positions?: number[];
  apply_to_employees?: number[];
  effective_from: string;
  effective_to?: string;
  is_active: boolean;
  is_default: boolean;
  created_by?: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
  is_current?: boolean;
}

export interface HolidayConfig {
  id: number;
  name: string;
  description?: string;
  holiday_date: string;
  is_recurring: boolean;
  holiday_type: string;
  holiday_type_display: string;
  is_working_day: boolean;
  allow_voluntary_work: boolean;
  overtime_multiplier: number;
  apply_to_all: boolean;
  excluded_departments?: number[];
  excluded_positions?: number[];
  excluded_employees?: number[];
  notes?: string;
  is_active: boolean;
  created_by?: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
  is_today?: boolean;
  is_holiday_today?: boolean;
}

export interface CurrentCompanyConfig {
  company_config?: CompanyConfig;
  current_shifts: ShiftConfig[];
  upcoming_holidays: HolidayConfig[];
  today_holidays: HolidayConfig[];
  today: string;
}

// Company Configuration API
export const companyConfigAPI = {
  // Company Configs
  listCompanyConfigs: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    is_active?: boolean;
    is_current?: string;
    start_date?: string;
    end_date?: string;
    ordering?: string;
  }): Promise<{
    count: number;
    next: string | null;
    previous: string | null;
    results: CompanyConfig[];
  }> => {
    const response: AxiosResponse<{
      count: number;
      next: string | null;
      previous: string | null;
      results: CompanyConfig[];
    }> = await managementApi.get('/api-hrm/company-configs/', { params });
    return response.data;
  },

  getCompanyConfigById: async (id: number): Promise<CompanyConfig> => {
    const response: AxiosResponse<CompanyConfig> = await managementApi.get(`/api-hrm/company-configs/${id}/`);
    return response.data;
  },

  createCompanyConfig: async (data: Partial<CompanyConfig>): Promise<CompanyConfig> => {
    const response: AxiosResponse<CompanyConfig> = await managementApi.post('/api-hrm/company-configs/', data);
    return response.data;
  },

  updateCompanyConfig: async (id: number, data: Partial<CompanyConfig>): Promise<CompanyConfig> => {
    const response: AxiosResponse<CompanyConfig> = await managementApi.put(`/api-hrm/company-configs/${id}/`, data);
    return response.data;
  },

  partialUpdateCompanyConfig: async (id: number, data: Partial<CompanyConfig>): Promise<CompanyConfig> => {
    const response: AxiosResponse<CompanyConfig> = await managementApi.patch(`/api-hrm/company-configs/${id}/`, data);
    return response.data;
  },

  deleteCompanyConfig: async (id: number): Promise<void> => {
    await managementApi.delete(`/api-hrm/company-configs/${id}/`);
  },

  getCurrentCompanyConfig: async (): Promise<CompanyConfig> => {
    const response: AxiosResponse<CompanyConfig> = await managementApi.get('/api-hrm/company-configs/current/');
    return response.data;
  },

  getCompanyConfigStats: async (): Promise<any> => {
    const response: AxiosResponse<any> = await managementApi.get('/api-hrm/company-configs/stats/');
    return response.data;
  },

  // Shift Configs
  listShiftConfigs: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    is_active?: boolean;
    is_default?: boolean;
    shift_type?: string;
    is_current?: string;
    employee_id?: number;
    department_id?: number;
    start_date?: string;
    end_date?: string;
    ordering?: string;
  }): Promise<{
    count: number;
    next: string | null;
    previous: string | null;
    results: ShiftConfig[];
  }> => {
    const response: AxiosResponse<{
      count: number;
      next: string | null;
      previous: string | null;
      results: ShiftConfig[];
    }> = await managementApi.get('/api-hrm/shift-configs/', { params });
    return response.data;
  },

  getShiftConfigById: async (id: number): Promise<ShiftConfig> => {
    const response: AxiosResponse<ShiftConfig> = await managementApi.get(`/api-hrm/shift-configs/${id}/`);
    return response.data;
  },

  createShiftConfig: async (data: Partial<ShiftConfig>): Promise<ShiftConfig> => {
    const response: AxiosResponse<ShiftConfig> = await managementApi.post('/api-hrm/shift-configs/', data);
    return response.data;
  },

  updateShiftConfig: async (id: number, data: Partial<ShiftConfig>): Promise<ShiftConfig> => {
    const response: AxiosResponse<ShiftConfig> = await managementApi.put(`/api-hrm/shift-configs/${id}/`, data);
    return response.data;
  },

  partialUpdateShiftConfig: async (id: number, data: Partial<ShiftConfig>): Promise<ShiftConfig> => {
    const response: AxiosResponse<ShiftConfig> = await managementApi.patch(`/api-hrm/shift-configs/${id}/`, data);
    return response.data;
  },

  deleteShiftConfig: async (id: number): Promise<void> => {
    await managementApi.delete(`/api-hrm/shift-configs/${id}/`);
  },

  getCurrentShiftConfigs: async (): Promise<ShiftConfig[]> => {
    const response: AxiosResponse<ShiftConfig[]> = await managementApi.get('/api-hrm/shift-configs/current/');
    return response.data;
  },

  getEmployeeShiftConfigs: async (employeeId: number): Promise<ShiftConfig[]> => {
    const response: AxiosResponse<ShiftConfig[]> = await managementApi.get(`/api-hrm/shift-configs/employee_shifts/?employee_id=${employeeId}`);
    return response.data;
  },

  getShiftConfigStats: async (): Promise<any> => {
    const response: AxiosResponse<any> = await managementApi.get('/api-hrm/shift-configs/stats/');
    return response.data;
  },

  // Holiday Configs
  listHolidayConfigs: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    is_active?: boolean;
    is_recurring?: boolean;
    holiday_type?: string;
    is_working_day?: boolean;
    allow_voluntary_work?: boolean;
    start_date?: string;
    end_date?: string;
    is_today?: string;
    employee_id?: number;
    ordering?: string;
  }): Promise<{
    count: number;
    next: string | null;
    previous: string | null;
    results: HolidayConfig[];
  }> => {
    const response: AxiosResponse<{
      count: number;
      next: string | null;
      previous: string | null;
      results: HolidayConfig[];
    }> = await managementApi.get('/api-hrm/holiday-configs/', { params });
    return response.data;
  },

  getHolidayConfigById: async (id: number): Promise<HolidayConfig> => {
    const response: AxiosResponse<HolidayConfig> = await managementApi.get(`/api-hrm/holiday-configs/${id}/`);
    return response.data;
  },

  createHolidayConfig: async (data: Partial<HolidayConfig>): Promise<HolidayConfig> => {
    const response: AxiosResponse<HolidayConfig> = await managementApi.post('/api-hrm/holiday-configs/', data);
    return response.data;
  },

  updateHolidayConfig: async (id: number, data: Partial<HolidayConfig>): Promise<HolidayConfig> => {
    const response: AxiosResponse<HolidayConfig> = await managementApi.put(`/api-hrm/holiday-configs/${id}/`, data);
    return response.data;
  },

  partialUpdateHolidayConfig: async (id: number, data: Partial<HolidayConfig>): Promise<HolidayConfig> => {
    const response: AxiosResponse<HolidayConfig> = await managementApi.patch(`/api-hrm/holiday-configs/${id}/`, data);
    return response.data;
  },

  deleteHolidayConfig: async (id: number): Promise<void> => {
    await managementApi.delete(`/api-hrm/holiday-configs/${id}/`);
  },

  getUpcomingHolidays: async (): Promise<HolidayConfig[]> => {
    const response: AxiosResponse<HolidayConfig[]> = await managementApi.get('/api-hrm/holiday-configs/upcoming/');
    return response.data;
  },

  getTodayHolidays: async (): Promise<HolidayConfig[]> => {
    const response: AxiosResponse<HolidayConfig[]> = await managementApi.get('/api-hrm/holiday-configs/today/');
    return response.data;
  },

  getEmployeeHolidays: async (employeeId: number, startDate?: string, endDate?: string): Promise<HolidayConfig[]> => {
    const params: any = { employee_id: employeeId };
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    
    const response: AxiosResponse<HolidayConfig[]> = await managementApi.get('/api-hrm/holiday-configs/employee_holidays/', { params });
    return response.data;
  },

  getHolidayConfigStats: async (): Promise<any> => {
    const response: AxiosResponse<any> = await managementApi.get('/api-hrm/holiday-configs/stats/');
    return response.data;
  },

  // Current Company Config
  getCurrentCompanyConfiguration: async (): Promise<CurrentCompanyConfig> => {
    const response: AxiosResponse<CurrentCompanyConfig> = await managementApi.get('/api-hrm/current-company-config/');
    return response.data;
  },
};

// HRM Company Information API
export const hrmAPI = {
  // Company Documents
  getEmployeeCompanyInfo: async (): Promise<any> => {
    const response: AxiosResponse<any> = await managementApi.get('/api-hrm/company-info/employee/');
    return response.data;
  },

  getCompanyDocuments: async (params?: {
    page?: number;
    page_size?: number;
    document_type?: string;
    access_level?: string;
    department?: number;
    status?: string;
    is_current?: boolean;
    search?: string;
  }): Promise<{
    count: number;
    next: string | null;
    previous: string | null;
    results: any[];
  }> => {
    const response: AxiosResponse<{
      count: number;
      next: string | null;
      previous: string | null;
      results: any[];
    }> = await managementApi.get('/api-hrm/company-documents/', { params });
    return response.data;
  },

  getCompanyDocumentById: async (id: number): Promise<any> => {
    const response: AxiosResponse<any> = await managementApi.get(`/api-hrm/company-documents/${id}/`);
    return response.data;
  },

  recordDocumentView: async (documentId: number): Promise<void> => {
    await managementApi.post(`/api-hrm/company-documents/${documentId}/record-view/`);
  },

  // Company Announcements
  getCompanyAnnouncements: async (params?: {
    page?: number;
    page_size?: number;
    announcement_type?: string;
    priority?: string;
    is_active?: boolean;
    is_current?: boolean;
    search?: string;
  }): Promise<{
    count: number;
    next: string | null;
    previous: string | null;
    results: any[];
  }> => {
    const response: AxiosResponse<{
      count: number;
      next: string | null;
      previous: string | null;
      results: any[];
    }> = await managementApi.get('/api-hrm/company-announcements/', { params });
    return response.data;
  },

  getCompanyAnnouncementById: async (id: number): Promise<any> => {
    const response: AxiosResponse<any> = await managementApi.get(`/api-hrm/company-announcements/${id}/`);
    return response.data;
  },

  acknowledgeAnnouncement: async (announcementId: number): Promise<void> => {
    await managementApi.post(`/api-hrm/company-announcements/${announcementId}/acknowledge/`);
  },

  // Company Policies
  getCompanyPolicies: async (params?: {
    page?: number;
    page_size?: number;
    policy_type?: string;
    is_active?: boolean;
    search?: string;
  }): Promise<{
    count: number;
    next: string | null;
    previous: string | null;
    results: any[];
  }> => {
    const response: AxiosResponse<{
      count: number;
      next: string | null;
      previous: string | null;
      results: any[];
    }> = await managementApi.get('/api-hrm/company-policies/', { params });
    return response.data;
  },

  // Company Procedures
  getCompanyProcedures: async (params?: {
    page?: number;
    page_size?: number;
    department?: number;
    is_active?: boolean;
    search?: string;
  }): Promise<{
    count: number;
    next: string | null;
    previous: string | null;
    results: any[];
  }> => {
    const response: AxiosResponse<{
      count: number;
      next: string | null;
      previous: string | null;
      results: any[];
    }> = await managementApi.get('/api-hrm/company-procedures/', { params });
    return response.data;
  },

  // Company Forms
  getCompanyForms: async (params?: {
    page?: number;
    page_size?: number;
    form_type?: string;
    department?: number;
    is_active?: boolean;
    search?: string;
  }): Promise<{
    count: number;
    next: string | null;
    previous: string | null;
    results: any[];
  }> => {
    const response: AxiosResponse<{
      count: number;
      next: string | null;
      previous: string | null;
      results: any[];
    }> = await managementApi.get('/api-hrm/company-forms/', { params });
    return response.data;
  },

  // Company Training Materials
  getCompanyTrainingMaterials: async (params?: {
    page?: number;
    page_size?: number;
    training_type?: string;
    department?: number;
    is_active?: boolean;
    search?: string;
  }): Promise<{
    count: number;
    next: string | null;
    previous: string | null;
    results: any[];
  }> => {
    const response: AxiosResponse<{
      count: number;
      next: string | null;
      previous: string | null;
      results: any[];
    }> = await managementApi.get('/api-hrm/company-training-materials/', { params });
    return response.data;
  },

  // Company Stats
  getCompanyInfoStats: async (): Promise<any> => {
    const response: AxiosResponse<any> = await managementApi.get('/api-hrm/company-info/stats/');
    return response.data;
  },
};

// Attendance Rule Configuration API Types
export interface AttendanceRuleConfig {
  id: number;
  code: string;
  name: string;
  description?: string;
  rule_type: string;
  rule_type_display: string;
  configuration: any;
  work_hours_calculation?: any;
  late_early_config?: any;
  overtime_config?: any;
  break_time_config?: any;
  apply_to_all: boolean;
  apply_to_departments?: number[];
  apply_to_positions?: number[];
  apply_to_employees?: number[];
  is_active: boolean;
  is_default: boolean;
  effective_from: string;
  effective_to?: string;
  created_by?: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
  is_current?: boolean;
}

export interface AttendanceRuleHistory {
  id: number;
  attendance: number;
  attendance_code: string;
  attendance_date: string;
  rule: number;
  rule_code: string;
  rule_name: string;
  applied_by?: number;
  applied_by_name?: string;
  applied_at: string;
  calculation_result: any;
  notes?: string;
  created_at: string;
}

export interface LeavePolicyConfig {
  id: number;
  code: string;
  name: string;
  description?: string;
  leave_type: string;
  leave_type_display: string;
  max_days_per_year: number;
  max_consecutive_days: number;
  advance_notice_days: number;
  emergency_notice_hours: number;
  requires_approval: boolean;
  requires_medical_certificate: boolean;
  medical_certificate_days_threshold: number;
  allow_half_day: boolean;
  allow_carry_over: boolean;
  max_carry_over_days: number;
  apply_to_all: boolean;
  apply_to_departments?: number[];
  apply_to_positions?: number[];
  apply_to_employees?: number[];
  is_active: boolean;
  effective_from: string;
  effective_to?: string;
  created_by?: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
  is_current?: boolean;
}

export interface AttendanceRuleEngineRequest {
  employee_id: number;
  attendance_date: string;
  check_in?: string;
  check_out?: string;
  shift_type?: string;
  rule_id?: number;
}

export interface AttendanceRuleEngineResponse {
  status: string;
  applied_rule?: AttendanceRuleConfig;
  calculation_result: any;
  work_hours: number;
  work_coefficient: number;
  late_minutes?: number;
  early_leave_minutes?: number;
  overtime_hours?: number;
  break_time_minutes?: number;
  notes?: string;
}

// Attendance Rule Configuration API
export const attendanceRuleAPI = {
  // Attendance Rule Configs
  listAttendanceRuleConfigs: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    rule_type?: string;
    is_active?: boolean;
    is_default?: boolean;
    is_current?: string;
    employee_id?: number;
    department_id?: number;
    position_id?: number;
    start_date?: string;
    end_date?: string;
    ordering?: string;
  }): Promise<{
    count: number;
    next: string | null;
    previous: string | null;
    results: AttendanceRuleConfig[];
  }> => {
    const response: AxiosResponse<{
      count: number;
      next: string | null;
      previous: string | null;
      results: AttendanceRuleConfig[];
    }> = await managementApi.get('/api-hrm/attendance-rule-configs/', { params });
    return response.data;
  },

  getAttendanceRuleConfigById: async (id: number): Promise<AttendanceRuleConfig> => {
    const response: AxiosResponse<AttendanceRuleConfig> = await managementApi.get(`/api-hrm/attendance-rule-configs/${id}/`);
    return response.data;
  },

  createAttendanceRuleConfig: async (data: Partial<AttendanceRuleConfig>): Promise<AttendanceRuleConfig> => {
    const response: AxiosResponse<AttendanceRuleConfig> = await managementApi.post('/api-hrm/attendance-rule-configs/', data);
    return response.data;
  },

  updateAttendanceRuleConfig: async (id: number, data: Partial<AttendanceRuleConfig>): Promise<AttendanceRuleConfig> => {
    const response: AxiosResponse<AttendanceRuleConfig> = await managementApi.put(`/api-hrm/attendance-rule-configs/${id}/`, data);
    return response.data;
  },

  partialUpdateAttendanceRuleConfig: async (id: number, data: Partial<AttendanceRuleConfig>): Promise<AttendanceRuleConfig> => {
    const response: AxiosResponse<AttendanceRuleConfig> = await managementApi.patch(`/api-hrm/attendance-rule-configs/${id}/`, data);
    return response.data;
  },

  deleteAttendanceRuleConfig: async (id: number): Promise<void> => {
    await managementApi.delete(`/api-hrm/attendance-rule-configs/${id}/`);
  },

  getCurrentAttendanceRuleConfigs: async (): Promise<AttendanceRuleConfig[]> => {
    const response: AxiosResponse<AttendanceRuleConfig[]> = await managementApi.get('/api-hrm/attendance-rule-configs/current/');
    return response.data;
  },

  getEmployeeAttendanceRuleConfigs: async (employeeId: number): Promise<AttendanceRuleConfig[]> => {
    const response: AxiosResponse<AttendanceRuleConfig[]> = await managementApi.get(`/api-hrm/attendance-rule-configs/employee_rules/?employee_id=${employeeId}`);
    return response.data;
  },

  getAttendanceRuleConfigStats: async (): Promise<any> => {
    const response: AxiosResponse<any> = await managementApi.get('/api-hrm/attendance-rule-configs/stats/');
    return response.data;
  },

  // Attendance Rule History
  listAttendanceRuleHistory: async (params?: {
    page?: number;
    page_size?: number;
    attendance?: number;
    rule?: number;
    applied_by?: number;
    start_date?: string;
    end_date?: string;
    ordering?: string;
  }): Promise<{
    count: number;
    next: string | null;
    previous: string | null;
    results: AttendanceRuleHistory[];
  }> => {
    const response: AxiosResponse<{
      count: number;
      next: string | null;
      previous: string | null;
      results: AttendanceRuleHistory[];
    }> = await managementApi.get('/api-hrm/attendance-rule-history/', { params });
    return response.data;
  },

  getAttendanceRuleHistoryById: async (id: number): Promise<AttendanceRuleHistory> => {
    const response: AxiosResponse<AttendanceRuleHistory> = await managementApi.get(`/api-hrm/attendance-rule-history/${id}/`);
    return response.data;
  },

  // Leave Policy Configs
  listLeavePolicyConfigs: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    leave_type?: string;
    is_active?: boolean;
    is_current?: string;
    employee_id?: number;
    department_id?: number;
    position_id?: number;
    start_date?: string;
    end_date?: string;
    ordering?: string;
  }): Promise<{
    count: number;
    next: string | null;
    previous: string | null;
    results: LeavePolicyConfig[];
  }> => {
    const response: AxiosResponse<{
      count: number;
      next: string | null;
      previous: string | null;
      results: LeavePolicyConfig[];
    }> = await managementApi.get('/api-hrm/leave-policy-configs/', { params });
    return response.data;
  },

  getLeavePolicyConfigById: async (id: number): Promise<LeavePolicyConfig> => {
    const response: AxiosResponse<LeavePolicyConfig> = await managementApi.get(`/api-hrm/leave-policy-configs/${id}/`);
    return response.data;
  },

  createLeavePolicyConfig: async (data: Partial<LeavePolicyConfig>): Promise<LeavePolicyConfig> => {
    const response: AxiosResponse<LeavePolicyConfig> = await managementApi.post('/api-hrm/leave-policy-configs/', data);
    return response.data;
  },

  updateLeavePolicyConfig: async (id: number, data: Partial<LeavePolicyConfig>): Promise<LeavePolicyConfig> => {
    const response: AxiosResponse<LeavePolicyConfig> = await managementApi.put(`/api-hrm/leave-policy-configs/${id}/`, data);
    return response.data;
  },

  partialUpdateLeavePolicyConfig: async (id: number, data: Partial<LeavePolicyConfig>): Promise<LeavePolicyConfig> => {
    const response: AxiosResponse<LeavePolicyConfig> = await managementApi.patch(`/api-hrm/leave-policy-configs/${id}/`, data);
    return response.data;
  },

  deleteLeavePolicyConfig: async (id: number): Promise<void> => {
    await managementApi.delete(`/api-hrm/leave-policy-configs/${id}/`);
  },

  getCurrentLeavePolicyConfigs: async (): Promise<LeavePolicyConfig[]> => {
    const response: AxiosResponse<LeavePolicyConfig[]> = await managementApi.get('/api-hrm/leave-policy-configs/current/');
    return response.data;
  },

  getEmployeeLeavePolicyConfigs: async (employeeId: number): Promise<LeavePolicyConfig[]> => {
    const response: AxiosResponse<LeavePolicyConfig[]> = await managementApi.get(`/api-hrm/leave-policy-configs/employee_policies/?employee_id=${employeeId}`);
    return response.data;
  },

  calculateAdvanceNotice: async (data: {
    employee_id: number;
    leave_type: string;
    total_days: number;
    start_date?: string;
  }): Promise<{
    required_advance_notice_days: number;
    required_advance_notice_hours: number;
    is_emergency: boolean;
    can_request: boolean;
    message: string;
  }> => {
    const response: AxiosResponse<{
      required_advance_notice_days: number;
      required_advance_notice_hours: number;
      is_emergency: boolean;
      can_request: boolean;
      message: string;
    }> = await managementApi.post('/api-hrm/leave-policy-configs/calculate_advance_notice/', data);
    return response.data;
  },

  getLeavePolicyConfigStats: async (): Promise<any> => {
    const response: AxiosResponse<any> = await managementApi.get('/api-hrm/leave-policy-configs/stats/');
    return response.data;
  },

  // Attendance Rule Engine
  calculateAttendance: async (data: AttendanceRuleEngineRequest): Promise<AttendanceRuleEngineResponse> => {
    const response: AxiosResponse<AttendanceRuleEngineResponse> = await managementApi.post('/api-hrm/attendance-rule-engine/', data);
    return response.data;
  },

  testRuleApplication: async (params?: {
    employee_id?: number;
    rule_id?: number;
    date?: string;
  }): Promise<AttendanceRuleEngineResponse> => {
    const response: AxiosResponse<AttendanceRuleEngineResponse> = await managementApi.get('/api-hrm/attendance-rule-engine/test_rule_application/', { params });
    return response.data;
  },
};

// Update default export to include attendance rule APIs
export default {
  auth: authAPI,
  chatbots: chatbotsAPI,
  documents: documentsAPI,
  botPermissions: botPermissionsAPI,
  conversations: conversationsAPI,
  users: usersAPI,
  health: healthAPI,
  facebook: facebookAPI,
  permissions: permissionsAPI,
  roles: rolesAPI,
  media: mediaAPI,
  domains: domainsAPI,
  employees: employeesAPI,
  departments: departmentsAPI,
  positions: positionsAPI,
  assets: assetsAPI,
  assetAssignments: assetAssignmentsAPI,
  assetMaintenance: assetMaintenanceAPI,
  hrm: hrmAPI,
  attendanceRule: attendanceRuleAPI,
};
