import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { Plus, Trash2 } from 'lucide-react';

// Form validation schema for daily menu
const menuItemSchema = z.object({
  menuItem: z.string().min(1, { message: "Menyu elementini tanlash majburiy" }),
  mealTime: z.enum(["breakfast", "lunch", "dinner"], { 
    required_error: "Ovqatlanish vaqtini tanlash majburiy" 
  }),
  servingSize: z.enum(["small", "standard", "large"], { 
    required_error: "Porsiya o'lchamini tanlash majburiy" 
  }),
  quantity: z.coerce.number().positive({ message: "Miqdor musbat son bo'lishi kerak" })
});

const dailyMenuSchema = z.object({
  date: z.string().min(1, { message: "Sanani kiritish majburiy" }),
  items: z.array(menuItemSchema).min(1, { message: "Kamida bitta menyu elementi kiritish kerak" }),
  notes: z.string().optional()
});

type MenuItemValues = z.infer<typeof menuItemSchema>;
type DailyMenuValues = z.infer<typeof dailyMenuSchema>;

interface MenuItem {
  id: string;
  name: string;
  category: string;
}

interface MenuFormProps {
  menuItems: MenuItem[];
  onSubmit: (data: DailyMenuValues) => void;
  isSubmitting?: boolean;
  defaultValues?: Partial<DailyMenuValues>;
  title?: string;
}

const MenuForm: React.FC<MenuFormProps> = ({
  menuItems,
  onSubmit,
  isSubmitting = false,
  defaultValues,
  title = "Kunlik Menyu Yaratish"
}) => {
  const form = useForm<DailyMenuValues>({
    resolver: zodResolver(dailyMenuSchema),
    defaultValues: {
      date: defaultValues?.date ? new Date(defaultValues.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      items: defaultValues?.items?.length ? defaultValues.items : [{ menuItem: '', mealTime: 'lunch', servingSize: 'standard', quantity: 50 }],
      notes: defaultValues?.notes || ''
    }
  });

  const { fields, append, remove } = useFieldArray({
    name: "items",
    control: form.control
  });

  const mealTimes = [
    { id: 'breakfast', name: 'Nonushta' },
    { id: 'lunch', name: 'Tushlik' },
    { id: 'dinner', name: 'Kechki ovqat' }
  ];

  const servingSizes = [
    { id: 'small', name: 'Kichik' },
    { id: 'standard', name: "O'rta" },
    { id: 'large', name: 'Katta' }
  ];

  return (
    <Card className="border bg-white shadow">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sana</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div>
              <h3 className="text-lg font-medium mb-4">Menyu Elementlari</h3>
              
              {fields.map((field, index) => (
                <div key={field.id} className="p-4 border rounded-md mb-4 bg-gray-50">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">Element #{index + 1}</h4>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name={`items.${index}.menuItem`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Menyu Elementi</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Menyu elementini tanlang" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {menuItems.map((item) => (
                                <SelectItem key={item.id} value={item.id}>
                                  {item.name} ({item.category})
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
                      name={`items.${index}.mealTime`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ovqatlanish Vaqti</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Ovqatlanish vaqtini tanlang" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {mealTimes.map((mealTime) => (
                                <SelectItem key={mealTime.id} value={mealTime.id}>
                                  {mealTime.name}
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
                      name={`items.${index}.servingSize`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Porsiya O'lchami</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Porsiya o'lchamini tanlang" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {servingSizes.map((size) => (
                                <SelectItem key={size.id} value={size.id}>
                                  {size.name}
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
                      name={`items.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Miqdori</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormDescription>
                            Tayyorlanadigan porsiyalar soni
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}
              
              <Button
                type="button"
                variant="outline"
                className="mt-2"
                onClick={() => append({ menuItem: '', mealTime: 'lunch', servingSize: 'standard', quantity: 50 })}
              >
                <Plus className="h-4 w-4 mr-2" />
                Menyu elementi qo'shish
              </Button>
            </div>
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Eslatmalar</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Kunlik menyu haqida qo'shimcha ma'lumotlar" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline">
                Bekor qilish
              </Button>
              <Button type="submit" className="bg-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Saqlanmoqda...' : 'Menyuni saqlash'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default MenuForm;
