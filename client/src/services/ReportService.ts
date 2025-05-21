import { baseHost } from '@/lib/host';
import { getToken } from '@/lib/auth';

// Report interfaces
export interface DailyReportData {
  mortality: number;
  culls: number;
  averageWeight: number;
  weightSampleSize: number;
  feedConsumption: number;
  waterConsumption: number;
  temperature: {
    min: number;
    max: number;
    average: number;
  };
  humidity: {
    min: number;
    max: number;
    average: number;
  };
  healthIssues: string;
  observations: string;
}

export interface CalculatedMetrics {
  totalMortality: number;
  totalBirds: number;
  mortalityRate: number;
  feedConversionRatio: number;
  waterFeedRatio: number;
  dailyWeightGain: number;
  growthEfficiency: number;
  performanceIndex?: number;
}

export interface Report {
  id: string;
  type: ReportType;
  date: string;
  batch: {
    id: string;
    batchNumber: string;
    section: {
      id: string;
      name: string;
    };
    period?: {
      id: string;
      name: string;
    };
    day?: number;
  };
  data: DailyReportData;
  calculatedMetrics: CalculatedMetrics;
  previous?: {
    id: string;
    date: string;
    averageWeight: number;
    mortality: number;
  };
  submittedBy: {
    id: string;
    name: string;
  };
  approvedBy?: {
    id: string;
    name: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReportSummary {
  id: string;
  type: ReportType;
  date: string;
  batch: {
    id: string;
    batchNumber: string;
  };
  section: {
    id: string;
    name: string;
  };
  summary: {
    mortality: number;
    averageWeight: number;
    feedConsumption: number;
  };
  submittedBy: {
    id: string;
    name: string;
  };
  createdAt: string;
}

export type ReportType = 'daily' | 'weekly' | 'monthly' | 'special';

export interface ReportFilterParams {
  type?: ReportType;
  batchId?: string;
  sectionId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface CreateReportData {
  type: ReportType;
  date: string;
  batchId: string;
  data: DailyReportData;
}

export interface UpdateReportData {
  data: Partial<DailyReportData>;
}

export interface GenerateReportData {
  reportType: ReportType;
  startDate: string;
  endDate: string;
  batchId?: string;
  sectionId?: string;
  metrics: string[];
  format?: 'json' | 'excel' | 'pdf';
  title?: string;
}

export interface ComparePeriodData {
  periods: {
    id: string;
    name: string;
  }[];
  metrics: string[];
  format?: 'json' | 'excel' | 'pdf';
}

export interface CompareSectionData {
  sections: string[];
  startDate: string;
  endDate: string;
  metrics: string[];
  format?: 'json' | 'excel' | 'pdf';
}

export interface BatchReportData {
  startDate: string;
  endDate: string;
  metrics: string[];
  format?: 'json' | 'excel' | 'pdf';
}

export interface ReportsResponse {
  reports: ReportSummary[];
  total: number;
  totalPages: number;
  currentPage: number;
}

export interface ReportResponse {
  report: Report;
}

export interface ReportStats {
  period: {
    startDate: string;
    endDate: string;
  };
  overall: {
    totalReports: number;
    byType: {
      [key: string]: number;
    };
    bySection: {
      id: string;
      name: string;
      count: number;
    }[];
    byUser: {
      id: string;
      name: string;
      count: number;
    }[];
  };
  latestReports: {
    daily?: {
      id: string;
      date: string;
      batch: string;
      section: string;
    };
    weekly?: {
      id: string;
      startDate: string;
      endDate: string;
      section: string;
    };
  };
  activityTimeline: {
    date: string;
    reportCount: number;
  }[];
}

class ReportServiceClass {
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

  async createReport(reportData: CreateReportData): Promise<Report> {
    const response = await this.request<{
      success: boolean;
      message: string;
      report: Report;
    }>('/api/reports', 'POST', reportData);
    return response.report;
  }

  async getReports(params?: ReportFilterParams): Promise<ReportsResponse> {
    let url = '/api/reports';
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
      data: ReportsResponse;
    }>(url);
    return response.data;
  }

  async getReport(id: string): Promise<Report> {
    const response = await this.request<{
      success: boolean;
      report: Report;
    }>(`/api/reports/${id}`);
    return response.report;
  }

  async updateReport(id: string, updateData: UpdateReportData): Promise<Report> {
    const response = await this.request<{
      success: boolean;
      message: string;
      report: Report;
    }>(`/api/reports/${id}`, 'PUT', updateData);
    return response.report;
  }

  async deleteReport(id: string): Promise<{ success: boolean; message: string }> {
    return await this.request<{ success: boolean; message: string }>(
      `/api/reports/${id}`,
      'DELETE'
    );
  }

  async generateReport(data: GenerateReportData): Promise<any> {
    const response = await this.request<{
      success: boolean;
      data: any;
    }>('/api/reports/generate', 'POST', data);
    return response.data;
  }

  async getReportStats(startDate?: string, endDate?: string): Promise<ReportStats> {
    let url = '/api/reports/stats';
    if (startDate || endDate) {
      const queryParams = new URLSearchParams();
      if (startDate) {
        queryParams.append('startDate', startDate);
      }
      if (endDate) {
        queryParams.append('endDate', endDate);
      }
      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }
    }
    const response = await this.request<{
      success: boolean;
      data: ReportStats;
    }>(url);
    return response.data;
  }

  async comparePeriods(data: ComparePeriodData): Promise<any> {
    const response = await this.request<{
      success: boolean;
      data: any;
    }>('/api/reports/compare-periods', 'POST', data);
    return response.data;
  }

  async compareSections(data: CompareSectionData): Promise<any> {
    const response = await this.request<{
      success: boolean;
      data: any;
    }>('/api/reports/compare-sections', 'POST', data);
    return response.data;
  }

  async getBatchReport(batchId: string, data: BatchReportData): Promise<any> {
    const response = await this.request<{
      success: boolean;
      data: any;
    }>(`/api/reports/batch/${batchId}`, 'POST', data);
    return response.data;
  }

  async exportReport(id: string, format: 'excel' | 'pdf' = 'excel'): Promise<Blob> {
    const token = getToken();
    const headers: HeadersInit = {
      'Authorization': `Bearer ${token || ''}`,
    };

    const response = await fetch(`${baseHost}/api/reports/${id}/export?format=${format}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Hisobotni export qilishda xatolik');
    }

    return await response.blob();
  }
}

export const ReportService = new ReportServiceClass();