import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAppDispatch } from '@/redux/hooks';
import { WebSocketService, WebSocketEventType } from '@/services/WebSocketService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Factory, 
  Users, 
  PackageCheck, 
  Plus, 
  Search, 
  Filter, 
  Settings, 
  AlertTriangle, 
  Thermometer, 
  Wind, 
  Activity,
  Check,
  X,
  Edit,
  Clock,
  Ruler,
  MapPin,
  ChevronRight
} from 'lucide-react';
import { Section, SectionService } from '@/services/SectionService';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

// Section yaratish formi uchun schema
const createSectionSchema = z.object({
  name: z.string().min(3, "Nom kamida 3 ta belgidan iborat bo'lishi kerak"),
  code: z.string().min(2, "Kod kamida 2 ta belgidan iborat bo'lishi kerak"),
  type: z.enum(["growing", "breeding", "slaughter"], {
    required_error: "Sex turini tanlash shart",
  }),
  capacity: z.coerce.number().positive("Sig'im musbat son bo'lishi kerak"),
  location: z.string().min(3, "Joylashuv kamida 3 ta belgidan iborat bo'lishi kerak"),
  dimensions: z.object({
    length: z.coerce.number().positive("Uzunlik musbat son bo'lishi kerak"),
    width: z.coerce.number().positive("Kenglik musbat son bo'lishi kerak"),
    height: z.coerce.number().positive("Balandlik musbat son bo'lishi kerak"),
  }),
  ventilation: z.object({
    type: z.string().min(2, "Ventilyatsiya turi kiritilishi kerak"),
    capacity: z.string().min(2, "Ventilyatsiya quvvati kiritilishi kerak"),
  }),
  heating: z.object({
    type: z.string().min(2, "Isitish turi kiritilishi kerak"),
    temperature: z.string().min(2, "Harorat ko'rsatkich kiritilishi kerak"),
  }),
});

// Section status o'zgartirish formi uchun schema
const updateSectionStatusSchema = z.object({
  status: z.enum(["active", "inactive", "maintenance"], {
    required_error: "Statusni tanlash shart",
  }),
  notes: z.string().optional(),
});

// SEX YARATISH FORMI
interface CreateSectionFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const CreateSectionForm = ({ onSuccess, onCancel }: CreateSectionFormProps) => {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof createSectionSchema>>({
    resolver: zodResolver(createSectionSchema),
    defaultValues: {
      name: "",
      code: "",
      type: "growing",
      capacity: 1000,
      location: "",
      dimensions: {
        length: 10,
        width: 10,
        height: 3,
      },
      ventilation: {
        type: "Avtomatik",
        capacity: "2000 m³/soat",
      },
      heating: {
        type: "Elektr",
        temperature: "22-25°C",
      },
    },
  });

  const onSubmit = async (values: z.infer<typeof createSectionSchema>) => {
    try {
      await SectionService.createSection(values);
      toast({
        title: "Sex yaratildi",
        description: "Yangi sex muvaffaqiyatli yaratildi",
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
                <FormLabel>Sex nomi</FormLabel>
                <FormControl>
                  <Input placeholder="Sex #1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sex kodi</FormLabel>
                <FormControl>
                  <Input placeholder="S001" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sex turi</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sex turini tanlang" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="growing">O'stirish</SelectItem>
                    <SelectItem value="breeding">Ko'paytirish</SelectItem>
                    <SelectItem value="slaughter">So'yish</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="capacity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sig'imi</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Joylashuv</FormLabel>
                <FormControl>
                  <Input placeholder="Ferma hududi" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="dimensions.length"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Uzunlik (m)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dimensions.width"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kenglik (m)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dimensions.height"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Balandlik (m)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-4">
            <h3 className="font-medium">Ventilyatsiya</h3>
            <FormField
              control={form.control}
              name="ventilation.type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ventilyatsiya turi</FormLabel>
                  <FormControl>
                    <Input placeholder="Avtomatik" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ventilation.capacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quvvati</FormLabel>
                  <FormControl>
                    <Input placeholder="2000 m³/soat" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4">
            <h3 className="font-medium">Isitish</h3>
            <FormField
              control={form.control}
              name="heating.type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Isitish turi</FormLabel>
                  <FormControl>
                    <Input placeholder="Elektr" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="heating.temperature"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Harorat ko'rsatkichi</FormLabel>
                  <FormControl>
                    <Input placeholder="22-25°C" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

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

// STATUS O'ZGARTIRISH FORMI
interface UpdateSectionStatusProps {
  section: Section;
  onStatusUpdated: () => void;
  onCancel: () => void;
}

const UpdateSectionStatus = ({ section, onStatusUpdated, onCancel }: UpdateSectionStatusProps) => {
  const { toast } = useToast();
  const [status, setStatus] = useState<"active" | "inactive" | "maintenance">(section.status);
  const [notes, setNotes] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await SectionService.updateSectionStatus(section.id, status, notes);
      toast({
        title: "Status yangilandi",
        description: `Sex statusi muvaffaqiyatli "${status}" ga o'zgartirildi`,
      });
      onStatusUpdated();
    } catch (error: any) {
      toast({
        title: "Xatolik yuz berdi",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="status">Yangi status</Label>
        <Select 
          onValueChange={(value) => setStatus(value as "active" | "inactive" | "maintenance")} 
          defaultValue={section.status}
        >
          <SelectTrigger>
            <SelectValue placeholder="Status tanlang" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">
              <div className="flex items-center">
                <Badge variant="outline" className="bg-green-50 text-green-700 mr-2">Faol</Badge>
                <span>Sex ishi faol holatda</span>
              </div>
            </SelectItem>
            <SelectItem value="maintenance">
              <div className="flex items-center">
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 mr-2">Ta'mirlash</Badge>
                <span>Sex ta'mirlash rejimida</span>
              </div>
            </SelectItem>
            <SelectItem value="inactive">
              <div className="flex items-center">
                <Badge variant="outline" className="bg-red-50 text-red-700 mr-2">Faol emas</Badge>
                <span>Sex ishlamayapti</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Izohlar</Label>
        <Input
          id="notes"
          placeholder="Status o'zgartirish sababi"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} type="button">
          Bekor qilish
        </Button>
        <Button type="submit">Saqlash</Button>
      </div>
    </form>
  );
};

// SEX KARTOCHKASI (QISQA MA'LUMOT)
interface SectionCardProps {
  section: Section;
  onViewDetails: (section: Section) => void;
  onStatusUpdate: (section: Section) => void;
}

const SectionCard = ({ section, onViewDetails, onStatusUpdate }: SectionCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-50 text-green-700';
      case 'inactive':
        return 'bg-red-50 text-red-700';
      case 'maintenance':
        return 'bg-yellow-50 text-yellow-700';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'growing':
        return "O'stirish";
      case 'breeding':
        return "Ko'paytirish";
      case 'slaughter':
        return "So'yish";
      default:
        return type;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return "Faol";
      case 'inactive':
        return "Faol emas";
      case 'maintenance':
        return "Ta'mirlash";
      default:
        return status;
    }
  };

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-base font-medium">
            {section.name}
          </CardTitle>
          <Badge variant="outline" className={getStatusColor(section.status)}>
            {getStatusLabel(section.status)}
          </Badge>
        </div>
        <CardDescription className="flex items-center gap-1 text-sm">
          <Factory size={14} className="flex-shrink-0" />
          <span>{getTypeLabel(section.type)}</span>
          <span className="mx-1">•</span>
          <span>Kod: {section.code}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2 text-sm space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-1">
            <Users size={14} />
            <span>{section.currentCount} / {section.capacity}</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin size={14} />
            <span className="truncate">{section.location}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-1">
            <Thermometer size={14} />
            <span className="truncate">{section.heating?.type}</span>
          </div>
          <div className="flex items-center gap-1">
            <Wind size={14} />
            <span className="truncate">{section.ventilation?.type}</span>
          </div>
        </div>
        
        {section.currentBatch && (
          <div className="flex items-center gap-1 mt-2">
            <PackageCheck size={14} />
            <span>Joriy partiya: {section.currentBatch.batchNumber}</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-2 flex justify-end gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onStatusUpdate(section)}
        >
          <Settings size={14} className="mr-1" />
          Status
        </Button>
        <Button 
          variant="default" 
          size="sm"
          onClick={() => onViewDetails(section)}
        >
          Batafsil
          <ChevronRight size={14} className="ml-1" />
        </Button>
      </CardFooter>
    </Card>
  );
};

// ASOSIY SAHIFA
const SectionsPage = () => {
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showStatusUpdateModal, setShowStatusUpdateModal] = useState<boolean>(false);
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Fetch all sections
  const fetchSections = async () => {
    setLoading(true);
    try {
      const filters: {status?: string, type?: string} = {};
      
      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }
      
      if (typeFilter !== 'all') {
        filters.type = typeFilter;
      }
      
      const response = await SectionService.getAllSections(filters);
      // Handle search filtering on client side
      let filteredSections = response.sections;
      if (searchQuery) {
        const lowerSearchQuery = searchQuery.toLowerCase();
        filteredSections = filteredSections.filter(section => 
          section.name.toLowerCase().includes(lowerSearchQuery) || 
          section.code.toLowerCase().includes(lowerSearchQuery) ||
          section.location.toLowerCase().includes(lowerSearchQuery)
        );
      }
      
      setSections(filteredSections);
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

  // WebSocket eventi uchun handler
  const handleSectionCreated = (data: Section) => {
    toast({
      title: "Yangi sex yaratildi",
      description: `${data.name} - ${data.type} turi`,
    });
    fetchSections();
  };

  const handleSectionUpdated = (data: Section) => {
    toast({
      title: "Sex yangilandi",
      description: `${data.name} ma'lumotlari yangilandi`,
    });
    
    // Agar tanlangan sex bo'lsa, uni ham yangilash
    if (selectedSection && selectedSection.id === data.id) {
      setSelectedSection(data);
    }
    
    fetchSections();
  };

  const handleSectionStatusChanged = (data: {
    id: string;
    name: string;
    status: 'active' | 'inactive' | 'maintenance';
    updatedBy: string;
  }) => {
    const statusLabels = {
      active: "Faol",
      inactive: "Faol emas",
      maintenance: "Ta'mirlash",
    };
    
    toast({
      title: "Sex statusi o'zgardi",
      description: `${data.name} statusi "${statusLabels[data.status]}" ga o'zgartirildi`,
    });
    fetchSections();
  };

  // WebSocket listenerlari
  useEffect(() => {
    // Section yaratish eventi
    WebSocketService.on(WebSocketEventType.SECTION_CREATED, handleSectionCreated);
    
    // Section yangilash eventi
    WebSocketService.on(WebSocketEventType.SECTION_UPDATED, handleSectionUpdated);
    
    // Section status o'zgartirish eventi
    WebSocketService.on(WebSocketEventType.SECTION_STATUS_CHANGED, handleSectionStatusChanged);
    
    // Cleanup on unmount
    return () => {
      WebSocketService.off(WebSocketEventType.SECTION_CREATED, handleSectionCreated);
      WebSocketService.off(WebSocketEventType.SECTION_UPDATED, handleSectionUpdated);
      WebSocketService.off(WebSocketEventType.SECTION_STATUS_CHANGED, handleSectionStatusChanged);
    };
  }, [selectedSection]);

  // Load sections on component mount and filter changes
  useEffect(() => {
    fetchSections();
  }, [statusFilter, typeFilter]);
  
  // Search handler (with debounce)
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchSections();
    }, 300);
    
    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  // Handle viewing section details
  const handleViewDetails = (section: Section) => {
    setSelectedSection(section);
    setShowDetailsModal(true);
  };

  // Handle status update
  const handleStatusUpdate = (section: Section) => {
    setSelectedSection(section);
    setShowStatusUpdateModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Sexlar boshqaruvi</h1>
          <p className="text-muted-foreground">Ferma sexlari monitoringi va boshqaruvi</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus size={16} className="mr-2" />
          Yangi sex
        </Button>
      </div>
      
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="flex gap-2">
          <div className="relative grow">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Qidirish..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div>
          <Select onValueChange={setStatusFilter} defaultValue="all">
            <SelectTrigger>
              <div className="flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status bo'yicha" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha statuslar</SelectItem>
              <SelectItem value="active">Faol</SelectItem>
              <SelectItem value="maintenance">Ta'mirlash</SelectItem>
              <SelectItem value="inactive">Faol emas</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Select onValueChange={setTypeFilter} defaultValue="all">
            <SelectTrigger>
              <div className="flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Tur bo'yicha" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha turlar</SelectItem>
              <SelectItem value="growing">O'stirish</SelectItem>
              <SelectItem value="breeding">Ko'paytirish</SelectItem>
              <SelectItem value="slaughter">So'yish</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Section Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <Card key={item} className="h-[200px] animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-5 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
              <CardFooter className="pt-2">
                <div className="h-8 bg-gray-200 rounded w-full"></div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : sections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10">
          <Factory className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium">Sexlar topilmadi</h3>
          <p className="text-muted-foreground">
            {searchQuery || statusFilter !== 'all' || typeFilter !== 'all' 
              ? "Qidiruv parametrlariga mos sexlar topilmadi. Iltimos, filtrlarni o'zgartiring."
              : "Hozircha hech qanday sex mavjud emas. Yangi sex qo'shish uchun \"Yangi sex\" tugmasini bosing."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sections.map((section) => (
            <SectionCard
              key={section.id}
              section={section}
              onViewDetails={handleViewDetails}
              onStatusUpdate={handleStatusUpdate}
            />
          ))}
        </div>
      )}
      
      {/* Create Section Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Yangi sex yaratish</DialogTitle>
            <DialogDescription>
              Ferma uchun yangi sex yaratish formasi
            </DialogDescription>
          </DialogHeader>
          <CreateSectionForm
            onSuccess={() => {
              setShowCreateModal(false);
              fetchSections();
            }}
            onCancel={() => setShowCreateModal(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* Status Update Modal */}
      <Dialog open={showStatusUpdateModal} onOpenChange={setShowStatusUpdateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sex statusini yangilash</DialogTitle>
            <DialogDescription>
              {selectedSection?.name} sexining statusini o'zgartirish
            </DialogDescription>
          </DialogHeader>
          {selectedSection && (
            <UpdateSectionStatus
              section={selectedSection}
              onStatusUpdated={() => {
                setShowStatusUpdateModal(false);
                fetchSections();
              }}
              onCancel={() => setShowStatusUpdateModal(false)}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Section Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Factory className="h-5 w-5" />
              {selectedSection?.name} - {selectedSection?.code}
            </DialogTitle>
            <DialogDescription>
              {selectedSection?.location}
            </DialogDescription>
          </DialogHeader>
          
          {selectedSection && (
            <Tabs defaultValue="details" className="flex-1 overflow-hidden flex flex-col">
              <TabsList className="mb-4">
                <TabsTrigger value="details">Umumiy ma'lumot</TabsTrigger>
                <TabsTrigger value="workers">Xodimlar</TabsTrigger>
                <TabsTrigger value="history">Tarix</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="flex-1 overflow-auto">
                <ScrollArea className="h-full pr-4">
                  <div className="space-y-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium">Sex ma'lumotlari</h3>
                        <p className="text-muted-foreground text-sm">
                          So'nggi yangilanish: {new Date(selectedSection.updatedAt).toLocaleDateString('uz-UZ')}
                        </p>
                      </div>
                      
                      <Badge variant="outline" className={`${
                        selectedSection.status === 'active' ? 'bg-green-50 text-green-700' :
                        selectedSection.status === 'inactive' ? 'bg-red-50 text-red-700' :
                        'bg-yellow-50 text-yellow-700'
                      }`}>
                        {selectedSection.status === 'active' && <Check size={12} className="mr-1" />}
                        {selectedSection.status === 'inactive' && <X size={12} className="mr-1" />}
                        {selectedSection.status === 'maintenance' && <AlertTriangle size={12} className="mr-1" />}
                        {selectedSection.status === 'active' ? 'Faol' : 
                         selectedSection.status === 'inactive' ? 'Faol emas' : 'Ta\'mirlash'}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Factory size={16} />
                            Asosiy ma'lumotlar
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                            <div className="flex flex-col">
                              <span className="text-sm text-muted-foreground">Turi</span>
                              <span className="font-medium">
                                {selectedSection.type === 'growing' ? "O'stirish" :
                                 selectedSection.type === 'breeding' ? "Ko'paytirish" : "So'yish"}
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm text-muted-foreground">Sig'imi</span>
                              <span className="font-medium">{selectedSection.capacity}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm text-muted-foreground">Joriy miqdor</span>
                              <span className="font-medium">{selectedSection.currentCount}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm text-muted-foreground">Band qilish (%)</span>
                              <span className="font-medium">
                                {Math.round((selectedSection.currentCount / selectedSection.capacity) * 100)}%
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Ruler size={16} />
                            O'lchamlari
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="grid grid-cols-3 gap-x-4 gap-y-2">
                            <div className="flex flex-col">
                              <span className="text-sm text-muted-foreground">Uzunlik</span>
                              {/* <span className="font-medium">{selectedSection.?dimensions?.length} m</span> */}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm text-muted-foreground">Kenglik</span>
                              {/* <span className="font-medium">{selectedSection.?dimensions?.width} m</span> */}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm text-muted-foreground">Balandlik</span>
                              <span className="font-medium">{selectedSection?.dimensions?.height} m</span>
                            </div>
                            <div className="flex flex-col col-span-3">
                              <span className="text-sm text-muted-foreground">Maydoni</span>
                              {/* <span className="font-medium">
                                {selectedSection?.dimensions?.length * selectedSection?.dimensions?.width} m²
                              </span> */}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Thermometer size={16} />
                            Isitish tizimi
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex flex-col">
                              <span className="text-sm text-muted-foreground">Isitish turi</span>
                              <span className="font-medium">{selectedSection?.heating?.type}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm text-muted-foreground">Harorat ko'rsatkichi</span>
                              <span className="font-medium">{selectedSection?.heating?.temperature}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Wind size={16} />
                            Ventilyatsiya tizimi
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex flex-col">
                              <span className="text-sm text-muted-foreground">Ventilyatsiya turi</span>
                              <span className="font-medium">{selectedSection?.ventilation?.type}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm text-muted-foreground">Quvvati</span>
                              <span className="font-medium">{selectedSection?.ventilation?.capacity}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    {selectedSection.currentBatch && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center gap-2">
                            <PackageCheck size={16} />
                            Joriy partiya ma'lumotlari
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col">
                              <span className="text-sm text-muted-foreground">Partiya raqami</span>
                              <span className="font-medium">{selectedSection?.currentBatch?.batchNumber}</span>
                            </div>
                            <div className="flex items-center justify-center">
                              <Button variant="outline" size="sm">
                                Partiya tafsilotlarini ko'rish
                                <ChevronRight size={14} className="ml-1" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    
                    {selectedSection.supervisor && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Users size={16} />
                            Nazoratchi
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col">
                              <span className="text-sm text-muted-foreground">Nazoratchi ismi</span>
                              <span className="font-medium">{selectedSection?.supervisor?.name}</span>
                            </div>
                            {selectedSection?.supervisor?.phoneNumber && (
                              <div className="flex flex-col">
                                <span className="text-sm text-muted-foreground">Telefon raqami</span>
                                <span className="font-medium">{selectedSection?.supervisor?.phoneNumber}</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="workers" className="flex-1 overflow-auto">
                <ScrollArea className="h-full pr-4">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">Sexga biriktirilgan xodimlar</h3>
                      <Button variant="outline" size="sm">
                        <Plus size={14} className="mr-1" />
                        Xodim qo'shish
                      </Button>
                    </div>
                    
                    {selectedSection.workers && selectedSection?.workers?.length > 0 ? (
                      <div className="space-y-2">
                        {selectedSection.workers.map(worker => (
                          <Card key={worker.id}>
                            <CardContent className="p-4 flex justify-between items-center">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-700">
                                  {worker.name.charAt(0)}
                                </div>
                                <div>
                                  <h4 className="font-medium">{worker.name}</h4>
                                </div>
                              </div>
                              <Button variant="ghost" size="sm">
                                Batafsil
                                <ChevronRight size={14} className="ml-1" />
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-10 text-center">
                        <Users className="h-16 w-16 text-muted-foreground mb-4" />
                        <h3 className="text-xl font-medium">Xodimlar topilmadi</h3>
                        <p className="text-muted-foreground max-w-md">
                          Bu sexga hali xodimlar biriktirilmagan. Xodim qo'shish uchun "Xodim qo'shish" tugmasini bosing.
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="history" className="flex-1 overflow-auto">
                <ScrollArea className="h-full pr-4">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">Sex partiyalari tarixi</h3>
                    </div>
                    
                    {selectedSection.history && selectedSection.history.length > 0 ? (
                      <div className="space-y-2">
                        {selectedSection.history.map(batch => (
                          <Card key={batch.batchId}>
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium">{batch.batchNumber}</h4>
                                  <div className="text-sm text-muted-foreground">
                                    {new Date(batch.startDate).toLocaleDateString('uz-UZ')} - {batch.endDate ? new Date(batch.endDate).toLocaleDateString('uz-UZ') : 'Hozir'}
                                  </div>
                                </div>
                                <Badge variant="outline" className={
                                  batch.performance === 'Excellent' ? 'bg-green-50 text-green-700' :
                                  batch.performance === 'Good' ? 'bg-blue-50 text-blue-700' :
                                  batch.performance === 'Average' ? 'bg-yellow-50 text-yellow-700' :
                                  'bg-red-50 text-red-700'
                                }>
                                  {batch.performance}
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-3 gap-4 mt-3">
                                <div className="flex flex-col">
                                  <span className="text-sm text-muted-foreground">Boshlang'ich miqdor</span>
                                  <span className="font-medium">{batch.initialCount}</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-sm text-muted-foreground">Yakuniy miqdor</span>
                                  <span className="font-medium">{batch.finalCount}</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-sm text-muted-foreground">O'lim darajasi</span>
                                  <span className="font-medium">
                                    {((batch.initialCount - batch.finalCount) / batch.initialCount * 100).toFixed(1)}%
                                  </span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-10 text-center">
                        <Clock className="h-16 w-16 text-muted-foreground mb-4" />
                        <h3 className="text-xl font-medium">Tarix mavjud emas</h3>
                        <p className="text-muted-foreground max-w-md">
                          Bu sex uchun hali partiyalar tarixi mavjud emas.
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SectionsPage;