import { baseHost } from '@/lib/host';
import { getToken } from '@/lib/auth';

// User related types
export interface User {
  id: string;
  name: string;
  phoneNumber: string;
  role: string;
  section?: {
    id: string;
    name: string;
  };
  position?: {
    id: string;
    name: string;
  };
}

export interface Position {
  id: string;
  name: string;
  description?: string;
}

// Query params for users
export interface UserFilterParams {
  role?: string;
  section?: string;
  page?: number;
  limit?: number;
}

// Response types
export interface UsersResponse {
  users: User[];
  total: number;
  totalPages: number;
  currentPage: number;
}

export interface UserResponse {
  user: User;
}

export interface PositionsResponse {
  positions: Position[];
  total: number;
  totalPages: number;
  currentPage: number;
}

// User service class
class UserServiceClass {
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

  // User methods
  async getUsers(params?: UserFilterParams): Promise<UsersResponse> {
    let url = '/api/user';
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
      data: UsersResponse;
    }>(url);
    return response.data;
  }

  async getUser(id: string): Promise<User> {
    const response = await this.request<{
      success: boolean;
      user: User;
    }>(`/api/user/${id}`);
    return response.user;
  }

  async createUser(userData: any): Promise<User> {
    const response = await this.request<{
      success: boolean;
      message: string;
      user: User;
    }>('/api/user', 'POST', userData);
    return response.user;
  }

  async updateUser(id: string, userData: any): Promise<User> {
    const response = await this.request<{
      success: boolean;
      message: string;
      user: User;
    }>(`/api/user/${id}`, 'PUT', userData);
    return response.user;
  }

  async deleteUser(id: string): Promise<{ success: boolean; message: string }> {
    return await this.request<{ success: boolean; message: string }>(
      `/api/user/${id}`,
      'DELETE'
    );
  }

  // Position methods
  async getPositions(): Promise<PositionsResponse> {
    const response = await this.request<{
      success: boolean;
      data: PositionsResponse;
    }>('/api/positions');
    return response.data;
  }

  async createPosition(positionData: any): Promise<Position> {
    const response = await this.request<{
      success: boolean;
      message: string;
      position: Position;
    }>('/api/positions', 'POST', positionData);
    return response.position;
  }

  // Helper method to get users for processing team
  async getProcessingTeamUsers(): Promise<User[]> {
    const params: UserFilterParams = {
      role: 'worker',
      limit: 100
    };
    
    const response = await this.getUsers(params);
    return response.users;
  }
}

export const UserService = new UserServiceClass();