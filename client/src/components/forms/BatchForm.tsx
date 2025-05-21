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
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

// Form validation schema
const batchFormSchema = z.object({
  batchNumber: z.string().min(5, { message: "Partiya raqami kamida 5 ta belgidan iborat bo'lishi kerak" }),
  section: z.string().min(1, { message: "Bo'limni tanlash majburiy" }),
  period: z.string().min(1, { message: "Davrni tanlash majburiy" }),
  arrivalDate: z.string().min(1, { message: "Kelish sanasini kiritish majburiy" }),
  initialCount: z.coerce.number().min(1, { message: "Dastlabki miqdor 1 dan katta bo'lishi kerak" }),
  breed: z.string().min(1, { message: "Tovuq zotini kiritish majburiy" }),
  supplier: z.string().min(1, { message: "Ta'minotchini kiritish majburiy" }),
  notes: z.string().optional(),
  acceptableMortalityRate: z.coerce.number().min(0, { message: "Mortallik ko'rsatkichi 0 dan katta bo'lishi kerak" }),
  acceptableGrowthVariance: z.coerce.number().min(0, { message: "O'sish variansiyasi 0 dan katta bo'lishi kerak" }),
  notificationPhoneNumbers: z.string()
    .refine(value => value.split(',').every(phone => phone.trim().match(/^\+?\d{10,15}$/)), {
      message: "Telefon raqamlar to'g'ri formatda bo'lishi kerak (+998XXXXXXXXX)"
    })
});

type BatchFormValues = z.infer<typeof batchFormSchema>;

interface Section {
  id: string;
  name: string;
}

interface Period {
  id: string;
  name: string;
}

interface BatchFormProps {
  sections: Section[];
  periods: Period[];
  onSubmit: (data: BatchFormValues) => void;
  isSubmitting?: boolean;
  defaultValues?: Partial<BatchFormValues>;
  title?: string;
  submitLabel?: string;
}

const BatchForm: React.FC<BatchFormProps> = ({
  sections,
  periods,
  onSubmit,
  isSubmitting = false,
  defaultValues,
  title = "Yangi Tovuq Partiyasi",
  submitLabel = "Saqlash"
}) => {
  const form = useForm<BatchFormValues>({
    resolver: zodResolver(batchFormSchema),
    defaultValues: {
      batchNumber: defaultValues?.batchNumber || '',
      section: defaultValues?.section || '',
      period: defaultValues?.period || '',
      arrivalDate: defaultValues?.arrivalDate ? new Date(defaultValues.arrivalDate).toISOString().split('T')[0] : '',
      initialCount: defaultValues?.initialCount || 1000,
      breed: defaultValues?.breed || '',
      supplier: defaultValues?.supplier || '',
      notes: defaultValues?.notes || '',
      acceptableMortalityRate: defaultValues?.acceptableMortalityRate || 3,
      acceptableGrowthVariance: defaultValues?.acceptableGrowthVariance || 0.7,
      notificationPhoneNumbers: defaultValues?.notificationPhoneNumbers ? 
        Array.isArray(defaultValues.notificationPhoneNumbers) ? 
          defaultValues.notificationPhoneNumbers.join(', ') : 
          defaultValues.notificationPhoneNumbers :
        ''
    }
  });

  const handleSubmit = (values: BatchFormValues) => {
    // Transform phone numbers string to array
    const transformedValues = {
      ...values,
      notificationPhoneNumbers: values.notificationPhoneNumbers
        .split(',')
        .map(phone => phone.trim())
        .filter(phone => phone.length > 0)
    };
    
    onSubmit(transformedValues as any);
  };

  return (
    <Card className="border bg-white shadow">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="batchNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Partiya Raqami</FormLabel>
                    <FormControl>
                      <Input placeholder="B-2025-001" {...field} />
                    </FormControl>
                    <FormDescription>
                      Partiya uchun noyob identifikator
                    </FormDescription>
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
                name="period"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Davri</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Davrni tanlang" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {periods.length && periods.map((period) => (
                          <SelectItem key={period.id} value={period.id}>
                            {period.name}
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
                name="arrivalDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kelish Sanasi</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="initialCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dastlabki Miqdori</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="breed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tovuq Zoti</FormLabel>
                    <FormControl>
                      <Input placeholder="Broiler Ross 308" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="supplier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ta'minotchi</FormLabel>
                    <FormControl>
                      <Input placeholder="Tovuq fermasi MChJ" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="acceptableMortalityRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maqbul Mortallik Ko'rsatkichi (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="acceptableGrowthVariance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maqbul O'sish Variansiyasi</FormLabel>
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
              name="notificationPhoneNumbers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Xabarnoma Telefon Raqamlari</FormLabel>
                  <FormControl>
                    <Input placeholder="+998901234567, +998901234568" {...field} />
                  </FormControl>
                  <FormDescription>
                    Vergul bilan ajratilgan telefon raqamlar
                  </FormDescription>
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
                    <Textarea placeholder="Partiya haqida qo'shimcha ma'lumotlar" {...field} />
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

export default BatchForm;
