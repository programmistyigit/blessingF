import { baseHost } from '@/lib/host';
import { getToken } from '@/lib/auth';

export interface Warehouse {
  id: string;
  name: string;
  code: string; 
  location: string;
  description?: string;
  isActive: boolean;
}

export interface InventoryItem {
  id: string;
  warehouse: Warehouse;
  name: string;
  code: string;
  type: InventoryItemType;
  subType?: string;
  quantity: number;
  unit: string;
  price: number;
  location: string;
  section: {
    id: string;
    name: string;
  } | null;
  expiryDate: string;
  supplier: string | {
    name: string;
    contact?: string;
    address?: string;
  };
  status: InventoryItemStatus;
  safetyStock: number;
  nutritionalInfo?: {
    protein: number;
    fat: number;
    fiber: number;
    energy: number;
    [key: string]: number;
  };
  dimensions?: {
    weight: number;
    packageType: string;
    [key: string]: any;
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type InventoryItemType = 'feed' | 'medicine' | 'equipment' | 'cleaning';
export type InventoryItemStatus = 'available' | 'low_stock' | 'out_of_stock';
export type TransactionType = 'addition' | 'consumption' | 'transfer' | 'disposal';

export interface InventoryTransaction {
  id: string;
  type: TransactionType;
  quantity: number;
  date: string;
  item?: {
    id: string;
    name: string;
    code: string;
    type: InventoryItemType;
  };
  performedBy: {
    id: string;
    name: string;
  };
  section?: {
    id: string;
    name: string;
  };
  batch?: {
    id: string;
    batchNumber: string;
  };
  price?: number;
  totalCost?: number;
  supplier?: string;
  fromSection?: {
    id: string;
    name: string;
  };
  toSection?: {
    id: string;
    name: string;
  };
  reason?: string;
  notes?: string;
}

export interface InventoryFilterParams {
  page?: number;
  limit?: number;
  type?: string;
  section?: string;
  status?: string;
  expiry?: string;
}

export interface TransactionFilterParams {
  page?: number;
  limit?: number;
  type?: string;
  itemType?: string;
  section?: string;
  batch?: string;
  itemId?: string;
  startDate?: string;
  endDate?: string;
}

export interface InventoryItemCreateData {
  name: string;
  code: string;
  type: InventoryItemType;
  subType?: string;
  quantity: number;
  unit: string;
  price: number;
  location: string;
  section?: string;
  expiryDate: string;
  supplier: string | {
    name: string;
    contact?: string;
    address?: string;
  };
  safetyStock: number;
  nutritionalInfo?: {
    protein: number;
    fat: number;
    fiber: number;
    energy: number;
    [key: string]: number;
  };
  dimensions?: {
    weight: number;
    packageType: string;
    [key: string]: any;
  };
  notes?: string;
}

export interface InventoryItemUpdateData {
  name?: string;
  price?: number;
  safetyStock?: number;
  nutritionalInfo?: {
    protein?: number;
    fat?: number;
    fiber?: number;
    energy?: number;
    [key: string]: any;
  };
  notes?: string;
}

export interface AdditionTransactionData {
  type: 'addition';
  quantity: number;
  date: string;
  price: number;
  supplier: string;
  notes?: string;
}

export interface ConsumptionTransactionData {
  type: 'consumption';
  quantity: number;
  date: string;
  section: string;
  batch?: string;
  notes?: string;
}

export interface TransferTransactionData {
  itemId: string;
  quantity: number;
  fromSection: string;
  toSection: string;
  date: string;
  notes?: string;
}

export interface DisposalTransactionData {
  type: 'disposal';
  quantity: number;
  date: string;
  reason: string;
  notes?: string;
}

export interface InventoryItemsResponse {
  items: InventoryItem[];
  total: number;
  totalPages: number;
  currentPage: number;
  summary: {
    totalValue: number;
    itemsByType: {
      [key: string]: number;
    };
    lowStockItems: number;
    outOfStockItems: number;
    expiringItems: number;
  };
}

export interface InventoryItemResponse {
  item: InventoryItem;
  transactions: InventoryTransaction[];
}

export interface InventoryTransactionsResponse {
  transactions: InventoryTransaction[];
  total: number;
  totalPages: number;
  currentPage: number;
  summary: {
    totalAdditions: number;
    totalConsumptions: number;
    totalTransfers: number;
    totalDisposals: number;
    totalCost: number;
    bySection: {
      id: string;
      name: string;
      consumptionValue: number;
    }[];
  };
}

export interface InventoryReportParams {
  startDate?: string;
  endDate?: string;
  type?: string;
  format?: 'json' | 'excel' | 'pdf';
}

export interface InventoryReport {
  period: {
    startDate: string;
    endDate: string;
  };
  summary: {
    openingStock: {
      quantity: number;
      value: number;
    };
    additions: {
      quantity: number;
      value: number;
    };
    consumptions: {
      quantity: number;
      value: number;
    };
    disposals: {
      quantity: number;
      value: number;
    };
    closingStock: {
      quantity: number;
      value: number;
    };
  };
  byType: {
    type: string;
    openingStock: number;
    additions: number;
    consumptions: number;
    disposals: number;
    closingStock: number;
  }[];
  bySection: {
    id: string;
    name: string;
    consumptions: {
      quantity: number;
      value: number;
    };
  }[];
  alertItems: {
    id: string;
    name: string;
    code: string;
    quantity: number;
    safetyStock: number;
    status: string;
  }[];
}

class InventoryServiceClass {
  // Warehouse management methods
  async getWarehouses(): Promise<Warehouse[]> {
    const response = await this.request<{
      success: boolean;
      data: { warehouses: Warehouse[] };
    }>('/api/warehouses');
    return response.data.warehouses;
  }

  async createWarehouse(data: Omit<Warehouse, "id" | "isActive">): Promise<Warehouse> {
    const response = await this.request<{
      success: boolean;
      data: { warehouse: Warehouse };
    }>('/api/warehouses', 'POST', data);
    return response.data.warehouse;
  }

  async updateWarehouse(id: string, data: Partial<Warehouse>): Promise<Warehouse> {
    const response = await this.request<{
      success: boolean;
      data: { warehouse: Warehouse };
    }>(`/api/warehouses/${id}`, 'PUT', data);
    return response.data.warehouse;
  }

  async deleteWarehouse(id: string): Promise<void> {
    await this.request<{success: boolean}>(
      `/api/warehouses/${id}`, 
      'DELETE'
    );
  }

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

  async getInventoryItems(params?: InventoryFilterParams): Promise<InventoryItemsResponse> {
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
      data: InventoryItemsResponse;
    }>(url);
    return response.data;
  }

  async getInventoryItem(id: string): Promise<InventoryItemResponse> {
    const response = await this.request<{
      success: boolean;
      data: InventoryItemResponse;
    }>(`/api/inventory/items/${id}`);
    return response.data;
  }

  async createInventoryItem(itemData: InventoryItemCreateData): Promise<{ item: InventoryItem }> {
    const response = await this.request<{
      success: boolean;
      message: string;
      data: { item: InventoryItem };
    }>('/api/inventory/items', 'POST', itemData);
    return response.data;
  }

  async updateInventoryItem(id: string, itemData: InventoryItemUpdateData): Promise<{ item: Partial<InventoryItem> }> {
    const response = await this.request<{
      success: boolean;
      message: string;
      data: { item: Partial<InventoryItem> };
    }>(`/api/inventory/items/${id}`, 'PUT', itemData);
    return response.data;
  }

  async addItemTransaction(id: string, transactionData: AdditionTransactionData | ConsumptionTransactionData | DisposalTransactionData): Promise<{
    transaction: InventoryTransaction;
    item: Partial<InventoryItem>;
  }> {
    const response = await this.request<{
      success: boolean;
      message: string;
      data: {
        transaction: InventoryTransaction;
        item: Partial<InventoryItem>;
      };
    }>(`/api/inventory/items/${id}/transactions`, 'POST', transactionData);
    return response.data;
  }

  async transferItem(transferData: TransferTransactionData): Promise<{
    transaction: InventoryTransaction;
  }> {
    const response = await this.request<{
      success: boolean;
      message: string;
      data: {
        transaction: InventoryTransaction;
      };
    }>('/api/inventory/item/transfer', 'POST', transferData);
    return response.data;
  }

  async getTransactions(params?: TransactionFilterParams): Promise<InventoryTransactionsResponse> {
    let url;
    
    // Create query params
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && key !== 'itemId') {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    // Build URL based on whether we have an item ID
    if (params?.itemId) {
      url = `/api/inventory/items/${params.itemId}/transactions`;
    } else {
      url = '/api/inventory/stats';
    }
    
    // Add query parameters if they exist
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }
    const response = await this.request<{
      success: boolean;
      data: InventoryTransactionsResponse;
    }>(url);
    return response.data;
  }

  async getReport(params?: InventoryReportParams): Promise<InventoryReport> {
    let url = '/api/inventory/report';
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
      data: InventoryReport;
    }>(url);
    return response.data;
  }
}

export const InventoryService = new InventoryServiceClass();