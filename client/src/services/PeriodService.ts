import { baseHost } from '@/lib/host';
import { getToken } from '@/lib/auth';

// Period status enum
export enum PeriodStatus {
  ACTIVE = 'active',
  PLANNED = 'planned',
  COMPLETED = 'completed'
}

// Period related types
export interface Period {
  id: string;
  name: string;
  code: string;
  startDate: string;
  endDate: string;
  status: string;
  description?: string;
  sections: string[];
}

// Response types
export interface PeriodsResponse {
  data: Period[];
  total: number;
  totalPages: number;
  currentPage: number;
}

export interface PeriodResponse {
  period: Period;
}

// Period service class
class PeriodServiceClass {
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

  // Period methods
  async getAllPeriods(): Promise<PeriodsResponse> {
    const response = await this.request<{
      success: boolean;
      data: PeriodsResponse;
    }>('/api/periods');
    return response.data;
  }

  async getPeriod(id: string): Promise<Period> {
    const response = await this.request<{
      success: boolean;
      period: Period;
    }>(`/api/periods/${id}`);
    return response.period;
  }

  async createPeriod(periodData: any): Promise<Period> {
    const response = await this.request<{
      success: boolean;
      message: string;
      period: Period;
    }>('/api/periods', 'POST', periodData);
    return response.period;
  }

  async updatePeriod(id: string, periodData: any): Promise<Period> {
    const response = await this.request<{
      success: boolean;
      message: string;
      period: Period;
    }>(`/api/periods/${id}`, 'PUT', periodData);
    return response.period;
  }

  async deletePeriod(id: string): Promise<{ success: boolean; message: string }> {
    return await this.request<{ success: boolean; message: string }>(
      `/api/periods/${id}`,
      'DELETE'
    );
  }
}

export const PeriodService = new PeriodServiceClass();