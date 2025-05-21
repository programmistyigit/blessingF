import { baseHost } from '@/lib/host';
import { getToken } from '@/lib/auth';

// Enums for meat types, quality grades and statuses
export enum MeatType {
  WHOLE = 'whole',
  BREAST = 'breast',
  LEG = 'leg',
  WING = 'wing',
  THIGH = 'thigh',
  DRUMSTICK = 'drumstick',
  BY_PRODUCT = 'by_product'
}

export enum MeatQualityGrade {
  PREMIUM = 'premium',
  STANDARD = 'standard',
  COMMERCIAL = 'commercial',
  REJECTED = 'rejected'
}

export enum SlaughterBatchStatus {
  PLANNED = 'planned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed'
}

export enum PaymentStatus {
  PAID = 'paid',
  PENDING = 'pending',
  PARTIAL = 'partial'
}

export enum PaymentMethod {
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
  CARD = 'card'
}

export enum DeliveryStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

// Interfaces for slaughter batches
export interface SlaughterBatch {
  id: string;
  batchNumber: string;
  chickenBatch: {
    id: string;
    batchNumber: string;
    section?: {
      id: string;
      name: string;
    };
    arrivalDate?: string;
    breed?: string;
  };
  plannedDate: string;
  actualDate?: string | null;
  status: SlaughterBatchStatus;
  preslaughterCount: number;
  preslaughterAverageWeight: number;
  totalWeight?: number | null;
  averageDressedWeight?: number | null;
  meatQuantity?: number | null;
  meatQualityGrade?: MeatQualityGrade | null;
  processingTeam?: string[];
  notes?: string;
  meatItems?: MeatItem[];
  history?: BatchHistoryEntry[];
  createdBy: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface BatchHistoryEntry {
  date: string;
  action: string;
  performedBy: {
    id: string;
    name: string;
  };
  notes?: string;
}

export interface CreateSlaughterBatchData {
  batchNumber: string;
  chickenBatchId: string;
  plannedDate: string;
  preslaughterCount: number;
  preslaughterAverageWeight: number;
  processingTeam?: string[];
  notes?: string;
}

export interface UpdateSlaughterBatchData {
  plannedDate?: string;
  preslaughterCount?: number;
  preslaughterAverageWeight?: number;
  processingTeam?: string[];
  notes?: string;
}

export interface UpdateStatusData {
  status: SlaughterBatchStatus;
  notes?: string;
}

// Interface for slaughter results
export interface SlaughterResultData {
  actualCount: number;
  totalWeight: number;
  averageDressedWeight: number;
  meatQuantity: number;
  meatQualityGrade: MeatQualityGrade;
  wastage: number;
  notes?: string;
  meatItems: {
    type: MeatType;
    count: number;
    weight: number;
    qualityGrade: MeatQualityGrade;
  }[];
}

// Interfaces for meat inventory
export interface MeatItem {
  id: string;
  type: MeatType;
  weight: number;
  count: number;
  averageWeight: number;
  qualityGrade: MeatQualityGrade;
  slaughterBatch: {
    id: string;
    batchNumber: string;
    chickenBatch?: {
      id: string;
      batchNumber: string;
      breed?: string;
    };
  };
  location: string;
  expiryDate: string;
  productionDate: string;
  status: string;
  price: number;
  notes?: string;
  packagingDetails?: {
    type: string;
    weight: number;
    materials: string[];
  };
  nutritionalInfo?: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  };
  transactions?: MeatTransaction[];
  createdAt: string;
  updatedAt: string;
}

export interface MeatTransaction {
  id: string;
  type: string;
  quantity: number;
  date: string;
  customer?: {
    name: string;
    contactNumber: string;
    address: string;
  };
  price?: number;
  totalAmount?: number;
  performedBy: {
    id: string;
    name: string;
  };
  notes?: string;
}

export interface UpdateMeatItemData {
  location?: string;
  price?: number;
  notes?: string;
}

export interface MeatTransactionData {
  type: string;
  quantity: number;
  date: string;
  customer?: {
    name: string;
    contactNumber: string;
    address: string;
  };
  price?: number;
  notes?: string;
}

// Interfaces for meat sales
export interface MeatSale {
  id: string;
  saleDate: string;
  slaughterBatch: {
    id: string;
    batchNumber: string;
    chickenBatch?: {
      id: string;
      batchNumber: string;
    };
  };
  customer: {
    name: string;
    contactNumber: string;
    address: string;
    isRegular: boolean;
    previousPurchases?: number;
    totalSpent?: number;
  };
  meatItems: {
    type: MeatType;
    quantity: number;
    unit: string;
    pricePerUnit: number;
    totalPrice?: number;
  }[];
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentDetails?: {
    reference?: string;
    receivedAmount: number;
    paymentDate: string;
  };
  deliveryRequired: boolean;
  deliveryAddress?: string;
  deliveryStatus?: DeliveryStatus;
  deliveryDetails?: {
    assignedTo: string;
    vehicleNumber: string;
    scheduledTime: string;
    completedTime?: string;
  };
  notes?: string;
  history?: SaleHistoryEntry[];
  createdBy: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface SaleHistoryEntry {
  date: string;
  action: string;
  performedBy: {
    id: string;
    name: string;
  };
  notes?: string;
}

export interface CreateMeatSaleData {
  slaughterBatchId: string;
  saleDate: string;
  customer: {
    name: string;
    contactNumber: string;
    address: string;
    isRegular?: boolean;
  };
  meatItems: {
    type: MeatType;
    quantity: number;
    unit: string;
    pricePerUnit: number;
  }[];
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentDetails?: {
    reference?: string;
    receivedAmount: number;
    paymentDate: string;
  };
  deliveryRequired: boolean;
  deliveryAddress?: string;
  deliveryStatus?: DeliveryStatus;
  deliveryDetails?: {
    assignedTo: string;
    vehicleNumber: string;
    scheduledTime: string;
  };
  notes?: string;
}

// Filter params interfaces
export interface SlaughterBatchFilterParams {
  status?: SlaughterBatchStatus;
  batchId?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}

export interface MeatInventoryFilterParams {
  type?: MeatType;
  qualityGrade?: MeatQualityGrade;
  page?: number;
  limit?: number;
}

export interface MeatSaleFilterParams {
  startDate?: string;
  endDate?: string;
  customer?: string;
  paymentStatus?: PaymentStatus;
  page?: number;
  limit?: number;
}

// Response interfaces
export interface SlaughterBatchesResponse {
  batches: SlaughterBatch[];
  total: number;
  totalPages: number;
  currentPage: number;
}

export interface SlaughterBatchResponse {
  batch: SlaughterBatch;
}

export interface SlaughterBatchStatsResponse {
  batch: {
    id: string;
    batchNumber: string;
    chickenBatch: {
      id: string;
      batchNumber: string;
    };
    status: SlaughterBatchStatus;
  };
  overview: {
    plannedCount: number;
    actualCount: number;
    deviation: number;
    averageWeight: {
      planned: number;
      actual: number;
      deviation: number;
    };
    totalWeight: {
      planned: number;
      actual: number;
      deviation: number;
    };
  };
  meatProduction: {
    totalMeatWeight: number;
    meatYield: number;
    wastage: number;
    wastagePercent: number;
    byType: {
      type: string;
      count: number;
      weight: number;
      percentage: number;
    }[];
    byQuality: {
      grade: string;
      weight: number;
      percentage: number;
    }[];
  };
  efficiency: {
    feedConversionRatio: number;
    meatPerFeeding: number;
    dressPercentage: number;
    growthEfficiency: number;
    productionCost: {
      feedCost: number;
      laborCost: number;
      otherCost: number;
      totalCost: number;
      costPerKg: number;
    };
  };
  comparison: {
    previousBatches: {
      batchNumber: string;
      meatYield: number;
      dressPercentage: number;
      costPerKg: number;
    }[];
    avgImprovement: {
      meatYield: number;
      dressPercentage: number;
      costPerKg: number;
    };
  };
}

export interface OptimalTimingParams {
  batchId: string;
  currentAverageWeight: number;
  currentAge: number;
  currentDailyGain: number;
  currentFCR: number;
  marketPrices: {
    feed: number;
    meat: {
      premium: number;
      standard: number;
    };
  };
  considerFactors: string[];
}

export interface OptimalTimingResponse {
  batch: {
    id: string;
    batchNumber: string;
    currentAverageWeight: number;
    currentAge: number;
    currentDailyGain: number;
    currentFCR: number;
    birdCount: number;
  };
  optimumSlaughterTime: {
    recommendedDay: number;
    recommendedDate: string;
    projectedWeight: number;
    projectedFCR: number;
    confidenceLevel: string;
  };
  economicAnalysis: {
    current: {
      totalWeight: number;
      estimatedRevenue: number;
      estimatedCost: number;
      estimatedProfit: number;
      profitPerBird: number;
    };
    projected: {
      totalWeight: number;
      estimatedRevenue: number;
      estimatedCost: number;
      estimatedProfit: number;
      profitPerBird: number;
    };
    differential: {
      weightGain: number;
      additionalRevenue: number;
      additionalCost: number;
      additionalProfit: number;
      profitIncrease: number;
    };
  };
  growthAnalysis: {
    growthCurve: {
      day: number;
      weight: number;
      dailyGain: number;
      fcr: number;
    }[];
    inflectionPoint: number;
    efficiencyDecrease: {
      day: number;
      percentage: number;
      description: string;
    };
  };
  factors: {
    [key: string]: {
      influence: string;
      recommendation: string;
    };
  };
  recommendation: string;
}

export interface MeatInventoryResponse {
  items: MeatItem[];
  total: number;
  totalPages: number;
  currentPage: number;
  summary: {
    totalWeight: number;
    totalItems: number;
    byType: {
      type: string;
      weight: number;
      count: number;
      percentage: number;
    }[];
    byQuality: {
      grade: string;
      weight: number;
      percentage: number;
    }[];
    totalValue: number;
  };
}

export interface MeatInventoryItemResponse {
  item: MeatItem;
}

export interface MeatTransactionResponse {
  transaction: MeatTransaction;
  item: {
    id: string;
    weight: number;
    count: number;
    status: string;
    updatedAt: string;
  };
}

export interface MeatInventoryStatsResponse {
  period: {
    startDate: string;
    endDate: string;
  };
  overview: {
    totalProduction: number;
    totalSales: number;
    totalRevenue: number;
    averagePrice: number;
    currentInventory: number;
    currentValue: number;
  };
  productionAnalysis: {
    byType: {
      type: string;
      produced: number;
      sold: number;
      remaining: number;
      percentage: number;
    }[];
    byQuality: {
      grade: string;
      produced: number;
      sold: number;
      remaining: number;
      percentage: number;
    }[];
  };
  salesAnalysis: {
    byCustomer: {
      name: string;
      quantity: number;
      revenue: number;
      percentage: number;
    }[];
    byType: {
      type: string;
      quantity: number;
      revenue: number;
      percentage: number;
    }[];
    byDate: {
      date: string;
      quantity: number;
      revenue: number;
    }[];
  };
  inventoryHealth: {
    expiringItems: number;
    expiredItems: number;
    lowStockItems: number;
    freshItems: number;
  };
}

export interface MeatSalesResponse {
  sales: MeatSale[];
  total: number;
  totalPages: number;
  currentPage: number;
  summary: {
    totalSales: number;
    totalRevenue: number;
    totalWeight: number;
    averageSaleAmount: number;
    byPaymentStatus: {
      [key in PaymentStatus]?: number;
    };
    byPaymentMethod: {
      [key in PaymentMethod]?: number;
    };
  };
}

export interface MeatSaleResponse {
  sale: MeatSale;
}

// Main service class
class MeatProductionServiceClass {

  
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

  // Slaughter batches methods
  async getSlaughterBatches(params?: SlaughterBatchFilterParams): Promise<SlaughterBatchesResponse> {
    let url = '/api/slaughter-batches';
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
      data: SlaughterBatchesResponse;
    }>(url);
    return response.data;
  }

  async getSlaughterBatch(id: string): Promise<SlaughterBatch> {
    const response = await this.request<{
      success: boolean;
      batch: SlaughterBatch;
    }>(`/api/slaughter-batches/${id}`);
    return response.batch;
  }

  async createSlaughterBatch(data: CreateSlaughterBatchData): Promise<SlaughterBatch> {
    const response = await this.request<{
      success: boolean;
      message: string;
      batch: SlaughterBatch;
    }>('/api/slaughter-batches', 'POST', data);
    return response.batch;
  }

  async updateSlaughterBatch(id: string, data: UpdateSlaughterBatchData): Promise<SlaughterBatch> {
    const response = await this.request<{
      success: boolean;
      message: string;
      batch: SlaughterBatch;
    }>(`/api/slaughter-batches/${id}`, 'PUT', data);
    return response.batch;
  }

  async updateSlaughterBatchStatus(id: string, data: UpdateStatusData): Promise<SlaughterBatch> {
    const response = await this.request<{
      success: boolean;
      message: string;
      batch: SlaughterBatch;
    }>(`/api/slaughter-batches/${id}/status`, 'PUT', data);
    return response.batch;
  }

  async addSlaughterResults(id: string, data: SlaughterResultData): Promise<SlaughterBatch> {
    const response = await this.request<{
      success: boolean;
      message: string;
      batch: SlaughterBatch;
    }>(`/api/slaughter-batches/${id}/results`, 'POST', data);
    return response.batch;
  }

  async getSlaughterBatchStats(id: string): Promise<SlaughterBatchStatsResponse> {
    const response = await this.request<{
      success: boolean;
      data: SlaughterBatchStatsResponse;
    }>(`/api/slaughter-batches/${id}/stats`);
    return response.data;
  }

  async getOptimalTiming(params: OptimalTimingParams): Promise<OptimalTimingResponse> {
    const response = await this.request<{
      success: boolean;
      data: OptimalTimingResponse;
    }>('/api/slaughter-batches/optimal-timing', 'POST', params);
    return response.data;
  }

  // Meat inventory methods
  async getMeatInventory(params?: MeatInventoryFilterParams): Promise<MeatInventoryResponse> {
    let url = '/api/inventory/items';
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
      data: MeatInventoryResponse;
    }>(url);
    return response.data;
  }

  async getMeatInventoryItem(id: string): Promise<MeatItem> {
    const response = await this.request<{
      success: boolean;
      item: MeatItem;
    }>(`/api/inventory/items/${id}`);
    return response.item;
  }

  async updateMeatInventoryItem(id: string, data: UpdateMeatItemData): Promise<MeatItem> {
    const response = await this.request<{
      success: boolean;
      message: string;
      item: MeatItem;
    }>(`/api/inventory/items/${id}`, 'PUT', data);
    return response.item;
  }

  async addMeatTransaction(id: string, data: MeatTransactionData): Promise<MeatTransactionResponse> {
    const response = await this.request<{
      success: boolean;
      message: string;
      data: MeatTransactionResponse;
    }>(`/api/inventory/items/${id}/transactions`, 'POST', data);
    return response.data;
  }

  async getMeatInventoryStats(startDate?: string, endDate?: string, slaughterBatchId?: string): Promise<MeatInventoryStatsResponse> {
    let url = '/api/inventory/stats';
    const queryParams = new URLSearchParams();
    
    if (startDate) {
      queryParams.append('startDate', startDate);
    }
    
    if (endDate) {
      queryParams.append('endDate', endDate);
    }
    
    if (slaughterBatchId) {
      queryParams.append('slaughterBatchId', slaughterBatchId);
    }
    
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }
    
    const response = await this.request<{
      success: boolean;
      data: MeatInventoryStatsResponse;
    }>(url);
    return response.data;
  }

  // Meat sales methods
  async getMeatSales(params?: MeatSaleFilterParams): Promise<MeatSalesResponse> {
    let url = '/api/meat-sales';
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
      data: MeatSalesResponse;
    }>(url);
    return response.data;
  }

  async getMeatSale(id: string): Promise<MeatSale> {
    const response = await this.request<{
      success: boolean;
      sale: MeatSale;
    }>(`/api/meat-sales/${id}`);
    return response.sale;
  }

  async createMeatSale(data: CreateMeatSaleData): Promise<MeatSale> {
    const response = await this.request<{
      success: boolean;
      message: string;
      sale: MeatSale;
    }>('/api/meat-sales', 'POST', data);
    return response.sale;
  }
  
  async updatePaymentStatus(id: string, status: PaymentStatus, details?: any): Promise<MeatSale> {
    const response = await this.request<{
      success: boolean;
      message: string;
      sale: MeatSale;
    }>(`/api/meat-sales/${id}/payment`, 'PUT', { status, details });
    return response.sale;
  }
  
  async updateDeliveryStatus(id: string, status: DeliveryStatus, details?: any): Promise<MeatSale> {
    const response = await this.request<{
      success: boolean;
      message: string;
      sale: MeatSale;
    }>(`/api/meat-sales/${id}/delivery`, 'PUT', { status, details });
    return response.sale;
  }

  // Helper methods for UI
  getMeatTypeName(type: MeatType): string {
    switch (type) {
      case MeatType.WHOLE: return 'Butun tovuq';
      case MeatType.BREAST: return 'Ko\'krak';
      case MeatType.LEG: return 'Oyoq';
      case MeatType.WING: return 'Qanot';
      case MeatType.THIGH: return 'Son';
      case MeatType.DRUMSTICK: return 'Boldir';
      case MeatType.BY_PRODUCT: return 'Subproduktlar';
      default: return type;
    }
  }

  getMeatQualityName(grade: MeatQualityGrade): string {
    switch (grade) {
      case MeatQualityGrade.PREMIUM: return 'Premium';
      case MeatQualityGrade.STANDARD: return 'Standart';
      case MeatQualityGrade.COMMERCIAL: return 'Tijoriy';
      case MeatQualityGrade.REJECTED: return 'Rad etilgan';
      default: return grade;
    }
  }

  getSlaughterBatchStatusName(status: SlaughterBatchStatus): string {
    switch (status) {
      case SlaughterBatchStatus.PLANNED: return 'Rejalashtirilgan';
      case SlaughterBatchStatus.IN_PROGRESS: return 'Jarayonda';
      case SlaughterBatchStatus.COMPLETED: return 'Tugallangan';
      default: return status;
    }
  }

  getPaymentStatusName(status: PaymentStatus): string {
    switch (status) {
      case PaymentStatus.PAID: return 'To\'langan';
      case PaymentStatus.PENDING: return 'Kutilmoqda';
      case PaymentStatus.PARTIAL: return 'Qisman to\'langan';
      default: return status;
    }
  }

  getPaymentMethodName(method: PaymentMethod): string {
    switch (method) {
      case PaymentMethod.CASH: return 'Naqd pul';
      case PaymentMethod.BANK_TRANSFER: return 'Bank o\'tkazmasi';
      case PaymentMethod.CARD: return 'Karta orqali';
      default: return method;
    }
  }

  getDeliveryStatusName(status: DeliveryStatus): string {
    switch (status) {
      case DeliveryStatus.PENDING: return 'Kutilmoqda';
      case DeliveryStatus.IN_PROGRESS: return 'Jarayonda';
      case DeliveryStatus.DELIVERED: return 'Yetkazildi';
      case DeliveryStatus.CANCELLED: return 'Bekor qilindi';
      default: return status;
    }
  }
}

export const MeatProductionService = new MeatProductionServiceClass();