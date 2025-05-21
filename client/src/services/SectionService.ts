import { baseHost } from '@/lib/host';
import { getToken } from '@/lib/auth';

// Section related types
export interface Section {
  id: string;
  name: string;
  code: string;
  capacity: number;
  status: string;
  manager?: {
    id: string;
    name: string;
  };
  description?: string;
  location?: string;
  equipmentDetails?: any;
}

// Response types
export interface SectionsResponse {
  sections?: Section[];
  total?: number;
  totalPages?: number;
  currentPage?: number;
  data?: Section[];
  success?: boolean;
}

export interface SectionResponse {
  section: Section;
}

// Section service class
class SectionServiceClass {
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

  // Section methods
  async getAllSections(): Promise<SectionsResponse> {
    const response = await this.request<any>('/api/sections');
    
    // API ikkita turli formatdagi javoblarni qaytarishi mumkin
    if (response.data && Array.isArray(response.data)) {
      // API {success: true, data: Section[]} format qaytarilgan
      return {
        sections: response.data,
        success: response.success
      };
    } else if (response.data && response.data.sections) {
      // Eski format: {success: true, data: SectionsResponse}
      return response.data;
    } else if (response.sections) {
      // To'g'ridan-to'g'ri sections massivi qaytarilgan
      return response;
    } else {
      // Ma'lumot topilmadi
      console.warn('Sections API qaytarilgan formatni tanib bo\'lmadi:', response);
      return {
        sections: [],
        success: true,
      };
    }
  }

  async getSection(id: string): Promise<Section> {
    const response = await this.request<{
      success: boolean;
      section: Section;
    }>(`/api/sections/${id}`);
    return response.section;
  }

  async createSection(sectionData: any): Promise<Section> {
    const response = await this.request<{
      success: boolean;
      message: string;
      section: Section;
    }>('/api/sections', 'POST', sectionData);
    return response.section;
  }

  async updateSection(id: string, sectionData: any): Promise<Section> {
    const response = await this.request<{
      success: boolean;
      message: string;
      section: Section;
    }>(`/api/sections/${id}`, 'PUT', sectionData);
    return response.section;
  }

  async deleteSection(id: string): Promise<{ success: boolean; message: string }> {
    return await this.request<{ success: boolean; message: string }>(
      `/api/sections/${id}`,
      'DELETE'
    );
  }

  // Section status methods
  async updateSectionStatus(id: string, status: string): Promise<Section> {
    const response = await this.request<{
      success: boolean;
      message: string;
      section: Section;
    }>(`/api/sections/sections/${id}/status`, 'PUT', { status });
    return response.section;
  }

  // Section report methods
  async getSectionReport(sectionId: string, reportParams: any): Promise<any> {
    const response = await this.request<{
      success: boolean;
      data: any;
    }>(`/api/sections/sections/${sectionId}/report`, 'POST', reportParams);
    return response.data;
  }

  async exportSectionReport(sectionId: string, reportParams: any, format: 'pdf' | 'excel'): Promise<Blob> {
    const token = getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token || ''}`,
    };

    const response = await fetch(`${baseHost}/api/sections/sections/${sectionId}/report/export?format=${format}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(reportParams),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Hisobotni export qilishda xatolik');
    }

    return await response.blob();
  }
}

export const SectionService = new SectionServiceClass();