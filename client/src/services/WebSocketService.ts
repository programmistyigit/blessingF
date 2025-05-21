import { getToken } from "@/lib/auth";
import { baseHost } from "@/lib/host";

export enum WebSocketEventType {
  // Batch events
  BATCH_CREATED = 'batch_created',
  BATCH_WEIGHT_UPDATED = 'batch_weight_updated',
  BATCH_MORTALITY_UPDATED = 'batch_mortality_updated',
  BATCH_STATUS_CHANGED = 'batch_status_changed',
  READY_FOR_SLAUGHTER = 'ready_for_slaughter',
  // Section events
  SECTION_STATUS_CHANGED = 'section_status_changed',
  SECTION_UPDATED = 'section_updated',
  SECTION_CREATED = 'section_created',
  SECTION_WORKERS_ASSIGNED = 'section_workers_assigned',
  // Task events
  TASK_ASSIGNED = 'task_assigned',
  TASK_UPDATED = 'task_updated',
  TASK_STATUS_CHANGED = 'task_status_changed',
  TASK_COMMENT_ADDED = 'task_comment_added',
  TASK_DEADLINE_APPROACHING = 'task_deadline_approaching',
  // Alert events
  EMERGENCY_ALERT = 'emergency_alert',
  INVENTORY_ALERT = 'inventory_alert',
  // Report events
  PRODUCTION_REPORT = 'production_report',
  // Users events
  USER_CREATED = 'user_created',
  USER_UPDATED = 'user_updated',
  USER_DELETED = 'user_deleted',
  WORKER_ASSIGNED = 'worker_assigned',
  // Position events
  POSITION_CREATED = 'position_created',
  POSITION_UPDATED = 'position_updated',
  POSITION_DELETED = 'position_deleted',
  // Attendance events
  ATTENDANCE_TASK_CREATED = 'attendance_task_created',
  ATTENDANCE_TASK_COMPLETED = 'attendance_task_completed',
  ATTENDANCE_RECORD_CREATED = 'attendance_record_created',
  // Inventory events
  INVENTORY_ITEM_CREATED = 'inventory_item_created',
  INVENTORY_ITEM_UPDATED = 'inventory_item_updated',
  INVENTORY_TRANSACTION_CREATED = 'inventory_transaction_created',
  INVENTORY_LOW_STOCK = 'inventory_low_stock',
  INVENTORY_OUT_OF_STOCK = 'inventory_out_of_stock',
  // Feed events
  FEED_CREATED = 'feed_created',
  FEED_UPDATED = 'feed_updated',
  FEED_PLAN_CREATED = 'feed_plan_created',
  FEED_CONSUMPTION_RECORDED = 'feed_consumption_recorded',
  
  // Boss API (Boshliq) uchun qo'shimcha WebSocket eventlar
  
  // Tizim holati o'zgarish eventlari
  SYSTEM_STATUS_UPDATE = 'system_status_update',
  // Yangi ogohlantirish eventlari
  NEW_ALERT = 'new_alert',
  // Foydalanuvchi roli o'zgarishi
  USER_ROLE_CHANGED = 'user_role_changed',
  // SMS xabar yuborilganda
  SMS_SENT = 'sms_sent',
  // Dashboard ma'lumotlari yangilanganda
  DASHBOARD_DATA_UPDATE = 'dashboard_data_update',
  // Hisobot avtomatik generatsiya qilinganda
  REPORT_GENERATED = 'report_generated',
  // Tizim xatosi yuzaga kelganda
  SYSTEM_ERROR = 'system_error',
  // Yangi foydalanuvchi tizimga kirganda
  USER_LOGGED_IN = 'user_logged_in',
  // Foydalanuvchi tizimdan chiqqanda
  USER_LOGGED_OUT = 'user_logged_out',
  // Tizim sozlamalari o'zgarganda
  SETTINGS_UPDATED = 'settings_updated',
  // Sessiya o'zgarganida
  SESSION_CHANGED = 'session_changed'
}

export interface WebSocketMessage {
  type: WebSocketEventType;
  data: any;
}

interface EventHandler {
  type: WebSocketEventType;
  handler: (data: any) => void;
}

class WebSocketManager {
  private socket: WebSocket | null = null;
  private eventHandlers: EventHandler[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isConnecting = false;

  connect(): void {
    // Test uchun, WebSocket ulanishni o'chirib qo'yamiz
    console.log('WebSocket ulanish - test rejimida o\'chirilgan');
    return;

    /*
    if (this.socket?.readyState === WebSocket.OPEN || this.isConnecting) {
      return;
    }

    this.isConnecting = true;
    const token = getToken();
    if (!token) {
      console.error('WebSocket ulanish uchun avtorizatsiya talab qilinadi');
      this.isConnecting = false;
      return;
    }

    // WebSocket ulanishini olib, path'ni "/ws" ga o'zgartirish kerak
    // Bu WebSocket serverga ulangan bo'lishi kerak
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${baseHost.replace(/^https?:\/\//, '')}/ws?token=${token}`;

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log('WebSocket ulanish muvaffaqiyatli');
        this.reconnectAttempts = 0;
        this.isConnecting = false;
      };

      this.socket.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('WebSocket xabarini qayta ishlashda xatolik:', error);
        }
      };

      this.socket.onclose = () => {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
          console.log(`WebSocket ulanish uzildi. ${delay}ms dan so'ng qayta ulanish.`);
          
          this.reconnectTimeout = setTimeout(() => {
            this.isConnecting = false;
            this.connect();
          }, delay);
        } else {
          console.error('WebSocket ulanishidagi maksimal qayta urinishlar soni tugadi');
        }
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket xatosi:', error);
        this.isConnecting = false;
      };
    } catch (error) {
      console.error('WebSocket ulanishda xatolik:', error);
      this.isConnecting = false;
    }
    */
  }

  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    this.isConnecting = false;
    this.reconnectAttempts = 0;
  }

  on(type: WebSocketEventType, handler: (data: any) => void): void {
    this.eventHandlers.push({ type, handler });
  }

  off(type: WebSocketEventType, handler: (data: any) => void): void {
    this.eventHandlers = this.eventHandlers.filter(
      (eventHandler) => !(eventHandler.type === type && eventHandler.handler === handler)
    );
  }

  private handleMessage(message: WebSocketMessage): void {
    const { type, data } = message;
    this.eventHandlers
      .filter((eventHandler) => eventHandler.type === type)
      .forEach((eventHandler) => {
        try {
          eventHandler.handler(data);
        } catch (error) {
          console.error(`${type} uchun xabar qayta ishlashda xatolik:`, error);
        }
      });
  }

  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }
}

export const WebSocketService = new WebSocketManager();