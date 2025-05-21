import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { WebSocketEventType } from '@/services/WebSocketService';

// Bildirishnoma va ogohlantirishlar uchun interfeys
interface Alert {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  severity: 'high' | 'medium' | 'low';
  read?: boolean;
}

// Kam qolgan inventar ma'lumotlari uchun interfeys
interface LowInventoryItem {
  id: string;
  name: string;
  currentQuantity: number;
  minimumQuantity: number;
  unit: string;
  percentage: number;
}

// So'yishga tayyor partiyalar uchun interfeys
interface ReadyBatch {
  id: string;
  batchNumber: string;
  arrivalDate: string;
  currentCount: number;
  initialCount: number;
  preslaughterAverageWeight: number;
  status: string;
  section: {
    id: string;
    name: string;
  };
  breed: string;
}

// Ishlab chiqarish hisoboti uchun interfeys
interface ProductionReport {
  id: string;
  date: string;
  sectionId: string;
  sectionName: string;
  metrics: {
    key: string;
    name: string;
    value: number;
    unit: string;
    change: number;
  }[];
}

// Management Task - Boshqarish vazifalari uchun interfeys
interface ManagementTask {
  id: string;
  title: string;
  description: string;
  type: 'feeding' | 'cleaning' | 'vaccination' | 'maintenance' | 'measurement' | 'medication' | 'other';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'urgent';
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
  comments?: {
    id: string;
    userId: string;
    userName: string;
    text: string;
    timestamp: string;
  }[];
}

// Real vaqt state interfeysi
interface RealTimeState {
  connected: boolean;
  lastUpdated: string | null;
  alerts: Alert[];
  lowInventoryItems: LowInventoryItem[];
  readyBatches: ReadyBatch[];
  productionReports: ProductionReport[];
  recentTasks: ManagementTask[]; // Yangi vazifalar va yangilangan vazifalar
}

// Boshlang'ich qiymat
const initialState: RealTimeState = {
  connected: false,
  lastUpdated: null,
  alerts: [],
  lowInventoryItems: [],
  readyBatches: [],
  productionReports: [],
  recentTasks: []
};

// Real vaqt slice
const realTimeSlice = createSlice({
  name: 'realtime',
  initialState,
  reducers: {
    // WebSocket ulanish holatini yangilash
    setConnectionStatus: (state, action: PayloadAction<boolean>) => {
      state.connected = action.payload;
      state.lastUpdated = new Date().toISOString();
    },
    
    // WebSocket orqali kelgan har qanday ma'lumotni qabul qilish
    receiveMessage: (state, action: PayloadAction<{
      type: WebSocketEventType | string;
      data: any;
    }>) => {
      state.lastUpdated = new Date().toISOString();
      
      const { type, data } = action.payload;
      
      // Event turiga qarab tegishli ma'lumotlarni saqlash
      switch (type) {
        case WebSocketEventType.EMERGENCY_ALERT:
        case WebSocketEventType.INVENTORY_ALERT:
          // Yangi ogohlantirish kelganda ro'yxat boshiga qo'shish
          if (data && 'id' in data) {
            state.alerts = [data, ...state.alerts.slice(0, 29)]; // Eng so'nggi 30ta
          }
          break;
        
        case WebSocketEventType.READY_FOR_SLAUGHTER:
          // So'yishga tayyor partiyani qo'shish
          if (data && 'id' in data) {
            // Mavjud bo'lmasa qo'shish
            const existingIndex = state.readyBatches.findIndex(batch => batch.id === data.id);
            if (existingIndex === -1) {
              state.readyBatches = [data, ...state.readyBatches];
            } else {
              // Mavjud bo'lsa yangilash
              state.readyBatches[existingIndex] = data;
            }
          }
          break;
        
        case WebSocketEventType.PRODUCTION_REPORT:
          // Ishlab chiqarish hisobotini yangilash
          if (data && 'id' in data) {
            const existingIndex = state.productionReports.findIndex(report => report.id === data.id);
            if (existingIndex === -1) {
              state.productionReports = [data, ...state.productionReports.slice(0, 19)]; // Eng so'nggi 20ta
            } else {
              state.productionReports[existingIndex] = data;
            }
          }
          break;
          
        case 'low_inventory_update':
          // Kam qolgan inventar ma'lumotlarini yangilash
          if (Array.isArray(data)) {
            state.lowInventoryItems = data;
          }
          break;

        // Boshqarish vazifalari uchun WebSocket event turlari
        case WebSocketEventType.TASK_ASSIGNED:
        case WebSocketEventType.TASK_UPDATED:
        case WebSocketEventType.TASK_STATUS_CHANGED:
          // Vazifa yangilanganda yoki yangi vazifa berilganda
          if (data && 'id' in data) {
            const existingIndex = state.recentTasks.findIndex(task => task.id === data.id);
            
            if (existingIndex === -1) {
              // Yangi vazifa qo'shish
              state.recentTasks = [data, ...state.recentTasks.slice(0, 14)]; // Eng so'nggi 15ta
            } else {
              // Mavjud vazifani yangilash
              state.recentTasks[existingIndex] = data;
            }
            
            // Vazifa bildirishnomalarini ko'rsatish uchun alert ham qo'shish
            const taskAlert: Alert = {
              id: `task-${data.id}-${Date.now()}`,
              type: type === WebSocketEventType.TASK_ASSIGNED ? 'task_assigned' : 
                    type === WebSocketEventType.TASK_STATUS_CHANGED ? 'task_status_changed' : 'task_updated',
              title: type === WebSocketEventType.TASK_ASSIGNED ? 'Yangi vazifa berildi' : 
                    type === WebSocketEventType.TASK_STATUS_CHANGED ? 'Vazifa statusi o\'zgardi' : 'Vazifa yangilandi',
              message: `"${data.title}" - ${data.assignedTo.name}`,
              timestamp: new Date().toISOString(),
              severity: data.priority === 'urgent' ? 'high' : data.priority === 'high' ? 'medium' : 'low',
            };
            
            state.alerts = [taskAlert, ...state.alerts.slice(0, 29)];
          }
          break;
        
        case WebSocketEventType.TASK_COMMENT_ADDED:
          // Vazifaga izoh qo'shilganda
          if (data && 'taskId' in data && 'comment' in data) {
            const taskIndex = state.recentTasks.findIndex(task => task.id === data.taskId);
            
            if (taskIndex !== -1) {
              // Mavjud vazifaga izoh qo'shish
              const task = state.recentTasks[taskIndex];
              const updatedComments = [...(task.comments || []), data.comment];
              
              state.recentTasks = [
                ...state.recentTasks.slice(0, taskIndex),
                { ...task, comments: updatedComments },
                ...state.recentTasks.slice(taskIndex + 1)
              ];
              
              // Izoh qo'shilganligi haqida bildirishnoma
              const commentAlert: Alert = {
                id: `comment-${data.comment.id}-${Date.now()}`,
                type: 'task_comment',
                title: 'Vazifaga yangi izoh',
                message: `"${task.title}" - ${data.comment.userName}`,
                timestamp: new Date().toISOString(),
                severity: 'low',
              };
              
              state.alerts = [commentAlert, ...state.alerts.slice(0, 29)];
            }
          }
          break;
          
        case WebSocketEventType.TASK_DEADLINE_APPROACHING:
          // Vazifa muddati yaqinlashganda
          if (data && 'id' in data) {
            // Muddati yaqinlashgan vazifa haqida ogohlantirishni qo'shish
            const deadlineAlert: Alert = {
              id: `deadline-${data.id}-${Date.now()}`,
              type: 'task_deadline',
              title: 'Vazifa muddati yaqinlashmoqda',
              message: `"${data.title}" - muddati: ${new Date(data.deadline).toLocaleDateString()}`,
              timestamp: new Date().toISOString(),
              severity: 'medium',
            };
            
            state.alerts = [deadlineAlert, ...state.alerts.slice(0, 29)];
          }
          break;
          
        default:
          console.log('Noma\'lum WebSocket event turi:', type);
      }
    },
    
    // Barcha real vaqt ma'lumotlarini tozalash
    clearRealTimeData: (state) => {
      state.alerts = [];
      state.lowInventoryItems = [];
      state.readyBatches = [];
      state.productionReports = [];
      state.recentTasks = [];
    },
    
    // Ma'lum bir alert-ni o'qilgan deb belgilash
    markAlertAsRead: (state, action: PayloadAction<string>) => {
      const alertIndex = state.alerts.findIndex(alert => alert.id === action.payload);
      if (alertIndex !== -1) {
        // Qiymati o'zgartirilib yangi massiv yaratiladi
        state.alerts = [
          ...state.alerts.slice(0, alertIndex),
          { ...state.alerts[alertIndex], read: true },
          ...state.alerts.slice(alertIndex + 1)
        ];
      }
    },
    
    // So'yishga tayyor partiyani qayta ishlash
    processBatch: (state, action: PayloadAction<string>) => {
      // Partiyani ro'yxatdan o'chirish
      state.readyBatches = state.readyBatches.filter(batch => batch.id !== action.payload);
    },
    
    // Vazifa holatini yangilash (status o'zgartirish)
    updateTaskStatus: (state, action: PayloadAction<{
      taskId: string;
      status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'overdue';
    }>) => {
      const { taskId, status } = action.payload;
      const taskIndex = state.recentTasks.findIndex(task => task.id === taskId);
      
      if (taskIndex !== -1) {
        const task = state.recentTasks[taskIndex];
        const updatedTask = { ...task, status, updatedAt: new Date().toISOString() };
        
        // Agar vazifa tugallangan bo'lsa, completedAt ham qo'shiladi
        if (status === 'completed') {
          updatedTask.completedAt = new Date().toISOString();
        }
        
        state.recentTasks = [
          ...state.recentTasks.slice(0, taskIndex),
          updatedTask,
          ...state.recentTasks.slice(taskIndex + 1)
        ];
      }
    },
    
    // Vazifaga izoh qo'shish
    addTaskComment: (state, action: PayloadAction<{
      taskId: string;
      comment: {
        id: string;
        userId: string;
        userName: string;
        text: string;
        timestamp: string;
      };
    }>) => {
      const { taskId, comment } = action.payload;
      const taskIndex = state.recentTasks.findIndex(task => task.id === taskId);
      
      if (taskIndex !== -1) {
        const task = state.recentTasks[taskIndex];
        const updatedComments = [...(task.comments || []), comment];
        
        state.recentTasks = [
          ...state.recentTasks.slice(0, taskIndex),
          { ...task, comments: updatedComments, updatedAt: new Date().toISOString() },
          ...state.recentTasks.slice(taskIndex + 1)
        ];
      }
    },
    
    // Real vaqt vazifalar ro'yxatini yangilash (backend dan full sync)
    syncTasks: (state, action: PayloadAction<ManagementTask[]>) => {
      state.recentTasks = action.payload;
    }
  }
});

export const {
  setConnectionStatus,
  receiveMessage,
  clearRealTimeData,
  markAlertAsRead,
  processBatch,
  updateTaskStatus,
  addTaskComment,
  syncTasks
} = realTimeSlice.actions;

export default realTimeSlice.reducer;