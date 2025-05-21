import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { getUser } from '@/lib/auth';
import { 
  getDashboardStats, 
  getReadyBatches, 
  getLowInventoryItems, 
  getAlerts, 
  getDashboardAttendance,
  getBatchGrowthData,
  getDashboardData,
  getFinancialDashboardData,
  getProductionDashboardData,
  getInventoryDashboardData,
  getMeatSalesDashboardData
} from '@/lib/api';
import { Batch } from '@/components/tables/BatchTable';
import StatCard from '@/components/charts/StatCard';
import GrowthChart from '@/components/charts/GrowthChart';
import BatchTable from '@/components/tables/BatchTable';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Calendar, 
  DollarSign, 
  BarChart3, 
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Filter,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from 'date-fns';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line, Area, AreaChart 
} from 'recharts';

// Moliyaviy ma'lumotlar uchun grafik komponenti
interface FinancialChartProps {
  data: {
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
  }[];
}

const FinancialChart: React.FC<FinancialChartProps> = ({ data }) => {
  // Ma'lumotlarni formatlash (qisqartirib ko'rsatish)
  const formatYAxis = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(0)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value;
  };
  
  // Tooltip ma'lumotlarini formatlash
  const formatTooltip = (value: number) => {
    return new Intl.NumberFormat('uz-UZ').format(value) + " so'm";
  };
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={data}
        margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
        <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 12 }} />
        <Tooltip 
          formatter={(value: number) => formatTooltip(value)}
          labelFormatter={(label) => `${label} oyi`}
        />
        <Area 
          type="monotone" 
          dataKey="revenue" 
          name="Daromad" 
          stroke="#10b981" 
          fill="#10b98133" 
          strokeWidth={2}
          activeDot={{ r: 6 }} 
        />
        <Area 
          type="monotone" 
          dataKey="expenses" 
          name="Xarajat" 
          stroke="#ef4444" 
          fill="#ef444433" 
          strokeWidth={2}
          activeDot={{ r: 6 }} 
        />
        <Line 
          type="monotone" 
          dataKey="profit" 
          name="Foyda" 
          stroke="#3b82f6" 
          strokeWidth={2.5}
          dot={{ stroke: '#3b82f6', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6 }} 
        />
        <Legend verticalAlign="top" height={36} />
      </AreaChart>
    </ResponsiveContainer>
  );
};

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

interface Alert {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: Date;
  severity: 'high' | 'medium' | 'low';
}

interface LowInventoryItem {
  id: string;
  name: string;
  currentQuantity: number;
  minimumQuantity: number;
  unit: string;
  percentage: number;
}

// Yangi dashboard filter tipi
export type PeriodType = 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'custom';

// Dashboard sahifasi uchun yangi komponent
const DashboardPage = () => {
  const user = getUser(); // O'zimiz yaratgan auth funksiyasidan foydalanishga o'tdik
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [period, setPeriod] = useState<PeriodType>('month');
  const [startDate, setStartDate] = useState<string | undefined>(undefined);
  const [endDate, setEndDate] = useState<string | undefined>(undefined);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | undefined>(undefined);

  // Yangi Dashboard API integratsiyasi - Asosiy ma'lumotlar
  const { data: dashboardData, isLoading: isLoadingDashboard } = useQuery({
    queryKey: ['/api/dashboard', period, startDate, endDate, selectedPeriodId],
    queryFn: () => getDashboardData({ 
      period, 
      startDate, 
      endDate, 
      periodId: selectedPeriodId 
    }),
    enabled: !!user,
  });

  // Moliyaviy ma'lumotlarni olish
  const { data: financialData, isLoading: isLoadingFinancial } = useQuery({
    queryKey: ['/api/dashboard/financial', period, startDate, endDate, selectedPeriodId],
    queryFn: () => getFinancialDashboardData({ 
      period, 
      startDate, 
      endDate, 
      periodId: selectedPeriodId 
    }),
    enabled: !!user,
  });

  // Ishlab chiqarish ma'lumotlarini olish
  const { data: productionData, isLoading: isLoadingProduction } = useQuery({
    queryKey: ['/api/dashboard/production', period, startDate, endDate, selectedPeriodId, selectedBatchId],
    queryFn: () => getProductionDashboardData({ 
      period, 
      startDate, 
      endDate, 
      periodId: selectedPeriodId,
      batchId: selectedBatchId
    }),
    enabled: !!user,
  });

  // Inventar ma'lumotlarini olish
  const { data: inventoryData, isLoading: isLoadingInventory } = useQuery({
    queryKey: ['/api/dashboard/inventory', period, startDate, endDate, selectedPeriodId],
    queryFn: () => getInventoryDashboardData({ 
      period, 
      startDate, 
      endDate, 
      periodId: selectedPeriodId 
    }),
    enabled: !!user,
  });

  // Go'sht savdo ma'lumotlarini olish
  const { data: meatSalesData, isLoading: isLoadingMeatSales } = useQuery({
    queryKey: ['/api/dashboard/meat-sales', period, startDate, endDate, selectedPeriodId],
    queryFn: () => getMeatSalesDashboardData({ 
      period, 
      startDate, 
      endDate, 
      periodId: selectedPeriodId 
    }),
    enabled: !!user,
  });

  // Eski API so'rovlarini ham saqlab qolamiz
  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    queryFn: getDashboardStats,
    enabled: !!user,
  });

  // Fetch ready batches data
  const { data: readyBatchesData, isLoading: isLoadingReadyBatches } = useQuery({
    queryKey: ['/api/dashboard/ready-batches'],
    queryFn: getReadyBatches,
    enabled: !!user,
  });

  // Fetch low inventory items data
  const { data: lowInventoryItemsData, isLoading: isLoadingLowInventory } = useQuery({
    queryKey: ['/api/dashboard/low-inventory'],
    queryFn: getLowInventoryItems,
    enabled: !!user,
  });

  // Fetch alerts data
  const { data: alertsData, isLoading: isLoadingAlerts } = useQuery({
    queryKey: ['/api/dashboard/alerts'],
    queryFn: getAlerts,
    enabled: !!user,
  });

  // Fetch attendance data
  const { data: attendanceData, isLoading: isLoadingAttendance } = useQuery({
    queryKey: ['/api/dashboard/attendance'],
    queryFn: getDashboardAttendance,
    enabled: !!user,
  });

  // Fetch batch growth data for selected batch
  const { data: growthData, isLoading: isLoadingGrowthData } = useQuery({
    queryKey: ['/api/batches/growth', selectedBatchId],
    queryFn: () => selectedBatchId ? getBatchGrowthData(selectedBatchId) : null,
    enabled: !!user && !!selectedBatchId,
  });

  // Fetch batches for growth chart
  const { data: batchesData, isLoading: isLoadingBatches } = useQuery({
    queryKey: ['/api/batches'],
    enabled: !!user,
  });

  // Use API data if available, otherwise use empty arrays/objects
  const stats = statsData || { 
    activeBatches: 0, 
    readyBatches: 0, 
    lowInventoryCount: 0, 
    attendancePercentage: 0,
    activeBatchesChange: { value: 0, isIncrease: false },
    attendanceChange: { value: 0, isIncrease: false },
    lowInventoryStatus: '',
    readyBatchesStatus: '',
  };
  
  const readyBatches = (readyBatchesData as ReadyBatch[] | undefined) || [];
  const lowInventoryItems = (lowInventoryItemsData as LowInventoryItem[] | undefined) || [];
  const alerts = (alertsData as Alert[] | undefined) || [];
  const attendance: {date: string; responsible: string; percentage: number}[] = 
    Array.isArray(attendanceData?.records) ? attendanceData.records : [];
  const attendanceSummary = attendanceData?.summary || { present: 0, absent: 0, late: 0 };
  
  // Format batches for growth chart dropdown
  const batchesForChart = Array.isArray(batchesData) 
    ? batchesData.map((batch: any) => ({
        id: batch.id,
        name: `${batch.batchNumber} partiyasi`
      }))
    : [];
  
  // Format growth data for chart
  const chartGrowthData = growthData || [];

  // Set default selected batch
  useEffect(() => {
    if (batchesForChart.length > 0 && !selectedBatchId) {
      setSelectedBatchId(batchesForChart[0].id);
    }
  }, [batchesForChart, selectedBatchId]);

  const handleSlaughterPlan = (batch: Batch) => {
    // Navigate to slaughter page with batch id for planning
    setLocation(`/slaughter?batchId=${batch.id}`);
    
    toast({
      title: 'So\'yish rejalashtirish',
      description: `${batch.batchNumber} partiyasi uchun so'yish rejasi yaratilmoqda`,
    });
  };

  const handleInventoryOrder = (item: LowInventoryItem) => {
    // Navigate to inventory page for ordering
    setLocation(`/inventory?action=add&itemId=${item.id}`);
    
    toast({
      title: 'Inventar buyurtma',
      description: `${item.name} uchun yangi buyurtma yaratilmoqda`,
    });
  };

  // Vaqt davrini o'zgartirish
  const handlePeriodChange = (value: string) => {
    setPeriod(value as PeriodType);
  };

  // Yangi tizimdan eski tizimga o'tish
  const handleBackToOldDashboard = () => {
    localStorage.setItem('dashboardVersion', 'old');
    window.location.reload();
  };

  // Dashboard ma'lumotlarini olish va formatlarini tekshirish
  const dashboardOverview = dashboardData?.data?.overview || {
    totalBirds: 0,
    totalSections: 0,
    activeBatches: 0,
    totalEmployees: 0,
    activeTasks: 0,
    pendingAlerts: 0
  };
  
  const financialSummary = financialData?.data?.financialSummary || {
    revenue: { total: 0, byCategory: {}, previousPeriod: 0, change: { value: 0, percentage: 0 } },
    expenses: { total: 0, byCategory: {}, pendingExpenses: 0 },
    profit: { gross: 0, net: 0, margin: { gross: 0, net: 0 }, previousPeriod: 0, change: { value: 0, percentage: 0 } },
    topCustomers: []
  };

  const productionSummary = productionData?.data?.productionSummary || {
    totalBirds: 0,
    currentCount: 0,
    mortality: { count: 0, rate: 0, trend: '0%' },
    weight: { average: 0, gain: 0, trend: '0%' },
    feed: { total: 0, perBird: 0, fcr: 0, trend: '0%' }
  };

  const inventorySummary = inventoryData?.data?.inventorySummary || {
    totalItems: 0,
    totalValue: 0,
    categories: [],
    lowStockItems: []
  };

  const salesSummary = meatSalesData?.data?.salesSummary || {
    totalSales: 0,
    totalRevenue: 0,
    averageSaleValue: 0,
    salesCount: 0,
    byPaymentMethod: { cash: 0, card: 0, transfer: 0, mixed: 0 },
    byPaymentStatus: { paid: 0, pending: 0, partial: 0 },
    previousPeriod: { totalRevenue: 0, salesCount: 0 },
    growth: { revenue: 0, salesCount: 0 }
  };

  // Formatni millionlarga o'zgartirish uchun utility funksiyasi
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)} mln`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)} ming`;
    }
    return amount.toString();
  };

  return (
    <div>
      {/* Filter Panel */}
      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-gray-800">Ferma boshqaruv paneli</h2>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center">
              <span className="mr-2 text-sm text-gray-600">Davr:</span>
              <Select defaultValue={period} onValueChange={handlePeriodChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Davrni tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Bugun</SelectItem>
                  <SelectItem value="yesterday">Kecha</SelectItem>
                  <SelectItem value="week">Ushbu hafta</SelectItem>
                  <SelectItem value="month">Ushbu oy</SelectItem>
                  <SelectItem value="year">Ushbu yil</SelectItem>
                  <SelectItem value="custom">Maxsus davr</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                // Ma'lumotlarni qayta yuklash
                queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
                queryClient.invalidateQueries({ queryKey: ['/api/dashboard/financial'] });
                queryClient.invalidateQueries({ queryKey: ['/api/dashboard/production'] });
                queryClient.invalidateQueries({ queryKey: ['/api/dashboard/inventory'] });
                queryClient.invalidateQueries({ queryKey: ['/api/dashboard/meat-sales'] });
                
                toast({
                  title: "Yangilanmoqda",
                  description: "Dashboard ma'lumotlari yangilanmoqda"
                });
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Yangilash
            </Button>
          </div>
        </div>
      </div>
      
      {/* Dashboard Umumiy Ma'lumotlar */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {isLoadingDashboard ? (
          // Loading state
          Array(6).fill(0).map((_, index) => (
            <div key={index} className="bg-white rounded-lg p-4 shadow animate-pulse">
              <div className="h-3 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-7 bg-gray-200 rounded w-1/2 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
            </div>
          ))
        ) : (
          <>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Jami tovuqlar</p>
                    <h3 className="text-2xl font-bold">{dashboardOverview.totalBirds.toLocaleString()}</h3>
                  </div>
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Jami sexlar</p>
                    <h3 className="text-2xl font-bold">{dashboardOverview.totalSections}</h3>
                  </div>
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Aktiv partiyalar</p>
                    <h3 className="text-2xl font-bold">{dashboardOverview.activeBatches}</h3>
                  </div>
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Jami xodimlar</p>
                    <h3 className="text-2xl font-bold">{dashboardOverview.totalEmployees}</h3>
                  </div>
                  <div className="p-2 bg-blue-500/10 rounded-full">
                    <Package className="h-5 w-5 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Aktiv vazifalar</p>
                    <h3 className="text-2xl font-bold">{dashboardOverview.activeTasks}</h3>
                  </div>
                  <div className="p-2 bg-green-500/10 rounded-full">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Ogohlantirish</p>
                    <h3 className="text-2xl font-bold">{dashboardOverview.pendingAlerts}</h3>
                  </div>
                  <div className="p-2 bg-yellow-500/10 rounded-full">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
      
      {/* Moliyaviy ma'lumotlar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Moliyaviy ko'rsatkichlar</CardTitle>
            <CardDescription>
              {period === 'today' ? 'Bugungi kun' : 
               period === 'yesterday' ? 'Kecha' : 
               period === 'week' ? 'Joriy hafta' : 
               period === 'month' ? 'Joriy oy' : 
               period === 'year' ? 'Joriy yil' : 'Tanlangan davr'} uchun moliyaviy ma'lumotlar
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingFinancial ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-8 bg-gray-200 rounded"></div>
                <div className="h-44 bg-gray-200 rounded"></div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                    <p className="text-sm text-green-700 mb-1">Daromad</p>
                    <h3 className="text-2xl font-bold text-green-700">
                      {formatCurrency(financialSummary.revenue.total)} so'm
                    </h3>
                    <p className="text-xs flex items-center mt-2">
                      {financialSummary.revenue.change.percentage >= 0 ? (
                        <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                      )}
                      <span className={financialSummary.revenue.change.percentage >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {financialSummary.revenue.change.percentage >= 0 ? '+' : ''}
                        {financialSummary.revenue.change.percentage.toFixed(1)}% 
                      </span>
                      <span className="text-neutral-500 ml-1">oldingi davrga nisbatan</span>
                    </p>
                  </div>
                  
                  <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                    <p className="text-sm text-red-700 mb-1">Xarajatlar</p>
                    <h3 className="text-2xl font-bold text-red-700">
                      {formatCurrency(financialSummary.expenses.total)} so'm
                    </h3>
                    <p className="text-xs mt-2">
                      <span className="text-neutral-600">Kutilayotgan: </span>
                      <span className="text-neutral-800">{formatCurrency(financialSummary.expenses.pendingExpenses)} so'm</span>
                    </p>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <p className="text-sm text-blue-700 mb-1">Foyda</p>
                    <h3 className="text-2xl font-bold text-blue-700">
                      {formatCurrency(financialSummary.profit.gross)} so'm
                    </h3>
                    <p className="text-xs flex items-center mt-2">
                      <span className="text-neutral-600 mr-1">Rentabellik:</span>
                      <span className="text-blue-700 font-medium">
                        {financialSummary.profit.margin.gross.toFixed(1)}%
                      </span>
                    </p>
                  </div>
                </div>
                
                {/* Moliyaviy ma'lumotlar grafigi */}
                <div className="h-52 bg-neutral-50 border border-neutral-200 rounded-lg p-4">
                  {financialData?.data?.monthlyData ? (
                    <FinancialChart data={financialData.data.monthlyData} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <p className="text-neutral-500">
                        Daromad va xarajatlar ma'lumotlari mavjud emas
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Savdo ma'lumotlari</CardTitle>
            <CardDescription>Go'sht savdosi statistikasi</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingMeatSales ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-2/3"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Jami savdo</span>
                    <span className="font-medium">{salesSummary.salesCount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Jami daromad</span>
                    <span className="font-medium">{formatCurrency(salesSummary.totalRevenue)} so'm</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">O'rtacha savdo</span>
                    <span className="font-medium">{formatCurrency(salesSummary.averageSaleValue)} so'm</span>
                  </div>
                  
                  <div className="pt-2 border-t border-neutral-200">
                    <h4 className="font-medium text-sm mb-3">To'lov usuli bo'yicha</h4>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <span className="text-xs text-muted-foreground w-24">Naqd pul</span>
                        <div className="flex-1 mx-2">
                          <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500" style={{ 
                              width: `${salesSummary.totalRevenue ? (salesSummary.byPaymentMethod.cash / salesSummary.totalRevenue * 100) : 0}%` 
                            }}></div>
                          </div>
                        </div>
                        <span className="text-xs font-medium">
                          {formatCurrency(salesSummary.byPaymentMethod.cash)}
                        </span>
                      </div>
                      
                      <div className="flex items-center">
                        <span className="text-xs text-muted-foreground w-24">Karta</span>
                        <div className="flex-1 mx-2">
                          <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ 
                              width: `${salesSummary.totalRevenue ? (salesSummary.byPaymentMethod.card / salesSummary.totalRevenue * 100) : 0}%` 
                            }}></div>
                          </div>
                        </div>
                        <span className="text-xs font-medium">
                          {formatCurrency(salesSummary.byPaymentMethod.card)}
                        </span>
                      </div>
                      
                      <div className="flex items-center">
                        <span className="text-xs text-muted-foreground w-24">O'tkazma</span>
                        <div className="flex-1 mx-2">
                          <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500" style={{ 
                              width: `${salesSummary.totalRevenue ? (salesSummary.byPaymentMethod.transfer / salesSummary.totalRevenue * 100) : 0}%` 
                            }}></div>
                          </div>
                        </div>
                        <span className="text-xs font-medium">
                          {formatCurrency(salesSummary.byPaymentMethod.transfer)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Ishlab chiqarish va Inventar ma'lumotlari */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Ishlab chiqarish ma'lumotlari */}
        <Card>
          <CardHeader>
            <CardTitle>Ishlab chiqarish statistikasi</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingProduction ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-2/3"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Jami tovuqlar</p>
                    <p className="font-semibold">{productionSummary.totalBirds.toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Hozirgi holat</p>
                    <p className="font-semibold">{productionSummary.currentCount.toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="pt-2 border-t border-neutral-200">
                  <h4 className="font-medium text-sm mb-3">O'lim ko'rsatkichlari</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Jami</p>
                      <p className="font-semibold">{productionSummary.mortality.count.toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Foiz</p>
                      <p className="font-semibold">{productionSummary.mortality.rate.toFixed(1)}%</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">O'zgarish</p>
                      <p className={`font-semibold ${
                        productionSummary.mortality.trend.startsWith('+') ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {productionSummary.mortality.trend}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-2 border-t border-neutral-200">
                  <h4 className="font-medium text-sm mb-3">O'rtacha vazn ko'rsatkichlari</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">O'rtacha</p>
                      <p className="font-semibold">{productionSummary.weight.average.toFixed(2)} kg</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">O'sish</p>
                      <p className="font-semibold">{productionSummary.weight.gain.toFixed(2)} kg</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">O'zgarish</p>
                      <p className={`font-semibold ${
                        productionSummary.weight.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {productionSummary.weight.trend}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-2 border-t border-neutral-200">
                  <h4 className="font-medium text-sm mb-3">Ozuqa ko'rsatkichlari</h4>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Jami</p>
                      <p className="font-semibold">{productionSummary.feed.total.toLocaleString()} kg</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Tovuq uchun</p>
                      <p className="font-semibold">{productionSummary.feed.perBird.toFixed(2)} kg</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">FCR</p>
                      <p className="font-semibold">{productionSummary.feed.fcr.toFixed(2)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">O'zgarish</p>
                      <p className={`font-semibold ${
                        productionSummary.feed.trend.startsWith('-') ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {productionSummary.feed.trend}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Inventar ma'lumotlari */}
        <Card>
          <CardHeader>
            <CardTitle>Inventar ma'lumotlari</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingInventory ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-2/3"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Jami mahsulotlar</p>
                    <p className="font-semibold">{inventorySummary.totalItems.toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Jami qiymat</p>
                    <p className="font-semibold">{formatCurrency(inventorySummary.totalValue)} so'm</p>
                  </div>
                </div>
                
                <div className="pt-2 border-t border-neutral-200">
                  <h4 className="font-medium text-sm mb-3">Kategoriyalar bo'yicha</h4>
                  <div className="space-y-3">
                    {inventorySummary.categories.map((category, index) => (
                      <div key={index} className="flex items-center">
                        <span className="text-xs text-muted-foreground w-20">{category.category}</span>
                        <div className="flex-1 mx-2">
                          <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ 
                              width: `${inventorySummary.totalValue ? (category.value / inventorySummary.totalValue * 100) : 0}%` 
                            }}></div>
                          </div>
                        </div>
                        <span className="text-xs font-medium">
                          {formatCurrency(category.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="pt-2 border-t border-neutral-200">
                  <h4 className="font-medium text-sm mb-3">Kam qolgan mahsulotlar</h4>
                  <div className="space-y-2">
                    {inventorySummary.lowStockItems.slice(0, 3).map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">Qoldiq: {item.currentStock} {item.unit}</p>
                        </div>
                        <div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setLocation(`/inventory?action=add&itemId=${item.id}`)}
                          >
                            Buyurtma
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    
      {/* Original Dashboard */}
      <div className="mt-10 mb-4 border-t pt-6">
        <h2 className="text-xl font-semibold mb-4">Eski ko'rinishdagi Dashboard</h2>

        {/* Eski Dashboard Stat Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          {isLoadingStats ? (
            Array(4).fill(0).map((_, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))
          ) : (
            <>
              <StatCard
                title="Aktiv Partiyalar"
                value={stats.activeBatches.toString()}
                icon={<Package className="h-6 w-6 text-primary" />}
                iconBgColor="bg-primary-light bg-opacity-20"
                borderColor="border-primary"
                change={stats.activeBatchesChange}
              />
              
              <StatCard
                title="Yo'qlamalar"
                value={`${stats.attendancePercentage}%`}
                icon={<CheckCircle className="h-6 w-6 text-success" />}
                iconBgColor="bg-success bg-opacity-20"
                borderColor="border-success"
                change={stats.attendanceChange}
              />
              
              <StatCard
                title="Kam Tovarlar"
                value={stats.lowInventoryCount.toString()}
                icon={<AlertTriangle className="h-6 w-6 text-warning" />}
                iconBgColor="bg-warning bg-opacity-20"
                borderColor="border-warning"
                change={{ value: stats.lowInventoryStatus, isIncrease: false }}
              />
              
              <StatCard
                title="Tayyor Partiyalar"
                value={stats.readyBatches.toString()}
                icon={<Clock className="h-6 w-6 text-info" />}
                iconBgColor="bg-info bg-opacity-20"
                borderColor="border-info"
                change={{ value: stats.readyBatchesStatus, isIncrease: true }}
              />
            </>
          )}
        </div>
        
        {/* Middle Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Ready Batches Table */}
          <div className="col-span-2">
            {isLoadingReadyBatches ? (
              <div className="bg-white rounded-lg shadow p-4 h-full">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="space-y-3">
                  {Array(3).fill(0).map((_, index) => (
                    <div key={index} className="animate-pulse flex items-center">
                      <div className="h-4 bg-gray-200 rounded w-1/4 mr-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/5"></div>
                      <div className="ml-auto h-8 bg-gray-200 rounded w-24"></div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <BatchTable
                batches={readyBatches}
                title="So'yishga tayyor partiyalar"
                actionLabel="Rejalashtirish"
                onAction={handleSlaughterPlan}
              />
            )}
          </div>
          
          {/* Alerts Panel */}
          <div className="bg-white rounded-lg shadow">
            <div className="border-b border-neutral-200 px-6 py-4">
              <h2 className="font-heading font-semibold text-neutral-800">Favqulodda xabarlar</h2>
            </div>
            <div className="p-6">
              {isLoadingAlerts ? (
                <div className="space-y-4">
                  {Array(2).fill(0).map((_, index) => (
                    <div key={index} className="animate-pulse p-4 rounded bg-gray-100">
                      <div className="flex">
                        <div className="flex-shrink-0 h-5 w-5 rounded-full bg-gray-300"></div>
                        <div className="ml-3 w-full">
                          <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {alerts.map((alert) => (
                    <div 
                      key={alert.id}
                      className={`
                        p-4 rounded
                        ${alert.severity === 'high' ? 'bg-danger bg-opacity-10 border-l-4 border-danger' : 
                          alert.severity === 'medium' ? 'bg-warning bg-opacity-10 border-l-4 border-warning' : 
                          'bg-info bg-opacity-10 border-l-4 border-info'}
                      `}
                    >
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <AlertTriangle className={`h-5 w-5 ${
                            alert.severity === 'high' ? 'text-danger' : 
                            alert.severity === 'medium' ? 'text-warning' : 
                            'text-info'
                          }`} />
                        </div>
                        <div className="ml-3">
                          <h3 className={`text-sm font-medium ${
                            alert.severity === 'high' ? 'text-danger' : 
                            alert.severity === 'medium' ? 'text-warning' : 
                            'text-info'
                          }`}>
                            {alert.title}
                          </h3>
                          <div className="mt-1 text-sm text-neutral-600">
                            <p>{alert.message}</p>
                          </div>
                          <div className="mt-2">
                            <p className="text-xs text-neutral-500">
                              {new Date(alert.timestamp).toLocaleTimeString('uz-UZ', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })} {new Date(alert.timestamp).toLocaleDateString('uz-UZ', { 
                                day: '2-digit', 
                                month: '2-digit', 
                                year: 'numeric' 
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Growth Statistics Row */}
        <div className="grid grid-cols-1 gap-6 mb-6">
          {isLoadingGrowthData || isLoadingBatches ? (
            <div className="bg-white rounded-lg shadow p-4">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-64 bg-gray-100 rounded animate-pulse flex items-center justify-center">
                <div className="text-gray-400">Маълумотлар юкланмоқда...</div>
              </div>
            </div>
          ) : (
            <GrowthChart
              data={chartGrowthData}
              title="Haftalik statistika"
              batches={batchesForChart}
              onBatchChange={setSelectedBatchId}
              selectedBatchId={selectedBatchId}
              loading={isLoadingGrowthData}
            />
          )}
        </div>
        
        {/* Bottom Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Low Inventory */}
          <div className="bg-white rounded-lg shadow">
            <div className="border-b border-neutral-200 px-6 py-4">
              <h2 className="font-heading font-semibold text-neutral-800">Kam qolgan inventar</h2>
            </div>
            <div className="p-6">
              {isLoadingLowInventory ? (
                <div className="space-y-4 animate-pulse">
                  {Array(3).fill(0).map((_, index) => (
                    <div className="flex items-center" key={index}>
                      <div className="w-2/3">
                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                        <div className="h-2 bg-gray-200 rounded w-full"></div>
                      </div>
                      <div className="w-1/3 text-right">
                        <div className="h-4 bg-gray-200 rounded w-2/3 mb-2 ml-auto"></div>
                        <div className="h-8 bg-gray-200 rounded w-16 ml-auto"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {lowInventoryItems.map((item) => (
                    <div className="flex items-center" key={item.id}>
                      <div className="w-2/3">
                        <h3 className="text-sm font-medium">{item.name}</h3>
                        <div className="mt-1 flex items-center">
                          <div className="flex-1 h-2 bg-neutral-200 rounded-full">
                            <div 
                              className={`h-2 rounded-full ${
                                item.percentage <= 5 ? 'bg-danger' : 
                                item.percentage <= 20 ? 'bg-warning' : 
                                'bg-success'
                              }`} 
                              style={{ width: `${item.percentage}%` }}
                            ></div>
                          </div>
                          <span className={`ml-2 text-xs font-medium ${
                            item.percentage <= 5 ? 'text-danger' : 
                            item.percentage <= 20 ? 'text-warning' : 
                            'text-success'
                          }`}>
                            {item.percentage}%
                          </span>
                        </div>
                      </div>
                      <div className="w-1/3 text-right">
                        <span className="text-sm text-neutral-600">{item.currentQuantity} {item.unit} qoldi</span>
                        <Button
                          className="mt-1 bg-primary text-white text-xs py-1 px-3 rounded hover:bg-primary-dark focus:outline-none"
                          size="sm"
                          onClick={() => handleInventoryOrder(item)}
                        >
                          Buyurtma
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Attendance Stats */}
          <div className="bg-white rounded-lg shadow">
            <div className="border-b border-neutral-200 px-6 py-4">
              <h2 className="font-heading font-semibold text-neutral-800">Bugungi yo'qlama</h2>
            </div>
            <div className="p-6">
              {isLoadingAttendance ? (
                <div className="space-y-6 animate-pulse">
                  <div className="grid grid-cols-3 gap-4">
                    {Array(3).fill(0).map((_, index) => (
                      <div key={index} className="text-center">
                        <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto"></div>
                      </div>
                    ))}
                  </div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="space-y-3">
                    {Array(3).fill(0).map((_, index) => (
                      <div key={index} className="flex justify-between">
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-4 mb-6 text-center">
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-success">{attendanceSummary.present}</div>
                      <div className="text-xs text-neutral-600">Kelganlar</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-danger">{attendanceSummary.absent}</div>
                      <div className="text-xs text-neutral-600">Kelmaganlar</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-warning">{attendanceSummary.late}</div>
                      <div className="text-xs text-neutral-600">Kechikkanlar</div>
                    </div>
                  </div>
                  
                  <div className="border-t border-neutral-100 pt-4">
                    <h3 className="text-sm font-medium mb-3">Bo'limlar bo'yicha yo'qlama</h3>
                    <div className="overflow-auto max-h-[200px]">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-neutral-50">
                            <th className="px-4 py-2 text-left font-medium text-neutral-700">Sana</th>
                            <th className="px-4 py-2 text-left font-medium text-neutral-700">Mas'ul</th>
                            <th className="px-4 py-2 text-left font-medium text-neutral-700">Natija</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                          {attendance.map((record, index) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-neutral-50'}>
                              <td className="px-4 py-2 whitespace-nowrap">{record.date}</td>
                              <td className="px-4 py-2 whitespace-nowrap">{record.responsible}</td>
                              <td className="px-4 py-2 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="w-16 h-1.5 bg-neutral-200 rounded-full mr-2">
                                    <div 
                                      className={`h-1.5 rounded-full ${
                                        record.percentage < 80 ? 'bg-warning' : 'bg-success'
                                      }`}
                                      style={{ width: `${record.percentage}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-xs">{record.percentage}%</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;