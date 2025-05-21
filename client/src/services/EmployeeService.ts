import { baseHost } from "@/lib/host";
import { getToken } from "@/lib/auth";

const API_URL = `${baseHost}/api/user`;

export interface User {
  id: string;
  name: string;
  phoneNumber: string;
  role: 'owner' | 'boss' | 'manager' | 'worker' | 'veterinarian' | 'cook';
  section?: {
    id: string;
    name: string;
  };
  position?: {
    id: string;
    name: string;
    permissions?: string[];
  };
  sections?: {
    id: string;
    name: string;
  }[];
  subordinates?: {
    id: string;
    name: string;
    role: string;
  }[];
  supervisor?: {
    id: string;
    name: string;
  } | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  value: string;
  label: string;
  category: string;
  description: string;
}

export interface PositionType {
  key: string;
  value: string;
  label: string;
}

export interface Position {
  id: string;
  name: string;
  type: string;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'DELETED';
}

export interface AttendanceTask {
  id: string;
  assignedTo: {
    id: string;
    name: string;
  };
  assignedBy: {
    id: string;
    name: string;
  };
  section: {
    id: string;
    name: string;
  };
  date: string;
  isCompleted: boolean;
  completedAt?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceRecord {
  id: string;
  user: {
    id: string;
    name: string;
  };
  recordedBy: {
    id: string;
    name: string;
  };
  date: string;
  status: 'present' | 'absent' | 'late' | 'leave' | 'sick';
  checkInTime?: string;
  checkOutTime?: string;
  comments?: string;
  workingHours?: number;
  createdAt: string;
  updatedAt: string;
}

export interface UsersResponse {
  success: boolean;
  total?: number;
  page?: number;
  limit?: number;
  users?: User[];
  data?: User[];
}

export interface UserResponse {
  success: boolean;
  user: User;
}

export interface PositionsResponse {
  success: boolean;
  positions: Position[];
}

export interface AttendanceResponse {
  success: boolean;
  data: {
    sectionId: string;
    sectionName: string;
    date: string;
    records: {
      id: string;
      user: {
        id: string;
        name: string;
      };
      status: string;
      checkInTime?: string;
      checkOutTime?: string;
    }[];
    summary: {
      total: number;
      present: number;
      absent: number;
      late: number;
      leave: number;
      sick: number;
    };
  };
}


export const EmployeeService = {
  // Barcha ruxsatlarni olish
  getAllPermissions: async (format: 'simple' | 'detailed' | 'byCategory' = 'byCategory'): Promise<any> => {
    const token = getToken();
    if (!token) {
      throw new Error("Avtorizatsiya talab qilinadi");
    }

    const response = await fetch(`${baseHost}/api/positions/permissions?format=${format}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Ruxsatlar ro'yxatini olishda xatolik yuz berdi");
    }

    return await response.json();
  },

  // Lavozim turlarini olish
  getPositionTypes: async (): Promise<PositionType[]> => {
    const token = getToken();
    if (!token) {
      throw new Error("Avtorizatsiya talab qilinadi");
    }

    const response = await fetch(`${baseHost}/api/positions/position-types`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Lavozim turlarini olishda xatolik yuz berdi");
    }

    return await response.json();
  },
  // Barcha xodimlarni olish
  getAllEmployees: async (params?: {
    role?: string;
    section?: string;
    isActive?: boolean;
    query?: string;
    page?: number;
    limit?: number;
    positionId?: string;
    positionType?: string;
  }): Promise<UsersResponse> => {
    const token = getToken();
    if (!token) {
      throw new Error("Avtorizatsiya talab qilinadi");
    }

    let url = API_URL;
    if (params) {
      const queryParams = new URLSearchParams();
      if (params.role) queryParams.append('role', params.role);
      if (params.section) queryParams.append('section', params.section);
      if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
      if (params.query) queryParams.append('query', params.query);
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.positionId) queryParams.append('positionId', params.positionId);
      if (params.positionType) queryParams.append('positionType', params.positionType);
      
      url += `?${queryParams.toString()}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Xodimlar ro'yxatini olishda xatolik yuz berdi");
    }

    return await response.json();
  },

  // Bitta xodimni olish
  getEmployee: async (id: string): Promise<UserResponse> => {
    const token = getToken();
    if (!token) {
      throw new Error("Avtorizatsiya talab qilinadi");
    }

    const response = await fetch(`${API_URL}/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Xodim ma'lumotlarini olishda xatolik yuz berdi");
    }

    return await response.json();
  },

  // Joriy foydalanuvchi ma'lumotlarini olish
  getCurrentUser: async (): Promise<UserResponse> => {
    const token = getToken();
    if (!token) {
      throw new Error("Avtorizatsiya talab qilinadi");
    }

    const response = await fetch(`${API_URL}/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Foydalanuvchi ma'lumotlarini olishda xatolik yuz berdi");
    }

    return await response.json();
  },

  // Yangi xodim yaratish
  createEmployee: async (data: {
    name: string;
    phoneNumber: string;
    role: string;
    positionId?: string;
    sections?: string[];
    isActive: boolean;
  }): Promise<UserResponse> => {
    const token = getToken();
    if (!token) {
      throw new Error("Avtorizatsiya talab qilinadi");
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Xodim yaratishda xatolik yuz berdi");
    }

    return await response.json();
  },

  // Xodimni yangilash
  updateEmployee: async (id: string, data: {
    name?: string;
    positionId?: string;
    sections?: string[];
    isActive?: boolean;
  }): Promise<UserResponse> => {
    const token = getToken();
    if (!token) {
      throw new Error("Avtorizatsiya talab qilinadi");
    }

    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Xodim ma'lumotlarini yangilashda xatolik yuz berdi");
    }

    return await response.json();
  },

  // Xodimni o'chirish
  deleteEmployee: async (id: string): Promise<{ success: boolean; message: string }> => {
    const token = getToken();
    if (!token) {
      throw new Error("Avtorizatsiya talab qilinadi");
    }

    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Xodimni o'chirishda xatolik yuz berdi");
    }

    return await response.json();
  },

  // Ishchini menejerga biriktirish
  assignWorkerToManager: async (workerId: string, managerId: string): Promise<any> => {
    const token = getToken();
    if (!token) {
      throw new Error("Avtorizatsiya talab qilinadi");
    }

    const response = await fetch(`${API_URL}/assign-worker`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ workerId, managerId })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Ishchini menejerga biriktirishda xatolik yuz berdi");
    }

    return await response.json();
  },

  // Ishchini menejerdan chiqarish
  removeWorkerFromManager: async (workerId: string, managerId: string): Promise<any> => {
    const token = getToken();
    if (!token) {
      throw new Error("Avtorizatsiya talab qilinadi");
    }

    const response = await fetch(`${API_URL}/remove-worker`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ workerId, managerId })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Ishchini menejerdan chiqarishda xatolik yuz berdi");
    }

    return await response.json();
  },

  // Menejerga tegishli ishchilarni olish
  getManagerSubordinates: async (managerId: string): Promise<any> => {
    const token = getToken();
    if (!token) {
      throw new Error("Avtorizatsiya talab qilinadi");
    }

    const response = await fetch(`${API_URL}/manager/${managerId}/subordinates`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Menejerga tegishli ishchilarni olishda xatolik yuz berdi");
    }

    return await response.json();
  },

  // Xodimga bir nechta sexlarni biriktirish
  assignSectionsToUser: async (userId: string, sections: string[]): Promise<any> => {
    const token = getToken();
    if (!token) {
      throw new Error("Avtorizatsiya talab qilinadi");
    }

    const response = await fetch(`${API_URL}/${userId}/assign-sections`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sections })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Xodimga sexlarni biriktirishda xatolik yuz berdi");
    }

    return await response.json();
  },

  // Barcha lavozimlarni olish
  getAllPositions: async (): Promise<PositionsResponse> => {
    const token = getToken();
    if (!token) {
      throw new Error("Avtorizatsiya talab qilinadi");
    }

    const response = await fetch(`${baseHost}/api/positions`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Lavozimlar ro'yxatini olishda xatolik yuz berdi");
    }

    return await response.json();
  },

  // Yangi lavozim yaratish
  createPosition: async (data: {
    name: string;
    type: string;
    permissions: string[];
  }): Promise<any> => {
    const token = getToken();
    if (!token) {
      throw new Error("Avtorizatsiya talab qilinadi");
    }

    const response = await fetch(`${baseHost}/api/positions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Lavozim yaratishda xatolik yuz berdi");
    }

    return await response.json();
  },

  // Lavozimni yangilash
  updatePosition: async (id: string, data: {
    name?: string;
    type?: string;
    permissions?: string[];
  }): Promise<any> => {
    const token = getToken();
    if (!token) {
      throw new Error("Avtorizatsiya talab qilinadi");
    }

    const response = await fetch(`${baseHost}/api/positions/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Lavozimni yangilashda xatolik yuz berdi");
    }

    return await response.json();
  },

  // Lavozimni o'chirish
  deletePosition: async (id: string): Promise<any> => {
    const token = getToken();
    if (!token) {
      throw new Error("Avtorizatsiya talab qilinadi");
    }

    const response = await fetch(`${baseHost}/api/positions/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Lavozimni o'chirishda xatolik yuz berdi");
    }

    return await response.json();
  },
  
  // Lavozim statusini o'zgartirish
  togglePositionStatus: async (id: string): Promise<any> => {
    const token = getToken();
    if (!token) {
      throw new Error("Avtorizatsiya talab qilinadi");
    }

    const response = await fetch(`${baseHost}/api/positions/${id}/toggle-status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Lavozim statusini o'zgartirishda xatolik yuz berdi");
    }

    return await response.json();
  },
  
  // O'chirilgan lavozimlarni olish (faqat boss uchun)
  getDeletedPositions: async (): Promise<PositionsResponse> => {
    const token = getToken();
    if (!token) {
      throw new Error("Avtorizatsiya talab qilinadi");
    }

    const response = await fetch(`${baseHost}/api/positions/deleted`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "O'chirilgan lavozimlarni olishda xatolik yuz berdi");
    }

    return await response.json();
  },
  
  // O'chirilgan lavozimni qaytarish (faqat boss uchun)
  restorePosition: async (id: string): Promise<any> => {
    const token = getToken();
    if (!token) {
      throw new Error("Avtorizatsiya talab qilinadi");
    }

    const response = await fetch(`${baseHost}/api/positions/${id}/restore`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Lavozimni qaytarishda xatolik yuz berdi");
    }

    return await response.json();
  },
  
  // Standart lavozimlarni yaratish (faqat boss uchun)
  createDefaultPositions: async (): Promise<any> => {
    const token = getToken();
    if (!token) {
      throw new Error("Avtorizatsiya talab qilinadi");
    }

    const response = await fetch(`${baseHost}/api/positions/create-defaults`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Standart lavozimlarni yaratishda xatolik yuz berdi");
    }

    return await response.json();
  },

  // Yo'qlama vazifasini yaratish
  createAttendanceTask: async (data: {
    assignedTo: string;
    section: string;
    date: string;
    notes?: string;
  }): Promise<any> => {
    const token = getToken();
    if (!token) {
      throw new Error("Avtorizatsiya talab qilinadi");
    }

    const response = await fetch(`${baseHost}/api/attendance/tasks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Yo'qlama vazifasini yaratishda xatolik yuz berdi");
    }

    return await response.json();
  },

  // Sex bo'yicha yo'qlama qaydlarini olish
  getSectionAttendance: async (sectionId: string, date: string): Promise<AttendanceResponse> => {
    const token = getToken();
    if (!token) {
      throw new Error("Avtorizatsiya talab qilinadi");
    }

    const response = await fetch(`${baseHost}/api/attendance/sections/${sectionId}?date=${date}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Yo'qlama qaydlarini olishda xatolik yuz berdi");
    }

    return await response.json();
  },

  // Yo'qlama qaydini yaratish
  createAttendanceRecord: async (data: {
    user: string;
    date: Date;
    status: 'present' | 'absent' | 'late' | 'leave' | 'sick';
    checkInTime?: Date;
    checkOutTime?: Date;
    comments?: string;
  }): Promise<any> => {
    const token = getToken();
    if (!token) {
      throw new Error("Avtorizatsiya talab qilinadi");
    }

    // Convert Date objects to ISO strings
    const formattedData = {
      ...data,
      date: data.date.toISOString(),
      checkInTime: data.checkInTime ? data.checkInTime.toISOString() : undefined,
      checkOutTime: data.checkOutTime ? data.checkOutTime.toISOString() : undefined,
    };

    const response = await fetch(`${baseHost}/api/attendance/records`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formattedData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Yo'qlama qaydini yaratishda xatolik yuz berdi");
    }

    return await response.json();
  },

  // Yo'qlama statistikasini olish
  getAttendanceStats: async (params: {
    startDate: string;
    endDate: string;
    section?: string;
  }): Promise<any> => {
    const token = getToken();
    if (!token) {
      throw new Error("Avtorizatsiya talab qilinadi");
    }

    let url = `${baseHost}/api/attendance/stats?startDate=${params.startDate}&endDate=${params.endDate}`;
    if (params.section) {
      url += `&section=${params.section}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Yo'qlama statistikasini olishda xatolik yuz berdi");
    }

    return await response.json();
  }
};