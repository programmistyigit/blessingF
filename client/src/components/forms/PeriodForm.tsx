import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { string, z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { PeriodService, type Period } from '@/services/PeriodService';
import { toast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { baseHost } from '@/lib/host';
import { getSections } from '@/lib/api';

// Schema for form validation
const periodSchema = z.object({
  name: z.string().min(2, 'Nomi kamida 2 ta belgi bo\'lishi kerak'),
  code: z.string().min(2, 'Kod kamida 2 ta belgi bo\'lishi kerak'),
  startDate: z.date({ required_error: 'Boshlanish sanasi talab qilinadi' }),
  endDate: z.date({ required_error: 'Tugash sanasi talab qilinadi' }),
  status: z.string({ required_error: 'Status talab qilinadi' }),
  description: z.string().optional(),
  sections: z.array(z.string())
}).refine(data => {
  const { startDate, endDate } = data;
  return startDate <= endDate;
}, {
  message: 'Tugash sanasi boshlanish sanasidan keyin bo\'lishi kerak',
  path: ['endDate']
});

type PeriodFormValues = z.infer<typeof periodSchema>;
interface PeriodFormProps {
  periodToEdit?: Period;
  onSuccess?: () => void;
}

const PeriodForm: React.FC<PeriodFormProps> = ({ periodToEdit, onSuccess }) => {
  const queryClient = useQueryClient();
  const isEditMode = !!periodToEdit;
  const [selectedSections, setSelectedSections] = React.useState([]);
  const [sections, setSections] = React.useState([]);

  useEffect(() => {
    const fetchSections = async () => {
      try {
        const response = await getSections()


        setSections(response.data)
        console.log('Sections:', response.data);

      } catch (error) {
        console.error('Error fetching sections:', error);
      }
    };

    fetchSections();
  }, [])

  // Initialize form
  const form = useForm<PeriodFormValues>({
    resolver: zodResolver(periodSchema),
    defaultValues: {
      name: periodToEdit?.name || '',
      code: periodToEdit?.code || '',
      startDate: periodToEdit ? new Date(periodToEdit.startDate) : new Date(),
      endDate: periodToEdit ? new Date(periodToEdit.endDate) : new Date(),
      status: periodToEdit?.status || 'planned',
      description: periodToEdit?.description || '',
      sections: periodToEdit?.sections || [],
    },
  });

  // Create period mutation
  const createPeriod = useMutation({
    mutationFn: async (data: any) => {
      return await PeriodService.createPeriod({
        ...data,
        startDate: format(data.startDate, 'yyyy-MM-dd'),
        endDate: format(data.endDate, 'yyyy-MM-dd'),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/periods'] });
      form.reset();
      toast({
        title: 'Muvaffaqiyatli yaratildi',
        description: 'Yangi davr muvaffaqiyatli yaratildi.',
      });
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: 'Xatolik yuz berdi',
        description: error.toString(),
        variant: 'destructive',
      });
    },
  });

  // Update period mutation
  const updatePeriod = useMutation({
    mutationFn: async (data: PeriodFormValues) => {
      if (!periodToEdit) throw new Error('Tahrirlash uchun davr ma\'lumotlari topilmadi');
      return await PeriodService.updatePeriod(periodToEdit.id, {
        ...data,
        startDate: format(data.startDate, 'yyyy-MM-dd'),
        endDate: format(data.endDate, 'yyyy-MM-dd'),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/periods'] });
      toast({
        title: 'Muvaffaqiyatli yangilandi',
        description: 'Davr ma\'lumotlari muvaffaqiyatli yangilandi.',
      });
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: 'Xatolik yuz berdi',
        description: error.toString(),
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: PeriodFormValues) => {
    if (isEditMode) {
      updatePeriod.mutate(data);
    } else {
      console.log(data);

      const formattedData = {
        ...data,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
      };

      createPeriod.mutate(formattedData);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nomi</FormLabel>
                <FormControl>
                  <Input placeholder="Masalan: 2023-yil 1-chorak" {...field} />
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
                <FormLabel>Kod</FormLabel>
                <FormControl>
                  <Input placeholder="Masalan: Q1-2023" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        variant="outline"
                        className="w-full pl-3 text-left font-normal"
                      >
                        {field.value ? (
                          format(field.value, 'dd.MM.yyyy')
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
                <FormLabel>Tugash sanasi</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className="w-full pl-3 text-left font-normal"
                      >
                        {field.value ? (
                          format(field.value, 'dd.MM.yyyy')
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

        {/* multiselect */}
        <FormField
          control={form.control}
          name="sections"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bo'limlar</FormLabel>
              <FormControl>
                <div className="grid gap-2">
                  {sections.length > 0 ? (
                    sections.map((section: any) => (
                      <label key={section.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          value={section.name}
                          checked={field.value.includes(section.id)}
                          onChange={(e) => {
                            console.log(field, section);

                            const checked = e.target.checked;
                            const newValue = checked
                              ? [...field.value, section.id]
                              : field.value.filter((id) => id !== section.id);
                            field.onChange(newValue);
                          }}
                        />
                        <span>{section.name}</span>
                      </label>
                    ))
                  ) : (
                    <p>Bo‘limlar topilmadi</p>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Statusni tanlang" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="planned">Rejalashtirilgan</SelectItem>
                  <SelectItem value="active">Faol</SelectItem>
                  <SelectItem value="completed">Tugatilgan</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Izoh</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Izoh qoldiring..."
                  className="resize-none h-20"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" className="w-full">
            {isEditMode ? 'Yangilash' : 'Yaratish'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default PeriodForm;