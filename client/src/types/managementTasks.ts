// Boshqarish vazifalari uchun tiplar va interfeyslar

// Vazifa statuslari
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'overdue';

// Vazifa prioriteti
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

// Vazifa turlari
export type TaskType = 'feeding' | 'cleaning' | 'vaccination' | 'maintenance' | 'measurement' | 'medication' | 'other';

// Izoh interfeysi
export interface TaskComment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: string;
}

// Vazifa interfeysi
export interface Task {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
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
  startDate: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  isRecurring: boolean;
  notes?: string;
  completionPercentage: number;
  createdBy: {
    id: string;
    name: string;
  };
  comments?: TaskComment[];
}

// Yangi vazifa yaratish uchun interfeys
export interface CreateTaskInput {
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

// Vazifa statusini yangilash uchun interfeys
export interface UpdateTaskStatusInput {
  status: TaskStatus;
  completionPercentage?: number;
  notes?: string;
}

// Vazifaga izoh qo'shish uchun interfeys
export interface AddTaskCommentInput {
  text: string;
}

// Vazifalarni filtrlash uchun parametrlar
export interface TaskFilterParams {
  page?: number;
  limit?: number;
  status?: TaskStatus | TaskStatus[];
  type?: TaskType | TaskType[];
  section?: string;
  batch?: string;
  assignedTo?: string;
  startDate?: string;
  endDate?: string;
  isOverdue?: boolean;
  search?: string;
}

// So'rov javobidagi paginated response
export interface PaginatedTasksResponse {
  tasks: Task[];
  total: number;
  totalPages: number;
  currentPage: number;
}