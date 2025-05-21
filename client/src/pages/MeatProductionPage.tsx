import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  MeatProductionService,
  SlaughterBatch,
  SlaughterBatchStatus,
  MeatType,
  MeatQualityGrade,
  SlaughterResultData,
  MeatItem,
  MeatSale,
  PaymentMethod,
  PaymentStatus,
  DeliveryStatus
} from '@/services/MeatProductionService';

// Go'sht savdosi yaratish uchun interfeyslar
interface CreateMeatSaleData {
  slaughterBatchId: string;
  saleDate: string;
  customer: {
    name: string;
    contactNumber: string;
    address: string;
    isRegular?: boolean;
  };
  meatItems: Array<{
    type: string;
    quantity: number;
    unit: string;
    pricePerUnit: number;
    totalPrice?: number;
  }>;
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
    assignedTo?: string;
    vehicleNumber?: string;
    scheduledTime?: string;
  };
  notes?: string;
};
import { BatchService } from '@/services/BatchService';
import { UserService } from '@/services/UserService';
import { WebSocketService, WebSocketEventType } from '@/services/WebSocketService';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

import {
  ClipboardList,
  Scissors,
  Calendar as CalendarIcon,
  ChevronDown,
  Download,
  BarChart2,
  BarChart4,
  FileSpreadsheet,
  FileText, // FilePdf o'rniga FileText ishlatish
  Filter,
  PlusCircle,
  CircleX,
  Check,
  Trash2,
  Search,
  RefreshCw,
  Building2,
  Package,
  Scale,
  Activity,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Settings,
  FileDigit,
  Eye,
  Edit,
  Truck,
  Users,
  Calendar as CalendarIconComponent,
  Clock,
  DollarSign,
  CreditCard,
  Tag,
  ArrowRight,
  ArrowDown,
  ShoppingCart,
  ExternalLink,
  Plus,
  X,
  User,
  Banknote,
  Building,
  Phone,
  MapPin
} from 'lucide-react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';

// Tab-based main component
const MeatProductionPage = () => {
  const [activeTab, setActiveTab] = useState<string>('slaughter-batches');
  const { toast } = useToast();
  
  // Redux store'dan foydalanib, user ma'lumotlarini olish
  const user = useSelector((state: RootState) => state.auth.user);

  const isAdmin = user?.role === 'boss' || user?.role === 'admin';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Go'sht ishlab chiqarish</h1>
          <p className="text-muted-foreground">So'yish, go'sht ishlab chiqarish va savdo boshqaruvi</p>
        </div>
      </div>

      <Tabs defaultValue="slaughter-batches" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="slaughter-batches" className="flex items-center">
            <Scissors className="h-4 w-4 mr-2" />
            <span>So'yish partiyalari</span>
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center">
            <Package className="h-4 w-4 mr-2" />
            <span>Go'sht inventari</span>
          </TabsTrigger>
          <TabsTrigger value="sales" className="flex items-center">
            <ShoppingCart className="h-4 w-4 mr-2" />
            <span>Savdo</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="slaughter-batches">
          <SlaughterBatchesTab isAdmin={isAdmin} />
        </TabsContent>

        <TabsContent value="inventory">
          <MeatInventoryTab isAdmin={isAdmin} />
        </TabsContent>

        <TabsContent value="sales">
          <MeatSalesTab isAdmin={isAdmin} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Status badge component for slaughter batches
const SlaughterBatchStatusBadge = ({ status }: { status: SlaughterBatchStatus }) => {
  switch (status) {
    case SlaughterBatchStatus.PLANNED:
      return <Badge variant="outline" className="bg-blue-50 text-blue-800 hover:bg-blue-100">Rejalashtirilgan</Badge>;
    case SlaughterBatchStatus.IN_PROGRESS:
      return <Badge variant="outline" className="bg-amber-50 text-amber-800 hover:bg-amber-100">Jarayonda</Badge>;
    case SlaughterBatchStatus.COMPLETED:
      return <Badge variant="outline" className="bg-green-50 text-green-800 hover:bg-green-100">Tugallangan</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

// Meat type badge component
const MeatTypeBadge = ({ type }: { type: MeatType }) => {
  switch (type) {
    case MeatType.WHOLE:
      return <Badge variant="outline" className="bg-emerald-50 text-emerald-800">Butun tovuq</Badge>;
    case MeatType.BREAST:
      return <Badge variant="outline" className="bg-blue-50 text-blue-800">Ko'krak</Badge>;
    case MeatType.LEG:
      return <Badge variant="outline" className="bg-purple-50 text-purple-800">Oyoq</Badge>;
    case MeatType.WING:
      return <Badge variant="outline" className="bg-amber-50 text-amber-800">Qanot</Badge>;
    case MeatType.THIGH:
      return <Badge variant="outline" className="bg-pink-50 text-pink-800">Son</Badge>;
    case MeatType.DRUMSTICK:
      return <Badge variant="outline" className="bg-indigo-50 text-indigo-800">Boldir</Badge>;
    case MeatType.BY_PRODUCT:
      return <Badge variant="outline" className="bg-gray-50 text-gray-800">Subproduktlar</Badge>;
    default:
      return <Badge variant="outline">{type}</Badge>;
  }
};

// Meat quality badge component
const MeatQualityBadge = ({ grade }: { grade: MeatQualityGrade }) => {
  switch (grade) {
    case MeatQualityGrade.PREMIUM:
      return <Badge variant="outline" className="bg-green-50 text-green-800">Premium</Badge>;
    case MeatQualityGrade.STANDARD:
      return <Badge variant="outline" className="bg-blue-50 text-blue-800">Standart</Badge>;
    case MeatQualityGrade.COMMERCIAL:
      return <Badge variant="outline" className="bg-amber-50 text-amber-800">Tijoriy</Badge>;
    case MeatQualityGrade.REJECTED:
      return <Badge variant="outline" className="bg-red-50 text-red-800">Rad etilgan</Badge>;
    default:
      return <Badge variant="outline">{grade}</Badge>;
  }
};

// Payment status badge component
const PaymentStatusBadge = ({ status }: { status: PaymentStatus }) => {
  switch (status) {
    case PaymentStatus.PAID:
      return <Badge variant="outline" className="bg-green-50 text-green-800">To'langan</Badge>;
    case PaymentStatus.PENDING:
      return <Badge variant="outline" className="bg-amber-50 text-amber-800">Kutilmoqda</Badge>;
    case PaymentStatus.PARTIAL:
      return <Badge variant="outline" className="bg-blue-50 text-blue-800">Qisman to'langan</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

// Delivery status badge component
const DeliveryStatusBadge = ({ status }: { status: DeliveryStatus }) => {
  switch (status) {
    case DeliveryStatus.DELIVERED:
      return <Badge variant="outline" className="bg-green-50 text-green-800">Yetkazildi</Badge>;
    case DeliveryStatus.IN_PROGRESS:
      return <Badge variant="outline" className="bg-amber-50 text-amber-800">Jarayonda</Badge>;
    case DeliveryStatus.PENDING:
      return <Badge variant="outline" className="bg-blue-50 text-blue-800">Kutilmoqda</Badge>;
    case DeliveryStatus.CANCELLED:
      return <Badge variant="outline" className="bg-red-50 text-red-800">Bekor qilindi</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

// Slaughter Batches Tab Component
const SlaughterBatchesTab = ({ isAdmin }: { isAdmin: boolean }) => {
  const [batches, setBatches] = useState<SlaughterBatch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const { toast } = useToast();

  // Fetch slaughter batches
  const fetchSlaughterBatches = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        limit: 10,
      };
      
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      
      if (startDate) {
        params.fromDate = startDate.toISOString();
      }
      
      if (endDate) {
        params.toDate = endDate.toISOString();
      }
      
      const response = await MeatProductionService.getSlaughterBatches(params);
      setBatches(response.batches);
      setTotalPages(response.totalPages);
    } catch (error: any) {
      toast({
        title: 'Xatolik',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlaughterBatches();
  }, [currentPage, statusFilter, startDate, endDate]);

  // WebSocket event handlers
  useEffect(() => {
    const handleBatchUpdated = () => {
      fetchSlaughterBatches();
      
      if (selectedBatchId) {
        setShowDetailsModal(true);
      }
      
      toast({
        title: 'Yangilanish',
        description: 'So\'yish partiyasi ma\'lumotlari yangilandi',
      });
    };
    
    // You would need to add these event types to your WebSocketEventType enum
    // WebSocketService.on(WebSocketEventType.SLAUGHTER_BATCH_CREATED, handleBatchUpdated);
    // WebSocketService.on(WebSocketEventType.SLAUGHTER_BATCH_UPDATED, handleBatchUpdated);
    
    // Cleanup on unmount
    return () => {
      // WebSocketService.off(WebSocketEventType.SLAUGHTER_BATCH_CREATED, handleBatchUpdated);
      // WebSocketService.off(WebSocketEventType.SLAUGHTER_BATCH_UPDATED, handleBatchUpdated);
    };
  }, [selectedBatchId]);

  const handleCreateBatch = () => {
    setShowCreateModal(true);
  };

  const handleViewBatch = (id: string) => {
    setSelectedBatchId(id);
    setShowDetailsModal(true);
  };

  const clearDateFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="w-[180px]">
            <Select 
              value={statusFilter} 
              onValueChange={setStatusFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha statuslar</SelectItem>
                <SelectItem value="planned">Rejalashtirilgan</SelectItem>
                <SelectItem value="in_progress">Jarayonda</SelectItem>
                <SelectItem value="completed">Tugallangan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-[180px]">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Boshlang'ich sana"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="w-[180px]">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : "Tugash sana"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {(startDate || endDate) && (
            <Button variant="ghost" size="icon" onClick={clearDateFilters}>
              <CircleX className="h-4 w-4" />
            </Button>
          )}
        </div>

        {isAdmin && (
          <Button onClick={handleCreateBatch}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Yangi partiya
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin h-8 w-8 border-2 border-primary rounded-full border-t-transparent"></div>
        </div>
      ) : batches.length === 0 ? (
        <div className="text-center p-12 border rounded-md">
          <Scissors className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">So'yish partiyalari topilmadi</h3>
          <p className="text-muted-foreground mb-4">Hozirda so'yish partiyalari mavjud emas yoki filtrlarga mos partiyalar topilmadi</p>
          {isAdmin && (
            <Button onClick={handleCreateBatch}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Yangi partiya yaratish
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Partiya raqami</TableHead>
                  <TableHead>Tovuq partiyasi</TableHead>
                  <TableHead>Rejalashtirilgan sana</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tovuqlar soni</TableHead>
                  <TableHead>O'rtacha vazn</TableHead>
                  <TableHead>Kim tomonidan</TableHead>
                  <TableHead className="text-right">Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((batch) => (
                  <TableRow key={batch.id}>
                    <TableCell>{batch.batchNumber}</TableCell>
                    <TableCell>{batch.chickenBatch.batchNumber}</TableCell>
                    <TableCell>{format(new Date(batch.plannedDate), 'PPP')}</TableCell>
                    <TableCell>
                      <SlaughterBatchStatusBadge status={batch.status} />
                    </TableCell>
                    <TableCell>{batch.preslaughterCount}</TableCell>
                    <TableCell>{batch.preslaughterAverageWeight} kg</TableCell>
                    <TableCell>{batch.createdBy.name}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleViewBatch(batch.id)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ko'rish
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      className={currentPage === 1 ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        isActive={currentPage === page}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      className={currentPage === totalPages ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}
      
      {/* Placeholder for Modals */}
      {/* We'll implement these modals separately */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Yangi so'yish partiyasi yaratish</DialogTitle>
            <DialogDescription>
              So'yish partiyasi yaratish uchun quyidagi formani to'ldiring
            </DialogDescription>
          </DialogHeader>
          <CreateSlaughterBatchForm 
            onSuccess={() => {
              setShowCreateModal(false);
              fetchSlaughterBatches();
              toast({
                title: "Muvaffaqiyatli",
                description: "So'yish partiyasi yaratildi",
              });
            }}
            onCancel={() => setShowCreateModal(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>So'yish partiyasi tafsilotlari</DialogTitle>
          </DialogHeader>
          {selectedBatchId && (
            <SlaughterBatchDetails 
              batchId={selectedBatchId} 
              onClose={() => setShowDetailsModal(false)}
              onUpdateSuccess={() => {
                setShowDetailsModal(false);
                fetchSlaughterBatches();
              }}
              isAdmin={isAdmin}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Meat Inventory Tab Component
const MeatInventoryTab = ({ isAdmin }: { isAdmin: boolean }) => {
  const [items, setItems] = useState<MeatItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [qualityFilter, setQualityFilter] = useState<string>('all');
  const { toast } = useToast();

  // Fetch meat inventory
  const fetchMeatInventory = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        limit: 10,
      };
      
      if (typeFilter !== 'all') {
        params.type = typeFilter;
      }
      
      if (qualityFilter !== 'all') {
        params.qualityGrade = qualityFilter;
      }
      
      const response = await MeatProductionService.getMeatInventory(params);
      setItems(response.items);
      setTotalPages(response.totalPages);
    } catch (error: any) {
      toast({
        title: 'Xatolik',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeatInventory();
  }, [currentPage, typeFilter, qualityFilter]);

  const handleViewItem = (id: string) => {
    setSelectedItemId(id);
    setShowDetailsModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 items-center">
        <div className="w-[180px]">
          <Select 
            value={typeFilter} 
            onValueChange={setTypeFilter}
          >
            <SelectTrigger>
              <SelectValue placeholder="Go'sht turi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha turlar</SelectItem>
              <SelectItem value="whole">Butun tovuq</SelectItem>
              <SelectItem value="breast">Ko'krak</SelectItem>
              <SelectItem value="leg">Oyoq</SelectItem>
              <SelectItem value="wing">Qanot</SelectItem>
              <SelectItem value="thigh">Son</SelectItem>
              <SelectItem value="drumstick">Boldir</SelectItem>
              <SelectItem value="by_product">Subproduktlar</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-[180px]">
          <Select 
            value={qualityFilter} 
            onValueChange={setQualityFilter}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sifat darajasi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha darajalar</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
              <SelectItem value="standard">Standart</SelectItem>
              <SelectItem value="commercial">Tijoriy</SelectItem>
              <SelectItem value="rejected">Rad etilgan</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin h-8 w-8 border-2 border-primary rounded-full border-t-transparent"></div>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center p-12 border rounded-md">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Go'sht inventari topilmadi</h3>
          <p className="text-muted-foreground mb-4">Hozirda go'sht inventari mavjud emas yoki filtrlarga mos mahsulotlar topilmadi</p>
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tur</TableHead>
                  <TableHead>Sifat</TableHead>
                  <TableHead>Miqdor (kg)</TableHead>
                  <TableHead>Dona</TableHead>
                  <TableHead>Narx (so'm)</TableHead>
                  <TableHead>Partiya</TableHead>
                  <TableHead>Ishlab chiqarilgan sana</TableHead>
                  <TableHead>Yaroqlilik muddati</TableHead>
                  <TableHead className="text-right">Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <MeatTypeBadge type={item.type} />
                    </TableCell>
                    <TableCell>
                      <MeatQualityBadge grade={item.qualityGrade} />
                    </TableCell>
                    <TableCell>{item.weight} kg</TableCell>
                    <TableCell>{item.count}</TableCell>
                    <TableCell>{new Intl.NumberFormat('uz-UZ').format(item.price)} so'm/kg</TableCell>
                    <TableCell>{item.slaughterBatch.batchNumber}</TableCell>
                    <TableCell>{format(new Date(item.productionDate), 'PPP')}</TableCell>
                    <TableCell>{format(new Date(item.expiryDate), 'PPP')}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleViewItem(item.id)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ko'rish
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      className={currentPage === 1 ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        isActive={currentPage === page}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      className={currentPage === totalPages ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}
      
      {/* Placeholder for Modals */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Go'sht inventari tafsilotlari</DialogTitle>
          </DialogHeader>
          <div className="text-center p-4">
            <p>Tafsilot ko'rish sahifasi implementatsiya qilinishi kerak</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Meat Sales Tab Component
const MeatSalesTab = ({ isAdmin }: { isAdmin: boolean }) => {
  const [sales, setSales] = useState<MeatSale[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [customerFilter, setCustomerFilter] = useState<string>('');
  const { toast } = useToast();

  // Fetch meat sales
  const fetchMeatSales = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        limit: 10,
      };
      
      if (paymentStatusFilter !== 'all') {
        params.paymentStatus = paymentStatusFilter;
      }
      
      if (startDate) {
        params.startDate = startDate.toISOString();
      }
      
      if (endDate) {
        params.endDate = endDate.toISOString();
      }
      
      if (customerFilter) {
        params.customer = customerFilter;
      }
      
      const response = await MeatProductionService.getMeatSales(params);
      setSales(response.sales);
      setTotalPages(response.totalPages);
    } catch (error: any) {
      toast({
        title: 'Xatolik',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeatSales();
  }, [currentPage, paymentStatusFilter, startDate, endDate, customerFilter]);

  const handleCreateSale = () => {
    setShowCreateModal(true);
  };

  const handleViewSale = (id: string) => {
    setSelectedSaleId(id);
    setShowDetailsModal(true);
  };

  const clearDateFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const clearAllFilters = () => {
    setPaymentStatusFilter('all');
    setStartDate(undefined);
    setEndDate(undefined);
    setCustomerFilter('');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="w-[180px]">
            <Select 
              value={paymentStatusFilter} 
              onValueChange={setPaymentStatusFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="To'lov statusi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha statuslar</SelectItem>
                <SelectItem value="paid">To'langan</SelectItem>
                <SelectItem value="pending">Kutilmoqda</SelectItem>
                <SelectItem value="partial">Qisman to'langan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-[180px]">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Boshlang'ich sana"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="w-[180px]">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : "Tugash sana"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="w-[220px]">
            <Input
              placeholder="Mijoz nomi bo'yicha qidirish"
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
            />
          </div>

          <Button variant="ghost" size="sm" onClick={clearAllFilters}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Filtrlarni tozalash
          </Button>
        </div>

        {isAdmin && (
          <Button onClick={handleCreateSale}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Yangi savdo
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin h-8 w-8 border-2 border-primary rounded-full border-t-transparent"></div>
        </div>
      ) : sales.length === 0 ? (
        <div className="text-center p-12 border rounded-md">
          <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Sotishlar topilmadi</h3>
          <p className="text-muted-foreground mb-4">Hozirda sotishlar mavjud emas yoki filtrlarga mos ma'lumotlar topilmadi</p>
          {isAdmin && (
            <Button onClick={handleCreateSale}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Yangi savdo yaratish
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sana</TableHead>
                  <TableHead>Mijoz</TableHead>
                  <TableHead>Partiya</TableHead>
                  <TableHead>Umumiy miqdor (kg)</TableHead>
                  <TableHead>Umumiy narx (so'm)</TableHead>
                  <TableHead>To'lov statusi</TableHead>
                  <TableHead>To'lov usuli</TableHead>
                  <TableHead>Yetkazish</TableHead>
                  <TableHead className="text-right">Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>{format(new Date(sale.saleDate), 'PPP')}</TableCell>
                    <TableCell>{sale.customer.name}</TableCell>
                    <TableCell>{sale.slaughterBatch.batchNumber}</TableCell>
                    <TableCell>
                      {sale.meatItems.reduce((sum, item) => sum + item.quantity, 0)} kg
                    </TableCell>
                    <TableCell>{new Intl.NumberFormat('uz-UZ').format(sale.totalAmount)} so'm</TableCell>
                    <TableCell>
                      <PaymentStatusBadge status={sale.paymentStatus} />
                    </TableCell>
                    <TableCell>{MeatProductionService.getPaymentMethodName(sale.paymentMethod)}</TableCell>
                    <TableCell>
                      {sale.deliveryRequired ? (
                        sale.deliveryStatus ? (
                          <DeliveryStatusBadge status={sale.deliveryStatus} />
                        ) : (
                          <Badge variant="outline">Zarur</Badge>
                        )
                      ) : (
                        <Badge variant="outline" className="bg-gray-50 text-gray-800">Kerak emas</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleViewSale(sale.id)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ko'rish
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      className={currentPage === 1 ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        isActive={currentPage === page}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      className={currentPage === totalPages ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}
      
      {/* Placeholder for Modals */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Yangi savdo yaratish</DialogTitle>
            <DialogDescription>
              Yangi savdo yaratish uchun quyidagi formani to'ldiring
            </DialogDescription>
          </DialogHeader>
          <CreateMeatSaleForm 
            onSuccess={() => {
              setShowCreateModal(false);
              fetchMeatSales();
              toast({
                title: "Muvaffaqiyatli",
                description: "Go'sht savdosi yaratildi",
              });
            }}
            onCancel={() => setShowCreateModal(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Savdo tafsilotlari</DialogTitle>
          </DialogHeader>
          {selectedSaleId && (
            <MeatSaleDetails
              saleId={selectedSaleId}
              onClose={() => setShowDetailsModal(false)}
              isAdmin={isAdmin}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// So'yish partiyasi tafsilotlari komponenti
interface SlaughterBatchDetailsProps {
  batchId: string;
  onClose: () => void;
  onUpdateSuccess: () => void;
  isAdmin: boolean;
}

const SlaughterBatchDetails: React.FC<SlaughterBatchDetailsProps> = ({ 
  batchId, 
  onClose, 
  onUpdateSuccess,
  isAdmin 
}) => {
  const [batch, setBatch] = useState<SlaughterBatch | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [showResultModal, setShowResultModal] = useState<boolean>(false);
  const [showUpdateStatusModal, setShowUpdateStatusModal] = useState<boolean>(false);
  const { toast } = useToast();

  const fetchBatchDetails = async () => {
    try {
      setLoading(true);
      const batchData = await MeatProductionService.getSlaughterBatch(batchId);
      setBatch(batchData);
    } catch (error: any) {
      toast({
        title: "Xatolik",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatchDetails();
  }, [batchId]);

  const handleStatusUpdate = async (newStatus: SlaughterBatchStatus, notes?: string) => {
    try {
      await MeatProductionService.updateSlaughterBatchStatus(batchId, {
        status: newStatus,
        notes
      });
      
      toast({
        title: "Muvaffaqiyatli",
        description: "So'yish partiyasi statusi yangilandi",
      });
      
      fetchBatchDetails();
      setShowUpdateStatusModal(false);
      
      if (newStatus === SlaughterBatchStatus.COMPLETED) {
        toast({
          title: "Natijalarni kiritish",
          description: "So'yish partiyasi yakunlandi, natijalarni kiritish kerak",
        });
        setShowResultModal(true);
      }
    } catch (error: any) {
      toast({
        title: "Xatolik",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin h-8 w-8 border-2 border-primary rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="text-center p-6">
        <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium">So'yish partiyasi ma'lumotlari topilmadi</h3>
        <p className="text-muted-foreground mb-4">Ma'lumotlarni yuklab bo'lmadi. Qayta urinib ko'ring.</p>
        <Button onClick={fetchBatchDetails}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Qayta yuklash
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Batch Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-semibold">{batch.batchNumber}</h2>
            <SlaughterBatchStatusBadge status={batch.status} />
          </div>
          <p className="text-muted-foreground">
            Tovuq partiyasi: {batch.chickenBatch?.batchNumber || "Kiritilmagan"}
            {batch.chickenBatch?.breed && ` - ${batch.chickenBatch.breed}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && batch.status !== SlaughterBatchStatus.COMPLETED && (
            <Button 
              variant="outline"
              onClick={() => setShowUpdateStatusModal(true)}
            >
              <Settings className="mr-2 h-4 w-4" />
              Status o'zgartirish
            </Button>
          )}
          
          {isAdmin && batch.status === SlaughterBatchStatus.COMPLETED && !batch.meatItems && (
            <Button
              onClick={() => setShowResultModal(true)}
            >
              <FileText className="mr-2 h-4 w-4" />
              Natijalarni kiritish
            </Button>
          )}
          
          <Button variant="outline" onClick={onClose}>
            <CircleX className="mr-2 h-4 w-4" />
            Yopish
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="overview">
            <ClipboardList className="mr-2 h-4 w-4" />
            <span>Umumiy ma'lumot</span>
          </TabsTrigger>
          <TabsTrigger value="meat-items" disabled={!batch.meatItems || batch.meatItems.length === 0}>
            <Package className="mr-2 h-4 w-4" />
            <span>Go'sht mahsulotlari</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Asosiy ma'lumotlar</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Rejalashtirilgan sana</p>
                <p className="text-sm">{format(new Date(batch.plannedDate), "PPP")}</p>
              </div>
              
              {batch.actualDate && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">Amalga oshirilgan sana</p>
                  <p className="text-sm">{format(new Date(batch.actualDate), "PPP")}</p>
                </div>
              )}
              
              <div className="space-y-1">
                <p className="text-sm font-medium">Tovuqlar soni</p>
                <p className="text-sm">{batch.preslaughterCount} dona</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-medium">O'rtacha vazn</p>
                <p className="text-sm">{batch.preslaughterAverageWeight} kg</p>
              </div>
              
              {batch.meatQuantity && (
                <>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Olingan go'sht miqdori</p>
                    <p className="text-sm">{batch.meatQuantity} kg</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm font-medium">O'rtacha so'yilgan vazn</p>
                    <p className="text-sm">{batch.averageDressedWeight} kg</p>
                  </div>
                </>
              )}
              
              {batch.meatQualityGrade && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">Go'sht sifati</p>
                  <p className="text-sm">
                    <MeatQualityBadge grade={batch.meatQualityGrade} />
                  </p>
                </div>
              )}
              
              {batch.notes && (
                <div className="space-y-1 col-span-full">
                  <p className="text-sm font-medium">Qo'shimcha ma'lumot</p>
                  <p className="text-sm">{batch.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Created By & Timestamps */}
          <div className="flex flex-col md:flex-row gap-4">
            <Card className="flex-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Kim tomonidan yaratilgan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white text-xs mr-2">
                    {batch.createdBy.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{batch.createdBy.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(batch.createdAt), "PPP, HH:mm")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="flex-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Yaratilgan va yangilangan</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Yaratilgan</p>
                  <p className="text-sm">{format(new Date(batch.createdAt), "PPP")}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Yangilangan</p>
                  <p className="text-sm">{format(new Date(batch.updatedAt), "PPP")}</p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Display History if exists */}
          {batch.history && batch.history.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tarix</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  {batch.history.map((entry, index) => (
                    <div key={index} className="mb-4 last:mb-0">
                      <div className="flex items-start gap-2">
                        <div className="h-2 w-2 rounded-full bg-primary mt-2"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{entry.action}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(entry.date), "PPP, HH:mm")} - {entry.performedBy.name}
                          </p>
                          {entry.notes && (
                            <p className="text-sm mt-1">{entry.notes}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="meat-items" className="space-y-4">
          {batch.meatItems && batch.meatItems.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Go'sht mahsulotlari</CardTitle>
                <CardDescription>So'yish natijasida olingan go'sht mahsulotlari</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tur</TableHead>
                      <TableHead>Vazn (kg)</TableHead>
                      <TableHead>Soni</TableHead>
                      <TableHead>O'rtacha vazn (kg)</TableHead>
                      <TableHead>Sifat</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batch.meatItems.map((item, index) => (
                      <TableRow key={item.id || index}>
                        <TableCell>
                          <MeatTypeBadge type={item.type} />
                        </TableCell>
                        <TableCell>{item.weight} kg</TableCell>
                        <TableCell>{item.count}</TableCell>
                        <TableCell>{item.averageWeight.toFixed(2)}</TableCell>
                        <TableCell>
                          <MeatQualityBadge grade={item.qualityGrade} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center p-8">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Go'sht mahsulotlari mavjud emas</h3>
              <p className="text-muted-foreground mb-4">Bu partiya uchun go'sht mahsulotlari hali kiritilmagan</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Status Update Modal */}
      <Dialog open={showUpdateStatusModal} onOpenChange={setShowUpdateStatusModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Status o'zgartirish</DialogTitle>
            <DialogDescription>
              So'yish partiyasi uchun yangi statusni tanlang
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Joriy status</Label>
              <div>
                <SlaughterBatchStatusBadge status={batch.status} />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Yangi status</Label>
              <div className="grid grid-cols-1 gap-2">
                {batch.status === SlaughterBatchStatus.PLANNED && (
                  <Button 
                    variant="outline" 
                    className="justify-start" 
                    onClick={() => handleStatusUpdate(SlaughterBatchStatus.IN_PROGRESS)}
                  >
                    <Activity className="mr-2 h-4 w-4 text-amber-500" />
                    Jarayonda
                  </Button>
                )}
                
                {batch.status === SlaughterBatchStatus.IN_PROGRESS && (
                  <Button 
                    variant="outline" 
                    className="justify-start" 
                    onClick={() => handleStatusUpdate(SlaughterBatchStatus.COMPLETED)}
                  >
                    <Check className="mr-2 h-4 w-4 text-green-500" />
                    Tugallangan
                  </Button>
                )}
                
                {batch.status === SlaughterBatchStatus.COMPLETED && (
                  <p className="text-sm text-muted-foreground">
                    Bu partiya allaqachon tugallangan va o'zgartirib bo'lmaydi.
                  </p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpdateStatusModal(false)}>
              Bekor qilish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Slaughter Results Modal */}
      <Dialog open={showResultModal} onOpenChange={setShowResultModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>So'yish natijalarini kiritish</DialogTitle>
            <DialogDescription>
              So'yish jarayoni natijalarini to'ldiring
            </DialogDescription>
          </DialogHeader>
          <div className="text-center p-4">
            <p>So'yish jarayoni natijalarini kiritish formasini implementatsiya qilish kerak</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResultModal(false)}>
              Bekor qilish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// So'yish partiyasi yaratish formasini implementatsiya qilish
interface CreateSlaughterBatchFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const CreateSlaughterBatchForm: React.FC<CreateSlaughterBatchFormProps> = ({ onSuccess, onCancel }) => {
  const [chickenBatches, setChickenBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchChickenBatches = async () => {
      try {
        setLoading(true);
        const response = await BatchService.getAllBatches();
        // Faqat active statusdagi va so'yish uchun tayyor batches-larni filtrlash
        const readyBatches = response.batches.filter(
          (batch) => batch.status === 'active' && batch.readyForSlaughter
        );
        setChickenBatches(readyBatches);
      } catch (error: any) {
        toast({
          title: "Xatolik",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchChickenBatches();
  }, []);

  // Form validation yaratish
  const formSchema = z.object({
    batchNumber: z.string().min(1, { message: "Partiya raqami talab qilinadi" }),
    chickenBatchId: z.string().min(1, { message: "Tovuq partiyasini tanlash talab qilinadi" }),
    plannedDate: z.date({ message: "Sana talab qilinadi" }),
    preslaughterCount: z.number().min(1, { message: "So'yishdan oldingi miqdor talab qilinadi" }),
    preslaughterAverageWeight: z.number().min(0.1, { message: "O'rtacha vazn talab qilinadi" }),
    processingTeam: z.array(z.string()).optional(),
    notes: z.string().optional(),
  });

  // Form yaratish
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      batchNumber: "",
      chickenBatchId: "",
      plannedDate: new Date(),
      preslaughterCount: 0,
      preslaughterAverageWeight: 0,
      processingTeam: [],
      notes: "",
    },
  });

  // Submit hodisasi
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setSubmitting(true);
      await MeatProductionService.createSlaughterBatch({
        ...values,
        plannedDate: values.plannedDate.toISOString(),
      });
      toast({
        title: "Muvaffaqiyatli",
        description: "So'yish partiyasi yaratildi",
      });
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Xatolik",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handler for auto-filling fields based on the selected batch
  const handleBatchChange = (chickenBatchId: string) => {
    if (!chickenBatchId) return;
    
    const selectedBatch = chickenBatches.find(batch => batch.id === chickenBatchId);
    if (selectedBatch) {
      form.setValue('preslaughterCount', selectedBatch.currentCount || 0);
      form.setValue('preslaughterAverageWeight', selectedBatch.averageWeight || 0);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="batchNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Partiya raqami</FormLabel>
              <FormControl>
                <Input placeholder="SP-001" {...field} />
              </FormControl>
              <FormDescription>
                So'yish partiyasi uchun noyob raqam kiriting
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="chickenBatchId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tovuq partiyasi</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  handleBatchChange(value);
                }}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Tovuq partiyasini tanlang" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {loading ? (
                    <div className="flex items-center justify-center p-2">
                      <div className="animate-spin h-5 w-5 border-2 border-primary rounded-full border-t-transparent"></div>
                    </div>
                  ) : chickenBatches.length === 0 ? (
                    <div className="p-2 text-center text-sm text-muted-foreground">
                      So'yish uchun tayyor partiyalar topilmadi
                    </div>
                  ) : (
                    chickenBatches.map((batch) => (
                      <SelectItem key={batch.id} value={batch.id}>
                        {batch.batchNumber} - {batch.breed || 'Noma\'lum'}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormDescription>
                So'yish uchun tovuq partiyasini tanlang
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="plannedDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Rejalashtirilgan sana</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Sanani tanlang</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>
                So'yish jarayoni uchun rejalashtirilgan sana
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="preslaughterCount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>So'yishdan oldingi miqdor</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="0"
                    min={1}
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormDescription>
                  So'yish uchun rejalashtirilgan tovuqlar soni
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="preslaughterAverageWeight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>O'rtacha vazn (kg)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="0.0"
                    min={0.1}
                    step={0.1}
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormDescription>
                  Tovuqlarning taxminiy o'rtacha vazni
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Qo'shimcha ma'lumot</FormLabel>
              <FormControl>
                <Input placeholder="Qo'shimcha ma'lumot kiriting" {...field} />
              </FormControl>
              <FormDescription>
                So'yish partiyasi haqida qo'shimcha ma'lumotlar
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Bekor qilish
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <div className="flex items-center">
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-primary rounded-full border-t-transparent"></div>
                <span>Saqlanmoqda...</span>
              </div>
            ) : (
              "Saqlash"
            )}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

// Go'sht savdosini yaratish uchun forma
interface CreateMeatSaleFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const CreateMeatSaleForm: React.FC<CreateMeatSaleFormProps> = ({ onSuccess, onCancel }) => {
  const [slaughterBatches, setSlaughterBatches] = useState<SlaughterBatch[]>([]);
  const [meatItems, setMeatItems] = useState<MeatItem[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMeatItems, setLoadingMeatItems] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const { toast } = useToast();

  // Form validation
  const formSchema = z.object({
    slaughterBatchId: z.string().min(1, { message: "So'yish partiyasini tanlash talab qilinadi" }),
    saleDate: z.date({ message: "Sana talab qilinadi" }),
    customer: z.object({
      name: z.string().min(1, { message: "Haridor nomi talab qilinadi" }),
      contactNumber: z.string().min(9, { message: "Telefon raqam talab qilinadi" }),
      address: z.string().min(1, { message: "Manzil talab qilinadi" }),
      isRegular: z.boolean().optional().default(false),
    }),
    meatItems: z.array(z.object({
      type: z.string().min(1, { message: "Go'sht turi talab qilinadi" }),
      quantity: z.number().min(0.1, { message: "Miqdor talab qilinadi" }),
      unit: z.string().min(1, { message: "O'lchov birligi talab qilinadi" }),
      pricePerUnit: z.number().min(1, { message: "Narx talab qilinadi" }),
    })).min(1, { message: "Kamida bitta go'sht mahsulotini tanlash kerak" }),
    paymentMethod: z.nativeEnum(PaymentMethod, {
      errorMap: () => ({ message: "To'lov usulini tanlang" }),
    }),
    paymentStatus: z.nativeEnum(PaymentStatus, {
      errorMap: () => ({ message: "To'lov statusini tanlang" }),
    }),
    paymentDetails: z.object({
      reference: z.string().optional(),
      receivedAmount: z.number().min(0, { message: "Qabul qilingan miqdor 0 dan kam bo'lishi mumkin emas" }),
      paymentDate: z.date({ message: "To'lov sanasi talab qilinadi" }),
    }).optional(),
    deliveryRequired: z.boolean().default(false),
    deliveryAddress: z.string().optional(),
    deliveryStatus: z.nativeEnum(DeliveryStatus).optional(),
    deliveryDetails: z.object({
      assignedTo: z.string().optional(),
      vehicleNumber: z.string().optional(),
      scheduledTime: z.string().optional(),
    }).optional(),
    notes: z.string().optional(),
  });

  // Create form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      slaughterBatchId: "",
      saleDate: new Date(),
      customer: {
        name: "",
        contactNumber: "",
        address: "",
        isRegular: false,
      },
      meatItems: [
        {
          type: MeatType.WHOLE,
          quantity: 0,
          unit: "kg",
          pricePerUnit: 0,
        }
      ],
      paymentMethod: PaymentMethod.CASH,
      paymentStatus: PaymentStatus.PAID,
      paymentDetails: {
        receivedAmount: 0,
        paymentDate: new Date(),
      },
      deliveryRequired: false,
      notes: "",
    },
  });

  // Calculate total amount based on meat items
  const calculateTotal = (): number => {
    const meatItems = form.getValues("meatItems");
    return meatItems.reduce((total, item) => {
      return total + (item.quantity * item.pricePerUnit);
    }, 0);
  };

  // Watch for delivery required changes
  const deliveryRequired = form.watch("deliveryRequired");
  const paymentStatus = form.watch("paymentStatus");

  // Fetch slaughter batches
  useEffect(() => {
    const fetchSlaughterBatches = async () => {
      try {
        setLoading(true);
        const response = await MeatProductionService.getSlaughterBatches({
          status: SlaughterBatchStatus.COMPLETED
        });
        setSlaughterBatches(response.batches.filter(batch => batch.meatItems && batch.meatItems.length > 0));
      } catch (error: any) {
        toast({
          title: "Xatolik",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSlaughterBatches();
  }, []);

  // Fetch meat items for the selected batch
  useEffect(() => {
    const fetchMeatItems = async () => {
      if (!selectedBatchId) return;
      
      try {
        setLoadingMeatItems(true);
        const response = await MeatProductionService.getMeatInventory({
          batchId: selectedBatchId
        });
        setMeatItems(response.items);
        
        // Reset the meat items in the form
        form.setValue("meatItems", [
          {
            type: MeatType.WHOLE,
            quantity: 0,
            unit: "kg",
            pricePerUnit: 0,
          }
        ]);
      } catch (error: any) {
        toast({
          title: "Xatolik",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoadingMeatItems(false);
      }
    };

    if (selectedBatchId) {
      fetchMeatItems();
    }
  }, [selectedBatchId]);

  // Handle batch selection
  const handleBatchChange = (batchId: string) => {
    setSelectedBatchId(batchId);
    form.setValue("slaughterBatchId", batchId);
  };

  // Add new meat item
  const addMeatItem = () => {
    const currentItems = form.getValues("meatItems");
    form.setValue("meatItems", [
      ...currentItems,
      {
        type: MeatType.WHOLE,
        quantity: 0,
        unit: "kg",
        pricePerUnit: 0,
      }
    ]);
  };

  // Remove meat item
  const removeMeatItem = (index: number) => {
    const currentItems = form.getValues("meatItems");
    if (currentItems.length === 1) {
      toast({
        title: "Xatolik",
        description: "Kamida bitta go'sht mahsuloti bo'lishi kerak",
        variant: "destructive",
      });
      return;
    }
    
    form.setValue("meatItems", currentItems.filter((_, i) => i !== index));
  };

  // Get available quantity for meat type
  const getAvailableQuantity = (type: string): number => {
    const item = meatItems.find(item => item.type === type);
    return item ? item.weight : 0;
  };

  // Submit handler
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setSubmitting(true);
      
      // Prepare meat items with calculated total prices
      const preparedMeatItems = values.meatItems.map(item => ({
        ...item,
        totalPrice: item.quantity * item.pricePerUnit
      }));
      
      // Create the final data
      const saleData: CreateMeatSaleData = {
        slaughterBatchId: values.slaughterBatchId,
        saleDate: values.saleDate.toISOString(),
        customer: values.customer,
        meatItems: values.meatItems,
        paymentMethod: values.paymentMethod,
        paymentStatus: values.paymentStatus,
        paymentDetails: values.paymentDetails ? {
          ...values.paymentDetails,
          paymentDate: values.paymentDetails.paymentDate.toISOString(),
        } : undefined,
        deliveryRequired: values.deliveryRequired,
        deliveryAddress: values.deliveryAddress,
        deliveryStatus: values.deliveryStatus,
        deliveryDetails: values.deliveryDetails,
        notes: values.notes,
      };
      
      await MeatProductionService.createMeatSale(saleData);
      
      toast({
        title: "Muvaffaqiyatli",
        description: "Go'sht savdosi yaratildi",
      });
      
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Xatolik",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Slaughter Batch Selection */}
          <FormField
            control={form.control}
            name="slaughterBatchId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>So'yish partiyasi</FormLabel>
                <Select
                  onValueChange={(value) => handleBatchChange(value)}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="So'yish partiyasini tanlang" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {loading ? (
                      <div className="flex items-center justify-center p-2">
                        <div className="animate-spin h-5 w-5 border-2 border-primary rounded-full border-t-transparent"></div>
                      </div>
                    ) : slaughterBatches.length === 0 ? (
                      <div className="p-2 text-center text-sm text-muted-foreground">
                        Tugallangan so'yish partiyalari topilmadi
                      </div>
                    ) : (
                      slaughterBatches.map((batch) => (
                        <SelectItem key={batch.id} value={batch.id}>
                          {batch.batchNumber} - {format(new Date(batch.createdAt), "PPP")}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Go'sht savdosi uchun so'yish partiyasini tanlang
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Sale Date */}
          <FormField
            control={form.control}
            name="saleDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Savdo sanasi</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Sanani tanlang</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  Savdo amalga oshirilgan sana
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle>Haridor ma'lumotlari</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customer.name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Haridor nomi</FormLabel>
                    <FormControl>
                      <Input placeholder="Haridor nomi" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customer.contactNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefon raqami</FormLabel>
                    <FormControl>
                      <Input placeholder="+998 XX XXX XX XX" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="customer.address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Manzil</FormLabel>
                  <FormControl>
                    <Input placeholder="Haridor manzili" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customer.isRegular"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Doimiy haridor</FormLabel>
                    <FormDescription>
                      Agar haridor doimiy bo'lsa, belgilang
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Meat Items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Go'sht mahsulotlari</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addMeatItem}>
              <Plus className="mr-2 h-4 w-4" />
              Mahsulot qo'shish
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {form.getValues("meatItems").map((_, index) => (
              <div key={index} className="relative rounded-md border p-4">
                <div className="absolute right-2 top-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeMeatItem(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name={`meatItems.${index}.type`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Go'sht turi</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Turni tanlang" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {loadingMeatItems ? (
                              <div className="flex items-center justify-center p-2">
                                <div className="animate-spin h-5 w-5 border-2 border-primary rounded-full border-t-transparent"></div>
                              </div>
                            ) : meatItems.length === 0 ? (
                              <div className="p-2 text-center text-sm text-muted-foreground">
                                Go'sht mahsulotlari mavjud emas
                              </div>
                            ) : (
                              Object.values(MeatType).map((type) => {
                                // Check if this type of meat is available in the inventory
                                const available = meatItems.some(item => item.type === type);
                                return (
                                  <SelectItem key={type} value={type} disabled={!available}>
                                    <div className="flex items-center">
                                      <span className="mr-2">
                                        <MeatTypeBadge type={type as MeatType} />
                                      </span>
                                      <span>
                                        {available && `(${getAvailableQuantity(type)} kg mavjud)`}
                                      </span>
                                    </div>
                                  </SelectItem>
                                );
                              })
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`meatItems.${index}.quantity`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Miqdor</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            min="0.1"
                            placeholder="0.0"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`meatItems.${index}.unit`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>O'lchov birligi</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Birlik" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="kg">Kilogramm (kg)</SelectItem>
                            <SelectItem value="pcs">Dona (pcs)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`meatItems.${index}.pricePerUnit`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Narx (so'm/birlik)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Total price for this item */}
                <div className="mt-2 text-right text-sm text-muted-foreground">
                  Jami: {new Intl.NumberFormat('uz-UZ').format(
                    form.getValues(`meatItems.${index}.quantity`) * 
                    form.getValues(`meatItems.${index}.pricePerUnit`)
                  )} so'm
                </div>
              </div>
            ))}

            {/* Show total amount */}
            <div className="text-right">
              <div className="text-lg font-semibold">
                Umumiy summa: {new Intl.NumberFormat('uz-UZ').format(calculateTotal())} so'm
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Information */}
        <Card>
          <CardHeader>
            <CardTitle>To'lov ma'lumotlari</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>To'lov usuli</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="To'lov usulini tanlang" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={PaymentMethod.CASH}>Naqd pul</SelectItem>
                        <SelectItem value={PaymentMethod.CARD}>Karta orqali</SelectItem>
                        <SelectItem value={PaymentMethod.BANK_TRANSFER}>Bank o'tkazmasi</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>To'lov holati</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="To'lov holatini tanlang" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={PaymentStatus.PAID}>To'langan</SelectItem>
                        <SelectItem value={PaymentStatus.PENDING}>Kutilmoqda</SelectItem>
                        <SelectItem value={PaymentStatus.PARTIAL}>Qisman to'langan</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {paymentStatus === PaymentStatus.PAID || paymentStatus === PaymentStatus.PARTIAL ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="paymentDetails.receivedAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Qabul qilingan summa</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paymentDetails.paymentDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>To'lov sanasi</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Sanani tanlang</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ) : null}
            
            {paymentStatus !== PaymentStatus.PAID && (
              <div className="p-4 rounded-md bg-amber-50 border border-amber-200">
                <p className="text-amber-700 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  <span>To'lov to'liq amalga oshirilmagan. Kerakli ma'lumotlarni to'ldiring.</span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delivery Information */}
        <Card>
          <CardHeader>
            <CardTitle>Yetkazib berish</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="deliveryRequired"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Yetkazib berish kerak</FormLabel>
                    <FormDescription>
                      Agar mahsulotni yetkazib berish kerak bo'lsa, belgilang
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {deliveryRequired && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="deliveryAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Yetkazib berish manzili</FormLabel>
                      <FormControl>
                        <Input placeholder="Manzil" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deliveryStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Yetkazib berish holati</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Holatni tanlang" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={DeliveryStatus.PENDING}>Kutilmoqda</SelectItem>
                          <SelectItem value={DeliveryStatus.IN_PROGRESS}>Jarayonda</SelectItem>
                          <SelectItem value={DeliveryStatus.DELIVERED}>Yetkazildi</SelectItem>
                          <SelectItem value={DeliveryStatus.CANCELLED}>Bekor qilindi</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="deliveryDetails.assignedTo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Yetkazib beruvchi</FormLabel>
                        <FormControl>
                          <Input placeholder="F.I.O" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="deliveryDetails.vehicleNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Transport raqami</FormLabel>
                        <FormControl>
                          <Input placeholder="01 A 000 AA" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="deliveryDetails.scheduledTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Yetkazib berish vaqti</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Additional Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Qo'shimcha ma'lumotlar</FormLabel>
              <FormControl>
                <Input placeholder="Qo'shimcha ma'lumotlarni kiriting" {...field} />
              </FormControl>
              <FormDescription>
                Savdo haqida qo'shimcha ma'lumotlar
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Bekor qilish
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <div className="flex items-center">
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-primary rounded-full border-t-transparent"></div>
                <span>Saqlanmoqda...</span>
              </div>
            ) : (
              "Saqlash"
            )}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

// Go'sht savdosi tafsilotlari komponenti
interface MeatSaleDetailsProps {
  saleId: string;
  onClose: () => void;
  isAdmin: boolean;
}

const MeatSaleDetails: React.FC<MeatSaleDetailsProps> = ({ saleId, onClose, isAdmin }) => {
  const [sale, setSale] = useState<MeatSale | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("overview");
  const { toast } = useToast();

  const fetchSaleDetails = async () => {
    try {
      setLoading(true);
      const saleData = await MeatProductionService.getMeatSale(saleId);
      setSale(saleData);
    } catch (error: any) {
      toast({
        title: "Xatolik",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSaleDetails();
  }, [saleId]);

  const getPaymentStatusText = (status: PaymentStatus): { text: string; color: string } => {
    switch (status) {
      case PaymentStatus.PAID:
        return { text: "To'langan", color: "text-green-600" };
      case PaymentStatus.PENDING:
        return { text: "Kutilmoqda", color: "text-amber-600" };
      case PaymentStatus.PARTIAL:
        return { text: "Qisman to'langan", color: "text-blue-600" };
      default:
        return { text: "Noma'lum", color: "text-gray-600" };
    }
  };

  const getDeliveryStatusText = (status: DeliveryStatus): { text: string; color: string } => {
    switch (status) {
      case DeliveryStatus.PENDING:
        return { text: "Kutilmoqda", color: "text-amber-600" };
      case DeliveryStatus.IN_PROGRESS:
        return { text: "Jarayonda", color: "text-blue-600" };
      case DeliveryStatus.DELIVERED:
        return { text: "Yetkazildi", color: "text-green-600" };
      case DeliveryStatus.CANCELLED:
        return { text: "Bekor qilindi", color: "text-red-600" };
      default:
        return { text: "Noma'lum", color: "text-gray-600" };
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin h-8 w-8 border-2 border-primary rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="text-center p-6">
        <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium">Savdo ma'lumotlari topilmadi</h3>
        <p className="text-muted-foreground mb-4">Ma'lumotlarni yuklab bo'lmadi. Qayta urinib ko'ring.</p>
        <Button onClick={fetchSaleDetails}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Qayta yuklash
        </Button>
      </div>
    );
  }

  const paymentStatus = getPaymentStatusText(sale.paymentStatus);
  const totalAmount = sale.totalAmount;
  const receivedAmount = sale.paymentDetails?.receivedAmount || 0;
  const remainingAmount = totalAmount - receivedAmount;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-semibold">Savdo #{sale.id.slice(-6)}</h2>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${paymentStatus.color} bg-opacity-10`}>
              {paymentStatus.text}
            </span>
          </div>
          <p className="text-muted-foreground">
            Sana: {format(new Date(sale.saleDate), "PPP")}
          </p>
        </div>
        <div>
          <Button variant="outline" onClick={onClose}>
            <CircleX className="mr-2 h-4 w-4" />
            Yopish
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="overview">
            <ShoppingCart className="mr-2 h-4 w-4" />
            <span>Savdo ma'lumotlari</span>
          </TabsTrigger>
          <TabsTrigger value="customer">
            <User className="mr-2 h-4 w-4" />
            <span>Haridor ma'lumotlari</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          {/* Sale Items */}
          <Card>
            <CardHeader>
              <CardTitle>Sotilgan mahsulotlar</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mahsulot turi</TableHead>
                    <TableHead>Miqdor</TableHead>
                    <TableHead>Birlik</TableHead>
                    <TableHead>Narx (so'm)</TableHead>
                    <TableHead className="text-right">Jami (so'm)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sale.meatItems.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <MeatTypeBadge type={item.type as MeatType} />
                      </TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell>{new Intl.NumberFormat('uz-UZ').format(item.pricePerUnit)}</TableCell>
                      <TableCell className="text-right">
                        {new Intl.NumberFormat('uz-UZ').format(item.totalPrice || (item.quantity * item.pricePerUnit))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={4}>Jami</TableCell>
                    <TableCell className="text-right font-bold">
                      {new Intl.NumberFormat('uz-UZ').format(sale.totalAmount)} so'm
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>

          {/* Payment Details */}
          <Card>
            <CardHeader>
              <CardTitle>To'lov ma'lumotlari</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">To'lov usuli</p>
                <div className="flex items-center">
                  {sale.paymentMethod === PaymentMethod.CASH && <Banknote className="h-4 w-4 mr-2 text-green-600" />}
                  {sale.paymentMethod === PaymentMethod.CARD && <CreditCard className="h-4 w-4 mr-2 text-blue-600" />}
                  {sale.paymentMethod === PaymentMethod.BANK_TRANSFER && <Building className="h-4 w-4 mr-2 text-purple-600" />}
                  <p className="text-sm">
                    {sale.paymentMethod === PaymentMethod.CASH && "Naqd pul"}
                    {sale.paymentMethod === PaymentMethod.CARD && "Karta orqali"}
                    {sale.paymentMethod === PaymentMethod.BANK_TRANSFER && "Bank o'tkazmasi"}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium">To'lov holati</p>
                <p className={`text-sm ${paymentStatus.color}`}>{paymentStatus.text}</p>
              </div>

              {sale.paymentDetails && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">To'lov sanasi</p>
                  <p className="text-sm">{format(new Date(sale.paymentDetails.paymentDate), "PPP")}</p>
                </div>
              )}
            </CardContent>

            {/* Payment Summary */}
            {sale.paymentStatus !== PaymentStatus.PAID && (
              <CardFooter className="border-t">
                <div className="w-full space-y-2">
                  <div className="flex justify-between">
                    <p className="text-sm font-medium">Umumiy summa:</p>
                    <p className="text-sm">{new Intl.NumberFormat('uz-UZ').format(totalAmount)} so'm</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-sm font-medium">To'langan:</p>
                    <p className="text-sm">{new Intl.NumberFormat('uz-UZ').format(receivedAmount)} so'm</p>
                  </div>
                  <div className="flex justify-between font-bold">
                    <p className="text-sm">Qoldiq:</p>
                    <p className="text-sm text-red-600">{new Intl.NumberFormat('uz-UZ').format(remainingAmount)} so'm</p>
                  </div>
                </div>
              </CardFooter>
            )}
          </Card>

          {/* Delivery Details */}
          {sale.deliveryRequired && (
            <Card>
              <CardHeader>
                <CardTitle>Yetkazib berish ma'lumotlari</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Yetkazib berish manzili</p>
                  <p className="text-sm">{sale.deliveryAddress}</p>
                </div>

                {sale.deliveryStatus && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Yetkazib berish holati</p>
                    <p className={`text-sm ${getDeliveryStatusText(sale.deliveryStatus).color}`}>
                      {getDeliveryStatusText(sale.deliveryStatus).text}
                    </p>
                  </div>
                )}

                {sale.deliveryDetails && (
                  <>
                    {sale.deliveryDetails.assignedTo && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Yetkazib beruvchi</p>
                        <p className="text-sm">{sale.deliveryDetails.assignedTo}</p>
                      </div>
                    )}

                    {sale.deliveryDetails.vehicleNumber && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Transport raqami</p>
                        <p className="text-sm">{sale.deliveryDetails.vehicleNumber}</p>
                      </div>
                    )}

                    {sale.deliveryDetails.scheduledTime && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Yetkazib berish vaqti</p>
                        <p className="text-sm">{sale.deliveryDetails.scheduledTime}</p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Additional Information */}
          {sale.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Qo'shimcha ma'lumot</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{sale.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Sale Metadata */}
          <div className="flex flex-col md:flex-row gap-4">
            <Card className="flex-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Kim tomonidan yaratilgan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white text-xs mr-2">
                    {sale.createdBy.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{sale.createdBy.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(sale.createdAt), "PPP, HH:mm")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="flex-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Yaratilgan va yangilangan</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Yaratilgan</p>
                  <p className="text-sm">{format(new Date(sale.createdAt), "PPP")}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Yangilangan</p>
                  <p className="text-sm">{format(new Date(sale.updatedAt), "PPP")}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="customer" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Haridor ma'lumotlari</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Haridor nomi</p>
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2 text-gray-500" />
                  <p className="text-sm">{sale.customer.name}</p>
                  {sale.customer.isRegular && (
                    <Badge variant="secondary" className="ml-2">Doimiy haridor</Badge>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium">Telefon raqami</p>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-gray-500" />
                  <p className="text-sm">{sale.customer.contactNumber}</p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium">Manzil</p>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                  <p className="text-sm">{sale.customer.address}</p>
                </div>
              </div>

              {sale.customer.previousPurchases !== undefined && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">Oldingi xaridlar soni</p>
                  <p className="text-sm">{sale.customer.previousPurchases} ta</p>
                </div>
              )}

              {sale.customer.totalSpent !== undefined && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">Jami sarflangan</p>
                  <p className="text-sm">{new Intl.NumberFormat('uz-UZ').format(sale.customer.totalSpent)} so'm</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MeatProductionPage;