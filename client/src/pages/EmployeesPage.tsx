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
import { format } from 'date-fns';
import { useDispatch, useSelector } from 'react-redux';

import { EmployeeService, User, Position } from '@/services/EmployeeService';
import { SectionService, Section } from '@/services/SectionService';
import { WebSocketService, WebSocketEventType } from '@/services/WebSocketService';
import { fetchAllEmployees, selectAllEmployees, selectEmployeesLoading, selectEmployeesTotal, selectFilteredEmployees } from '@/redux/slices/employeesSlice';
import { AppDispatch } from '@/redux/store';

// Xodim yaratish uchun forma sxemasi
const createUserSchema = z.object({
  name: z.string().min(3, { message: "Ism kamida 3 ta belgidan iborat bo'lishi kerak" }),
  phoneNumber: z.string().min(9, { message: "Telefon raqami noto'g'ri formatda" }).max(13),
  role: z.string().default("worker"),
  positionId: z.string().optional(),
  sections: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
});

// Xodimni yangilash uchun forma sxemasi
const updateUserSchema = z.object({
  name: z.string().min(3, { message: "Ism kamida 3 ta belgidan iborat bo'lishi kerak" }),
  positionId: z.string().optional(),
  sections: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
});

// Xodim yaratish forma komponenti
interface CreateEmployeeFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  positions: Position[];
  sections: Section[];
}

const CreateEmployeeForm = ({ onSuccess, onCancel, positions, sections }: CreateEmployeeFormProps) => {
  const form = useForm<z.infer<typeof createUserSchema>>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: "",
      phoneNumber: "",
      role: "worker",
      isActive: true,
      sections: [],
    },
  });

  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (values: z.infer<typeof createUserSchema>) => {
    try {
      setIsSubmitting(true);
      await EmployeeService.createEmployee(values);
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Xatolik",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Endi rollar kerak emas - lavozimlar orqali aniqlanadi

  const showPositionField = form.watch("role") !== "owner";
  const showSectionsField = form.watch("role") === "worker" || form.watch("role") === "veterinarian" || form.watch("role") === "cook";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>F.I.SH.</FormLabel>
              <FormControl>
                <Input placeholder="Ism Familiya" {...field} />
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
              <FormDescription>
                Telefon raqami orqali kirish parolini olish mumkin bo'ladi.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />



        {showPositionField && (
          <FormField
            control={form.control}
            name="positionId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lavozim</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Lavozimni tanlang" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {positions && positions.length > 0 ? (
                      positions.map((position) => (
                        <SelectItem key={position.id} value={position.id}>
                          {position.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-positions" disabled>Lavozimlar mavjud emas</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {showSectionsField && (
          <FormField
            control={form.control}
            name="sections"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sexlar</FormLabel>
                <div className="grid grid-cols-2 gap-2 border rounded-md p-3">
                  {sections && sections.length > 0 ? (
                    sections.map((section) => (
                      <div key={section.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`section-${section.id}`}
                          checked={field.value?.includes(section.id)}
                          onCheckedChange={(checked) => {
                            const updatedSections = checked
                              ? [...(field.value || []), section.id]
                              : (field.value || []).filter((id) => id !== section.id);
                            field.onChange(updatedSections);
                          }}
                        />
                        <Label htmlFor={`section-${section.id}`}>{section.name}</Label>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 text-center py-2 text-muted-foreground">
                      Sexlar mavjud emas
                    </div>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

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
                  Agar belgilansa, xodim tizimga kirishi mumkin bo'ladi
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button variant="outline" type="button" onClick={onCancel}>
            Bekor qilish
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            )}
            Saqlash
          </Button>
        </div>
      </form>
    </Form>
  );
};

// Xodimni yangilash forma komponenti
interface UpdateEmployeeFormProps {
  user: User;
  onSuccess: () => void;
  onCancel: () => void;
  positions: Position[];
  sections: Section[];
}

const UpdateEmployeeForm = ({ user, onSuccess, onCancel, positions, sections }: UpdateEmployeeFormProps) => {
  const form = useForm<z.infer<typeof updateUserSchema>>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      name: user.name,
      positionId: user.position?.id,
      sections: user.sections?.map(s => s.id) || [],
      isActive: user.isActive,
    },
  });

  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (values: z.infer<typeof updateUserSchema>) => {
    try {
      setIsSubmitting(true);
      await EmployeeService.updateEmployee(user.id, values);
      onSuccess();
      toast({
        title: "Muvaffaqiyatli",
        description: "Xodim ma'lumotlari yangilandi",
      });
    } catch (error: any) {
      toast({
        title: "Xatolik",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const showSectionsField = user.role === "worker" || user.role === "veterinarian" || user.role === "cook";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

        {user.role !== "owner" && (
          <FormField
            control={form.control}
            name="positionId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lavozim</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Lavozimni tanlang" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {positions && positions.length > 0 ? (
                      positions.map((position) => (
                        <SelectItem key={position.id} value={position.id}>
                          {position.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-positions" disabled>Lavozimlar mavjud emas</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {showSectionsField && (
          <FormField
            control={form.control}
            name="sections"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sexlar</FormLabel>
                <div className="grid grid-cols-2 gap-2 border rounded-md p-3">
                  {sections && sections.length > 0 ? (
                    sections.map((section) => (
                      <div key={section.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`section-update-${section.id}`}
                          checked={field.value?.includes(section.id)}
                          onCheckedChange={(checked) => {
                            const updatedSections = checked
                              ? [...(field.value || []), section.id]
                              : (field.value || []).filter((id) => id !== section.id);
                            field.onChange(updatedSections);
                          }}
                        />
                        <Label htmlFor={`section-update-${section.id}`}>{section.name}</Label>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 text-center py-2 text-muted-foreground">
                      Sexlar mavjud emas
                    </div>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

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
                  Agar belgilansa, xodim tizimga kirishi mumkin bo'ladi
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button variant="outline" type="button" onClick={onCancel}>
            Bekor qilish
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            )}
            Saqlash
          </Button>
        </div>
      </form>
    </Form>
  );
};

// Xodim ma'lumotlarini ko'rish komponenti
interface EmployeeDetailsProps {
  userId: string;
  onClose: () => void;
  onUpdate: () => void;
}

const EmployeeDetails = ({ userId, onClose, onUpdate }: EmployeeDetailsProps) => {
  const [employee, setEmployee] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);
  const { toast } = useToast();
  const [positions, setPositions] = useState<Position[]>([]);
  const [sections, setSections] = useState<Section[]>([]);

  const fetchEmployee = async () => {
    try {
      setLoading(true);
      const response = await EmployeeService.getEmployee(userId);
      setEmployee(response.user);
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

  const fetchPositionsAndSections = async () => {
    try {
      const [positionsResponse, sectionsResponse] = await Promise.all([
        EmployeeService.getAllPositions(),
        SectionService.getAllSections()
      ]);

      setPositions(positionsResponse?.positions || []);
      setSections(sectionsResponse?.sections || []);
    } catch (error: any) {
      toast({
        title: "Ma'lumotlarni yuklashda xatolik",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchEmployee();
    fetchPositionsAndSections();
  }, [userId]);

  const handleUpdateSuccess = () => {
    setShowEditForm(false);
    fetchEmployee();
    onUpdate();
  };

  const handleDelete = async () => {
    if (!employee) return;
    if (!confirm(`${employee.name} xodimini o'chirishni tasdiqlaysizmi?`)) return;

    try {
      await EmployeeService.deleteEmployee(employee.id);
      toast({
        title: "Muvaffaqiyatli",
        description: "Xodim o'chirildi",
      });
      onClose();
      onUpdate();
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
      <div className="flex justify-center items-center py-10">
        <RefreshCw className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center p-6">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold">Xodim topilmadi</h3>
        <p className="text-muted-foreground mt-2">Ushbu ma'lumotlar topilmadi yoki o'chirilgan bo'lishi mumkin</p>
        <Button onClick={onClose} variant="outline" className="mt-6">
          Yopish
        </Button>
      </div>
    );
  }

  if (showEditForm) {
    return (
      <div className="p-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowEditForm(false)}
          className="mb-4"
        >
          <ChevronRight className="mr-2 h-4 w-4 rotate-180" />
          Orqaga
        </Button>
        <UpdateEmployeeForm
          user={employee}
          onSuccess={handleUpdateSuccess}
          onCancel={() => setShowEditForm(false)}
          positions={positions}
          sections={sections}
        />
      </div>
    );
  }

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <UserIcon className="h-8 w-8 mr-3 text-primary" />
          <div>
            <h3 className="text-xl font-semibold">{employee.name}</h3>
            <div className="flex items-center text-sm text-muted-foreground">
              <Badge variant={employee.isActive ? "outline" : "destructive"} className="mr-2">
                {employee.isActive ? "Faol" : "Faol emas"}
              </Badge>
              {getRoleBadge(employee.role)}
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => setShowEditForm(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Tahrirlash
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            O'chirish
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Asosiy ma'lumotlar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Telefon raqami</Label>
              <div className="flex items-center mt-1">
                <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{employee.phoneNumber}</span>
              </div>
            </div>

            <div>
              <Label className="text-muted-foreground">Lavozim</Label>
              <div className="mt-1">
                {employee.position ? (
                  <Badge variant="outline">{employee.position.name}</Badge>
                ) : (
                  <span className="text-muted-foreground">Belgilanmagan</span>
                )}
              </div>
            </div>

            <div>
              <Label className="text-muted-foreground">Qo'shilgan sana</Label>
              <div className="mt-1">
                {format(new Date(employee.createdAt), 'dd.MM.yyyy')}
              </div>
            </div>
          </CardContent>
        </Card>

        {employee.role !== "owner" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sex ma'lumotlari</CardTitle>
            </CardHeader>
            <CardContent>
              {employee.sections && employee.sections.length > 0 ? (
                <div className="space-y-2">
                  {employee.sections.map((section) => (
                    <Badge key={section.id} variant="outline" className="mr-2">
                      {section.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground">Sexlar biriktirilmagan</div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {(employee.role === 'manager' || employee.role === 'boss') && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Bo'ysunuvchi xodimlar</CardTitle>
            <CardDescription>Bu xodimga biriktirilgan ishchilar</CardDescription>
          </CardHeader>
          <CardContent>
            {employee.subordinates && employee.subordinates.length > 0 ? (
              <div className="space-y-2">
                {employee.subordinates.map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between p-2 border rounded-md">
                    <div className="flex items-center">
                      <UserIcon className="h-4 w-4 mr-2" />
                      <span>{sub.name}</span>
                    </div>
                    <Badge variant="outline">{sub.role}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground">Bo'ysunuvchi xodimlar mavjud emas</div>
            )}
          </CardContent>
        </Card>
      )}

      {employee.role === 'worker' && employee.supervisor && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Menejer ma'lumotlari</CardTitle>
            <CardDescription>Bu xodimga biriktirilgan menejer</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center p-2 border rounded-md">
              <UserIcon className="h-4 w-4 mr-2" />
              <span>{employee.supervisor.name}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Asosiy sahifa komponenti
const EmployeesPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const allEmployees = useSelector(selectAllEmployees);
  const loading = useSelector(selectEmployeesLoading);
  const totalEmployeesCount = useSelector(selectEmployeesTotal);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [positionFilter, setPositionFilter] = useState("all");
  const [positionTypeFilter, setPositionTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [positions, setPositions] = useState<Position[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const { toast } = useToast();
  const limit = 10;

  // Serverdan xodimlarni bir marta olish uchun
  const fetchAllEmployeesFromRedux = async () => {
    try {
      await dispatch(fetchAllEmployees());
    } catch (error: any) {
      toast({
        title: "Xodimlarni yuklashda xatolik",
        description: error.message,
        variant: "destructive",
      });
    }
  };
  
  // Filtrlangan xodimlarni Redux state'dan olish
  const filteredEmployees = useSelector((state: RootState) => 
    selectFilteredEmployees(state, { 
      searchQuery, 
      positionFilter, 
      positionTypeFilter, 
      statusFilter, 
      sectionFilter 
    })
  );
  
  // Sahifalashtirish uchun joriy sahifa xodimlari
  const paginatedEmployees = (() => {
    const startIndex = (currentPage - 1) * limit;
    const endIndex = startIndex + limit;
    return filteredEmployees.slice(startIndex, endIndex);
  })();
  


  const fetchPositionsAndSections = async () => {
    try {
      const [positionsResponse, sectionsResponse] = await Promise.all([
        EmployeeService.getAllPositions(),
        SectionService.getAllSections()
      ]);

      setPositions(positionsResponse?.positions || []);
      setSections(sectionsResponse?.sections || []);
    } catch (error: any) {
      toast({
        title: "Ma'lumotlarni yuklashda xatolik",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Birinchi render vaqtida xodimlarni fetch qilamiz
  useEffect(() => {
    fetchAllEmployeesFromRedux();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Qidiruv vaqtida birinchi sahifaga qaytarish
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [searchQuery, positionFilter, positionTypeFilter, statusFilter, sectionFilter]);

  useEffect(() => {
    fetchPositionsAndSections();
  }, []);

  // WebSocket handlers for real-time updates
  useEffect(() => {
    const handleUserCreated = () => {
      // Yangi xodim yaratilganda Reduxdan yangilash
      fetchAllEmployeesFromRedux();
      toast({
        title: "Yangi xodim qo'shildi",
        description: "Yangi xodim tizimga qo'shildi",
      });
    };

    const handleUserUpdated = () => {
      // Xodim o'zgartirilganda Reduxdan yangilash
      fetchAllEmployeesFromRedux();
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
    fetchAllEmployeesFromRedux();
    toast({
      title: "Muvaffaqiyatli",
      description: "Yangi xodim yaratildi",
    });
  };

  const handleUpdateSuccess = () => {
    fetchAllEmployeesFromRedux();
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

  // Jami sahifalar soni
  const totalPages = Math.ceil(filteredEmployees.length / limit);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Xodimlar boshqaruvi</h1>
          <p className="text-muted-foreground">Xodimlarni boshqarish va nazorat qilish</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Yangi ishchi qo'shish
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

        <Select value={positionFilter} onValueChange={setPositionFilter}>
          <SelectTrigger>
            <div className="flex items-center">
              <Briefcase className="mr-2 h-4 w-4" />
              <span>Lavozim bo'yicha</span>
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha lavozimlar</SelectItem>
            {positions && positions.length > 0 ? positions.map((position) => (
              <SelectItem key={position.id} value={position.id}>
                {position.name}
              </SelectItem>
            )) : <SelectItem value="no-positions" disabled>Lavozimlar mavjud emas</SelectItem>}
          </SelectContent>
        </Select>

        <Select value={positionTypeFilter} onValueChange={setPositionTypeFilter}>
          <SelectTrigger>
            <div className="flex items-center">
              <ShieldCheck className="mr-2 h-4 w-4" />
              <span>Lavozim turi</span>
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha turlar</SelectItem>
            <SelectItem value="MANAGEMENT">Boshqaruv</SelectItem>
            <SelectItem value="WORKER">Ishchi</SelectItem>
            <SelectItem value="SPECIALIST">Mutaxassis</SelectItem>
            <SelectItem value="TECHNICAL">Texnik xodim</SelectItem>
            <SelectItem value="PRODUCTION">Ishlab chiqarish</SelectItem>
            <SelectItem value="VETERINARY">Veterinariya</SelectItem>
            <SelectItem value="FINANCE">Moliya</SelectItem>
            <SelectItem value="COOKING">Oshxona</SelectItem>
            <SelectItem value="SERVICE">Yordam xizmati</SelectItem>
            <SelectItem value="OTHER">Boshqa</SelectItem>
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
            ) : paginatedEmployees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <UserIcon className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Xodimlar topilmadi</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedEmployees.map((employee) => (
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
            <DialogTitle>Yangi ishchi qo'shish</DialogTitle>
            <DialogDescription>
              Ishchi ma'lumotlarini kiriting. Yaratilgandan so'ng SMS orqali kirish kodi yuboriladi.
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