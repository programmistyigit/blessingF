import { baseHost } from '@/lib/host';
import { getToken } from '@/lib/auth';

export interface Feed {
  id: string;
  name: string;
  code: string;
  description: string;
  nutritionalInfo: {
    protein: number;
    fat: number;
    fiber: number;
    energy: number;
    calcium?: number;
    phosphorus?: number;
    lysine?: number;
    methionine?: number;
    [key: string]: number | undefined;
  };
  recommendedAge: {
    min: number;
    max: number;
  };
  feeding: {
    method: string;
    dailyAmount: string;
    frequency?: string;
  };
  ingredients: string[];
  manufacturer: string;
  storage?: {
    temperature: string;
    humidity: string;
    shelfLife: string;
  };
  preparation?: string;
  warnings?: string;
  variants?: {
    id: string;
    name: string;
    protein: number;
    energy: number;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface FeedCreateData {
  name: string;
  code: string;
  description: string;
  nutritionalInfo: {
    protein: number;
    fat: number;
    fiber: number;
    energy: number;
    calcium?: number;
    phosphorus?: number;
    lysine?: number;
    methionine?: number;
  };
  recommendedAge: {
    min: number;
    max: number;
  };
  feeding: {
    method: string;
    dailyAmount: string;
    frequency?: string;
  };
  ingredients: string[];
  manufacturer: string;
  storage?: {
    temperature: string;
    humidity: string;
    shelfLife: string;
  };
  preparation?: string;
  warnings?: string;
}

export interface FeedUpdateData {
  nutritionalInfo?: {
    protein?: number;
    fat?: number;
    fiber?: number;
    energy?: number;
    calcium?: number;
    phosphorus?: number;
    lysine?: number;
    methionine?: number;
  };
  feeding?: {
    dailyAmount?: string;
  };
  storage?: {
    shelfLife?: string;
  };
}

export interface FeedPlan {
  id: string;
  feedId: string;
  feedName: string;
  startDay: number;
  endDay: number;
  estimatedTotalAmount: number;
  dailyAmountPerBird: number;
  status: 'scheduled' | 'active' | 'completed';
  startDate?: string;
  endDate?: string;
}

export interface BatchFeedPlan {
  batchInfo: {
    id: string;
    batchNumber: string;
    initialCount: number;
    currentCount?: number;
    section?: {
      id: string;
      name: string;
    };
  };
  plans: FeedPlan[];
  progress?: {
    totalEstimatedAmount: number;
    totalActualAmount: number;
    completion: number;
    currentDay: number;
    currentFeed?: {
      id: string;
      name: string;
    };
  };
  notes?: string;
  createdBy: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt?: string;
}

export interface FeedConsumption {
  id: string;
  batchId: string;
  feedId: string;
  quantity: number;
  date: string;
  day: number;
  amountPerBird: number;
  recordedBy: {
    id: string;
    name: string;
  };
  notes?: string;
  createdAt: string;
}

export interface CreateFeedPlanData {
  batchId: string;
  plans: {
    feedId: string;
    startDay: number;
    endDay: number;
    estimatedTotalAmount: number;
    dailyAmountPerBird: number;
  }[];
  notes?: string;
}

export interface CreateFeedConsumptionData {
  batchId: string;
  feedId: string;
  quantity: number;
  date: string;
  notes?: string;
}

export interface BatchFeedConsumptionReport {
  batchInfo: {
    id: string;
    batchNumber: string;
    totalBirds: number;
    startDate: string;
    age: number;
  };
  summary: {
    totalConsumption: number;
    averageFCR: number;
    totalCost: number;
    dailyAverage: number;
  };
  byFeedType: {
    feedId: string;
    feedName: string;
    totalUsed: number;
    averageFCR: number;
    totalCost: number;
  }[];
  dailyData: {
    date: string;
    day: number;
    consumption: number;
    cumulativeConsumption: number;
    amountPerBird: number;
    fcr: number;
  }[];
  recommendations?: string[];
}

class FeedServiceClass {
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

  async getAllFeeds(): Promise<Feed[]> {
    const response = await this.request<{
      success: boolean;
      feeds: Feed[];
    }>('/api/feeds');
    return response.feeds;
  }

  async getFeed(id: string): Promise<Feed> {
    const response = await this.request<{
      success: boolean;
      feed: Feed;
    }>(`/api/feeds/${id}`);
    return response.feed;
  }

  async createFeed(feedData: FeedCreateData): Promise<Feed> {
    const response = await this.request<{
      success: boolean;
      message: string;
      feed: Feed;
    }>('/api/feeds', 'POST', feedData);
    return response.feed;
  }

  async updateFeed(id: string, feedData: FeedUpdateData): Promise<Partial<Feed>> {
    const response = await this.request<{
      success: boolean;
      message: string;
      feed: Partial<Feed>;
    }>(`/api/feeds/${id}`, 'PUT', feedData);
    return response.feed;
  }

  async createFeedPlan(planData: CreateFeedPlanData): Promise<BatchFeedPlan> {
    const response = await this.request<{
      success: boolean;
      message: string;
      data: BatchFeedPlan;
    }>('/api/feeds/plans', 'POST', planData);
    return response.data;
  }

  async getBatchFeedPlan(batchId: string): Promise<BatchFeedPlan> {
    const response = await this.request<{
      success: boolean;
      data: BatchFeedPlan;
    }>(`/api/feeds/plans/batch/${batchId}`);
    return response.data;
  }

  async recordFeedConsumption(consumptionData: CreateFeedConsumptionData): Promise<{
    consumption: FeedConsumption;
  }> {
    const response = await this.request<{
      success: boolean;
      message: string;
      data: {
        consumption: FeedConsumption;
      };
    }>('/api/feeds/consumption', 'POST', consumptionData);
    return response.data;
  }

  async getBatchFeedConsumption(batchId: string): Promise<BatchFeedConsumptionReport> {
    const response = await this.request<{
      success: boolean;
      data: BatchFeedConsumptionReport;
    }>(`/api/feeds/consumption/batch/${batchId}`);
    return response.data;
  }
}

export const FeedService = new FeedServiceClass();