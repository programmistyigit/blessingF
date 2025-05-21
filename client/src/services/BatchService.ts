import { baseHost } from '@/lib/host';
import { getToken } from '@/lib/auth';

export interface Batch {
  id: string;
  batchNumber: string;
  startDate: string;
  birdCount: number;
  initialWeight: number;
  currentWeight?: number;
  mortality?: number;
  section: {
    id: string;
    name: string;
  };
  status: BatchStatus;
  expectedFinishDate: string;
  actualFinishDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type BatchStatus = 'preparing' | 'active' | 'completed' | 'slaughtered' | 'cancelled';

export interface BatchFilterParams {
  page?: number;
  limit?: number;
  status?: string;
  section?: string;
  startDate?: string;
  endDate?: string;
}

export interface BatchCreateData {
  batchNumber: string;
  startDate: string;
  birdCount: number;
  initialWeight: number;
  section: string;
  expectedFinishDate: string;
  notes?: string;
}

export interface BatchUpdateData {
  batchNumber?: string;
  currentWeight?: number;
  mortality?: number;
  status?: BatchStatus;
  expectedFinishDate?: string;
  actualFinishDate?: string;
  notes?: string;
}

export interface BatchesResponse {
  batches: Batch[];
  total: number;
  totalPages: number;
  currentPage: number;
}

export interface BatchResponse {
  batch: Batch;
}

class BatchServiceClass {
  private async request<T>(url: string, method: string = 'GET', data?: any): Promise<T> {
    const token = getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      method,
      headers,
    };

    if (data) {
      config.body = JSON.stringify(data);
    }

    const response = await fetch(`${baseHost}${url}`, config);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Api so\'rovida xatolik');
    }

    return await response.json();
  }

  async createBatch(batchData: BatchCreateData): Promise<BatchResponse> {
    const response = await this.request<{
      success: boolean;
      message: string;
      data: BatchResponse;
    }>('/api/batches', 'POST', batchData);
    return response.data;
  }

  async updateBatch(batchId: string, batchData: BatchUpdateData): Promise<BatchResponse> {
    const response = await this.request<{
      success: boolean;
      message: string;
      data: BatchResponse;
    }>(`/api/batches/${batchId}`, 'PUT', batchData);
    return response.data;
  }

  async getBatch(batchId: string): Promise<BatchResponse> {
    const response = await this.request<{
      success: boolean;
      data: BatchResponse;
    }>(`/api/batches/${batchId}`);
    return response.data;
  }

  async getAllBatches(params?: BatchFilterParams): Promise<BatchesResponse> {
    let url = '/api/batches';
    if (params) {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }
    }
    const response = await this.request<{
      success: boolean;
      data: BatchesResponse;
    }>(url);
    return response.data;
  }

  async deleteBatch(batchId: string): Promise<{ success: boolean; message: string }> {
    return await this.request<{ success: boolean; message: string }>(
      `/api/batches/${batchId}`,
      'DELETE'
    );
  }

  async getBatchGrowthData(batchId: string): Promise<{ 
    dates: string[]; 
    weights: number[]; 
    mortality: number[];
    feedConsumption: number[];
  }> {
    const response = await this.request<{
      success: boolean;
      data: { 
        dates: string[]; 
        weights: number[]; 
        mortality: number[];
        feedConsumption: number[];
      };
    }>(`/api/batches/${batchId}/growth`);
    return response.data;
  }
}

export const BatchService = new BatchServiceClass();