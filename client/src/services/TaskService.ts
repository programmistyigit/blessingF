import { baseHost } from '@/lib/host';
import { getToken } from '@/lib/auth';

export interface Task {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  section: {
    id: string;
    name: string;
  };
  batch?: {
    id: string;
    batchNumber: string;
  };
  assignedTo: {
    id: string;
    name: string;
  }[];
  supervisors: {
    id: string;
    name: string;
  }[];
  priority: TaskPriority;
  status: TaskStatus;
  startDate: string;
  dueDate: string;
  isRecurring: boolean;
  notes?: string;
  completionPercentage: number;
  createdBy: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'overdue';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TaskType = 'feeding' | 'cleaning' | 'vaccination' | 'maintenance' | 'measurement' | 'medication' | 'other';

export interface TaskFilterParams {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  section?: string;
  batch?: string;
  assignedTo?: string;
  startDate?: string;
  endDate?: string;
  isOverdue?: boolean;
}

export interface TaskCreateData {
  title: string;
  description: string;
  type: TaskType;
  section: string;
  batch?: string;
  assignedTo: string[];
  supervisors: string[];
  priority: TaskPriority;
  startDate: string;
  dueDate: string;
  isRecurring: boolean;
  notes?: string;
}

export interface TaskUpdateData {
  title?: string;
  description?: string;
  type?: TaskType;
  section?: string;
  batch?: string;
  assignedTo?: string[];
  supervisors?: string[];
  priority?: TaskPriority;
  startDate?: string;
  dueDate?: string;
  isRecurring?: boolean;
  notes?: string;
}

export interface TaskStatusUpdateData {
  status: TaskStatus;
  completionPercentage?: number;
  notes?: string;
}

export interface TasksResponse {
  tasks: Task[];
  total: number;
  totalPages: number;
  currentPage: number;
}

export interface TaskResponse {
  task: Task;
}

class TaskServiceClass {
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

  async createTask(taskData: TaskCreateData): Promise<TaskResponse> {
    const response = await this.request<{
      success: boolean;
      message: string;
      data: TaskResponse;
    }>('/api/tasks', 'POST', taskData);
    return response.data;
  }

  async updateTask(taskId: string, taskData: TaskUpdateData): Promise<TaskResponse> {
    const response = await this.request<{
      success: boolean;
      message: string;
      data: TaskResponse;
    }>(`/api/tasks/${taskId}`, 'PUT', taskData);
    return response.data;
  }

  async updateTaskStatus(taskId: string, statusData: TaskStatusUpdateData): Promise<TaskResponse> {
    const response = await this.request<{
      success: boolean;
      message: string;
      data: TaskResponse;
    }>(`/api/tasks/${taskId}/status`, 'POST', statusData);
    return response.data;
  }

  async getTask(taskId: string): Promise<TaskResponse> {
    const response = await this.request<{
      success: boolean;
      data: TaskResponse;
    }>(`/api/tasks/${taskId}`);
    return response.data;
  }

  async getTasks(params?: TaskFilterParams): Promise<TasksResponse> {
    let url = '/api/tasks';
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
      data: TasksResponse;
    }>(url);
    return response.data;
  }

  async getMyTasks(params?: TaskFilterParams): Promise<TasksResponse> {
    let url = '/api/tasks/my';
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
      data: TasksResponse;
    }>(url);
    return response.data;
  }

  async getOverdueTasks(params?: TaskFilterParams): Promise<TasksResponse> {
    let url = '/api/tasks/overdue';
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
      data: TasksResponse;
    }>(url);
    return response.data;
  }

  async getSectionTasks(sectionId: string, params?: TaskFilterParams): Promise<TasksResponse> {
    let url = `/api/sections/${sectionId}/tasks`;
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
      data: TasksResponse;
    }>(url);
    return response.data;
  }

  async getBatchTasks(batchId: string, params?: TaskFilterParams): Promise<TasksResponse> {
    let url = `/api/batches/${batchId}/tasks`;
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
      data: TasksResponse;
    }>(url);
    return response.data;
  }

  async createPeriodStartTasks(periodId: string, data: { section: string; assignedTo: string[] }): Promise<{
    tasks: { id: string; title: string; type: TaskType; priority: TaskPriority; status: TaskStatus }[];
    total: number;
  }> {
    const response = await this.request<{
      success: boolean;
      message: string;
      data: {
        tasks: { id: string; title: string; type: TaskType; priority: TaskPriority; status: TaskStatus }[];
        total: number;
      };
    }>(`/api/periods/${periodId}/start-tasks`, 'POST', data);
    return response.data;
  }
}

export const TaskService = new TaskServiceClass();