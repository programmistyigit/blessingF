import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { 
  ReportService, 
  Report, 
  ReportSummary, 
  ReportType, 
  DailyReportData,
  CreateReportData,
  ReportStats,
  GenerateReportData
} from '@/services/ReportService';
import { SectionService, Section } from '@/services/SectionService';
import { BatchService, Batch } from '@/services/BatchService';
import { WebSocketService, WebSocketEventType } from '@/services/WebSocketService';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

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
  FilePlus,
  FileText,
  Calendar as CalendarIcon,
  ChevronDown,
  Download,
  BarChart2,
  BarChart4,
  LineChart,
  PieChart,
  FileSpreadsheet,
  List,
  ListChecks,
  Filter,
  PlusCircle,
  CircleX,
  Check,
  Trash2,
  Search,
  RefreshCw,
  Building2,
  Package,
  ArrowLeftRight,
  ArrowRightLeft,
  Activity,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Settings,
  FileDigit,
  Eye,
  ExternalLink
} from 'lucide-react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// Komponenta: Hisobot turi va sana tanlov forması
interface CreateDailyReportSelectionProps {
  onNext: (data: { type: ReportType; date: Date; batchId: string }) => void;
  onCancel: () => void;
}

const CreateDailyReportSelection = ({ onNext, onCancel }: CreateDailyReportSelectionProps) => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const response = await BatchService.getAllBatches({ status: 'active' });
        setBatches(response.batches);
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

    fetchBatches();
  }, []);

  // Schema for selection form
  const selectionSchema = z.object({
    type: z.enum(['daily', 'weekly', 'monthly', 'special'] as const),
    date: z.date(),
    batchId: z.string().min(1, 'Partiyani tanlash majburiy'),
  });

  // Form for selection
  const form = useForm<z.infer<typeof selectionSchema>>({
    resolver: zodResolver(selectionSchema),
    defaultValues: {
      type: 'daily',
      date: new Date(),
      batchId: '',
    },
  });

  const onSubmit = (data: z.infer<typeof selectionSchema>) => {
    onNext(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hisobot turi</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Hisobot turini tanlang" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="daily">Kunlik hisobot</SelectItem>
                    <SelectItem value="weekly">Haftalik hisobot</SelectItem>
                    <SelectItem value="monthly">Oylik hisobot</SelectItem>
                    <SelectItem value="special">Maxsus hisobot</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Yaratmoqchi bo'lgan hisobot turini tanlang
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Hisobot sanasi</FormLabel>
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
                          <span>Sana tanlang</span>
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
                  Hisobot qaysi sana uchun tayyorlanishi
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="batchId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Partiya</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Partiyani tanlang" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {loading ? (
                      <SelectItem value="loading" disabled>
                        Yuklanmoqda...
                      </SelectItem>
                    ) : batches.length === 0 ? (
                      <SelectItem value="none" disabled>
                        Aktiv partiyalar mavjud emas
                      </SelectItem>
                    ) : (
                      batches.map((batch) => (
                        <SelectItem key={batch.id} value={batch.id}>
                          {batch.batchNumber} - {batch.section.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Hisobot qaysi partiya uchun tayyorlanishi
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Bekor qilish
          </Button>
          <Button type="submit">Davom etish</Button>
        </div>
      </form>
    </Form>
  );
};

// Komponenta: Kunlik hisobot yaratish forması
interface CreateDailyReportFormProps {
  initialData: { type: ReportType; date: Date; batchId: string };
  onSuccess: () => void;
  onCancel: () => void;
}

const CreateDailyReportForm = ({ initialData, onSuccess, onCancel }: CreateDailyReportFormProps) => {
  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchBatchDetails = async () => {
      try {
        const response = await BatchService.getBatch(initialData.batchId);
        setBatch(response.batch);
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

    fetchBatchDetails();
  }, [initialData.batchId]);

  // Schema for daily report form
  const dailyReportSchema = z.object({
    mortality: z.number().min(0, 'Qiymat 0 dan katta bo\'lishi kerak'),
    culls: z.number().min(0, 'Qiymat 0 dan katta bo\'lishi kerak'),
    averageWeight: z.number().min(0, 'Qiymat 0 dan katta bo\'lishi kerak'),
    weightSampleSize: z.number().min(0, 'Qiymat 0 dan katta bo\'lishi kerak'),
    feedConsumption: z.number().min(0, 'Qiymat 0 dan katta bo\'lishi kerak'),
    waterConsumption: z.number().min(0, 'Qiymat 0 dan katta bo\'lishi kerak'),
    temperatureMin: z.number().min(0, 'Qiymat 0 dan katta bo\'lishi kerak'),
    temperatureMax: z.number().min(0, 'Qiymat 0 dan katta bo\'lishi kerak'),
    temperatureAvg: z.number().min(0, 'Qiymat 0 dan katta bo\'lishi kerak'),
    humidityMin: z.number().min(0, 'Qiymat 0 dan katta bo\'lishi kerak'),
    humidityMax: z.number().min(0, 'Qiymat 0 dan katta bo\'lishi kerak'),
    humidityAvg: z.number().min(0, 'Qiymat 0 dan katta bo\'lishi kerak'),
    healthIssues: z.string(),
    observations: z.string(),
  });

  // Form for daily report
  const form = useForm<z.infer<typeof dailyReportSchema>>({
    resolver: zodResolver(dailyReportSchema),
    defaultValues: {
      mortality: 0,
      culls: 0,
      averageWeight: 0,
      weightSampleSize: 50,
      feedConsumption: 0,
      waterConsumption: 0,
      temperatureMin: 24,
      temperatureMax: 28,
      temperatureAvg: 26,
      humidityMin: 55,
      humidityMax: 65,
      humidityAvg: 60,
      healthIssues: 'Yo\'q',
      observations: 'Normal rivojlanish davom etmoqda',
    },
  });

  const onSubmit = async (values: z.infer<typeof dailyReportSchema>) => {
    try {
      // Construct the report data
      const reportData: CreateReportData = {
        type: initialData.type,
        date: initialData.date.toISOString(),
        batchId: initialData.batchId,
        data: {
          mortality: values.mortality,
          culls: values.culls,
          averageWeight: values.averageWeight,
          weightSampleSize: values.weightSampleSize,
          feedConsumption: values.feedConsumption,
          waterConsumption: values.waterConsumption,
          temperature: {
            min: values.temperatureMin,
            max: values.temperatureMax,
            average: values.temperatureAvg,
          },
          humidity: {
            min: values.humidityMin,
            max: values.humidityMax,
            average: values.humidityAvg,
          },
          healthIssues: values.healthIssues,
          observations: values.observations,
        }
      };

      await ReportService.createReport(reportData);
      
      toast({
        title: 'Muvaffaqiyatli',
        description: 'Hisobot muvaffaqiyatli yaratildi',
      });
      
      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Xatolik',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-2 border-primary rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="text-center p-8">
        <p className="text-red-500">Partiya ma'lumotlarini yuklashda xatolik yuz berdi</p>
        <Button onClick={onCancel} className="mt-4">Orqaga</Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-muted/50 p-4 rounded-md">
          <h3 className="font-medium mb-2">Partiya ma'lumotlari</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <p><span className="text-muted-foreground">Partiya raqami:</span> {batch.batchNumber}</p>
            <p><span className="text-muted-foreground">Sex:</span> {batch.section.name}</p>
            <p><span className="text-muted-foreground">Sana:</span> {format(initialData.date, 'PPP')}</p>
            <p><span className="text-muted-foreground">Jami tovuqlar:</span> {batch.birdCount - (batch.mortality || 0)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-medium">O'lim ko'rsatkichlari</h3>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="mortality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>O'lgan tovuqlar soni</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        value={field.value}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="culls"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brakka chiqarilgan</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        value={field.value}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <h3 className="font-medium pt-2">Vazn ko'rsatkichlari</h3>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="averageWeight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>O'rtacha vazn (kg)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        {...field} 
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        value={field.value}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="weightSampleSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Namuna hajmi</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        value={field.value}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <h3 className="font-medium pt-2">Yem va suv</h3>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="feedConsumption"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Yem sarfi (kg)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        value={field.value}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="waterConsumption"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Suv sarfi (litr)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        value={field.value}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium">Harorat</h3>
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="temperatureMin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum (°C)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        value={field.value}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="temperatureMax"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maksimum (°C)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        value={field.value}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="temperatureAvg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>O'rtacha (°C)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        value={field.value}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <h3 className="font-medium pt-2">Namlik</h3>
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="humidityMin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum (%)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        value={field.value}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="humidityMax"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maksimum (%)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        value={field.value}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="humidityAvg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>O'rtacha (%)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        value={field.value}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <h3 className="font-medium pt-2">Sog'liq va kuzatuvlar</h3>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="healthIssues"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sog'liq muammolari</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Yo'q yoki muammolarni ko'rsating" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="observations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kuzatuvlar</FormLabel>
                    <FormControl>
                      <textarea
                        {...field}
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Partiyaga oid qo'shimcha ma'lumotlar, kuzatuvlar"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Bekor qilish
          </Button>
          <Button type="submit">Hisobotni yaratish</Button>
        </div>
      </form>
    </Form>
  );
};

// Komponent: Hisobot tafsiloti
interface ReportDetailsProps {
  reportId: string;
  onClose: () => void;
}

const ReportDetails = ({ reportId, onClose }: ReportDetailsProps) => {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchReportDetails = async () => {
      try {
        const reportData = await ReportService.getReport(reportId);
        setReport(reportData);
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

    fetchReportDetails();
  }, [reportId]);

  const handleExport = async (format: 'excel' | 'pdf') => {
    try {
      const blob = await ReportService.exportReport(reportId, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `hisobot-${reportId}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({
        title: 'Xatolik',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-2 border-primary rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center p-8">
        <p className="text-red-500">Hisobot ma'lumotlarini yuklashda xatolik yuz berdi</p>
        <Button onClick={onClose} className="mt-4">Yopish</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">
            {report.type === 'daily' && 'Kunlik hisobot'}
            {report.type === 'weekly' && 'Haftalik hisobot'}
            {report.type === 'monthly' && 'Oylik hisobot'}
            {report.type === 'special' && 'Maxsus hisobot'}
          </h2>
          <p className="text-muted-foreground">
            {format(new Date(report.date), 'PPP')} - {report.batch.batchNumber} ({report.batch.section.name})
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => handleExport('excel')}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Excel
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleExport('pdf')}>
            <FileText className="mr-2 h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Asosiy ma'lumotlar</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <div className="grid grid-cols-2 gap-y-2">
              <span className="text-muted-foreground">Partiya:</span>
              <span>{report.batch.batchNumber}</span>
              
              <span className="text-muted-foreground">Sex:</span>
              <span>{report.batch.section.name}</span>
              
              <span className="text-muted-foreground">Hisobot sanasi:</span>
              <span>{format(new Date(report.date), 'PPP')}</span>
              
              <span className="text-muted-foreground">Kim tomonidan:</span>
              <span>{report.submittedBy.name}</span>
              
              {report.approvedBy && (
                <>
                  <span className="text-muted-foreground">Tasdiqlangan:</span>
                  <span>{report.approvedBy.name}</span>
                </>
              )}
              
              <span className="text-muted-foreground">Yaratilgan sana:</span>
              <span>{format(new Date(report.createdAt), 'PPP HH:mm')}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Hisoblangan ko'rsatkichlar</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <div className="grid grid-cols-2 gap-y-2">
              <span className="text-muted-foreground">Jami tovuqlar:</span>
              <span>{report.calculatedMetrics.totalBirds}</span>
              
              <span className="text-muted-foreground">Jami o'lim:</span>
              <span>{report.calculatedMetrics.totalMortality}</span>
              
              <span className="text-muted-foreground">O'lim foizi:</span>
              <span>{(report.calculatedMetrics.mortalityRate * 100).toFixed(2)}%</span>
              
              <span className="text-muted-foreground">FCR:</span>
              <span>{report.calculatedMetrics.feedConversionRatio.toFixed(2)}</span>
              
              <span className="text-muted-foreground">Suv/Yem nisbati:</span>
              <span>{report.calculatedMetrics.waterFeedRatio.toFixed(2)}</span>
              
              <span className="text-muted-foreground">Kunlik vazn ortishi:</span>
              <span>{report.calculatedMetrics.dailyWeightGain.toFixed(2)} kg</span>
              
              <span className="text-muted-foreground">O'sish samaradorligi:</span>
              <span>{report.calculatedMetrics.growthEfficiency.toFixed(1)}</span>
              
              {report.calculatedMetrics.performanceIndex && (
                <>
                  <span className="text-muted-foreground">Samaradorlik indeksi:</span>
                  <span>{report.calculatedMetrics.performanceIndex.toFixed(1)}</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">O'lim va vazn ko'rsatkichlari</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <div className="grid grid-cols-2 gap-y-2">
              <span className="text-muted-foreground">O'lim soni:</span>
              <span>{report.data.mortality}</span>
              
              <span className="text-muted-foreground">Brakka chiqarilgan:</span>
              <span>{report.data.culls}</span>
              
              <span className="text-muted-foreground">O'rtacha vazn:</span>
              <span>{report.data.averageWeight} kg</span>
              
              <span className="text-muted-foreground">Namuna hajmi:</span>
              <span>{report.data.weightSampleSize} tovuq</span>
              
              {report.previous && (
                <>
                  <span className="text-muted-foreground">Avvalgi o'rtacha vazn:</span>
                  <span>{report.previous.averageWeight} kg</span>
                  
                  <span className="text-muted-foreground">Vazn o'zgarishi:</span>
                  <span className={`${(report.data.averageWeight - report.previous.averageWeight) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(report.data.averageWeight - report.previous.averageWeight).toFixed(2)} kg
                  </span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Yem va suv</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <div className="grid grid-cols-2 gap-y-2">
              <span className="text-muted-foreground">Yem sarfi:</span>
              <span>{report.data.feedConsumption} kg</span>
              
              <span className="text-muted-foreground">Suv sarfi:</span>
              <span>{report.data.waterConsumption} liter</span>
              
              <span className="text-muted-foreground">Bir tovuqqa yem:</span>
              <span>{(report.data.feedConsumption / report.calculatedMetrics.totalBirds).toFixed(2)} kg</span>
              
              <span className="text-muted-foreground">Bir tovuqqa suv:</span>
              <span>{(report.data.waterConsumption / report.calculatedMetrics.totalBirds).toFixed(2)} liter</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mikroiqlim ko'rsatkichlari</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <div className="grid grid-cols-2 gap-y-2">
              <span className="text-muted-foreground">Harorat (min):</span>
              <span>{report.data.temperature.min}°C</span>
              
              <span className="text-muted-foreground">Harorat (max):</span>
              <span>{report.data.temperature.max}°C</span>
              
              <span className="text-muted-foreground">Harorat (o'rtacha):</span>
              <span>{report.data.temperature.average}°C</span>
              
              <span className="text-muted-foreground">Namlik (min):</span>
              <span>{report.data.humidity.min}%</span>
              
              <span className="text-muted-foreground">Namlik (max):</span>
              <span>{report.data.humidity.max}%</span>
              
              <span className="text-muted-foreground">Namlik (o'rtacha):</span>
              <span>{report.data.humidity.average}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sog'liq va kuzatuvlar</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-1">Sog'liq muammolari:</h4>
                <p>{report.data.healthIssues || 'Yo\'q'}</p>
              </div>
              
              <div>
                <h4 className="font-medium mb-1">Kuzatuvlar:</h4>
                <p>{report.data.observations}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Komponenta: Hisobot yaratish
interface GenerateReportFormProps {
  onSuccess: (data: any) => void;
  onCancel: () => void;
}

const GenerateReportForm = ({ onSuccess, onCancel }: GenerateReportFormProps) => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [batchesResponse, sectionsResponse] = await Promise.all([
          BatchService.getAllBatches(),
          SectionService.getAllSections()
        ]);
        setBatches(batchesResponse.batches);
        setSections(sectionsResponse.sections);
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

    fetchData();
  }, []);

  // Schema for generate report form
  const generateReportSchema = z.object({
    reportType: z.enum(['daily', 'weekly', 'monthly', 'special'] as const),
    startDate: z.date(),
    endDate: z.date(),
    batchId: z.string().optional(),
    sectionId: z.string().optional(),
    metrics: z.array(z.string()).min(1, 'Kamida bitta ko\'rsatkichni tanlang'),
    format: z.enum(['json', 'excel', 'pdf'] as const),
    title: z.string().optional(),
  });

  // Form for generating report
  const form = useForm<z.infer<typeof generateReportSchema>>({
    resolver: zodResolver(generateReportSchema),
    defaultValues: {
      reportType: 'weekly',
      startDate: new Date(new Date().setDate(new Date().getDate() - 7)),
      endDate: new Date(),
      metrics: ['mortality', 'weight', 'feed', 'fcr', 'health'],
      format: 'json',
      title: 'Tovuq fermasining haftalik hisoboti',
    },
  });

  const onSubmit = async (values: z.infer<typeof generateReportSchema>) => {
    try {
      const reportData: GenerateReportData = {
        reportType: values.reportType,
        startDate: values.startDate.toISOString(),
        endDate: values.endDate.toISOString(),
        batchId: values.batchId === "all" ? undefined : values.batchId,
        sectionId: values.sectionId === "all" ? undefined : values.sectionId,
        metrics: values.metrics,
        format: values.format,
        title: values.title || `Tovuq fermasining ${values.reportType} hisoboti`,
      };

      const response = await ReportService.generateReport(reportData);
      onSuccess(response);
    } catch (error: any) {
      toast({
        title: 'Xatolik',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="reportType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hisobot turi</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Hisobot turini tanlang" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="daily">Kunlik hisobot</SelectItem>
                      <SelectItem value="weekly">Haftalik hisobot</SelectItem>
                      <SelectItem value="monthly">Oylik hisobot</SelectItem>
                      <SelectItem value="special">Maxsus hisobot</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Boshlang'ich sana</FormLabel>
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
                              <span>Sana tanlang</span>
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

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Tugash sana</FormLabel>
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
                              <span>Sana tanlang</span>
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="batchId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Partiya (ixtiyoriy)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "all"}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Partiyani tanlang" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">Barcha partiyalar</SelectItem>
                        {loading ? (
                          <SelectItem value="loading" disabled>
                            Yuklanmoqda...
                          </SelectItem>
                        ) : (
                          batches.map((batch) => (
                            <SelectItem key={batch.id} value={batch.id}>
                              {batch.batchNumber} - {batch.section.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sectionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sex (ixtiyoriy)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "all"}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sexni tanlang" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">Barcha sexlar</SelectItem>
                        {loading ? (
                          <SelectItem value="loading" disabled>
                            Yuklanmoqda...
                          </SelectItem>
                        ) : (
                          sections.map((section) => (
                            <SelectItem key={section.id} value={section.id}>
                              {section.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hisobot nomi</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Hisobot nomini kiriting" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="format"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Format</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Formatni tanlang" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="json">JSON (ekranda ko'rish)</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                      <SelectItem value="pdf">PDF</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div>
            <FormField
              control={form.control}
              name="metrics"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ko'rsatkichlar</FormLabel>
                  <div className="border rounded-md p-4 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="metrics-mortality"
                        checked={field.value.includes('mortality')}
                        onCheckedChange={(checked) => {
                          const updatedMetrics = checked 
                            ? [...field.value, 'mortality'] 
                            : field.value.filter(m => m !== 'mortality');
                          field.onChange(updatedMetrics);
                        }}
                      />
                      <label htmlFor="metrics-mortality">O'lim ko'rsatkichlari</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="metrics-weight"
                        checked={field.value.includes('weight')}
                        onCheckedChange={(checked) => {
                          const updatedMetrics = checked 
                            ? [...field.value, 'weight'] 
                            : field.value.filter(m => m !== 'weight');
                          field.onChange(updatedMetrics);
                        }}
                      />
                      <label htmlFor="metrics-weight">Vazn ko'rsatkichlari</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="metrics-feed"
                        checked={field.value.includes('feed')}
                        onCheckedChange={(checked) => {
                          const updatedMetrics = checked 
                            ? [...field.value, 'feed'] 
                            : field.value.filter(m => m !== 'feed');
                          field.onChange(updatedMetrics);
                        }}
                      />
                      <label htmlFor="metrics-feed">Yem ko'rsatkichlari</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="metrics-fcr"
                        checked={field.value.includes('fcr')}
                        onCheckedChange={(checked) => {
                          const updatedMetrics = checked 
                            ? [...field.value, 'fcr'] 
                            : field.value.filter(m => m !== 'fcr');
                          field.onChange(updatedMetrics);
                        }}
                      />
                      <label htmlFor="metrics-fcr">FCR va samaradorlik</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="metrics-health"
                        checked={field.value.includes('health')}
                        onCheckedChange={(checked) => {
                          const updatedMetrics = checked 
                            ? [...field.value, 'health'] 
                            : field.value.filter(m => m !== 'health');
                          field.onChange(updatedMetrics);
                        }}
                      />
                      <label htmlFor="metrics-health">Sog'liq ko'rsatkichlari</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="metrics-environment"
                        checked={field.value.includes('environment')}
                        onCheckedChange={(checked) => {
                          const updatedMetrics = checked 
                            ? [...field.value, 'environment'] 
                            : field.value.filter(m => m !== 'environment');
                          field.onChange(updatedMetrics);
                        }}
                      />
                      <label htmlFor="metrics-environment">Mikroiqlim ko'rsatkichlari</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="metrics-economics"
                        checked={field.value.includes('economics')}
                        onCheckedChange={(checked) => {
                          const updatedMetrics = checked 
                            ? [...field.value, 'economics'] 
                            : field.value.filter(m => m !== 'economics');
                          field.onChange(updatedMetrics);
                        }}
                      />
                      <label htmlFor="metrics-economics">Iqtisodiy ko'rsatkichlar</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="metrics-all"
                        checked={field.value.includes('all')}
                        onCheckedChange={(checked) => {
                          field.onChange(checked ? ['all'] : []);
                        }}
                      />
                      <label htmlFor="metrics-all">Barcha ko'rsatkichlar</label>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Bekor qilish
          </Button>
          <Button type="submit">Hisobotni generatsiya qilish</Button>
        </div>
      </form>
    </Form>
  );
};

// Komponenta: Hisobotlar ro'yxati
interface ReportsListProps {
  reports: ReportSummary[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onViewReport: (id: string) => void;
  onDeleteReport?: (id: string) => void;
}

const ReportsList = ({ 
  reports, 
  currentPage, 
  totalPages, 
  onPageChange, 
  onViewReport,
  onDeleteReport 
}: ReportsListProps) => {
  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sana</TableHead>
              <TableHead>Tur</TableHead>
              <TableHead>Partiya</TableHead>
              <TableHead>Sex</TableHead>
              <TableHead>O'lim</TableHead>
              <TableHead>O'rtacha vazn</TableHead>
              <TableHead>Yem sarfi</TableHead>
              <TableHead>Kim tomonidan</TableHead>
              <TableHead className="text-right">Amallar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <FileText className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Hisobotlar topilmadi</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>{format(new Date(report.date), 'PPP')}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {report.type === 'daily' && 'Kunlik'}
                      {report.type === 'weekly' && 'Haftalik'}
                      {report.type === 'monthly' && 'Oylik'}
                      {report.type === 'special' && 'Maxsus'}
                    </Badge>
                  </TableCell>
                  <TableCell>{report.batch.batchNumber}</TableCell>
                  <TableCell>{report.section.name}</TableCell>
                  <TableCell>{report.summary.mortality}</TableCell>
                  <TableCell>{report.summary.averageWeight} kg</TableCell>
                  <TableCell>{report.summary.feedConsumption} kg</TableCell>
                  <TableCell>{report.submittedBy.name}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => onViewReport(report.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {onDeleteReport && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => onDeleteReport(report.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                  className={currentPage === 1 ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    isActive={currentPage === page}
                    onClick={() => onPageChange(page)}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext
                  onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                  className={currentPage === totalPages ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

// Asosiy Hisobotlar Sahifasi
const ReportsPage = () => {
  const { toast } = useToast();
  const { user } = useSelector((state: RootState) => state.auth);
  const [activeTab, setActiveTab] = useState<string>('reports');
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [reportStats, setReportStats] = useState<ReportStats | null>(null);
  const [generatedReport, setGeneratedReport] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showReportDetailsModal, setShowReportDetailsModal] = useState<boolean>(false);
  const [showGenerateReportModal, setShowGenerateReportModal] = useState<boolean>(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [createReportStep, setCreateReportStep] = useState<number>(1);
  const [initialReportData, setInitialReportData] = useState<any>(null);
  
  // Report filter states
  const [reportType, setReportType] = useState<string>('all');
  const [batchFilter, setBatchFilter] = useState<string>('all');
  const [sectionFilter, setSectionFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  
  // Fetch reports with filters
  const fetchReports = async () => {
    setLoading(true);
    try {
      const filters: any = {
        page: currentPage,
        limit: 10,
      };
      
      if (reportType !== 'all') {
        filters.type = reportType;
      }
      
      if (batchFilter && batchFilter !== 'all') {
        filters.batchId = batchFilter;
      }
      
      if (sectionFilter && sectionFilter !== 'all') {
        filters.sectionId = sectionFilter;
      }
      
      if (startDate) {
        filters.startDate = startDate.toISOString();
      }
      
      if (endDate) {
        filters.endDate = endDate.toISOString();
      }
      
      const response = await ReportService.getReports(filters);
      setReports(response.reports);
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

  // Fetch report stats
  const fetchReportStats = async () => {
    try {
      const stats = await ReportService.getReportStats();
      setReportStats(stats);
    } catch (error: any) {
      toast({
        title: 'Statistikani yuklashda xatolik',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (activeTab === 'reports') {
      fetchReports();
    } else if (activeTab === 'dashboard') {
      fetchReportStats();
    }
  }, [activeTab, currentPage, reportType, batchFilter, sectionFilter, startDate, endDate]);

  // WebSocket event handlers
  useEffect(() => {
    const handleReportCreated = () => {
      if (activeTab === 'reports') {
        fetchReports();
      } else if (activeTab === 'dashboard') {
        fetchReportStats();
      }
      
      toast({
        title: 'Yangi hisobot',
        description: 'Yangi hisobot yaratildi',
      });
    };
    
    const handleReportUpdated = () => {
      if (activeTab === 'reports') {
        fetchReports();
      } else if (activeTab === 'dashboard') {
        fetchReportStats();
      }
      
      if (selectedReportId) {
        setShowReportDetailsModal(true);
      }
    };
    
    // Subscribe to WebSocket events
    // Note: These events need to be defined in WebSocketEventType enum
    WebSocketService.on(WebSocketEventType.PRODUCTION_REPORT, handleReportCreated);
    
    // Cleanup on unmount
    return () => {
      WebSocketService.off(WebSocketEventType.PRODUCTION_REPORT, handleReportCreated);
    };
  }, [activeTab, selectedReportId]);

  const handleCreateReport = () => {
    setCreateReportStep(1);
    setInitialReportData(null);
    setShowCreateModal(true);
  };

  const handleReportSelectionNext = (data: any) => {
    setInitialReportData(data);
    setCreateReportStep(2);
  };

  const handleReportCreated = () => {
    setShowCreateModal(false);
    fetchReports();
    toast({
      title: 'Muvaffaqiyatli',
      description: 'Hisobot muvaffaqiyatli yaratildi',
    });
  };

  const handleViewReport = (id: string) => {
    setSelectedReportId(id);
    setShowReportDetailsModal(true);
  };

  const handleDeleteReport = async (id: string) => {
    try {
      await ReportService.deleteReport(id);
      fetchReports();
      toast({
        title: 'Muvaffaqiyatli',
        description: 'Hisobot o\'chirildi',
      });
    } catch (error: any) {
      toast({
        title: 'Xatolik',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleGenerateReport = () => {
    setGeneratedReport(null);
    setShowGenerateReportModal(true);
  };

  const handleReportGenerated = (data: any) => {
    setGeneratedReport(data);
    setShowGenerateReportModal(false);
  };

  const clearDateFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Ishlab chiqarish hisobotlari</h1>
          <p className="text-muted-foreground">Hisobotlarni yaratish, ko'rish va tahlil qilish</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCreateReport}>
            <FilePlus className="mr-2 h-4 w-4" />
            Yangi hisobot
          </Button>
          <Button variant="outline" onClick={handleGenerateReport}>
            <BarChart4 className="mr-2 h-4 w-4" />
            Tahlil qilish
          </Button>
        </div>
      </div>

      <Tabs defaultValue="reports" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="reports" className="flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            <span>Hisobotlar ro'yxati</span>
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="flex items-center">
            <BarChart2 className="h-4 w-4 mr-2" />
            <span>Statistika va tahlil</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-4">
          {/* Filters for reports */}
          <div className="flex flex-wrap gap-4">
            <div className="w-[180px]">
              <Select 
                value={reportType} 
                onValueChange={setReportType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Hisobot turi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha turlar</SelectItem>
                  <SelectItem value="daily">Kunlik</SelectItem>
                  <SelectItem value="weekly">Haftalik</SelectItem>
                  <SelectItem value="monthly">Oylik</SelectItem>
                  <SelectItem value="special">Maxsus</SelectItem>
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

            <div className="ml-auto">
              <Button 
                variant="outline" 
                onClick={() => {
                  setReportType('all');
                  setBatchFilter('all');
                  setSectionFilter('all');
                  setStartDate(undefined);
                  setEndDate(undefined);
                }}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Filtrlani tozalash
              </Button>
            </div>
          </div>

          {/* Reports list */}
          <ReportsList
            reports={reports}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            onViewReport={handleViewReport}
            onDeleteReport={user?.role === 'boss' ? handleDeleteReport : undefined}
          />
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-6">
          {/* Dashboard content will be implemented here */}
          {!reportStats ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin h-8 w-8 border-2 border-primary rounded-full border-t-transparent"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary statistics cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Jami hisobotlar</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{reportStats.overall.totalReports}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Kunlik: {reportStats.overall.byType.daily || 0} | 
                      Haftalik: {reportStats.overall.byType.weekly || 0} | 
                      Oylik: {reportStats.overall.byType.monthly || 0}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Eng faol sex</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {reportStats.overall.bySection.length > 0 ? (
                      <>
                        <div className="text-2xl font-bold">{reportStats.overall.bySection[0].name}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {reportStats.overall.bySection[0].count} ta hisobot
                        </p>
                      </>
                    ) : (
                      <div className="text-muted-foreground">Ma'lumot mavjud emas</div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Eng faol foydalanuvchi</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {reportStats.overall.byUser.length > 0 ? (
                      <>
                        <div className="text-2xl font-bold">{reportStats.overall.byUser[0].name}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {reportStats.overall.byUser[0].count} ta hisobot kiritgan
                        </p>
                      </>
                    ) : (
                      <div className="text-muted-foreground">Ma'lumot mavjud emas</div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Oxirgi hisobotlar</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {reportStats.latestReports.daily && (
                      <div className="text-sm">
                        <span className="font-medium">Kunlik:</span> {format(new Date(reportStats.latestReports.daily.date), 'PPP')}
                      </div>
                    )}
                    {reportStats.latestReports.weekly && (
                      <div className="text-sm">
                        <span className="font-medium">Haftalik:</span> {format(new Date(reportStats.latestReports.weekly.startDate), 'PPP')}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Activity timeline */}
              <Card>
                <CardHeader>
                  <CardTitle>Hisobotlar faolligi</CardTitle>
                  <CardDescription>Oxirgi 30 kundagi hisobotlar</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px] flex items-end gap-2">
                    {reportStats.activityTimeline.map((day) => {
                      const height = day.reportCount > 0 
                        ? Math.max(20, (day.reportCount / Math.max(...reportStats.activityTimeline.map(d => d.reportCount))) * 180) 
                        : 0;
                        
                      return (
                        <div key={day.date} className="flex flex-col items-center gap-1">
                          <div 
                            className="w-6 bg-primary rounded-t-sm hover:bg-primary/80 transition-all duration-200"
                            style={{ height: `${height}px` }}
                            title={`${day.date}: ${day.reportCount} ta hisobot`}
                          ></div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(day.date).getDate()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Additional dashboard components can be added here */}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Report Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {createReportStep === 1 ? 'Yangi hisobot yaratish' : 'Hisobot ma\'lumotlarini kiriting'}
            </DialogTitle>
            <DialogDescription>
              {createReportStep === 1 
                ? 'Hisobot turi va asosiy ma\'lumotlarini tanlang' 
                : 'Hisobot uchun kerakli barcha ma\'lumotlarni kiriting'}
            </DialogDescription>
          </DialogHeader>
          
          {createReportStep === 1 ? (
            <CreateDailyReportSelection
              onNext={handleReportSelectionNext}
              onCancel={() => setShowCreateModal(false)}
            />
          ) : (
            <CreateDailyReportForm
              initialData={initialReportData}
              onSuccess={handleReportCreated}
              onCancel={() => setCreateReportStep(1)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Report Details Modal */}
      <Dialog open={showReportDetailsModal} onOpenChange={setShowReportDetailsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Hisobot tafsilotlari
            </DialogTitle>
          </DialogHeader>
          
          {selectedReportId && (
            <ReportDetails
              reportId={selectedReportId}
              onClose={() => setShowReportDetailsModal(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Generate Report Modal */}
      <Dialog open={showGenerateReportModal} onOpenChange={setShowGenerateReportModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <BarChart4 className="mr-2 h-5 w-5" />
              Hisobot generatsiya qilish
            </DialogTitle>
            <DialogDescription>
              Tahlil uchun kerakli parametrlarni tanlang
            </DialogDescription>
          </DialogHeader>
          
          {!generatedReport ? (
            <GenerateReportForm
              onSuccess={handleReportGenerated}
              onCancel={() => setShowGenerateReportModal(false)}
            />
          ) : (
            <div className="space-y-4">
              <div className="border p-4 rounded-md">
                <pre className="overflow-auto max-h-96 text-xs">
                  {JSON.stringify(generatedReport, null, 2)}
                </pre>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => setShowGenerateReportModal(false)}>
                  Yopish
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReportsPage;