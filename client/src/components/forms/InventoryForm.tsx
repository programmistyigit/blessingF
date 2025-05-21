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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

// Form validation schema for inventory transactions
const inventoryTransactionSchema = z.object({
  itemId: z.string().min(1, { message: "Mahsulotni tanlash majburiy" }),
  type: z.enum(["addition", "deduction"], { 
    required_error: "Tranzaksiya turini tanlash majburiy" 
  }),
  quantity: z.coerce.number().positive({ message: "Miqdor musbat son bo'lishi kerak" }),
  date: z.string().min(1, { message: "Sanani kiritish majburiy" }),
  batchId: z.string().optional(),
  price: z.coerce.number().nonnegative({ message: "Narx manfiy bo'lmasligi kerak" }).optional(),
  supplier: z.string().optional(),
  notes: z.string().optional()
});

type InventoryTransactionValues = z.infer<typeof inventoryTransactionSchema>;

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  currentQuantity: number;
}

interface Batch {
  id: string;
  batchNumber: string;
}

interface InventoryFormProps {
  items: InventoryItem[];
  batches: Batch[];
  onSubmit: (data: InventoryTransactionValues) => void;
  isSubmitting?: boolean;
  defaultValues?: Partial<InventoryTransactionValues>;
  title?: string;
}

const InventoryForm: React.FC<InventoryFormProps> = ({
  items,
  batches,
  onSubmit,
  isSubmitting = false,
  defaultValues,
  title = "Inventar Harakati"
}) => {
  const form = useForm<InventoryTransactionValues>({
    resolver: zodResolver(inventoryTransactionSchema),
    defaultValues: {
      itemId: defaultValues?.itemId || '',
      type: defaultValues?.type || 'addition',
      quantity: defaultValues?.quantity || 0,
      date: defaultValues?.date ? new Date(defaultValues.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      batchId: defaultValues?.batchId || '',
      price: defaultValues?.price || 0,
      supplier: defaultValues?.supplier || '',
      notes: defaultValues?.notes || ''
    }
  });

  const watchType = form.watch('type');
  const watchItemId = form.watch('itemId');
  
  // Get the selected item to display its unit
  const selectedItem = React.useMemo(() => {
    return items.find(item => item.id === watchItemId);
  }, [watchItemId, items]);

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
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Harakat Turi</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-row space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="addition" />
                        </FormControl>
                        <FormLabel className="font-normal">Qo'shish</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="deduction" />
                        </FormControl>
                        <FormLabel className="font-normal">Sarflash</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="itemId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mahsulot</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Mahsulotni tanlang" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {items.map((item) => (
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
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Miqdori</FormLabel>
                    <div className="flex items-center">
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      {selectedItem && (
                        <span className="ml-2">{selectedItem.unit}</span>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
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
              
              {watchType === 'deduction' && (
                <FormField
                  control={form.control}
                  name="batchId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Partiya</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Partiyani tanlang (ixtiyoriy)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Partiya ko'rsatilmagan</SelectItem>
                          {batches.map((batch) => (
                            <SelectItem key={batch.id} value={batch.id}>
                              {batch.batchNumber}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Inventar qaysi partiya uchun sarflangan?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              {watchType === 'addition' && (
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Narxi</FormLabel>
                      <div className="flex items-center">
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <span className="ml-2">UZS</span>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              {watchType === 'addition' && (
                <FormField
                  control={form.control}
                  name="supplier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ta'minotchi</FormLabel>
                      <FormControl>
                        <Input placeholder="Chorvachilik mahsulotlari MChJ" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Eslatmalar</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Inventar harakati haqida qo'shimcha ma'lumotlar" {...field} />
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
                {isSubmitting ? 'Saqlanmoqda...' : watchType === 'addition' ? "Qo'shish" : "Sarflash"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default InventoryForm;
