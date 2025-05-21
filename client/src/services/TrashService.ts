import { baseHost } from '@/lib/host';
import { getToken } from '@/lib/auth';

// O'chirilgan ma'lumot turi uchun enum
export enum TrashItemType {
  USER = 'user',
  POSITION = 'position',
  SECTION = 'section',
  PERIOD = 'period',
  BATCH = 'batch',
  FEED = 'feed',
  HEALTH = 'health',
  INVENTORY = 'inventory',
  TASK = 'task',
  SLAUGHTER = 'slaughter',
  MENU = 'menu',
  MEALVOTE = 'mealvote',
  ATTENDANCE = 'attendance',
  ATTENDANCETASK = 'attendancetask',
  EXPENSE = 'expense',
  REPORT = 'report'
}

// O'chirilgan ma'lumot elementini ifodalash uchun interface
export interface TrashItem {
  _id: string;
  status: 'deleted';
  deletedAt: string;
  deletedBy: string | {
    _id: string;
    name: string;
  };
  [key: string]: any; // Qo'shimcha ma'lumotlar uchun
}

// Har bir tur uchun statistika
export interface TrashTypeStat {
  type: TrashItemType;
  displayName: string;
  count: number;
}

// O'chirilgan ma'lumotlar guruhi
export interface TrashTypeGroup {
  displayName: string;
  count: number;
  items: TrashItem[];
}

// API javoblari uchun interfacelar
export interface TrashStatsResponse {
  success: boolean;
  data: TrashTypeStat[];
}

export interface TrashAllResponse {
  success: boolean;
  data: {
    [key in TrashItemType]?: TrashTypeGroup;
  };
}

export interface TrashTypeResponse {
  success: boolean;
  data: {
    type: TrashItemType;
    items: TrashItem[];
  };
}

export interface TrashRestoreResponse {
  success: boolean;
  message: string;
  data: any;
}

// O'chirilgan ma'lumotlar bilan ishlash uchun xizmat
class TrashServiceClass {
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

  // Barcha o'chirilgan ma'lumotlarni olish
  async getAllTrashItems(): Promise<TrashAllResponse> {
    return await this.request<TrashAllResponse>('/api/trash');
  }

  // O'chirilgan ma'lumotlar statistikasini olish
  async getTrashStats(): Promise<TrashStatsResponse> {
    return await this.request<TrashStatsResponse>('/api/trash/stats');
  }

  // Ma'lum turdagi o'chirilgan ma'lumotlarni olish
  async getTrashItemsByType(type: TrashItemType): Promise<TrashTypeResponse> {
    return await this.request<TrashTypeResponse>(`/api/trash/${type}`);
  }

  // O'chirilgan ma'lumotni tiklash
  async restoreTrashItem(type: TrashItemType, id: string): Promise<TrashRestoreResponse> {
    return await this.request<TrashRestoreResponse>(
      `/api/trash/${type}/${id}/restore`,
      'POST'
    );
  }

  // O'chirilgan ma'lumotning nomi
  getTypeDisplayName(type: TrashItemType): string {
    const displayNames: Record<TrashItemType, string> = {
      [TrashItemType.USER]: 'Foydalanuvchilar',
      [TrashItemType.POSITION]: 'Lavozimlar',
      [TrashItemType.SECTION]: 'Sexlar',
      [TrashItemType.PERIOD]: 'Davrlar',
      [TrashItemType.BATCH]: 'Partiyalar',
      [TrashItemType.FEED]: 'Ozuqalar',
      [TrashItemType.HEALTH]: 'Sog\'liq qaydlari',
      [TrashItemType.INVENTORY]: 'Inventar',
      [TrashItemType.TASK]: 'Vazifalar',
      [TrashItemType.SLAUGHTER]: 'So\'yish partiyalari',
      [TrashItemType.MENU]: 'Oshxona menyulari',
      [TrashItemType.MEALVOTE]: 'Ovqat ovozlari',
      [TrashItemType.ATTENDANCE]: 'Yo\'qlama qaydlari',
      [TrashItemType.ATTENDANCETASK]: 'Yo\'qlama vazifalari',
      [TrashItemType.EXPENSE]: 'Xarajatlar',
      [TrashItemType.REPORT]: 'Hisobotlar'
    };
    return displayNames[type];
  }
}

export const TrashService = new TrashServiceClass();