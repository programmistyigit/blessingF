import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from "@/components/ui/checkbox";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  ClipboardList,
  ListChecks,
  AlertCircle,
  Clock,
  Calendar as CalendarIcon,
  Check,
  CheckCircle2,
  XCircle,
  AlarmClock,
  Filter,
  List,
  Star,
  LayoutGrid,
  RefreshCw,
  SlidersHorizontal,
  PlusCircle,
  Eye,
  Edit,
  Building2,
  Users,
  Package,
  Tag,
  MoreHorizontal,
  ChevronRight,
  Play,
  Timer,
  Ban,
} from 'lucide-react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { 
  Task, 
  TaskType, 
  TaskPriority, 
  TaskStatus,
  TaskService
} from '@/services/TaskService';
import { SectionService, Section } from '@/services/SectionService';
import { EmployeeService } from '@/services/EmployeeService';
import { BatchService } from '@/services/BatchService';
import { WebSocketService, WebSocketEventType } from '@/services/WebSocketService';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

// Schema for creating a new task
const createTaskSchema = z.object({
  title: z.string().min(3, "Sarlavha kamida 3 ta belgidan iborat bo'lishi kerak"),
  description: z.string().min(5, "Tavsif kamida 5 ta belgidan iborat bo'lishi kerak"),
  type: z.enum(['feeding', 'cleaning', 'vaccination', 'maintenance', 'measurement', 'medication', 'other'], {
    required_error: "Vazifa turini tanlash shart",
  }),
  section: z.string().min(1, "Sexni tanlash shart"),
  batch: z.string().optional(),
  assignedTo: z.array(z.string()).min(1, "Kamida bitta xodimni tanlash shart"),
  supervisors: z.array(z.string()).min(1, "Kamida bitta nazoratchi tanlash shart"),
  priority: z.enum(['low', 'medium', 'high', 'urgent'], {
    required_error: "Muhimlik darajasini tanlash shart",
  }),
  startDate: z.date({
    required_error: "Boshlanish sanasini tanlash shart",
  }),
  dueDate: z.date({
    required_error: "Tugash sanasini tanlash shart",
  }),
  isRecurring: z.boolean().default(false),
  notes: z.string().optional(),
});

// Schema for updating task status
const updateTaskStatusSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled', 'overdue'], {
    required_error: "Holat tanlash shart",
  }),
  completionPercentage: z.number().min(0).max(100).default(0),
  notes: z.string().optional(),
});

// Component for creating a new task
interface CreateTaskFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  sections: Section[];
  employees: any[];
  batches: any[];
}

const CreateTaskForm = ({ onSuccess, onCancel, sections, employees, batches }: CreateTaskFormProps) => {
  const { toast } = useToast();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const form = useForm<z.infer<typeof createTaskSchema>>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "other",
      priority: "medium",
      startDate: new Date(),
      dueDate: new Date(new Date().setDate(new Date().getDate() + 1)),
      isRecurring: false,
      assignedTo: [],
      supervisors: user ? [user.id] : [],
    },
  });

  const onSubmit = async (values: z.infer<typeof createTaskSchema>) => {
    try {
      // Convert dates to ISO strings
      const formattedValues = {
        ...values,
        startDate: values.startDate.toISOString(),
        dueDate: values.dueDate.toISOString(),
      };
      
      await TaskService.createTask(formattedValues);
      toast({
        title: "Vazifa yaratildi",
        description: "Yangi vazifa muvaffaqiyatli yaratildi",
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

  // Filter managers for supervisors
  const managers = employees.filter(emp => emp.role === "manager" || emp.role === "boss");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sarlavha</FormLabel>
              <FormControl>
                <Input placeholder="Vazifa sarlavhasi" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tavsif</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Vazifa haqida batafsil ma'lumot" 
                  className="min-h-32" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vazifa turi</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Vazifa turini tanlang" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="feeding">Oziqlantirish</SelectItem>
                    <SelectItem value="cleaning">Tozalash</SelectItem>
                    <SelectItem value="vaccination">Vaksinatsiya</SelectItem>
                    <SelectItem value="maintenance">Texnik xizmat</SelectItem>
                    <SelectItem value="measurement">O'lchash</SelectItem>
                    <SelectItem value="medication">Dori berish</SelectItem>
                    <SelectItem value="other">Boshqa</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Muhimlik darajasi</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Muhimlik darajasini tanlang" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="low">Past</SelectItem>
                    <SelectItem value="medium">O'rta</SelectItem>
                    <SelectItem value="high">Yuqori</SelectItem>
                    <SelectItem value="urgent">Juda muhim</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
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
            name="batch"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Partiya (ixtiyoriy)</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Partiyani tanlang" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {batches.map((batch) => (
                      <SelectItem key={batch.id} value={batch.id}>
                        {batch.batchNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Boshlanish sanasi</FormLabel>
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
            name="dueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Tugash sanasi</FormLabel>
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
        </div>

        <FormField
          control={form.control}
          name="assignedTo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mas'ul xodimlar</FormLabel>
              <div className="grid grid-cols-3 gap-2 border rounded-md p-3 max-h-48 overflow-y-auto">
                {employees.map((employee) => (
                  <div key={employee.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`employee-${employee.id}`}
                      checked={field.value?.includes(employee.id)}
                      onCheckedChange={(checked) => {
                        const currentValues = field.value || [];
                        if (checked) {
                          field.onChange([...currentValues, employee.id]);
                        } else {
                          field.onChange(
                            currentValues.filter((value) => value !== employee.id)
                          );
                        }
                      }}
                    />
                    <label
                      htmlFor={`employee-${employee.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {employee.name}
                    </label>
                  </div>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="supervisors"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nazoratchilar</FormLabel>
              <div className="grid grid-cols-3 gap-2 border rounded-md p-3 max-h-32 overflow-y-auto">
                {managers.map((manager) => (
                  <div key={manager.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`supervisor-${manager.id}`}
                      checked={field.value?.includes(manager.id)}
                      onCheckedChange={(checked) => {
                        const currentValues = field.value || [];
                        if (checked) {
                          field.onChange([...currentValues, manager.id]);
                        } else {
                          field.onChange(
                            currentValues.filter((value) => value !== manager.id)
                          );
                        }
                      }}
                    />
                    <label
                      htmlFor={`supervisor-${manager.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {manager.name}
                    </label>
                  </div>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isRecurring"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Takrorlanuvchi vazifa</FormLabel>
                <FormDescription>
                  Vazifa belgilangan jadval bo'yicha avtomatik takrorlanadi
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Qo'shimcha eslatmalar</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Vazifa bo'yicha qo'shimcha ko'rsatmalar"
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

// Component for updating task status
interface UpdateTaskStatusFormProps {
  task: Task;
  onSuccess: () => void;
  onCancel: () => void;
}

const UpdateTaskStatusForm = ({ task, onSuccess, onCancel }: UpdateTaskStatusFormProps) => {
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof updateTaskStatusSchema>>({
    resolver: zodResolver(updateTaskStatusSchema),
    defaultValues: {
      status: task.status,
      completionPercentage: task.completionPercentage,
      notes: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof updateTaskStatusSchema>) => {
    try {
      await TaskService.updateTaskStatus(task.id, values);
      toast({
        title: "Vazifa holati yangilandi",
        description: "Vazifa holati muvaffaqiyatli yangilandi",
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
        <div>
          <h3 className="text-lg font-medium">{task.title}</h3>
          <p className="text-sm text-muted-foreground">{task.description}</p>
        </div>
        
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Yangi holat</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Holatni tanlang" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="pending">
                    <div className="flex items-center">
                      <AlarmClock className="h-4 w-4 mr-2 text-blue-500" />
                      <span>Kutilmoqda</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="in_progress">
                    <div className="flex items-center">
                      <Play className="h-4 w-4 mr-2 text-amber-500" />
                      <span>Bajarilmoqda</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="completed">
                    <div className="flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                      <span>Bajarilgan</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="cancelled">
                    <div className="flex items-center">
                      <Ban className="h-4 w-4 mr-2 text-red-500" />
                      <span>Bekor qilingan</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.watch("status") === "in_progress" && (
          <FormField
            control={form.control}
            name="completionPercentage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bajarilish foizi ({field.value}%)</FormLabel>
                <FormControl>
                  <div className="space-y-3">
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      step="5"
                      value={field.value}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                      className="w-full"
                    />
                    <Progress value={field.value} className="h-2" />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Izohlar</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Statusi o'zgargani haqida izoh"
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

// Task details component
interface TaskDetailsProps {
  taskId: string;
  onClose: () => void;
  onUpdateStatus: () => void;
}

const TaskDetails = ({ taskId, onClose, onUpdateStatus }: TaskDetailsProps) => {
  const { toast } = useToast();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showUpdateStatusModal, setShowUpdateStatusModal] = useState<boolean>(false);

  useEffect(() => {
    const fetchTaskDetails = async () => {
      setLoading(true);
      try {
        const response = await TaskService.getTask(taskId);
        setTask(response.task);
      } catch (error: any) {
        toast({
          title: "Xatolik yuz berdi",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTaskDetails();
  }, [taskId]);

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-blue-100 text-blue-800 flex items-center"><AlarmClock className="h-3 w-3 mr-1" /> Kutilmoqda</Badge>;
      case 'in_progress':
        return <Badge className="bg-amber-100 text-amber-800 flex items-center"><Play className="h-3 w-3 mr-1" /> Bajarilmoqda</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 flex items-center"><CheckCircle2 className="h-3 w-3 mr-1" /> Bajarilgan</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 flex items-center"><Ban className="h-3 w-3 mr-1" /> Bekor qilingan</Badge>;
      case 'overdue':
        return <Badge className="bg-purple-100 text-purple-800 flex items-center"><Timer className="h-3 w-3 mr-1" /> Muddati o'tgan</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'low':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 flex items-center"><Star className="h-3 w-3 mr-1" /> Past</Badge>;
      case 'medium':
        return <Badge variant="outline" className="bg-green-50 text-green-700 flex items-center"><Star className="h-3 w-3 mr-1" /> O'rta</Badge>;
      case 'high':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 flex items-center"><Star className="h-3 w-3 mr-1" /> Yuqori</Badge>;
      case 'urgent':
        return <Badge variant="outline" className="bg-red-50 text-red-700 flex items-center"><Star className="h-3 w-3 mr-1" /> Juda muhim</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getTypeBadge = (type: TaskType) => {
    switch (type) {
      case 'feeding':
        return <Badge className="bg-green-100 text-green-800">Oziqlantirish</Badge>;
      case 'cleaning':
        return <Badge className="bg-blue-100 text-blue-800">Tozalash</Badge>;
      case 'vaccination':
        return <Badge className="bg-purple-100 text-purple-800">Vaksinatsiya</Badge>;
      case 'maintenance':
        return <Badge className="bg-amber-100 text-amber-800">Texnik xizmat</Badge>;
      case 'measurement':
        return <Badge className="bg-cyan-100 text-cyan-800">O'lchash</Badge>;
      case 'medication':
        return <Badge className="bg-pink-100 text-pink-800">Dori berish</Badge>;
      case 'other':
        return <Badge className="bg-neutral-100 text-neutral-800">Boshqa</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const handleSuccessStatusUpdate = () => {
    setShowUpdateStatusModal(false);
    onUpdateStatus();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-center">
        <p className="text-red-500">Vazifa ma'lumotlarini yuklashda xatolik yuz berdi</p>
        <Button onClick={onClose} className="mt-4">Yopish</Button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold">{task.title}</h2>
            <div className="flex items-center gap-2 mt-1">
              {getTypeBadge(task.type)}
              {getPriorityBadge(task.priority)}
              {getStatusBadge(task.status)}
            </div>
          </div>
          <Button size="sm" onClick={() => setShowUpdateStatusModal(true)}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Holatni yangilash
          </Button>
        </div>

        <div className="border rounded-md p-4">
          <h3 className="font-semibold mb-2">Tavsif</h3>
          <p className="text-sm">{task.description}</p>

          {task.notes && (
            <div className="mt-4 border-t pt-4">
              <h4 className="font-semibold text-sm mb-1">Qo'shimcha ma'lumotlar</h4>
              <p className="text-sm text-muted-foreground">{task.notes}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="border rounded-md p-4">
            <h3 className="font-semibold mb-3 flex items-center">
              <Building2 className="h-4 w-4 mr-2" />
              Sex
            </h3>
            <p>{task.section.name}</p>
          </div>

          {task.batch && (
            <div className="border rounded-md p-4">
              <h3 className="font-semibold mb-3 flex items-center">
                <Package className="h-4 w-4 mr-2" />
                Partiya
              </h3>
              <p>{task.batch.batchNumber}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="border rounded-md p-4">
            <h3 className="font-semibold mb-3 flex items-center">
              <CalendarIcon className="h-4 w-4 mr-2" />
              Boshlanish sanasi
            </h3>
            <p>{new Date(task.startDate).toLocaleDateString('uz-UZ')}</p>
          </div>

          <div className="border rounded-md p-4">
            <h3 className="font-semibold mb-3 flex items-center">
              <CalendarIcon className="h-4 w-4 mr-2" />
              Tugash sanasi
            </h3>
            <p>{new Date(task.dueDate).toLocaleDateString('uz-UZ')}</p>
          </div>
        </div>

        {task.status === 'in_progress' && (
          <div className="border rounded-md p-4">
            <h3 className="font-semibold mb-3 flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Bajarilish jarayoni
            </h3>
            <div className="space-y-2">
              <Progress value={task.completionPercentage} className="h-2" />
              <p className="text-sm text-muted-foreground text-right">{task.completionPercentage}%</p>
            </div>
          </div>
        )}

        <div className="border rounded-md p-4">
          <h3 className="font-semibold mb-3">Mas'ul xodimlar</h3>
          <div className="space-y-2">
            {task.assignedTo.map(user => (
              <div key={user.id} className="flex items-center p-2 rounded-md border">
                <span>{user.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border rounded-md p-4">
          <h3 className="font-semibold mb-3">Nazoratchilar</h3>
          <div className="space-y-2">
            {task.supervisors.map(user => (
              <div key={user.id} className="flex items-center p-2 rounded-md border">
                <span>{user.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border rounded-md p-4">
          <h3 className="font-semibold mb-3">Ma'lumot</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Yaratilgan sana:</span>
              <span>{new Date(task.createdAt).toLocaleDateString('uz-UZ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Yaratuvchi:</span>
              <span>{task.createdBy.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">O'zgartirilgan sana:</span>
              <span>{new Date(task.updatedAt).toLocaleDateString('uz-UZ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Takrorlanuvchi:</span>
              <span>{task.isRecurring ? 'Ha' : 'Yoq'}</span>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showUpdateStatusModal} onOpenChange={setShowUpdateStatusModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Vazifa holatini yangilash</DialogTitle>
            <DialogDescription>
              Vazifaning joriy holatini o'zgartiring
            </DialogDescription>
          </DialogHeader>
          <UpdateTaskStatusForm
            task={task}
            onSuccess={handleSuccessStatusUpdate}
            onCancel={() => setShowUpdateStatusModal(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

// Main component
const TasksPage = () => {
  const { toast } = useToast();
  const { user } = useSelector((state: RootState) => state.auth);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [totalTasks, setTotalTasks] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sectionFilter, setSectionFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  const [taskTab, setTaskTab] = useState<string>('all');
  
  const fetchTasks = async () => {
    setLoading(true);
    try {
      let response;
      const params: any = {
        page: currentPage,
        limit,
      };
      
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      
      if (typeFilter !== 'all') {
        params.type = typeFilter;
      }
      
      if (priorityFilter !== 'all') {
        params.priority = priorityFilter;
      }
      
      if (sectionFilter && sectionFilter !== 'all') {
        params.section = sectionFilter;
      }
      
      // Handle different tabs
      if (taskTab === 'my') {
        response = await TaskService.getMyTasks(params);
      } else if (taskTab === 'overdue') {
        response = await TaskService.getOverdueTasks(params);
      } else {
        response = await TaskService.getTasks(params);
      }
      
      setTasks(response.tasks);
      setTotalTasks(response.total);
    } catch (error: any) {
      toast({
        title: "Vazifalarni yuklashda xatolik",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSectionsEmployeesAndBatches = async () => {
    try {
      const [sectionsResponse, employeesResponse, batchesResponse] = await Promise.all([
        SectionService.getAllSections(),
        EmployeeService.getAllEmployees({ limit: 100 }),
        BatchService.getAllBatches()
      ]);

      setSections(sectionsResponse.sections);
      setEmployees(employeesResponse.users);
      setBatches(batchesResponse.batches);
    } catch (error: any) {
      toast({
        title: "Ma'lumotlarni yuklashda xatolik",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [currentPage, statusFilter, typeFilter, priorityFilter, sectionFilter, taskTab]);

  useEffect(() => {
    fetchSectionsEmployeesAndBatches();
  }, []);

  // WebSocket handlers for real-time updates
  useEffect(() => {
    const handleTaskAssigned = () => {
      fetchTasks();
      toast({
        title: "Yangi vazifa",
        description: "Sizga yangi vazifa biriktirildi",
      });
    };

    const handleTaskUpdated = () => {
      fetchTasks();
      if (selectedTask) {
        // If we are viewing a task, refresh its data
        setShowDetailsModal(true);
      }
    };

    const handleTaskStatusChanged = () => {
      fetchTasks();
    };

    // Subscribe to WebSocket events
    WebSocketService.on(WebSocketEventType.TASK_ASSIGNED, handleTaskAssigned);
    WebSocketService.on(WebSocketEventType.TASK_UPDATED, handleTaskUpdated);
    WebSocketService.on(WebSocketEventType.TASK_STATUS_CHANGED, handleTaskStatusChanged);

    // Cleanup on unmount
    return () => {
      WebSocketService.off(WebSocketEventType.TASK_ASSIGNED, handleTaskAssigned);
      WebSocketService.off(WebSocketEventType.TASK_UPDATED, handleTaskUpdated);
      WebSocketService.off(WebSocketEventType.TASK_STATUS_CHANGED, handleTaskStatusChanged);
    };
  }, [selectedTask]);

  const handleViewTask = (id: string) => {
    setSelectedTask(id);
    setShowDetailsModal(true);
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    fetchTasks();
    toast({
      title: "Muvaffaqiyatli",
      description: "Yangi vazifa yaratildi",
    });
  };

  const handleUpdateSuccess = () => {
    fetchTasks();
  };

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-blue-100 text-blue-800">Kutilmoqda</Badge>;
      case 'in_progress':
        return <Badge className="bg-amber-100 text-amber-800">Bajarilmoqda</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Bajarilgan</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Bekor qilingan</Badge>;
      case 'overdue':
        return <Badge className="bg-purple-100 text-purple-800">Muddati o'tgan</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'low':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">Past</Badge>;
      case 'medium':
        return <Badge variant="outline" className="bg-green-50 text-green-700">O'rta</Badge>;
      case 'high':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700">Yuqori</Badge>;
      case 'urgent':
        return <Badge variant="outline" className="bg-red-50 text-red-700">Juda muhim</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getTypeBadge = (type: TaskType) => {
    switch (type) {
      case 'feeding':
        return <Badge className="bg-green-100 text-green-800">Oziqlantirish</Badge>;
      case 'cleaning':
        return <Badge className="bg-blue-100 text-blue-800">Tozalash</Badge>;
      case 'vaccination':
        return <Badge className="bg-purple-100 text-purple-800">Vaksinatsiya</Badge>;
      case 'maintenance':
        return <Badge className="bg-amber-100 text-amber-800">Texnik xizmat</Badge>;
      case 'measurement':
        return <Badge className="bg-cyan-100 text-cyan-800">O'lchash</Badge>;
      case 'medication':
        return <Badge className="bg-pink-100 text-pink-800">Dori berish</Badge>;
      case 'other':
        return <Badge className="bg-neutral-100 text-neutral-800">Boshqa</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const totalPages = Math.ceil(totalTasks / limit);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Vazifalar boshqaruvi</h1>
          <p className="text-muted-foreground">Vazifalarni yaratish, nazorat qilish va boshqarish</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Yangi vazifa
        </Button>
      </div>

      {/* Task Tabs */}
      <Tabs defaultValue="all" value={taskTab} onValueChange={setTaskTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all" className="flex items-center">
            <ListChecks className="h-4 w-4 mr-2" />
            <span>Barcha vazifalar</span>
          </TabsTrigger>
          <TabsTrigger value="my" className="flex items-center">
            <ClipboardList className="h-4 w-4 mr-2" />
            <span>Mening vazifalarim</span>
          </TabsTrigger>
          <TabsTrigger value="overdue" className="flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            <span>Muddati o'tgan</span>
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center">
            <Check className="h-4 w-4 mr-2" />
            <span>Bajarilgan</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <div className="flex items-center">
              <Clock className="mr-2 h-4 w-4" />
              <span>Holat</span>
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha holatlar</SelectItem>
            <SelectItem value="pending">Kutilmoqda</SelectItem>
            <SelectItem value="in_progress">Bajarilmoqda</SelectItem>
            <SelectItem value="completed">Bajarilgan</SelectItem>
            <SelectItem value="cancelled">Bekor qilingan</SelectItem>
            <SelectItem value="overdue">Muddati o'tgan</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger>
            <div className="flex items-center">
              <Tag className="mr-2 h-4 w-4" />
              <span>Tur</span>
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha turlar</SelectItem>
            <SelectItem value="feeding">Oziqlantirish</SelectItem>
            <SelectItem value="cleaning">Tozalash</SelectItem>
            <SelectItem value="vaccination">Vaksinatsiya</SelectItem>
            <SelectItem value="maintenance">Texnik xizmat</SelectItem>
            <SelectItem value="measurement">O'lchash</SelectItem>
            <SelectItem value="medication">Dori berish</SelectItem>
            <SelectItem value="other">Boshqa</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger>
            <div className="flex items-center">
              <Star className="mr-2 h-4 w-4" />
              <span>Muhimlik</span>
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha muhimliklar</SelectItem>
            <SelectItem value="low">Past</SelectItem>
            <SelectItem value="medium">O'rta</SelectItem>
            <SelectItem value="high">Yuqori</SelectItem>
            <SelectItem value="urgent">Juda muhim</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sectionFilter} onValueChange={setSectionFilter}>
          <SelectTrigger>
            <div className="flex items-center">
              <Building2 className="mr-2 h-4 w-4" />
              <span>Sex</span>
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha sexlar</SelectItem>
            {sections.map((section) => (
              <SelectItem key={section.id} value={section.id}>
                {section.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sarlavha</TableHead>
              <TableHead>Tur</TableHead>
              <TableHead>Muhimlik</TableHead>
              <TableHead>Holat</TableHead>
              <TableHead>Mas'ullar</TableHead>
              <TableHead>Muddati</TableHead>
              <TableHead className="text-right">Amallar</TableHead>
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
                      <div className="h-5 w-20 bg-gray-200 rounded animate-pulse"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="h-8 w-20 bg-gray-200 rounded animate-pulse ml-auto"></div>
                    </TableCell>
                  </TableRow>
                ))}
              </>
            ) : tasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <ClipboardList className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Vazifalar topilmadi</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              tasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">{task.title}</TableCell>
                  <TableCell>{getTypeBadge(task.type)}</TableCell>
                  <TableCell>{getPriorityBadge(task.priority)}</TableCell>
                  <TableCell>{getStatusBadge(task.status)}</TableCell>
                  <TableCell>
                    <div className="flex -space-x-2">
                      {task.assignedTo.slice(0, 3).map((user, index) => (
                        <div key={index} className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white text-xs ring-2 ring-background">
                          {user.name.charAt(0)}
                        </div>
                      ))}
                      {task.assignedTo.length > 3 && (
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs ring-2 ring-background">
                          +{task.assignedTo.length - 3}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(task.dueDate).toLocaleDateString('uz-UZ')}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewTask(task.id)}
                    >
                      Ko'rish
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            {[...Array(totalPages)].map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink
                  isActive={currentPage === i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev))}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Create Task Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yangi vazifa yaratish</DialogTitle>
            <DialogDescription>
              Yangi vazifa yaratish uchun quyidagi formani to'ldiring
            </DialogDescription>
          </DialogHeader>
          <CreateTaskForm
            onSuccess={handleCreateSuccess}
            onCancel={() => setShowCreateModal(false)}
            sections={sections}
            employees={employees}
            batches={batches}
          />
        </DialogContent>
      </Dialog>

      {/* Task Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <ClipboardList className="mr-2 h-5 w-5" />
              Vazifa ma'lumotlari
            </DialogTitle>
          </DialogHeader>
          {selectedTask && (
            <TaskDetails
              taskId={selectedTask}
              onClose={() => setShowDetailsModal(false)}
              onUpdateStatus={handleUpdateSuccess}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TasksPage;