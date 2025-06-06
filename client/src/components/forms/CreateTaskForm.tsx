import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { CalendarIcon } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { getSections, getUsers, getBatches } from '@/lib/api';
import { TaskPriority, TaskType, CreateTaskInput } from '@/types/managementTasks';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';

// Vazifa yaratish uchun validatsiya sxemasi
const createTaskSchema = z.object({
  title: z.string().min(5, { message: "Sarlavha kamida 5 ta belgidan iborat bo'lishi kerak" }),
  description: z.string().min(10, { message: "Tavsif kamida 10 ta belgidan iborat bo'lishi kerak" }),
  type: z.enum(['feeding', 'cleaning', 'vaccination', 'maintenance', 'measurement', 'medication', 'other']),
  section: z.string({ required_error: "Sex tanlanishi shart" }),
  batch: z.string().optional(),
  assignedTo: z.array(z.string()).min(1, { message: "Kamida bitta xodim tayinlanishi kerak" }),
  supervisors: z.array(z.string()).min(1, { message: "Kamida bitta nazoratchi tayinlanishi kerak" }),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  startDate: z.date({ required_error: "Boshlanish sanasi kiritilishi shart" }),
  dueDate: z.date({ required_error: "Tugash sanasi kiritilishi shart" }),
  isRecurring: z.boolean().default(false),
  notes: z.string().optional(),
}).refine(data => {
  // Tugash sanasi boshlanish sanasidan keyin bo'lishi kerak
  return data.dueDate >= data.startDate;
}, {
  message: "Tugash sanasi boshlanish sanasidan keyin bo'lishi kerak",
  path: ["dueDate"]
});

interface CreateTaskFormProps {
  onSubmit: (data: CreateTaskInput) => void;
  isLoading: boolean;
}

const CreateTaskForm: React.FC<CreateTaskFormProps> = ({ onSubmit, isLoading }) => {
  // Form
  const form = useForm<z.infer<typeof createTaskSchema>>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: '',
      description: '',
      section: '',
      priority: 'medium',
      type: 'other',
      assignedTo: [],
      supervisors: [],
      isRecurring: false,
      notes: '',
      startDate: new Date(),
      dueDate: new Date(new Date().setDate(new Date().getDate() + 7)), // Default to 1 week from now
    },
  });

  // So'rovlar
  const { data: sectionsData } = useQuery({
    queryKey: ['/api/sections'],
    queryFn: getSections,
  });

  const { data: usersData } = useQuery({
    queryKey: ['/api/user'],
    queryFn: () => getUsers(),
  });

  const { data: batchesData } = useQuery({
    queryKey: ['/api/batches'],
    queryFn: () => getBatches(),
  });

  // Forma jo'natish
  const handleSubmit = (values: z.infer<typeof createTaskSchema>) => {
    // Formatting dates to ISO strings and mapping to CreateTaskInput
    const formattedData: CreateTaskInput = {
      ...values,
      startDate: values.startDate.toISOString(),
      dueDate: values.dueDate.toISOString(),
    };
    onSubmit(formattedData);
  };

  // Filterlash - tanlangan section ga mos batch larni ko'rsatish
  const selectedSection = form.watch('section');
  const filteredBatches = batchesData?.batches?.filter(
    (batch: { section: { id: string }}) => batch.section.id === selectedSection
  ) || [];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Sarlavha */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vazifa nomi</FormLabel>
                <FormControl>
                  <Input placeholder="Vazifa sarlavhasini kiriting" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Vazifa turi */}
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vazifa turi</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
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

          {/* Sex (Section) */}
          <FormField
            control={form.control}
            name="section"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sex</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sex (bo'lim) tanlang" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {sectionsData?.sections?.map((section: { id: string, name: string }) => (
                      <SelectItem key={section.id} value={section.id}>
                        {section.name}
                      </SelectItem>
                    )) || <SelectItem value="">Ma'lumot yuklanmoqda...</SelectItem>}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Partiya */}
          <FormField
            control={form.control}
            name="batch"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Partiya</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  disabled={!selectedSection || filteredBatches.length === 0}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Partiya tanlang" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {filteredBatches.map((batch: { id: string, batchNumber: string }) => (
                      <SelectItem key={batch.id} value={batch.id}>
                        {batch.batchNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  {!selectedSection 
                    ? "Avval sex tanlang" 
                    : filteredBatches.length === 0 
                      ? "Tanlangan sexda partiyalar yo'q" 
                      : "Vazifa qaysi partiya uchun?"}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Muhimlik */}
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Muhimlik darajasi</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
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

          {/* Boshlanish sanasi */}
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
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "dd MMM yyyy")
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

          {/* Tugash sanasi */}
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
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "dd MMM yyyy")
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

          {/* Takrorlanadimi? */}
          <FormField
            control={form.control}
            name="isRecurring"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel>Takrorlanadimi?</FormLabel>
                  <FormDescription>
                    Vazifa muntazam takrorlanadimi?
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {/* Tavsif */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tavsif</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Vazifa haqida batafsil ma'lumot kiriting"
                  className="resize-none"
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Xodimlar tanlash */}
        <FormField
          control={form.control}
          name="assignedTo"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">Tayinlangan xodimlar</FormLabel>
                <FormDescription>
                  Vazifa tayinlanadigan xodimlarni tanlang
                </FormDescription>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <ScrollArea className="h-48 rounded-md border">
                  {usersData?.users?.map((user: { id: string, name: string, position?: { name: string } }) => (
                    <FormField
                      key={user.id}
                      control={form.control}
                      name="assignedTo"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={user.id}
                            className="flex flex-row items-start space-x-3 space-y-0 p-2 border-b"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(user.id)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, user.id])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== user.id
                                        )
                                      );
                                }}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal cursor-pointer">
                              {user.name} 
                              <span className="text-xs text-muted-foreground"> - {user.position?.name || "Lavozim yo'q"}</span>
                            </FormLabel>
                          </FormItem>
                        );
                      }}
                    />
                  ))}
                </ScrollArea>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Nazoratchilar tanlash */}
        <FormField
          control={form.control}
          name="supervisors"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">Nazoratchilar</FormLabel>
                <FormDescription>
                  Vazifani nazorat qiladigan mas'ullarni tanlang
                </FormDescription>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <ScrollArea className="h-48 rounded-md border">
                  {usersData?.users?.filter((user: { role: string }) => user.role === 'manager' || user.role === 'boss')
                    .map((user: { id: string, name: string, position?: { name: string } }) => (
                      <FormField
                        key={user.id}
                        control={form.control}
                        name="supervisors"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={user.id}
                              className="flex flex-row items-start space-x-3 space-y-0 p-2 border-b"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(user.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, user.id])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== user.id
                                          )
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal cursor-pointer">
                                {user.name} 
                                <span className="text-xs text-muted-foreground"> - {user.position?.name || "Lavozim yo'q"}</span>
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))
                  }
                </ScrollArea>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Izohlar</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Qo'shimcha izohlar..."
                  className="resize-none"
                  rows={2}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Yaratilmoqda..." : "Vazifani yaratish"}
        </Button>
      </form>
    </Form>
  );
};

export default CreateTaskForm;