import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
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
  Edit,
  Trash2,
  Shield,
  Settings,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  Save
} from 'lucide-react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { EmployeeService, Position } from '@/services/EmployeeService';

// Predefined permissions list
const AVAILABLE_PERMISSIONS = [
  // User management permissions
  { id: "manage_users", name: "Xodimlarni boshqarish", description: "Xodimlarni qo'shish, o'zgartirish va o'chirish", category: "user" },
  { id: "view_users", name: "Xodimlarni ko'rish", description: "Barcha xodimlar ro'yxatini ko'rish", category: "user" },
  { id: "assign_WORKERs", name: "Ishchilarni biriktirish", description: "Ishchilarni menejerlarga biriktirish", category: "user" },
  
  // Section management permissions
  { id: "manage_sections", name: "Sexlarni boshqarish", description: "Sexlarni qo'shish, o'zgartirish va o'chirish", category: "section" },
  { id: "view_sections", name: "Sexlarni ko'rish", description: "Barcha sexlar ro'yxatini ko'rish", category: "section" },
  { id: "update_section_status", name: "Sex statusini o'zgartirish", description: "Sex statusini o'zgartirish", category: "section" },
  
  // Batch management permissions
  { id: "manage_batches", name: "Partiyalarni boshqarish", description: "Partiyalarni qo'shish, o'zgartirish va o'chirish", category: "batch" },
  { id: "view_batches", name: "Partiyalarni ko'rish", description: "Barcha partiyalar ro'yxatini ko'rish", category: "batch" },
  { id: "update_batch_status", name: "Partiya statusini o'zgartirish", description: "Partiya statusini o'zgartirish", category: "batch" },
  
  // Task management permissions
  { id: "manage_tasks", name: "Vazifalarni boshqarish", description: "Vazifalarni yaratish, o'zgartirish va o'chirish", category: "task" },
  { id: "view_tasks", name: "Vazifalarni ko'rish", description: "Barcha vazifalar ro'yxatini ko'rish", category: "task" },
  { id: "update_task_status", name: "Vazifa statusini o'zgartirish", description: "Vazifa statusini o'zgartirish", category: "task" },
  
  // Inventory management permissions
  { id: "manage_inventory", name: "Inventarni boshqarish", description: "Inventar elementlarini qo'shish, o'zgartirish va o'chirish", category: "inventory" },
  { id: "view_inventory", name: "Inventarni ko'rish", description: "Barcha inventar elementlarini ko'rish", category: "inventory" },
  
  // Report management permissions
  { id: "manage_reports", name: "Hisobotlarni boshqarish", description: "Hisobotlarni yaratish va o'zgartirish", category: "report" },
  { id: "view_reports", name: "Hisobotlarni ko'rish", description: "Barcha hisobotlarni ko'rish", category: "report" },
  { id: "export_reports", name: "Hisobotlarni eksport qilish", description: "Hisobotlarni PDF va EXCEL formatlarida eksport qilish", category: "report" },
  
  // Attendance management permissions
  { id: "manage_attendance", name: "Yo'qlamani boshqarish", description: "Yo'qlama vazifalarini yaratish va natijalarini kiritish", category: "attendance" },
  { id: "view_attendance", name: "Yo'qlamani ko'rish", description: "Yo'qlama natijalarini ko'rish", category: "attendance" },
  
  // Canteen management permissions
  { id: "manage_menu", name: "Menyu boshqarish", description: "Kunlik menyuni yaratish va o'zgartirish", category: "canteen" },
  { id: "view_menu", name: "Menyuni ko'rish", description: "Kunlik menyuni ko'rish", category: "canteen" },
];

// Position form schema
const positionSchema = z.object({
  name: z.string().min(3, "Lavozim nomi kamida 3 ta belgidan iborat bo'lishi kerak"),
  type: z.enum(["MANAGEMENT", "WORKER", "SPECIALIST", "TECHNICAL", "PRODUCTION", "VETERINARY", "FINANCE", "COOKING", "SERVICE", "OTHER"], {
    required_error: "Lavozim turini tanlash shart",
  }),
  permissions: z.array(z.string())
    .min(1, "Kamida bitta ruxsat tanlash kerak"),
});

// Create position form component
interface CreatePositionFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const CreatePositionForm = ({ onSuccess, onCancel }: CreatePositionFormProps) => {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof positionSchema>>({
    resolver: zodResolver(positionSchema),
    defaultValues: {
      name: "",
      type: "WORKER",
      permissions: [],
    },
  });

  const onSubmit = async (values: z.infer<typeof positionSchema>) => {
    try {
      await EmployeeService.createPosition({...values, type: values.type.toLowerCase()});
      toast({
        title: "Lavozim yaratildi",
        description: "Yangi lavozim muvaffaqiyatli yaratildi",
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

  const permissionCategories = AVAILABLE_PERMISSIONS.reduce<{[key: string]: typeof AVAILABLE_PERMISSIONS}>((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {});

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lavozim nomi</FormLabel>
                <FormControl>
                  <Input placeholder="Masalan: Senior Menejer" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lavozim turi</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Turni tanlang" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
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
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="permissions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ruxsatlar</FormLabel>
              <FormDescription>
                Ushbu lavozimga tegishli bo'lgan huquqlarni tanlang
              </FormDescription>
              
              <div className="space-y-4 mt-2">
                {Object.entries(permissionCategories).map(([category, permissions]) => (
                  <Card key={category}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base capitalize">{getCategoryName(category)}</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-3">
                      {permissions.map((permission) => (
                        <div key={permission.id} className="flex items-start space-x-2">
                          <Checkbox
                            id={`permission-${permission.id}`}
                            checked={field.value?.includes(permission.id)}
                            onCheckedChange={(checked) => {
                              const currentValues = field.value || [];
                              if (checked) {
                                field.onChange([...currentValues, permission.id]);
                              } else {
                                field.onChange(
                                  currentValues.filter((value) => value !== permission.id)
                                );
                              }
                            }}
                          />
                          <div className="grid gap-0.5">
                            <label
                              htmlFor={`permission-${permission.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {permission.name}
                            </label>
                            <p className="text-xs text-muted-foreground">
                              {permission.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
              
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

// Edit position form component
interface EditPositionFormProps {
  position: Position;
  onSuccess: () => void;
  onCancel: () => void;
}

const EditPositionForm = ({ position, onSuccess, onCancel }: EditPositionFormProps) => {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof positionSchema>>({
    resolver: zodResolver(positionSchema),
    defaultValues: {
      name: position.name,
      type: position.type as any,
      permissions: position.permissions,
    },
  });

  const onSubmit = async (values: z.infer<typeof positionSchema>) => {
    try {
      await EmployeeService.updatePosition(position._id, values);
      toast({
        title: "Lavozim yangilandi",
        description: "Lavozim ma'lumotlari muvaffaqiyatli yangilandi",
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
    if (window.confirm(`Rostdan ham "${position.name}" lavozimini o'chirmoqchimisiz?`)) {
      try {
        await EmployeeService.deletePosition(position._id);
        toast({
          title: "Lavozim o'chirildi",
          description: "Lavozim muvaffaqiyatli o'chirildi",
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

  const permissionCategories = AVAILABLE_PERMISSIONS.reduce<{[key: string]: typeof AVAILABLE_PERMISSIONS}>((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {});

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lavozim nomi</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lavozim turi</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Turni tanlang" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
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
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="permissions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ruxsatlar</FormLabel>
              <FormDescription>
                Ushbu lavozimga tegishli bo'lgan huquqlarni tanlang
              </FormDescription>
              
              <div className="space-y-4 mt-2">
                {Object.entries(permissionCategories).map(([category, permissions]) => (
                  <Card key={category}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base capitalize">{getCategoryName(category)}</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-3">
                      {permissions.map((permission) => (
                        <div key={permission.id} className="flex items-start space-x-2">
                          <Checkbox
                            id={`edit-permission-${permission.id}`}
                            checked={field.value?.includes(permission.id)}
                            onCheckedChange={(checked) => {
                              const currentValues = field.value || [];
                              if (checked) {
                                field.onChange([...currentValues, permission.id]);
                              } else {
                                field.onChange(
                                  currentValues.filter((value) => value !== permission.id)
                                );
                              }
                            }}
                          />
                          <div className="grid gap-0.5">
                            <label
                              htmlFor={`edit-permission-${permission.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {permission.name}
                            </label>
                            <p className="text-xs text-muted-foreground">
                              {permission.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <FormMessage />
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

// Helper function for position types
const getPositionTypeBadge = (type: string) => {
  switch (type) {
    case 'MANAGEMENT':
      return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Boshqaruv</Badge>;
    case 'WORKER':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Ishchi</Badge>;
    case 'SPECIALIST':
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Mutaxassis</Badge>;
    case 'TECHNICAL':
      return <Badge className="bg-teal-100 text-teal-800 hover:bg-teal-100">Texnik xodim</Badge>;
    case 'PRODUCTION':
      return <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-100">Ishlab chiqarish</Badge>;
    case 'VETERINARY':
      return <Badge className="bg-sky-100 text-sky-800 hover:bg-sky-100">Veterinariya</Badge>;
    case 'FINANCE':
      return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Moliya</Badge>;
    case 'COOKING':
      return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Oshxona</Badge>;  
    case 'SERVICE':
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Yordam xizmati</Badge>;
    case 'OTHER':
      return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Boshqa</Badge>;
    default:
      return <Badge variant="outline">{type}</Badge>;
  }
};

// Helper function for permission category names
const getCategoryName = (category: string) => {
  switch (category) {
    case 'user':
      return "Xodimlar boshqaruvi";
    case 'section':
      return "Sexlar boshqaruvi";
    case 'batch':
      return "Partiyalar boshqaruvi";
    case 'task':
      return "Vazifalar boshqaruvi";
    case 'inventory':
      return "Inventar boshqaruvi";
    case 'report':
      return "Hisobotlar";
    case 'attendance':
      return "Yo'qlama";
    case 'canteen':
      return "Oshxona";
    default:
      return category;
  }
};

// Helper function to add position service method if missing
EmployeeService.updatePosition = EmployeeService.updatePosition || (async (id: string, data: any) => {
  const token = getToken();
  if (!token) {
    throw new Error("Avtorizatsiya talab qilinadi");
  }

  const response = await fetch(`${baseHost}/api/positions/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Lavozimni yangilashda xatolik yuz berdi");
  }

  return await response.json();
});

EmployeeService.deletePosition = EmployeeService.deletePosition || (async (id: string) => {
  const token = getToken();
  if (!token) {
    throw new Error("Avtorizatsiya talab qilinadi");
  }

  const response = await fetch(`${baseHost}/api/positions/positions/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Lavozimni o'chirishda xatolik yuz berdi");
  }

  return await response.json();
});

// Main component
const PositionsPage = () => {
  const { toast } = useToast();
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  
  const fetchPositions = async () => {
    setLoading(true);
    try {
      const response = await EmployeeService.getAllPositions();
      let filteredPositions = response.positions;

      // Apply type filter
      if (typeFilter !== 'all') {
        filteredPositions = filteredPositions.filter(position => position.type === typeFilter);
      }

      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredPositions = filteredPositions.filter(position => 
          position.name.toLowerCase().includes(query)
        );
      }

      setPositions(filteredPositions);
    } catch (error: any) {
      toast({
        title: "Lavozimlarni yuklashda xatolik",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPositions();
  }, [typeFilter]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchPositions();
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  const handleEditPosition = (position: Position) => {
    setSelectedPosition(position);
    setShowEditModal(true);
  };

  const handleSuccess = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setSelectedPosition(null);
    fetchPositions();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Lavozimlar boshqaruvi</h1>
          <p className="text-muted-foreground">Tizim foydalanuvchilari uchun lavozimlar va huquqlarni boshqarish</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Yangi lavozim
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

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger>
            <div className="flex items-center">
              <Settings className="mr-2 h-4 w-4" />
              <span>Tur bo'yicha</span>
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
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nomi</TableHead>
              <TableHead>Turi</TableHead>
              <TableHead>Huquqlar soni</TableHead>
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
                      <div className="h-5 w-10 bg-gray-200 rounded animate-pulse"></div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="h-8 w-20 bg-gray-200 rounded animate-pulse ml-auto"></div>
                    </TableCell>
                  </TableRow>
                ))}
              </>
            ) : positions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <ShieldCheck className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Lavozimlar topilmadi</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              positions.map((position) => (
                <TableRow key={position.id}>
                  <TableCell className="font-medium">{position.name}</TableCell>
                  <TableCell>{getPositionTypeBadge(position.type)}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Shield className="h-4 w-4 text-muted-foreground mr-2" />
                      <span>{position.permissions.length}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditPosition(position)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Tahrirlash
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Position Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yangi lavozim yaratish</DialogTitle>
            <DialogDescription>
              Xodimlar uchun yangi lavozim va unga tegishli huquqlarni yarating.
            </DialogDescription>
          </DialogHeader>
          <CreatePositionForm
            onSuccess={handleSuccess}
            onCancel={() => setShowCreateModal(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Position Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Lavozimni tahrirlash</DialogTitle>
            <DialogDescription>
              {selectedPosition?.name} lavozimini tahrirlash
            </DialogDescription>
          </DialogHeader>
          {selectedPosition && (
            <EditPositionForm
              position={selectedPosition}
              onSuccess={handleSuccess}
              onCancel={() => setShowEditModal(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Helper function to get token
function getToken() {
  // This function should be imported from auth lib, but defining here for completeness
  return localStorage.getItem('token');
}

// Helper variable for API URL
const baseHost = "http://localhost:8000";

export default PositionsPage;