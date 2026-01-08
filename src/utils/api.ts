import axios, { AxiosInstance, AxiosResponse } from 'axios';

// API Configuration
const API_BASE_URL = "https://beautycare-uat.amcare.vn"
// Create axios instance for Management API
const managementApi: AxiosInstance = axios.create({
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
    const response: AxiosResponse<{ access: string; refresh: string; user: any }> =
      await managementApi.post('/api-hrm/users/token/', credentials);
    
    // Convert the response to match the expected AuthResponse format
    return {
      user: {
        id: response.data.user.id.toString(),
        username: response.data.user.username,
        email: response.data.user.email || '',
        firstName: response.data.user.first_name || '',
        lastName: response.data.user.last_name || '',
        phone: response.data.user.phone_number || '',
        role: response.data.user.role || 'user',
        isActive: response.data.user.is_active !== undefined ? response.data.user.is_active : true,
        lastLoginAt: new Date().toISOString(),
        loginCount: 0,
        emailVerified: false,
        phoneVerified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
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
    
    // The API returns user fields directly at the top level, not wrapped in a 'user' object
    const userData = response.data;
    return {
      user: {
        id: userData.user_id.toString(),
        username: userData.username,
        email: userData.email || '',
        firstName: userData.first_name || '',
        lastName: userData.last_name || '',
        phone: userData.phone_number || userData.username || '', // phone_number might not be in response
        role: userData.role || 'user',
        isActive: userData.is_active !== undefined ? userData.is_active : true,
        lastLoginAt: new Date().toISOString(),
        loginCount: 0,
        emailVerified: false,
        phoneVerified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
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
  department?: number;
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
};
