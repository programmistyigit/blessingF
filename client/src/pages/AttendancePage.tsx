import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from '@/components/ui/badge';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import {
  Search,
  Plus,
  CalendarDays,
  Clock,
  User as UserIcon,
  Building2,
  CheckSquare,
  XSquare,
  AlertCircle,
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  ClipboardList,
  Save,
} from 'lucide-react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { EmployeeService, AttendanceTask, AttendanceRecord } from '@/services/EmployeeService';
import type { User } from '@/services/EmployeeService';
import { SectionService, Section } from '@/services/SectionService';

// Schema for creating a new attendance task
const createAttendanceTaskSchema = z.object({
  assignedTo: z.string().min(1, "Xodimni tanlash shart"),
  section: z.string().min(1, "Sexni tanlash shart"),
  date: z.date({
    required_error: "Sanani tanlash shart",
  }),
  notes: z.string().optional(),
});

// Schema for submitting an attendance record
const submitAttendanceRecordSchema = z.object({
  user: z.string().min(1, "Xodimni tanlash shart"),
  date: z.date({
    required_error: "Sanani tanlash shart",
  }),
  status: z.enum(["present", "absent", "late", "leave", "sick"], {
    required_error: "Holatni tanlash shart",
  }),
  checkInTime: z.date().optional(),
  checkOutTime: z.date().optional(),
  comments: z.string().optional(),
});

// Component for creating a new attendance task
interface CreateAttendanceTaskFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  managers: User[];
  sections: Section[];
}

const CreateAttendanceTaskForm = ({ onSuccess, onCancel, managers, sections }: CreateAttendanceTaskFormProps) => {
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof createAttendanceTaskSchema>>({
    resolver: zodResolver(createAttendanceTaskSchema),
    defaultValues: {
      date: new Date(),
      notes: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof createAttendanceTaskSchema>) => {
    try {
      // Convert date object to ISO string
      const formattedValues = {
        ...values,
        date: values.date.toISOString(),
      };
      
      await EmployeeService.createAttendanceTask(formattedValues);
      toast({
        title: "Yo'qlama vazifasi yaratildi",
        description: "Yo'qlama vazifasi muvaffaqiyatli yaratildi",
      });
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Xatolik yuz berdi",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="section"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sex</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sexni tanlang" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {sections.map((section) => (
                    <SelectItem key={section.id} value={section.id}>
                      {section.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="assignedTo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mas'ul xodim</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Yo'qlama oluvchini tanlang" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {typeof(managers) == "object" && managers.map((manager) => (
                    <SelectItem key={manager.id} value={manager.id}>
                      {manager.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Bu xodim belgilangan sexdagi yo'qlamani o'tkazadi
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
              <FormLabel>Yo'qlama sanasi</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "pl-3 text-left font-normal",
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
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Izohlar</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Yo'qlama vazifasi bo'yicha qo'shimcha ko'rsatmalar"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel} type="button">
            Bekor qilish
          </Button>
          <Button type="submit">Saqlash</Button>
        </div>
      </form>
    </Form>
  );
};

// Component for submitting an attendance record
interface SubmitAttendanceRecordFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  sectionId: string;
  sectionName: string;
  date: Date;
  employees: User[];
}

const SubmitAttendanceRecordForm = ({ 
  onSuccess, 
  onCancel, 
  sectionId, 
  sectionName, 
  date, 
  employees
}: SubmitAttendanceRecordFormProps) => {
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof submitAttendanceRecordSchema>>({
    resolver: zodResolver(submitAttendanceRecordSchema),
    defaultValues: {
      date,
      status: "present",
      checkInTime: new Date(date.setHours(8, 0, 0, 0)),
      checkOutTime: new Date(date.setHours(17, 0, 0, 0)),
      comments: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof submitAttendanceRecordSchema>) => {
    try {
      await EmployeeService.createAttendanceRecord(values);
      toast({
        title: "Yo'qlama qaydi yaratildi",
        description: "Yo'qlama qaydi muvaffaqiyatli yaratildi",
      });
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Xatolik yuz berdi",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const watchStatus = form.watch("status");
  const needsTime = watchStatus === "present" || watchStatus === "late";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-base font-medium">{sectionName}</h3>
            <p className="text-sm text-muted-foreground">
              Sana: {format(date, "dd MMMM yyyy")}
            </p>
          </div>
        </div>

        <FormField
          control={form.control}
          name="user"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Xodim</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Xodimni tanlang" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {typeof(employees) == "object" && employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Holat</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Holatni tanlang" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="present">
                    <div className="flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                      <span>Keldi</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="absent">
                    <div className="flex items-center">
                      <XCircle className="h-4 w-4 mr-2 text-red-500" />
                      <span>Kelmadi</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="late">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-amber-500" />
                      <span>Kech keldi</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="leave">
                    <div className="flex items-center">
                      <CalendarDays className="h-4 w-4 mr-2 text-blue-500" />
                      <span>Ta'tilda</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="sick">
                    <div className="flex items-center">
                      <AlertCircle className="h-4 w-4 mr-2 text-purple-500" />
                      <span>Kasallikda</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {needsTime && (
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="checkInTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kelgan vaqt</FormLabel>
                  <div className="flex items-center">
                    <Select 
                      onValueChange={(value) => {
                        const hours = parseInt(value);
                        const newDate = new Date(field.value || date);
                        newDate.setHours(hours);
                        field.onChange(newDate);
                      }}
                      value={field.value ? field.value.getHours().toString() : "8"}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Soat" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => i + 7).map((hour) => (
                          <SelectItem key={hour} value={hour.toString()}>
                            {hour.toString().padStart(2, '0')}:00
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="mx-2">:</span>
                    <Select 
                      onValueChange={(value) => {
                        const minutes = parseInt(value);
                        const newDate = new Date(field.value || date);
                        newDate.setMinutes(minutes);
                        field.onChange(newDate);
                      }}
                      value={field.value ? field.value.getMinutes().toString() : "0"}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Daqiqa" />
                      </SelectTrigger>
                      <SelectContent>
                        {[0, 15, 30, 45].map((minute) => (
                          <SelectItem key={minute} value={minute.toString()}>
                            {minute.toString().padStart(2, '0')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="checkOutTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ketgan vaqt</FormLabel>
                  <div className="flex items-center">
                    <Select 
                      onValueChange={(value) => {
                        const hours = parseInt(value);
                        const newDate = new Date(field.value || date);
                        newDate.setHours(hours);
                        field.onChange(newDate);
                      }}
                      value={field.value ? field.value.getHours().toString() : "17"}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Soat" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => i + 12).map((hour) => (
                          <SelectItem key={hour} value={hour.toString()}>
                            {hour.toString().padStart(2, '0')}:00
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="mx-2">:</span>
                    <Select 
                      onValueChange={(value) => {
                        const minutes = parseInt(value);
                        const newDate = new Date(field.value || date);
                        newDate.setMinutes(minutes);
                        field.onChange(newDate);
                      }}
                      value={field.value ? field.value.getMinutes().toString() : "0"}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Daqiqa" />
                      </SelectTrigger>
                      <SelectContent>
                        {[0, 15, 30, 45].map((minute) => (
                          <SelectItem key={minute} value={minute.toString()}>
                            {minute.toString().padStart(2, '0')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        <FormField
          control={form.control}
          name="comments"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Izohlar</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Yo'qlama bo'yicha qo'shimcha izohlar"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel} type="button">
            Bekor qilish
          </Button>
          <Button type="submit">
            <Save className="h-4 w-4 mr-2" />
            Saqlash
          </Button>
        </div>
      </form>
    </Form>
  );
};

// Main component
const AttendancePage = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("create-task");
  const [managers, setManagers] = useState<User[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [tasks, setTasks] = useState<AttendanceTask[]>([]);
  const [records, setRecords] = useState<any>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [sectionEmployees, setSectionEmployees] = useState<User[]>([]);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showRecordModal, setShowRecordModal] = useState<boolean>(false);
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  const [selectedSectionName, setSelectedSectionName] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Fetch managers, sections and attendance tasks
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch managers and sections
        const [managersResponse, sectionsResponse] = await Promise.all([
          EmployeeService.getAllEmployees({ role: 'manager' }),
          SectionService.getAllSections()
        ]);
        
        setManagers(managersResponse.users);
        setSections(sectionsResponse.sections);
        
        // TODO: Add fetch for attendance tasks
        // ...
        
      } catch (error: any) {
        toast({
          title: "Ma'lumotlarni yuklashda xatolik",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Placeholder function for fetching section employees
  const fetchSectionEmployees = async (sectionId: string) => {
    setLoading(true);
    try {
      const response = await EmployeeService.getAllEmployees({ section: sectionId });
      setSectionEmployees(response.users);
    } catch (error: any) {
      toast({
        title: "Xodimlarni yuklashda xatolik",
        description: error.message,
        variant: "destructive",
      });
      setSectionEmployees([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch attendance records for a specific section and date
  const fetchSectionAttendance = async (sectionId: string, date: Date) => {
    setLoading(true);
    try {
      const dateStr = format(date, "yyyy-MM-dd");
      const response = await EmployeeService.getSectionAttendance(sectionId, dateStr);
      setRecords(response.data);
    } catch (error: any) {
      toast({
        title: "Yo'qlama ma'lumotlarini yuklashda xatolik",
        description: error.message,
        variant: "destructive",
      });
      setRecords({ records: [] });
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateTask = () => {
    setShowCreateModal(true);
  };
  
  const handleCreateTaskSuccess = () => {
    setShowCreateModal(false);
    // TODO: Refresh tasks list
    toast({
      title: "Muvaffaqiyatli",
      description: "Yo'qlama vazifasi yaratildi va mas'ul xodimga yuborildi",
    });
  };
  
  const handleAddRecord = (sectionId: string, sectionName: string) => {
    setSelectedSectionId(sectionId);
    setSelectedSectionName(sectionName);
    fetchSectionEmployees(sectionId);
    setShowRecordModal(true);
  };
  
  const handleAddRecordSuccess = () => {
    setShowRecordModal(false);
    if (selectedSectionId) {
      fetchSectionAttendance(selectedSectionId, selectedDate);
    }
    toast({
      title: "Muvaffaqiyatli",
      description: "Yo'qlama qaydi saqlandi",
    });
  };
  
  const handleViewAttendance = (sectionId: string, sectionName: string) => {
    setSelectedSectionId(sectionId);
    setSelectedSectionName(sectionName);
    fetchSectionAttendance(sectionId, selectedDate);
    setActiveTab("view-records");
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-green-100 text-green-800">Keldi</Badge>;
      case 'absent':
        return <Badge className="bg-red-100 text-red-800">Kelmadi</Badge>;
      case 'late':
        return <Badge className="bg-amber-100 text-amber-800">Kech keldi</Badge>;
      case 'leave':
        return <Badge className="bg-blue-100 text-blue-800">Ta'tilda</Badge>;
      case 'sick':
        return <Badge className="bg-purple-100 text-purple-800">Kasallikda</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  const formatTime = (dateString?: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return format(date, "HH:mm");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Yo'qlama boshqaruvi</h1>
          <p className="text-muted-foreground">Xodimlar yo'qlamasini nazorat qilish va hisobotlash</p>
        </div>
        <div className="flex space-x-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(selectedDate, "dd MMMM yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) {
                    setSelectedDate(date);
                    if (selectedSectionId && activeTab === "view-records") {
                      fetchSectionAttendance(selectedSectionId, date);
                    }
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          
          <Button onClick={handleCreateTask}>
            <Plus className="h-4 w-4 mr-2" />
            Vazifa yaratish
          </Button>
        </div>
      </div>

      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="create-task">
            <ClipboardList className="h-4 w-4 mr-2" />
            Yo'qlama vazifalar
          </TabsTrigger>
          <TabsTrigger value="view-records">
            <CalendarDays className="h-4 w-4 mr-2" />
            Yo'qlama ma'lumotlari
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="create-task" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sections.map((section) => (
              <Card key={section.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{section.name}</CardTitle>
                  <CardDescription>
                    <span className="flex items-center">
                      <Building2 className="h-4 w-4 mr-1" />
                      {section.type === 'growing' ? "O'stirish" : 
                       section.type === 'breeding' ? "Ko'paytirish" : "So'yish"}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <UserIcon className="h-4 w-4 mr-1 text-muted-foreground" />
                      <span className="text-sm">{section.currentCount} / {section.capacity}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-2 flex justify-between">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleAddRecord(section.id, section.name)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Qayd qo'shish
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => handleViewAttendance(section.id, section.name)}
                  >
                    Ko'rish
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="view-records" className="space-y-4">
          {selectedSectionId ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-medium">{selectedSectionName}</h2>
                  <p className="text-sm text-muted-foreground">
                    Sana: {format(selectedDate, "dd MMMM yyyy")}
                  </p>
                </div>
                <Button 
                  onClick={() => handleAddRecord(selectedSectionId, selectedSectionName)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Yangi qayd
                </Button>
              </div>
              
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Xodim</TableHead>
                      <TableHead>Holat</TableHead>
                      <TableHead>Kelgan vaqt</TableHead>
                      <TableHead>Ketgan vaqt</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <>
                        {[...Array(5)].map((_, i) => (
                          <TableRow key={i}>
                            <TableCell>
                              <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
                            </TableCell>
                            <TableCell>
                              <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
                            </TableCell>
                            <TableCell>
                              <div className="h-5 w-16 bg-gray-200 rounded animate-pulse"></div>
                            </TableCell>
                            <TableCell>
                              <div className="h-5 w-16 bg-gray-200 rounded animate-pulse"></div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </>
                    ) : records?.records && records.records.length > 0 ? (
                      records.records.map((record: any) => (
                        <TableRow key={record.id}>
                          <TableCell>{record.user.name}</TableCell>
                          <TableCell>{getStatusBadge(record.status)}</TableCell>
                          <TableCell>{formatTime(record.checkInTime)}</TableCell>
                          <TableCell>{formatTime(record.checkOutTime)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <CalendarDays className="h-10 w-10 text-muted-foreground mb-2" />
                            <p className="text-muted-foreground">Yo'qlama qaydi topilmadi</p>
                            <p className="text-sm text-muted-foreground">
                              Ushbu sana uchun yo'qlama qaydlari mavjud emas
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {records?.summary && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Umumiy statistika</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-5 gap-4">
                      <div className="flex flex-col items-center p-2 border rounded-md">
                        <span className="text-sm text-muted-foreground">Jami</span>
                        <span className="text-xl font-bold">{records.summary.total}</span>
                      </div>
                      <div className="flex flex-col items-center p-2 border rounded-md bg-green-50">
                        <span className="text-sm text-green-800">Keldi</span>
                        <span className="text-xl font-bold text-green-800">{records.summary.present}</span>
                      </div>
                      <div className="flex flex-col items-center p-2 border rounded-md bg-red-50">
                        <span className="text-sm text-red-800">Kelmadi</span>
                        <span className="text-xl font-bold text-red-800">{records.summary.absent}</span>
                      </div>
                      <div className="flex flex-col items-center p-2 border rounded-md bg-amber-50">
                        <span className="text-sm text-amber-800">Kech keldi</span>
                        <span className="text-xl font-bold text-amber-800">{records.summary.late}</span>
                      </div>
                      <div className="flex flex-col items-center p-2 border rounded-md bg-blue-50">
                        <span className="text-sm text-blue-800">Ta'til/Kasallikda</span>
                        <span className="text-xl font-bold text-blue-800">
                          {records.summary.leave + records.summary.sick}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[400px]">
              <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium">Sex tanlang</h3>
              <p className="text-muted-foreground">
                Yo'qlama ma'lumotlarini ko'rish uchun chap tarafdagi ro'yxatdan sexni tanlang
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Task Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Yo'qlama vazifasini yaratish</DialogTitle>
            <DialogDescription>
              Yo'qlama o'tkazish uchun mas'ul xodimni tayinlang
            </DialogDescription>
          </DialogHeader>
          <CreateAttendanceTaskForm
            managers={managers}
            sections={sections}
            onSuccess={handleCreateTaskSuccess}
            onCancel={() => setShowCreateModal(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Add Record Modal */}
      <Dialog open={showRecordModal} onOpenChange={setShowRecordModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Yo'qlama qaydini qo'shish</DialogTitle>
            <DialogDescription>
              Xodim uchun yo'qlama qaydini kiritish
            </DialogDescription>
          </DialogHeader>
          {selectedSectionId && (
            <SubmitAttendanceRecordForm
              sectionId={selectedSectionId}
              sectionName={selectedSectionName}
              date={selectedDate}
              employees={sectionEmployees}
              onSuccess={handleAddRecordSuccess}
              onCancel={() => setShowRecordModal(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AttendancePage;