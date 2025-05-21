import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

// Form validation schema
const slaughterFormSchema = z.object({
  batchNumber: z.string().min(5, { message: "Partiya raqami kamida 5 ta belgidan iborat bo'lishi kerak" }),
  chickenBatch: z.string().min(1, { message: "Tovuq partiyasini tanlash majburiy" }),
  section: z.string().min(1, { message: "Bo'limni tanlash majburiy" }),
  plannedDate: z.string().min(1, { message: "Rejalashtirish sanasini kiritish majburiy" }),
  preslaughterCount: z.coerce.number().min(1, { message: "So'yishdan oldingi miqdor 1 dan katta bo'lishi kerak" }),
  preslaughterAverageWeight: z.coerce.number().min(0.1, { message: "So'yishdan oldingi o'rtacha vazn 0.1 kg dan katta bo'lishi kerak" }),
  processingTeam: z.array(z.string()).min(1, { message: "Kamida bitta ishlov beruvchi xodimni tanlash kerak" }),
  notes: z.string().optional()
});

type SlaughterFormValues = z.infer<typeof slaughterFormSchema>;

interface Batch {
  id: string;
  batchNumber: string;
  currentCount: number;
  breed: string;
}

interface Section {
  id: string;
  name: string;
}

interface Employee {
  id: string;
  name: string;
}

interface SlaughterFormProps {
  batches: Batch[];
  sections: Section[];
  employees: Employee[];
  onSubmit: (data: SlaughterFormValues) => void;
  isSubmitting?: boolean;
  defaultValues?: Partial<SlaughterFormValues>;
  title?: string;
  submitLabel?: string;
}

const SlaughterForm: React.FC<SlaughterFormProps> = ({
  batches,
  sections,
  employees,
  onSubmit,
  isSubmitting = false,
  defaultValues,
  title = "Yangi So'yish Partiyasi",
  submitLabel = "Rejalashtirish"
}) => {
  const form = useForm<SlaughterFormValues>({
    resolver: zodResolver(slaughterFormSchema),
    defaultValues: {
      batchNumber: defaultValues?.batchNumber || '',
      chickenBatch: defaultValues?.chickenBatch || '',
      section: defaultValues?.section || '',
      plannedDate: defaultValues?.plannedDate ? new Date(defaultValues.plannedDate).toISOString().split('T')[0] : '',
      preslaughterCount: defaultValues?.preslaughterCount || 0,
      preslaughterAverageWeight: defaultValues?.preslaughterAverageWeight || 0,
      processingTeam: defaultValues?.processingTeam || [],
      notes: defaultValues?.notes || ''
    }
  });

  const watchChickenBatch = form.watch('chickenBatch');
  
  // Automatically update preslaughterCount when chickenBatch is selected
  React.useEffect(() => {
    if (watchChickenBatch) {
      const selectedBatch = batches.find(batch => batch.id === watchChickenBatch);
      if (selectedBatch) {
        form.setValue('preslaughterCount', selectedBatch.currentCount);
      }
    }
  }, [watchChickenBatch, batches, form]);

  return (
    <Card className="border bg-white shadow">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="batchNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>So'yish Partiyasi Raqami</FormLabel>
                    <FormControl>
                      <Input placeholder="SB-2025-001" {...field} />
                    </FormControl>
                    <FormDescription>
                      So'yish partiyasi uchun noyob identifikator
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="chickenBatch"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tovuq Partiyasi</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Tovuq partiyasini tanlang" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {batches.map((batch) => (
                          <SelectItem key={batch.id} value={batch.id}>
                            {batch.batchNumber} - {batch.breed} ({batch.currentCount} ta)
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
                name="section"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bo'lim</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Bo'limni tanlang" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sections.length && sections.map((section) => (
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
                name="plannedDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rejalashtirilgan Sana</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="preslaughterCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>So'yishdan Oldingi Miqdor</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="preslaughterAverageWeight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>So'yishdan Oldingi O'rtacha Vazn (kg)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="processingTeam"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel>Ishlov Beruvchi Jamoa</FormLabel>
                    <FormDescription>
                      So'yish jarayonida qatnashadigan xodimlarni tanlang
                    </FormDescription>
                  </div>
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                    {employees.length && employees.map((employee) => (
                      <FormField
                        key={employee.id}
                        control={form.control}
                        name="processingTeam"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={employee.id}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(employee.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, employee.id])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== employee.id
                                          )
                                        )
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {employee.name}
                              </FormLabel>
                            </FormItem>
                          )
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Eslatmalar</FormLabel>
                  <FormControl>
                    <Textarea placeholder="So'yish partiyasi haqida qo'shimcha ma'lumotlar" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline">
                Bekor qilish
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saqlanmoqda...' : submitLabel}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default SlaughterForm;
