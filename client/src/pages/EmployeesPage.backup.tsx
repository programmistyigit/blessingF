import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
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
  User as UserIcon,
  UserPlus,
  UserMinus,
  UserCheck,
  Building2,
  Phone,
  Save,
  Trash2,
  Edit,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Filter,
  RefreshCw,
  Briefcase,
  CalendarRange,
  ChevronRight,
  ShieldCheck,
  Users
} from 'lucide-react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { EmployeeService, Position } from '@/services/EmployeeService';
import type { User } from '@/services/EmployeeService';
import { SectionService, Section } from '@/services/SectionService';
import { WebSocketService, WebSocketEventType } from '@/services/WebSocketService';
import { useAppDispatch } from '@/redux/hooks';

// Schema for creating new employee
const createEmployeeSchema = z.object({
  name: z.string().min(3, "Ism kamida 3 ta belgidan iborat bo'lishi kerak"),
  phoneNumber: z.string().min(9, "Telefon raqami kamida 9 ta belgidan iborat bo'lishi kerak"),
  role: z.enum(["boss", "manager", "worker", "veterinarian", "cook"], {
    required_error: "Rolni tanlash shart",
  }),
  positionId: z.string().optional(),
  sections: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
});

// Schema for updating employee
const updateEmployeeSchema = z.object({
  name: z.string().min(3, "Ism kamida 3 ta belgidan iborat bo'lishi kerak"),
  positionId: z.string().optional(),
  sections: z.array(z.string()).optional(),
  isActive: z.boolean(),
});

// Component for creating a new employee
interface CreateEmployeeFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  positions: Position[];
  sections: Section[];
}

const CreateEmployeeForm = ({ onSuccess, onCancel, positions, sections }: CreateEmployeeFormProps) => {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof createEmployeeSchema>>({
    resolver: zodResolver(createEmployeeSchema),
    defaultValues: {
      name: "",
      phoneNumber: "+998",
      role: "worker",
      isActive: true,
      sections: [],
    },
  });

  const onSubmit = async (values: z.infer<typeof createEmployeeSchema>) => {
    try {
      await EmployeeService.createEmployee(values);
      toast({
        title: "Xodim yaratildi",
        description: "Yangi xodim muvaffaqiyatli yaratildi",
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
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>F.I.SH.</FormLabel>
                <FormControl>
                  <Input placeholder="Familiya Ism Sharif" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefon raqami</FormLabel>
                <FormControl>
                  <Input placeholder="+998901234567" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Roli</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Rolni tanlang" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="boss">Bo'lim boshlig'i</SelectItem>
                    <SelectItem value="manager">Menejer</SelectItem>
                    <SelectItem value="worker">Ishchi</SelectItem>
                    <SelectItem value="veterinarian">Veterinar</SelectItem>
                    <SelectItem value="cook">Oshpaz</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="positionId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lavozimi</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Lavozimni tanlang" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {positions.map((position) => (
                      <SelectItem key={position.id} value={position.id}>
                        {position.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="sections"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sexlar</FormLabel>
              <div className="grid grid-cols-3 gap-2 border rounded-md p-3">
                {sections.map((section) => (
                  <div key={section.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`section-${section.id}`}
                      checked={field.value?.includes(section.id)}
                      onCheckedChange={(checked) => {
                        const currentValues = field.value || [];
                        if (checked) {
                          field.onChange([...currentValues, section.id]);
                        } else {
                          field.onChange(
                            currentValues.filter((value) => value !== section.id)
                          );
                        }
                      }}
                    />
                    <label
                      htmlFor={`section-${section.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {section.name}
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
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Faol holat</FormLabel>
                <FormDescription>
                  Xodim faol holatda bo'lsa, tizimga kirishi va vazifalarni bajarishi mumkin
                </FormDescription>
              </div>
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

// Component for updating employee
interface UpdateEmployeeFormProps {
  user: User;
  onSuccess: () => void;
  onCancel: () => void;
  positions: Position[];
  sections: Section[];
}

const UpdateEmployeeForm = ({ user, onSuccess, onCancel, positions, sections }: UpdateEmployeeFormProps) => {
  const { toast } = useToast();
  
  // Prepare initial sections array from user.sections
  const initialSections = user.sections ? user.sections.map(section => section.id) : [];
  
  const form = useForm<z.infer<typeof updateEmployeeSchema>>({
    resolver: zodResolver(updateEmployeeSchema),
    defaultValues: {
      name: user.name,
      positionId: user.position?.id,
      sections: initialSections,
      isActive: user.isActive,
    },
  });

  const onSubmit = async (values: z.infer<typeof updateEmployeeSchema>) => {
    try {
      await EmployeeService.updateEmployee(user.id, values);
      toast({
        title: "Xodim yangilandi",
        description: "Xodim ma'lumotlari muvaffaqiyatli yangilandi",
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

  const handleDelete = async () => {
    if (window.confirm(`Rostdan ham ${user.name} ni o'chirmoqchimisiz?`)) {
      try {
        await EmployeeService.deleteEmployee(user.id);
        toast({
          title: "Xodim o'chirildi",
          description: "Xodim muvaffaqiyatli o'chirildi",
        });
        onSuccess();
      } catch (error: any) {
        toast({
          title: "Xatolik yuz berdi",
          description: error.message,
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-medium">{user.name}</h3>
            <p className="text-sm text-muted-foreground">{user.phoneNumber}</p>
          </div>
          <Badge className={user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
            {user.isActive ? "Faol" : "Faol emas"}
          </Badge>
        </div>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>F.I.SH.</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="positionId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Lavozimi</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Lavozimni tanlang" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {positions.map((position) => (
                    <SelectItem key={position.id} value={position.id}>
                      {position.name}
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
          name="sections"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sexlar</FormLabel>
              <div className="grid grid-cols-3 gap-2 border rounded-md p-3">
                {sections.map((section) => (
                  <div key={section.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`section-update-${section.id}`}
                      checked={field.value?.includes(section.id)}
                      onCheckedChange={(checked) => {
                        const currentValues = field.value || [];
                        if (checked) {
                          field.onChange([...currentValues, section.id]);
                        } else {
                          field.onChange(
                            currentValues.filter((value) => value !== section.id)
                          );
                        }
                      }}
                    />
                    <label
                      htmlFor={`section-update-${section.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {section.name}
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
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Faol holat</FormLabel>
                <FormDescription>
                  Xodim faol holatda bo'lsa, tizimga kirishi va vazifalarni bajarishi mumkin
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <div className="flex justify-between">
          <Button variant="destructive" type="button" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            O'chirish
          </Button>
          <div className="space-x-2">
            <Button variant="outline" onClick={onCancel} type="button">
              Bekor qilish
            </Button>
            <Button type="submit">
              <Save className="h-4 w-4 mr-2" />
              Saqlash
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
};

// Component for Employee details
interface EmployeeDetailsProps {
  userId: string;
  onClose: () => void;
  onUpdate: () => void;
}

const EmployeeDetails = ({ userId, onClose, onUpdate }: EmployeeDetailsProps) => {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [subordinates, setSubordinates] = useState<{ id: string; name: string; role: string }[]>([]);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [positions, setPositions] = useState<Position[]>([]);
  const [sections, setSections] = useState<Section[]>([]);

  const fetchEmployeeDetails = async () => {
    setLoading(true);
    try {
      const response = await EmployeeService.getEmployee(userId);
      setUser(response.user);

      // If user is a manager, fetch subordinates
      if (response.user.role === 'manager' || response.user.role === 'boss') {
        try {
          const subResponse = await EmployeeService.getManagerSubordinates(userId);
          setSubordinates(subResponse.data.subordinates || []);
        } catch (error) {
          console.error("Error fetching subordinates:", error);
        }
      }
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

  const fetchPositionsAndSections = async () => {
    try {
      const [positionsResponse, sectionsResponse] = await Promise.all([
        EmployeeService.getAllPositions(),
        SectionService.getAllSections()
      ]);

      setPositions(positionsResponse.positions);
      setSections(sectionsResponse.sections);
    } catch (error: any) {
      toast({
        title: "Ma'lumotlarni yuklashda xatolik",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchEmployeeDetails();
    fetchPositionsAndSections();
  }, [userId]);

  const handleSuccessUpdate = () => {
    setShowEditModal(false);
    fetchEmployeeDetails();
    onUpdate();
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'boss':
        return "Bo'lim boshlig'i";
      case 'manager':
        return "Menejer";
      case 'worker':
        return "Ishchi";
      case 'veterinarian':
        return "Veterinar";
      case 'cook':
        return "Oshpaz";
      default:
        return role;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center">
        <p className="text-red-500">Xodim ma'lumotlarini yuklashda xatolik yuz berdi</p>
        <Button onClick={onClose} className="mt-4">Yopish</Button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold">{user.name}</h2>
            <p className="text-muted-foreground flex items-center mt-1">
              <Phone className="h-4 w-4 mr-1" />
              {user.phoneNumber}
            </p>
          </div>
          <div className="flex gap-2">
            <Badge className={`py-1 ${user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
              {user.isActive ? <CheckCircle2 className="h-4 w-4 mr-1" /> : <XCircle className="h-4 w-4 mr-1" />}
              {user.isActive ? "Faol" : "Faol emas"}
            </Badge>
            <Button size="sm" variant="outline" onClick={() => setShowEditModal(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Tahrirlash
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center">
                <UserIcon className="h-4 w-4 mr-2" />
                Asosiy ma'lumotlar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Role:</span>
                <span className="font-medium">{getRoleName(user.role)}</span>
              </div>
              {user.position && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Lavozim:</span>
                  <span className="font-medium">{user.position.name}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Yaratilgan sana:</span>
                <span className="font-medium">{new Date(user.createdAt).toLocaleDateString('uz-UZ')}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center">
                <Building2 className="h-4 w-4 mr-2" />
                Biriktirilgan sexlar
              </CardTitle>
            </CardHeader>
            <CardContent>
              {user.sections && user.sections.length > 0 ? (
                <div className="space-y-2">
                  {user.sections.map(section => (
                    <div key={section.id} className="flex items-center p-2 rounded-md border">
                      <span>{section.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sexlar biriktirilmagan</p>
              )}
            </CardContent>
          </Card>
        </div>
        
        {user.supervisor && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center">
                <UserCheck className="h-4 w-4 mr-2" />
                Rahbar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 p-2 rounded-md border">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  {user.supervisor.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium">{user.supervisor.name}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {(user.role === 'manager' || user.role === 'boss') && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Bo'ysunuvchi xodimlar
              </CardTitle>
            </CardHeader>
            <CardContent>
              {subordinates.length > 0 ? (
                <div className="space-y-2">
                  {subordinates.map(sub => (
                    <div key={sub.id} className="flex items-center justify-between p-2 rounded-md border">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          {sub.name.charAt(0)}
                        </div>
                        <span>{sub.name}</span>
                      </div>
                      <Badge variant="outline">{getRoleName(sub.role)}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Bo'ysunuvchi xodimlar yo'q</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Xodimni tahrirlash</DialogTitle>
            <DialogDescription>
              Xodimning ma'lumotlarini yangilang
            </DialogDescription>
          </DialogHeader>
          {user && (
            <UpdateEmployeeForm
              user={user}
              positions={positions}
              sections={sections}
              onSuccess={handleSuccessUpdate}
              onCancel={() => setShowEditModal(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

// Main component
const EmployeesPage = () => {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<User[]>([]);
  const [totalEmployees, setTotalEmployees] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [sectionFilter, setSectionFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  
  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        limit,
      };
      
      if (searchQuery) {
        params.query = searchQuery;
      }
      
      if (roleFilter !== 'all') {
        params.role = roleFilter;
      }
      
      if (statusFilter !== 'all') {
        params.isActive = statusFilter === 'active';
      }
      
      if (sectionFilter) {
        params.section = sectionFilter;
      }
      
      const response = await EmployeeService.getAllEmployees(params);
      if (response && response.users) {
        // API response eski formatda (users field bilan)
        setEmployees(response.users);
        setTotalEmployees(response.total || 0);
      } else if (response && response.data) {
        // API response yangi formatda (data field bilan)
        setEmployees(response.data);
        setTotalEmployees(response.data.length || 0);
      } else {
        // Bo'sh ma'lumot
        setEmployees([]);
        setTotalEmployees(0);
      }
    } catch (error: any) {
      toast({
        title: "Xodimlarni yuklashda xatolik",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPositionsAndSections = async () => {
    try {
      const [positionsResponse, sectionsResponse] = await Promise.all([
        EmployeeService.getAllPositions(),
        SectionService.getAllSections()
      ]);

      setPositions(positionsResponse.positions);
      setSections(sectionsResponse.sections);
    } catch (error: any) {
      toast({
        title: "Ma'lumotlarni yuklashda xatolik",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [currentPage, roleFilter, statusFilter, sectionFilter]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (currentPage === 1) {
        fetchEmployees();
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  useEffect(() => {
    fetchPositionsAndSections();
  }, []);

  // WebSocket handlers for real-time updates
  useEffect(() => {
    const handleUserCreated = () => {
      fetchEmployees();
      toast({
        title: "Yangi xodim qo'shildi",
        description: "Yangi xodim tizimga qo'shildi",
      });
    };

    const handleUserUpdated = () => {
      fetchEmployees();
      if (selectedEmployee) {
        // If we are viewing an employee, refresh their data
        setShowDetailsModal(true);
      }
    };

    // Subscribe to WebSocket events
    WebSocketService.on(WebSocketEventType.USER_CREATED, handleUserCreated);
    WebSocketService.on(WebSocketEventType.USER_UPDATED, handleUserUpdated);

    // Cleanup on unmount
    return () => {
      WebSocketService.off(WebSocketEventType.USER_CREATED, handleUserCreated);
      WebSocketService.off(WebSocketEventType.USER_UPDATED, handleUserUpdated);
    };
  }, [selectedEmployee]);

  const handleViewEmployee = (id: string) => {
    setSelectedEmployee(id);
    setShowDetailsModal(true);
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    fetchEmployees();
    toast({
      title: "Muvaffaqiyatli",
      description: "Yangi xodim yaratildi",
    });
  };

  const handleUpdateSuccess = () => {
    fetchEmployees();
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'boss':
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Bo'lim boshlig'i</Badge>;
      case 'manager':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Menejer</Badge>;
      case 'worker':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Ishchi</Badge>;
      case 'veterinarian':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Veterinar</Badge>;
      case 'cook':
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Oshpaz</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge variant="outline" className="bg-green-50 text-green-700">Faol</Badge>
    ) : (
      <Badge variant="outline" className="bg-red-50 text-red-700">Faol emas</Badge>
    );
  };

  const totalPages = Math.ceil(totalEmployees / limit);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Xodimlar boshqaruvi</h1>
          <p className="text-muted-foreground">Xodimlarni boshqarish va nazorat qilish</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Yangi xodim
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>

        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger>
            <div className="flex items-center">
              <Briefcase className="mr-2 h-4 w-4" />
              <span>Rol bo'yicha</span>
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha rollar</SelectItem>
            <SelectItem value="boss">Bo'lim boshlig'i</SelectItem>
            <SelectItem value="manager">Menejer</SelectItem>
            <SelectItem value="worker">Ishchi</SelectItem>
            <SelectItem value="veterinarian">Veterinar</SelectItem>
            <SelectItem value="cook">Oshpaz</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <div className="flex items-center">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              <span>Holat bo'yicha</span>
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barchasi</SelectItem>
            <SelectItem value="active">Faol</SelectItem>
            <SelectItem value="inactive">Faol emas</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sectionFilter} onValueChange={setSectionFilter}>
          <SelectTrigger>
            <div className="flex items-center">
              <Building2 className="mr-2 h-4 w-4" />
              <span>Sex bo'yicha</span>
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha sexlar</SelectItem>
            {sections && sections.length > 0 ? sections.map((section) => (
              <SelectItem key={section.id} value={section.id}>
                {section.name}
              </SelectItem>
            )) : <SelectItem value="no-sections" disabled>Ma'lumotlar mavjud emas</SelectItem>}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>F.I.SH.</TableHead>
              <TableHead>Telefon</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Lavozim</TableHead>
              <TableHead>Holat</TableHead>
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
                      <div className="h-5 w-20 bg-gray-200 rounded animate-pulse"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-5 w-16 bg-gray-200 rounded animate-pulse"></div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="h-8 w-20 bg-gray-200 rounded animate-pulse ml-auto"></div>
                    </TableCell>
                  </TableRow>
                ))}
              </>
            ) : employees && employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <UserIcon className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Xodimlar topilmadi</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              employees && employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">{employee.name}</TableCell>
                  <TableCell>{employee.phoneNumber}</TableCell>
                  <TableCell>{getRoleBadge(employee.role)}</TableCell>
                  <TableCell>{employee.position?.name || "-"}</TableCell>
                  <TableCell>{getStatusBadge(employee.isActive)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewEmployee(employee.id)}
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

      {/* Create Employee Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yangi xodim yaratish</DialogTitle>
            <DialogDescription>
              Xodim ma'lumotlarini kiriting. Yaratilgandan so'ng SMS orqali kirish kodi yuboriladi.
            </DialogDescription>
          </DialogHeader>
          <CreateEmployeeForm
            onSuccess={handleCreateSuccess}
            onCancel={() => setShowCreateModal(false)}
            positions={positions}
            sections={sections}
          />
        </DialogContent>
      </Dialog>

      {/* Employee Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <UserIcon className="mr-2 h-5 w-5" />
              Xodim ma'lumotlari
            </DialogTitle>
          </DialogHeader>
          {selectedEmployee && (
            <EmployeeDetails
              userId={selectedEmployee}
              onClose={() => setShowDetailsModal(false)}
              onUpdate={handleUpdateSuccess}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeesPage;