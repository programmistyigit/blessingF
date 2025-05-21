import React, { useState, useEffect } from "react";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  PieChart, 
  BarChart, 
  LineChart, 
  DollarSign, 
  History, 
  Plus, 
  Filter, 
  FileText, 
  Download, 
  Calendar, 
  Search,
  CreditCard,
  ReceiptText,
  TrendingUp,
  Wallet,
  MoreVertical,
  Eye,
  Trash2,
  Package,
  RefreshCw,
  Loader2
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import ExpenseCategoryIcon, { getCategoryColor, getCategoryName, ExpenseCategory } from "@/components/finance/ExpenseCategoryIcon";
import ExpenseStatusBadge, { ExpenseApprovalStatus, ExpensePaymentStatus } from "@/components/finance/ExpenseStatusBadge";
import { FinanceService } from "@/services/FinanceService";
import { CreateExpenseForm } from "@/components/finance/CreateExpenseForm";
import { InventoryService, InventoryTransaction, InventoryItemType } from "@/services/InventoryService";
import { MeatProductionService, MeatSale } from "@/services/MeatProductionService";
import { PeriodService, Period, PeriodStatus } from "@/services/PeriodService";

// To'lov holatini belgilaydigan enumlar
enum PaymentStatus {
  PAID = 'paid',
  PARTIALLY_PAID = 'partially_paid',
  UNPAID = 'unpaid',
  REFUNDED = 'refunded'
}

// Asosiy Finance sahifasi
const FinancePage: React.FC = () => {
  const { toast } = useToast();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [activeTab, setActiveTab] = useState("expenses");
  const [loading, setLoading] = useState(false);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | undefined>(undefined);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [periodsLoading, setPeriodsLoading] = useState(false);
  
  // Davrlarni yuklash
  useEffect(() => {
    fetchPeriods();
  }, []);
  
  // Barcha davrlarni olish
  const fetchPeriods = async () => {
    try {
      setPeriodsLoading(true);
      const response = await PeriodService.getPeriods({
        limit: 100, // Ko'proq davrlarni olish
        sort: 'startDate',
        order: 'desc'
      });
      setPeriods(response.periods);
      
      // Agar davrlar mavjud bo'lsa va hech qaysi davr tanlanmagan bo'lsa,
      // joriy faol davrni tanlash
      if (response.periods.length > 0 && !selectedPeriodId) {
        const activePeriod = response.periods.find(p => p.status === PeriodStatus.ACTIVE);
        if (activePeriod) {
          setSelectedPeriodId(activePeriod.id);
        } else {
          // Faol davr bo'lmasa eng so'nggi davrni tanlash
          setSelectedPeriodId(response.periods[0].id);
        }
      }
    } catch (error) {
      console.error("Davrlarni olishda xatolik:", error);
      toast({
        title: "Xatolik yuz berdi",
        description: "Davrlarni yuklashda muammo yuzaga keldi",
        variant: "destructive"
      });
    } finally {
      setPeriodsLoading(false);
    }
  };
  
  // Boss rolida yaratish funksiyasi mavjud emas

  // Haqiqiy sahifani render qilish
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Moliya va Xarajatlar</h1>
          <p className="text-muted-foreground">
            Xarajatlar, byudjet va moliyaviy hisobotlarni boshqarish
          </p>
        </div>
        
        {/* Boss rolida yaratish funksiyasi kerak emas */}
      </div>
      
      {/* Davrni tanlash */}
      <div className="flex justify-between items-center border p-4 rounded-lg bg-white">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          <div>
            <div className="text-sm font-medium">Moliyaviy davr</div>
            <div className="text-sm text-muted-foreground">
              {periodsLoading ? 'Davrlar yuklanmoqda...' : periods.length === 0 ? 'Davrlar topilmadi' : 'Moliyaviy ma\'lumotlarni davr bo\'yicha ko\'rish'}
            </div>
          </div>
        </div>
          
        <Select
          value={selectedPeriodId}
          onValueChange={setSelectedPeriodId}
          disabled={periodsLoading || periods.length === 0}
        >
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Davrni tanlang" />
          </SelectTrigger>
          <SelectContent>
            {periods.map((period) => (
              <SelectItem 
                key={period.id} 
                value={period.id}
                className="flex items-center gap-2"
              >
                <Badge className={cn(
                  "mr-2",
                  period.status === PeriodStatus.ACTIVE && "bg-green-500",
                  period.status === PeriodStatus.PLANNED && "bg-blue-500",
                  period.status === PeriodStatus.COMPLETED && "bg-gray-500"
                )}>
                  {PeriodService.formatPeriodStatusName(period.status)}
                </Badge>
                {period.name} ({formatDate(period.startDate)} - {formatDate(period.endDate)})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="expenses" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-[500px]">
          <TabsTrigger value="expenses" className="flex items-center gap-2">
            <ReceiptText className="h-4 w-4" />
            <span>Xarajatlar</span>
          </TabsTrigger>
          <TabsTrigger value="budget" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            <span>Byudjet</span>
          </TabsTrigger>
          <TabsTrigger value="revenue" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span>Daromadlar</span>
          </TabsTrigger>
        </TabsList>

        {/* Xarajatlar tabbi */}
        <TabsContent value="expenses" className="space-y-4">
          <ExpensesTabContent 
            selectedPeriodId={selectedPeriodId}
            selectedPeriod={periods.find(p => p.id === selectedPeriodId)}
          />
        </TabsContent>
        
        {/* Byudjet tabbi */}
        <TabsContent value="budget" className="space-y-4">
          <BudgetTabContent 
            selectedPeriodId={selectedPeriodId}
            selectedPeriod={periods.find(p => p.id === selectedPeriodId)}
          />
        </TabsContent>
        
        {/* Daromadlar tabbi */}
        <TabsContent value="revenue" className="space-y-4">
          <RevenueTabContent 
            selectedPeriodId={selectedPeriodId}
            selectedPeriod={periods.find(p => p.id === selectedPeriodId)}
          />
        </TabsContent>
      </Tabs>
      
      {/* Boss rolida yaratish imkoniyati mavjud emas */}
    </div>
  );
};

// Xarajatlar tab komponenti
interface TabContentProps {
  selectedPeriodId?: string;
  selectedPeriod?: Period | undefined;
}

const ExpensesTabContent: React.FC<TabContentProps> = ({ selectedPeriodId, selectedPeriod }) => {
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState({
    type: 'addition',
    startDate: undefined as string | undefined,
    endDate: undefined as string | undefined,
    page: 1,
    limit: 10
  });

  // Davr o'zgarganda shu davr uchun sanalarni olish
  useEffect(() => {
    if (selectedPeriod) {
      setFilter(prev => ({
        ...prev,
        startDate: selectedPeriod.startDate,
        endDate: selectedPeriod.endDate,
        page: 1
      }));
    }
  }, [selectedPeriod]);

  useEffect(() => {
    fetchTransactions();
  }, [filter]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      
      // Inventarizatsiya xizmatidan ma'lumotlarni olish
      const response = await InventoryService.getTransactions({
        type: filter.type,
        startDate: filter.startDate,
        endDate: filter.endDate,
        page: filter.page,
        limit: filter.limit
      });
      
      setTransactions(response.transactions);
      setTotalPages(response.totalPages);
      setCurrentPage(response.currentPage);
    } catch (error) {
      console.error("Tranzaksiyalarni olishda xatolik:", error);
      setTransactions([]);
      setTotalPages(1);
      setCurrentPage(1);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setFilter(prev => ({ ...prev, page }));
  };

  // Sana formatini o'zgartirish
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // Summa formatini o'zgartirish
  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined) return '';
    return new Intl.NumberFormat('uz-UZ', {
      style: 'currency',
      currency: 'UZS',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Maxsulot turini o'zbek tiliga o'girish
  const getItemTypeLabel = (type: InventoryItemType | undefined): string => {
    if (!type) return '';
    
    const labels: Record<InventoryItemType, string> = {
      feed: 'Ozuqa',
      medicine: 'Dori-darmon',
      equipment: 'Jihoz',
      cleaning: 'Tozalash mahsuloti'
    };
    
    return labels[type] || type;
  };

  return (
    <div className="space-y-4">
      <div className="p-6 bg-white rounded-md space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Inventarizatsiya xarajatlari</h2>
          
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  <Filter className="h-4 w-4" />
                  Filtrlash
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <h4 className="font-medium">Filtrlash parametrlari</h4>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="startDate">Boshlang'ich sana</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={filter.startDate || ''}
                      onChange={(e) => setFilter(prev => ({ ...prev, startDate: e.target.value || undefined }))}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="endDate">Oxirgi sana</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={filter.endDate || ''}
                      onChange={(e) => setFilter(prev => ({ ...prev, endDate: e.target.value || undefined }))}
                    />
                  </div>
                  
                  <div className="flex justify-between">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setFilter({
                          type: 'addition',
                          startDate: undefined,
                          endDate: undefined,
                          page: 1,
                          limit: 10
                        });
                      }}
                    >
                      Tozalash
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => fetchTransactions()}
                    >
                      Qo'llash
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            
            <Button variant="outline" size="sm" onClick={() => fetchTransactions()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Yangilash
            </Button>
          </div>
        </div>
        
        {loading ? (
          <div className="py-10 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sana</TableHead>
                    <TableHead>Mahsulot nomi</TableHead>
                    <TableHead>Turi</TableHead>
                    <TableHead>Miqdori</TableHead>
                    <TableHead>Narxi</TableHead>
                    <TableHead>Umumiy summa</TableHead>
                    <TableHead>Ta'minotchi</TableHead>
                    <TableHead>Mas'ul shaxs</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-6">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <Package className="h-10 w-10 mb-2 opacity-50" />
                          <h3 className="text-lg font-medium">Ma'lumotlar topilmadi</h3>
                          <p>Ushbu davr uchun inventarizatsiya xarajatlari mavjud emas.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{formatDate(transaction.date)}</TableCell>
                        <TableCell>{transaction.item?.name || '—'}</TableCell>
                        <TableCell>{getItemTypeLabel(transaction.item?.type)}</TableCell>
                        <TableCell>
                          {transaction.quantity} {transaction.item?.unit || 'dona'}
                        </TableCell>
                        <TableCell>{formatCurrency(transaction.price)}</TableCell>
                        <TableCell>{formatCurrency(transaction.totalCost)}</TableCell>
                        <TableCell>{transaction.supplier || '—'}</TableCell>
                        <TableCell>{transaction.performedBy.name}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            {totalPages > 1 && (
              <Pagination className="mt-4">
                <PaginationContent>
                  {currentPage > 1 && (
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => handlePageChange(currentPage - 1)}
                      />
                    </PaginationItem>
                  )}

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => 
                      page === 1 || 
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    )
                    .map((page, index, array) => {
                      // Ellipsis after first page if not consecutive with next page
                      const showStartEllipsis = index > 0 && array[index - 1] !== page - 1 && page !== 1;
                      // Ellipsis before last page if not consecutive with previous page
                      const showEndEllipsis = index < array.length - 1 && array[index + 1] !== page + 1 && page !== totalPages;
                      
                      return (
                        <React.Fragment key={page}>
                          {showStartEllipsis && (
                            <PaginationItem>
                              <PaginationEllipsis />
                            </PaginationItem>
                          )}
                          <PaginationItem>
                            <PaginationLink
                              isActive={page === currentPage}
                              onClick={() => handlePageChange(page)}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                          {showEndEllipsis && (
                            <PaginationItem>
                              <PaginationEllipsis />
                            </PaginationItem>
                          )}
                        </React.Fragment>
                      );
                    })}

                  {currentPage < totalPages && (
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => handlePageChange(currentPage + 1)}
                      />
                    </PaginationItem>
                  )}
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Byudjet tab komponenti
const BudgetTabContent: React.FC<TabContentProps> = ({ selectedPeriodId, selectedPeriod }) => {
  const [sales, setSales] = useState<MeatSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState({
    startDate: undefined as string | undefined,
    endDate: undefined as string | undefined,
    paymentStatus: undefined as PaymentStatus | undefined,
    page: 1,
    limit: 10
  });

  // Davr o'zgarganda shu davr uchun sanalarni olish
  useEffect(() => {
    if (selectedPeriod) {
      setFilter(prev => ({
        ...prev,
        startDate: selectedPeriod.startDate,
        endDate: selectedPeriod.endDate,
        page: 1
      }));
    }
  }, [selectedPeriod]);

  useEffect(() => {
    fetchMeatSales();
  }, [filter]);

  const fetchMeatSales = async () => {
    try {
      setLoading(true);
      
      // Go'sht sotuvlarini olish - API dan to'g'ridan-to'g'ri
      const response = await MeatProductionService.getMeatSales({
        startDate: filter.startDate,
        endDate: filter.endDate,
        paymentStatus: filter.paymentStatus,
        page: filter.page,
        limit: filter.limit
      });
      
      setSales(response.sales);
      setTotalPages(response.totalPages);
      setCurrentPage(response.currentPage);
    } catch (error) {
      console.error("Go'sht sotuvlarini olishda xatolik:", error);
      setSales([]);
      setTotalPages(1);
      setCurrentPage(1);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setFilter(prev => ({ ...prev, page }));
  };

  // Sana formatini o'zgartirish
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // Summa formatini o'zgartirish
  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined) return '';
    return new Intl.NumberFormat('uz-UZ', {
      style: 'currency',
      currency: 'UZS',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // To'lov holatini o'zbek tiliga o'girish
  const getPaymentStatusLabel = (status: PaymentStatus | undefined): string => {
    if (!status) return '';
    
    const labels: Record<PaymentStatus, string> = {
      'paid': 'To\'langan',
      'partially_paid': 'Qisman to\'langan',
      'unpaid': 'To\'lanmagan',
      'refunded': 'Qaytarilgan'
    };
    
    return labels[status] || status;
  };

  // To'lov usulini o'zbek tiliga o'girish
  const getPaymentMethodLabel = (method: string | undefined): string => {
    if (!method) return '';
    
    const methods: Record<string, string> = {
      'cash': 'Naqd pul',
      'card': 'Karta',
      'bank_transfer': 'Bank o\'tkazmasi',
      'mobile_payment': 'Mobil to\'lov'
    };
    
    return methods[method] || method;
  };

  return (
    <div className="space-y-4">
      <div className="p-6 bg-white rounded-md space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Go'sht sotuvlari</h2>
          
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  <Filter className="h-4 w-4" />
                  Filtrlash
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <h4 className="font-medium">Filtrlash parametrlari</h4>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="budgetStartDate">Boshlang'ich sana</Label>
                    <Input
                      id="budgetStartDate"
                      type="date"
                      value={filter.startDate || ''}
                      onChange={(e) => setFilter(prev => ({ ...prev, startDate: e.target.value || undefined }))}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="budgetEndDate">Oxirgi sana</Label>
                    <Input
                      id="budgetEndDate"
                      type="date"
                      value={filter.endDate || ''}
                      onChange={(e) => setFilter(prev => ({ ...prev, endDate: e.target.value || undefined }))}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="paymentStatus">To'lov holati</Label>
                    <Select
                      value={filter.paymentStatus || 'all'}
                      onValueChange={(value) => setFilter(prev => ({ 
                        ...prev, 
                        paymentStatus: value === 'all' ? undefined : value as PaymentStatus
                      }))}
                    >
                      <SelectTrigger id="paymentStatus">
                        <SelectValue placeholder="Barcha to'lov holati" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Barcha to'lov holati</SelectItem>
                        <SelectItem value="paid">To'langan</SelectItem>
                        <SelectItem value="partially_paid">Qisman to'langan</SelectItem>
                        <SelectItem value="unpaid">To'lanmagan</SelectItem>
                        <SelectItem value="refunded">Qaytarilgan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex justify-between">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setFilter({
                          startDate: undefined,
                          endDate: undefined,
                          paymentStatus: undefined,
                          page: 1,
                          limit: 10
                        });
                      }}
                    >
                      Tozalash
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => fetchMeatSales()}
                    >
                      Qo'llash
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            
            <Button variant="outline" size="sm" onClick={() => fetchMeatSales()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Yangilash
            </Button>
          </div>
        </div>
        
        {loading ? (
          <div className="py-10 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sana</TableHead>
                    <TableHead>Partiya raqami</TableHead>
                    <TableHead>Xaridor</TableHead>
                    <TableHead>Mahsulotlar</TableHead>
                    <TableHead>Umumiy summa</TableHead>
                    <TableHead>To'lov usuli</TableHead>
                    <TableHead>To'lov holati</TableHead>
                    <TableHead>Sotuvchi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-6">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <Package className="h-10 w-10 mb-2 opacity-50" />
                          <h3 className="text-lg font-medium">Ma'lumotlar topilmadi</h3>
                          <p>Ushbu davr uchun go'sht sotuvlari mavjud emas.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    sales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell>{formatDate(sale.saleDate)}</TableCell>
                        <TableCell>
                          {sale.slaughterBatch.batchNumber}
                          {sale.slaughterBatch.chickenBatch && (
                            <span className="text-xs text-muted-foreground block">
                              ({sale.slaughterBatch.chickenBatch.batchNumber})
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{sale.customer.name}</div>
                          <div className="text-xs text-muted-foreground">{sale.customer.contactNumber}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {sale.meatItems.slice(0, 2).map((item, index) => (
                              <div key={index}>
                                {MeatProductionService.getMeatTypeName(item.type)}: {item.quantity} {item.unit}
                              </div>
                            ))}
                            {sale.meatItems.length > 2 && (
                              <div className="text-xs text-muted-foreground">
                                + yana {sale.meatItems.length - 2} tur
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{formatCurrency(sale.totalAmount)}</TableCell>
                        <TableCell>{getPaymentMethodLabel(sale.paymentMethod)}</TableCell>
                        <TableCell>
                          <Badge 
                            className={cn(
                              "capitalize",
                              sale.paymentStatus === 'paid' && "bg-green-100 text-green-800 hover:bg-green-100",
                              sale.paymentStatus === 'partially_paid' && "bg-amber-100 text-amber-800 hover:bg-amber-100",
                              sale.paymentStatus === 'unpaid' && "bg-red-100 text-red-800 hover:bg-red-100",
                              sale.paymentStatus === 'refunded' && "bg-blue-100 text-blue-800 hover:bg-blue-100"
                            )}
                          >
                            {getPaymentStatusLabel(sale.paymentStatus)}
                          </Badge>
                        </TableCell>
                        <TableCell>{sale.createdBy.name}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            {totalPages > 1 && (
              <Pagination className="mt-4">
                <PaginationContent>
                  {currentPage > 1 && (
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => handlePageChange(currentPage - 1)}
                      />
                    </PaginationItem>
                  )}

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => 
                      page === 1 || 
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    )
                    .map((page, index, array) => {
                      // Ellipsis after first page if not consecutive with next page
                      const showStartEllipsis = index > 0 && array[index - 1] !== page - 1 && page !== 1;
                      // Ellipsis before last page if not consecutive with previous page
                      const showEndEllipsis = index < array.length - 1 && array[index + 1] !== page + 1 && page !== totalPages;
                      
                      return (
                        <React.Fragment key={page}>
                          {showStartEllipsis && (
                            <PaginationItem>
                              <PaginationEllipsis />
                            </PaginationItem>
                          )}
                          <PaginationItem>
                            <PaginationLink
                              isActive={page === currentPage}
                              onClick={() => handlePageChange(page)}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                          {showEndEllipsis && (
                            <PaginationItem>
                              <PaginationEllipsis />
                            </PaginationItem>
                          )}
                        </React.Fragment>
                      );
                    })}

                  {currentPage < totalPages && (
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => handlePageChange(currentPage + 1)}
                      />
                    </PaginationItem>
                  )}
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Daromadlar tab komponenti
const RevenueTabContent: React.FC<TabContentProps> = ({ selectedPeriodId, selectedPeriod }) => {
  const [revenues, setRevenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState({
    startDate: undefined as string | undefined,
    endDate: undefined as string | undefined,
    source: undefined as string | undefined,
    page: 1,
    limit: 10
  });

  // Davr o'zgarganda shu davr uchun sanalarni olish
  useEffect(() => {
    if (selectedPeriod) {
      setFilter(prev => ({
        ...prev,
        startDate: selectedPeriod.startDate,
        endDate: selectedPeriod.endDate,
        page: 1
      }));
    }
  }, [selectedPeriod]);

  useEffect(() => {
    fetchRevenues();
  }, [filter]);

  const fetchRevenues = async () => {
    try {
      setLoading(true);
      // Daromadlar uchun API - asosiy manbasi go'sht sotishdan
      const response = await FinanceService.getRevenues({
        startDate: filter.startDate,
        endDate: filter.endDate,
        source: filter.source,
        page: filter.page,
        limit: filter.limit
      });
      
      setRevenues(response.revenues || []);
      setTotalPages(response.totalPages || 1);
      setCurrentPage(response.currentPage || 1);
    } catch (error) {
      console.error("Daromadlarni olishda xatolik:", error);
      setRevenues([]);
      setTotalPages(1);
      setCurrentPage(1);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setFilter(prev => ({ ...prev, page }));
  };

  // Sana formatini o'zgartirish
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // Summa formatini o'zgartirish
  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined) return '';
    return new Intl.NumberFormat('uz-UZ', {
      style: 'currency',
      currency: 'UZS',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Daromad turini o'zbek tiliga o'girish
  const getSourceLabel = (source: string | undefined): string => {
    if (!source) return '';
    
    const sources: Record<string, string> = {
      'meat_sale': 'Go\'sht sotish',
      'whole_chicken': 'Butun tovuq sotish',
      'parts_sale': 'Tovuq qismlari sotish',
      'other': 'Boshqa'
    };
    
    return sources[source] || source;
  };

  // Daromad turi uchun icon tanlash
  const getSourceIcon = (source: string) => {
    switch(source) {
      case 'meat_sale':
        return <Package className="h-6 w-6 text-red-500" />;
      case 'whole_chicken':
        return <Package className="h-6 w-6 text-orange-500" />;
      case 'parts_sale':
        return <Package className="h-6 w-6 text-amber-500" />;
      default:
        return <DollarSign className="h-6 w-6 text-green-500" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-6 bg-white rounded-md space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Ferma daromadlari</h2>
          
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  <Filter className="h-4 w-4" />
                  Filtrlash
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <h4 className="font-medium">Filtrlash parametrlari</h4>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="revenueStartDate">Boshlang'ich sana</Label>
                    <Input
                      id="revenueStartDate"
                      type="date"
                      value={filter.startDate || ''}
                      onChange={(e) => setFilter(prev => ({ ...prev, startDate: e.target.value || undefined }))}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="revenueEndDate">Oxirgi sana</Label>
                    <Input
                      id="revenueEndDate"
                      type="date"
                      value={filter.endDate || ''}
                      onChange={(e) => setFilter(prev => ({ ...prev, endDate: e.target.value || undefined }))}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="source">Daromad turi</Label>
                    <Select
                      value={filter.source || 'all'}
                      onValueChange={(value) => setFilter(prev => ({ 
                        ...prev, 
                        source: value === 'all' ? undefined : value 
                      }))}
                    >
                      <SelectTrigger id="source">
                        <SelectValue placeholder="Barcha daromad turlari" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Barcha daromad turlari</SelectItem>
                        <SelectItem value="meat_sale">Go'sht sotish</SelectItem>
                        <SelectItem value="whole_chicken">Butun tovuq sotish</SelectItem>
                        <SelectItem value="parts_sale">Tovuq qismlari sotish</SelectItem>
                        <SelectItem value="other">Boshqa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex justify-between">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setFilter({
                          startDate: undefined,
                          endDate: undefined,
                          source: undefined,
                          page: 1,
                          limit: 10
                        });
                      }}
                    >
                      Tozalash
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => fetchRevenues()}
                    >
                      Qo'llash
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            
            <Button variant="outline" size="sm" onClick={() => fetchRevenues()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Yangilash
            </Button>
          </div>
        </div>
        
        {loading ? (
          <div className="py-10 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sana</TableHead>
                    <TableHead>Daromad turi</TableHead>
                    <TableHead>Tavsif</TableHead>
                    <TableHead>Mijoz</TableHead>
                    <TableHead>Miqdori</TableHead>
                    <TableHead>Narxi</TableHead>
                    <TableHead>Umumiy summa</TableHead>
                    <TableHead>To'lov usuli</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {revenues.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-6">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <DollarSign className="h-10 w-10 mb-2 opacity-50" />
                          <h3 className="text-lg font-medium">Ma'lumotlar topilmadi</h3>
                          <p>Ushbu davr uchun daromadlar mavjud emas.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    revenues.map((revenue) => (
                      <TableRow key={revenue.id}>
                        <TableCell>{formatDate(revenue.date)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getSourceIcon(revenue.source)}
                            <span>{getSourceLabel(revenue.source)}</span>
                          </div>
                        </TableCell>
                        <TableCell>{revenue.description}</TableCell>
                        <TableCell>
                          {revenue.customer ? (
                            <div>
                              <div className="font-medium">{revenue.customer.name}</div>
                              {revenue.customer.contactNumber && (
                                <div className="text-xs text-muted-foreground">
                                  {revenue.customer.contactNumber}
                                </div>
                              )}
                            </div>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          {revenue.quantity} {revenue.unit || 'dona'}
                        </TableCell>
                        <TableCell>{formatCurrency(revenue.unitPrice)}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(revenue.amount)}</TableCell>
                        <TableCell>{revenue.paymentMethod}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            {totalPages > 1 && (
              <Pagination className="mt-4">
                <PaginationContent>
                  {currentPage > 1 && (
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => handlePageChange(currentPage - 1)}
                      />
                    </PaginationItem>
                  )}

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => 
                      page === 1 || 
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    )
                    .map((page, index, array) => {
                      // Ellipsis after first page if not consecutive with next page
                      const showStartEllipsis = index > 0 && array[index - 1] !== page - 1 && page !== 1;
                      // Ellipsis before last page if not consecutive with previous page
                      const showEndEllipsis = index < array.length - 1 && array[index + 1] !== page + 1 && page !== totalPages;
                      
                      return (
                        <React.Fragment key={page}>
                          {showStartEllipsis && (
                            <PaginationItem>
                              <PaginationEllipsis />
                            </PaginationItem>
                          )}
                          <PaginationItem>
                            <PaginationLink
                              isActive={page === currentPage}
                              onClick={() => handlePageChange(page)}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                          {showEndEllipsis && (
                            <PaginationItem>
                              <PaginationEllipsis />
                            </PaginationItem>
                          )}
                        </React.Fragment>
                      );
                    })}

                  {currentPage < totalPages && (
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => handlePageChange(currentPage + 1)}
                      />
                    </PaginationItem>
                  )}
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}
      </div>
    </div>
  );
};



export default FinancePage;