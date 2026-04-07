import type { AxiosResponse } from 'axios';
import { managementApi } from './client';
import type {
  Asset,
  AssetAssignmentHistory,
  AssetMaintenance,
  AssetStats,
} from './types';

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
    show_deleted?: boolean;
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

  delete: async (id: number): Promise<void> => {
    await managementApi.delete(`/api-hrm/assets/${id}/`);
  },

  restore: async (id: number): Promise<Asset> => {
    const response: AxiosResponse<Asset> = await managementApi.post(`/api-hrm/assets/${id}/restore/`);
    return response.data;
  },

  partialUpdate: async (id: number, data: Partial<Asset>): Promise<Asset> => {
    const response: AxiosResponse<Asset> = await managementApi.patch(`/api-hrm/assets/${id}/`, data);
    return response.data;
  },

  stats: async (): Promise<AssetStats> => {
    const response: AxiosResponse<AssetStats> = await managementApi.get('/api-hrm/assets/stats/');
    return response.data;
  },

  assign: async (id: number, data: {
    employee_id: number;
    assigned_date?: string;
    notes?: string;
    force?: boolean;
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

  assignedAssets: async (): Promise<Asset[]> => {
    const response: AxiosResponse<Asset[]> = await managementApi.get('/api-hrm/assets/assigned_assets/');
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
