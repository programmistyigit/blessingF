import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import {
  InventoryService,
  InventoryItem,
  InventoryTransaction,
  InventoryItemStatus,
  InventoryItemType,
  TransactionType
} from '@/services/InventoryService';
import { SectionService } from '@/services/SectionService';
import { BatchService } from '@/services/BatchService';
import { WebSocketService, WebSocketEventType } from '@/services/WebSocketService';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

import {
  Search,
  Filter,
  Package,
  Plus,
  Table as TableIcon,
  Grid,
  BarChart4,
  Activity,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  Trash2,
  Edit,
  Eye,
  PlusCircle,
  Calendar as CalendarIcon,
  Warehouse,
  AlertTriangle,
  Hash,
  Pill,
  Wrench,
  // Spray o'rniga boshqa ikonkani foydalanish
  Droplet, // Spray o'rniga
  Syringe,
  RotateCw,
  ChevronDown,
  ChevronUp,
  Tag,
  CircleDollarSign,
  Building2
} from 'lucide-react';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// Summary Card Component
const SummaryCard = ({ title, value, icon, description, className }: any) => {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
};

// Type Icon Component
const TypeIcon = ({ type }: { type: InventoryItemType }) => {
  switch (type) {
    case 'feed':
      return <Warehouse className="h-4 w-4" />;
    case 'medicine':
      return <Pill className="h-4 w-4" />;
    case 'equipment':
      return <Wrench className="h-4 w-4" />;
    case 'cleaning':
      return <Droplet className="h-4 w-4" />;
    default:
      return <Package className="h-4 w-4" />;
  }
};

// Transaction Type Icon Component
const TransactionTypeIcon = ({ type }: { type: TransactionType }) => {
  switch (type) {
    case 'addition':
      return <ArrowUpRight className="h-4 w-4 text-green-500" />;
    case 'consumption':
      return <ArrowDownLeft className="h-4 w-4 text-amber-500" />;
    case 'transfer':
      return <ArrowLeftRight className="h-4 w-4 text-blue-500" />;
    case 'disposal':
      return <Trash2 className="h-4 w-4 text-red-500" />;
    default:
      return <RotateCw className="h-4 w-4" />;
  }
};

// Status Badge Component
const StatusBadge = ({ status }: { status: InventoryItemStatus }) => {
  switch (status) {
    case 'available':
      return <Badge className="bg-green-100 text-green-800">Mavjud</Badge>;
    case 'low_stock':
      return <Badge className="bg-amber-100 text-amber-800">Kam zaxira</Badge>;
    case 'out_of_stock':
      return <Badge className="bg-red-100 text-red-800">Tugagan</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

// Type Badge Component
const TypeBadge = ({ type }: { type: InventoryItemType }) => {
  switch (type) {
    case 'feed':
      return <Badge className="bg-emerald-100 text-emerald-800">Yem</Badge>;
    case 'medicine':
      return <Badge className="bg-purple-100 text-purple-800">Dori</Badge>;
    case 'equipment':
      return <Badge className="bg-blue-100 text-blue-800">Jihozlar</Badge>;
    case 'cleaning':
      return <Badge className="bg-cyan-100 text-cyan-800">Tozalash</Badge>;
    default:
      return <Badge variant="outline">{type}</Badge>;
  }
};

// Create Inventory Item Form Schema
const createInventoryItemSchema = z.object({
  name: z.string().min(2, "Nom kamida 2 ta belgidan iborat bo'lishi kerak"),
  code: z.string().min(2, "Kod kamida 2 ta belgidan iborat bo'lishi kerak"),
  type: z.enum(['feed', 'medicine', 'equipment', 'cleaning']),
  subType: z.string().optional(),
  quantity: z.number().min(0, "Miqdor 0 dan katta yoki teng bo'lishi kerak"),
  unit: z.string().min(1, "O'lchov birligini tanlang"),
  price: z.number().min(0, "Narx 0 dan katta yoki teng bo'lishi kerak"),
  location: z.string().min(1, "Joylashuvni ko'rsating"),
  section: z.string().optional(),
  expiryDate: z.date().optional(),
  supplier: z.string().min(1, "Ta'minotchini ko'rsating"),
  safetyStock: z.number().min(0, "Minimal zaxira miqdori 0 dan katta yoki teng bo'lishi kerak"),
  notes: z.string().optional(),
  nutritionalInfo: z.object({
    protein: z.number().optional(),
    fat: z.number().optional(),
    fiber: z.number().optional(),
    energy: z.number().optional()
  }).optional(),
});

// Create Addition Transaction Schema
const createAdditionTransactionSchema = z.object({
  type: z.literal('addition'),
  quantity: z.number().min(1, "Miqdor kamida 1 bo'lishi kerak"),
  date: z.date(),
  price: z.number().min(0, "Narx 0 dan katta yoki teng bo'lishi kerak"),
  supplier: z.string().min(1, "Ta'minotchini ko'rsating"),
  notes: z.string().optional()
});

// Create Consumption Transaction Schema
const createConsumptionTransactionSchema = z.object({
  type: z.literal('consumption'),
  quantity: z.number().min(1, "Miqdor kamida 1 bo'lishi kerak"),
  date: z.date(),
  section: z.string().min(1, "Sexni tanlang"),
  batch: z.string().optional(),
  notes: z.string().optional()
});

// Transfer Transaction Schema
const transferTransactionSchema = z.object({
  itemId: z.string().min(1, "Element ID si ko'rsatilmagan"),
  quantity: z.number().min(1, "Miqdor kamida 1 bo'lishi kerak"),
  fromSection: z.string().min(1, "Boshlang'ich sexni tanlang"),
  toSection: z.string().min(1, "Yakuniy sexni tanlang"),
  date: z.date(),
  notes: z.string().optional()
});

// Create Disposal Transaction Schema
const createDisposalTransactionSchema = z.object({
  type: z.literal('disposal'),
  quantity: z.number().min(1, "Miqdor kamida 1 bo'lishi kerak"),
  date: z.date(),
  reason: z.string().min(1, "Sababni ko'rsating"),
  notes: z.string().optional()
});

// Component for creating a new inventory item
interface CreateInventoryItemFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  sections: any[];
}

const CreateInventoryItemForm = ({ onSuccess, onCancel, sections }: CreateInventoryItemFormProps) => {
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof createInventoryItemSchema>>({
    resolver: zodResolver(createInventoryItemSchema),
    defaultValues: {
      name: "",
      code: "",
      type: "feed",
      quantity: 0,
      unit: "kg",
      price: 0,
      location: "Asosiy ombor",
      expiryDate: new Date(new Date().setMonth(new Date().getMonth() + 6)),
      supplier: "",
      safetyStock: 0,
      notes: "",
      nutritionalInfo: {
        protein: 0,
        fat: 0,
        fiber: 0,
        energy: 0
      }
    },
  });

  const selectedType = form.watch('type');

  const onSubmit = async (values: z.infer<typeof createInventoryItemSchema>) => {
    try {
      // Format the data
      const formattedValues = {
        ...values,
        expiryDate: values.expiryDate ? values.expiryDate.toISOString() : undefined,
      };
      
      await InventoryService.createInventoryItem(formattedValues);
      toast({
        title: "Element yaratildi",
        description: "Yangi omborxona elementi muvaffaqiyatli yaratildi",
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
                <FormLabel>Nomi</FormLabel>
                <FormControl>
                  <Input placeholder="Element nomi" {...field} />
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
                  <Input placeholder="FD-001" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tur</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Elementning turini tanlang" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="feed">Yem</SelectItem>
                    <SelectItem value="medicine">Dori</SelectItem>
                    <SelectItem value="equipment">Jihozlar</SelectItem>
                    <SelectItem value="cleaning">Tozalash vositalari</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="subType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Qo'shimcha tur (ixtiyoriy)</FormLabel>
                <FormControl>
                  <Input placeholder="Qo'shimcha kategoriya" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Miqdor</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="0" 
                    {...field}
                    onChange={e => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>O'lchov birligi</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Birlikni tanlang" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="kg">Kilogramm (kg)</SelectItem>
                    <SelectItem value="g">Gramm (g)</SelectItem>
                    <SelectItem value="l">Litr (l)</SelectItem>
                    <SelectItem value="ml">Millilitr (ml)</SelectItem>
                    <SelectItem value="dona">Dona (pc)</SelectItem>
                    <SelectItem value="qop">Qop</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Narx (so'm)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="0" 
                    {...field}
                    onChange={e => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Joylashuv</FormLabel>
                <FormControl>
                  <Input placeholder="Asosiy ombor" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="section"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sex (ixtiyoriy)</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sexni tanlang" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Sex tanlanmagan</SelectItem>
                    {sections.map((section) => (
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
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="expiryDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Yaroqlilik muddati (ixtiyoriy)</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
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
            name="supplier"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ta'minotchi</FormLabel>
                <FormControl>
                  <Input placeholder="Ta'minotchi nomi" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="safetyStock"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Minimal zaxira miqdori</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="0" 
                  {...field}
                  onChange={e => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormDescription>
                Bu qiymatdan kam bo'lganda tizim ogohlantirish beradi
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedType === 'feed' && (
          <div className="border p-4 rounded-md space-y-4">
            <h3 className="font-medium">Ozuqaviy ma'lumotlar (ixtiyoriy)</h3>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nutritionalInfo.protein"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Protein (%)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0" 
                        {...field}
                        onChange={e => field.onChange(Number(e.target.value))}
                        value={field.value || 0}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nutritionalInfo.fat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Yog' (%)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0" 
                        {...field}
                        onChange={e => field.onChange(Number(e.target.value))}
                        value={field.value || 0}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nutritionalInfo.fiber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tola (%)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0" 
                        {...field}
                        onChange={e => field.onChange(Number(e.target.value))}
                        value={field.value || 0}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nutritionalInfo.energy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Energiya (kcal/kg)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0" 
                        {...field}
                        onChange={e => field.onChange(Number(e.target.value))}
                        value={field.value || 0}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Qo'shimcha ma'lumot (ixtiyoriy)</FormLabel>
              <FormControl>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Element haqida qo'shimcha ma'lumot"
                  {...field}
                />
              </FormControl>
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

// Component for creating a transaction
interface CreateTransactionFormProps {
  itemId: string;
  itemName: string;
  itemType: InventoryItemType;
  onSuccess: () => void;
  onCancel: () => void;
  sections: any[];
  batches: any[];
  transactionType: TransactionType;
}

const CreateTransactionForm = ({ 
  itemId, 
  itemName, 
  itemType,
  onSuccess, 
  onCancel, 
  sections, 
  batches,
  transactionType 
}: CreateTransactionFormProps) => {
  const { toast } = useToast();
  
  // Use different schemas based on transaction type
  let FormSchema: any;
  switch (transactionType) {
    case 'addition':
      FormSchema = createAdditionTransactionSchema;
      break;
    case 'consumption':
      FormSchema = createConsumptionTransactionSchema;
      break;
    case 'disposal':
      FormSchema = createDisposalTransactionSchema;
      break;
    default:
      FormSchema = createAdditionTransactionSchema;
  }
  
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      type: transactionType as any,
      quantity: 1,
      date: new Date(),
      ...(transactionType === 'addition' ? { price: 0, supplier: "" } : {}),
      ...(transactionType === 'consumption' ? { section: "", batch: "" } : {}),
      ...(transactionType === 'disposal' ? { reason: "" } : {}),
      notes: ""
    },
  });

  const onSubmit = async (values: z.infer<typeof FormSchema>) => {
    try {
      // Convert date to ISO string
      const formattedValues = {
        ...values,
        date: values.date.toISOString(),
      };
      
      await InventoryService.addItemTransaction(itemId, formattedValues as any);
      toast({
        title: "Tranzaksiya yaratildi",
        description: "Omborxona tranzaksiyasi muvaffaqiyatli yaratildi",
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
        <div>
          <h3 className="font-medium">{itemName}</h3>
          <p className="text-sm text-muted-foreground">{TypeBadge({ type: itemType })}</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Miqdor</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="1" 
                    {...field}
                    onChange={e => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Sana</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
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

        {transactionType === 'addition' && (
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Narx (so'm)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="0" 
                      {...field}
                      onChange={e => field.onChange(Number(e.target.value))}
                    />
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
                    <Input placeholder="Ta'minotchi nomi" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {transactionType === 'consumption' && (
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="section"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sex</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sexni tanlang" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {sections.map((section) => (
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
              name="batch"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Partiya (ixtiyoriy)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Partiyani tanlang" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Partiya yo'q</SelectItem>
                      {batches.map((batch) => (
                        <SelectItem key={batch.id} value={batch.id}>
                          {batch.batchNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {transactionType === 'disposal' && (
          <FormField
            control={form.control}
            name="reason"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sabab</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sababni tanlang" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="expired">Muddati o'tgan</SelectItem>
                    <SelectItem value="damaged">Shikastlangan</SelectItem>
                    <SelectItem value="contaminated">Ifloslangan</SelectItem>
                    <SelectItem value="other">Boshqa</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Izohlar (ixtiyoriy)</FormLabel>
              <FormControl>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Tranzaksiya haqida qo'shimcha ma'lumot"
                  {...field}
                />
              </FormControl>
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

// Component for transferring items between sections
interface TransferItemFormProps {
  itemId: string;
  itemName: string;
  onSuccess: () => void;
  onCancel: () => void;
  sections: any[];
}

const TransferItemForm = ({ 
  itemId, 
  itemName, 
  onSuccess, 
  onCancel, 
  sections 
}: TransferItemFormProps) => {
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof transferTransactionSchema>>({
    resolver: zodResolver(transferTransactionSchema),
    defaultValues: {
      itemId,
      quantity: 1,
      fromSection: "",
      toSection: "",
      date: new Date(),
      notes: ""
    },
  });

  const onSubmit = async (values: z.infer<typeof transferTransactionSchema>) => {
    try {
      if (values.fromSection === values.toSection) {
        toast({
          title: "Xatolik",
          description: "Boshlang'ich va yakuniy sexlar bir xil bo'lishi mumkin emas",
          variant: "destructive",
        });
        return;
      }
      
      // Convert date to ISO string
      const formattedValues = {
        ...values,
        date: values.date.toISOString(),
      };
      
      await InventoryService.transferItem(formattedValues);
      toast({
        title: "Ko'chirish muvaffaqiyatli",
        description: "Element muvaffaqiyatli ko'chirildi",
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
        <div>
          <h3 className="font-medium">{itemName}</h3>
          <p className="text-sm text-muted-foreground">Elementni bir sexdan boshqasiga ko'chirish</p>
        </div>
        
        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Miqdor</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="1" 
                  {...field}
                  onChange={e => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="fromSection"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Boshlang'ich sex</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sexni tanlang" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {sections.map((section) => (
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
            name="toSection"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Yakuniy sex</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sexni tanlang" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {sections.map((section) => (
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
        </div>

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Ko'chirish sanasi</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
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
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Izohlar (ixtiyoriy)</FormLabel>
              <FormControl>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Ko'chirish haqida qo'shimcha ma'lumot"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel} type="button">
            Bekor qilish
          </Button>
          <Button type="submit">Ko'chirish</Button>
        </div>
      </form>
    </Form>
  );
};

// Inventory Item Details Component
interface InventoryItemDetailsProps {
  itemId: string;
  onClose: () => void;
}

const InventoryItemDetails = ({ itemId, onClose }: InventoryItemDetailsProps) => {
  const { toast } = useToast();
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showTransactionModal, setShowTransactionModal] = useState<boolean>(false);
  const [showTransferModal, setShowTransferModal] = useState<boolean>(false);
  const [currentTransactionType, setCurrentTransactionType] = useState<TransactionType>('addition');
  const [sections, setSections] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);

  useEffect(() => {
    const fetchItemDetails = async () => {
      setLoading(true);
      try {
        const response = await InventoryService.getInventoryItem(itemId);
        setItem(response.item);
        setTransactions(response.transactions);
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

    fetchItemDetails();
  }, [itemId]);

  useEffect(() => {
    const fetchSectionsAndBatches = async () => {
      try {
        const [sectionsResponse, batchesResponse] = await Promise.all([
          SectionService.getAllSections(),
          BatchService.getAllBatches()
        ]);
        setSections(sectionsResponse.sections ?? []);
        setBatches(batchesResponse.batches);
      } catch (error: any) {
        toast({
          title: "Ma'lumotlarni yuklashda xatolik",
          description: error.message,
          variant: "destructive",
        });
      }
    };

    fetchSectionsAndBatches();
  }, []);

  const handleAddTransaction = (type: TransactionType) => {
    setCurrentTransactionType(type);
    setShowTransactionModal(true);
  };

  const handleTransferItem = () => {
    setShowTransferModal(true);
  };

  const handleTransactionSuccess = () => {
    setShowTransactionModal(false);
    setShowTransferModal(false);
    
    // Refresh item details
    const fetchItemDetails = async () => {
      try {
        const response = await InventoryService.getInventoryItem(itemId);
        setItem(response.item);
        setTransactions(response.transactions);
      } catch (error: any) {
        toast({
          title: "Ma'lumotlarni yangilashda xatolik",
          description: error.message,
          variant: "destructive",
        });
      }
    };

    fetchItemDetails();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="text-center p-6">
        <p className="text-red-500">Element ma'lumotlarini yuklashda xatolik yuz berdi</p>
        <Button onClick={onClose} className="mt-4">Yopish</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            <TypeIcon type={item.type} className="mr-2" />
            {item.name}
          </h2>
          <div className="flex gap-2 mt-1 items-center">
            <Badge variant="outline" className="bg-gray-100">
              <Hash className="h-3 w-3 mr-1" /> {item.code}
            </Badge>
            {TypeBadge({ type: item.type })}
            {StatusBadge({ status: item.status })}
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleAddTransaction('addition')}
          >
            <ArrowUpRight className="h-4 w-4 mr-2 text-green-500" />
            Qo'shish
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleAddTransaction('consumption')}
          >
            <ArrowDownLeft className="h-4 w-4 mr-2 text-amber-500" />
            Sarflash
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleTransferItem}
          >
            <ArrowLeftRight className="h-4 w-4 mr-2 text-blue-500" />
            Ko'chirish
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleAddTransaction('disposal')}
          >
            <Trash2 className="h-4 w-4 mr-2 text-red-500" />
            Yo'qotish
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="border rounded-md p-4">
          <h3 className="font-medium mb-3">Asosiy ma'lumotlar</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Miqdor:</span>
              <span className="font-medium">{item.quantity} {item.unit}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Narx:</span>
              <span className="font-medium">{new Intl.NumberFormat('uz-UZ').format(item.price)} so'm/{item.unit}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Umumiy qiymat:</span>
              <span className="font-medium">{new Intl.NumberFormat('uz-UZ').format(item.price * item.quantity)} so'm</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Minimal zaxira:</span>
              <span className="font-medium">{item.safetyStock} {item.unit}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Joylashuv:</span>
              <span className="font-medium">{item.location}</span>
            </div>
            {item.section && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sex:</span>
                <span className="font-medium">{item.section.name}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ta'minotchi:</span>
              <span className="font-medium">
                {typeof item.supplier === 'string' ? item.supplier : item.supplier.name}
              </span>
            </div>
            {item.expiryDate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Yaroqlilik muddati:</span>
                <span className="font-medium">{new Date(item.expiryDate).toLocaleDateString('uz-UZ')}</span>
              </div>
            )}
          </div>
        </div>
        
        {item.type === 'feed' && item.nutritionalInfo && (
          <div className="border rounded-md p-4">
            <h3 className="font-medium mb-3">Ozuqaviy ma'lumotlar</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Protein:</span>
                <span className="font-medium">{item.nutritionalInfo.protein}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Yog':</span>
                <span className="font-medium">{item.nutritionalInfo.fat}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tola:</span>
                <span className="font-medium">{item.nutritionalInfo.fiber}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Energiya:</span>
                <span className="font-medium">{item.nutritionalInfo.energy} kcal/kg</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {item.notes && (
        <div className="border rounded-md p-4">
          <h3 className="font-medium mb-2">Qo'shimcha ma'lumot</h3>
          <p className="text-sm text-muted-foreground">{item.notes}</p>
        </div>
      )}

      <div>
        <h3 className="font-medium mb-3">Tranzaksiyalar tarixi</h3>
        {transactions.length === 0 ? (
          <div className="text-center p-6 border rounded-md">
            <p className="text-muted-foreground">Hali tranzaksiyalar mavjud emas</p>
          </div>
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sana</TableHead>
                  <TableHead>Tur</TableHead>
                  <TableHead>Miqdor</TableHead>
                  <TableHead>Kim tomonidan</TableHead>
                  <TableHead>Qo'shimcha ma'lumot</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      {new Date(transaction.date).toLocaleDateString('uz-UZ')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <TransactionTypeIcon type={transaction.type} />
                        <span>
                          {transaction.type === 'addition' && 'Qoshish'}
                          {transaction.type === 'consumption' && 'Sarflash'}
                          {transaction.type === 'transfer' && 'Kochirish'}
                          {transaction.type === 'disposal' && 'Yoqotish'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {transaction.quantity} {item.unit}
                      {transaction.price && (
                        <span className="text-xs text-muted-foreground block">
                          {new Intl.NumberFormat('uz-UZ').format(transaction.price)} so'm/{item.unit}
                        </span>
                      )}
                      {transaction.totalCost && (
                        <span className="text-xs text-muted-foreground block">
                          Jami: {new Intl.NumberFormat('uz-UZ').format(transaction.totalCost)} so'm
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {transaction.performedBy.name}
                      {transaction.section && (
                        <span className="text-xs text-muted-foreground block">
                          Sex: {transaction.section.name}
                        </span>
                      )}
                      {transaction.batch && (
                        <span className="text-xs text-muted-foreground block">
                          Partiya: {transaction.batch.batchNumber}
                        </span>
                      )}
                      {transaction.fromSection && transaction.toSection && (
                        <span className="text-xs text-muted-foreground block">
                          {transaction.fromSection.name} → {transaction.toSection.name}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {transaction.notes || (
                        transaction.reason ? `Sabab: ${transaction.reason}` : '-'
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={showTransactionModal} onOpenChange={setShowTransactionModal}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              {currentTransactionType === 'addition' && (
                <>
                  <ArrowUpRight className="h-4 w-4 mr-2 text-green-500" />
                  Element qo'shish
                </>
              )}
              {currentTransactionType === 'consumption' && (
                <>
                  <ArrowDownLeft className="h-4 w-4 mr-2 text-amber-500" />
                  Element sarflash
                </>
              )}
              {currentTransactionType === 'disposal' && (
                <>
                  <Trash2 className="h-4 w-4 mr-2 text-red-500" />
                  Element yo'qotish
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {currentTransactionType === 'addition' && 'Omborxonaga yangi elementlar qoshish'}
              {currentTransactionType === 'consumption' && 'Omborxonadan element sarflash'}
              {currentTransactionType === 'disposal' && 'Yaroqsiz elementlarni yoqotish'}
            </DialogDescription>
          </DialogHeader>
          
          <CreateTransactionForm
            itemId={item.id}
            itemName={item.name}
            itemType={item.type}
            onSuccess={handleTransactionSuccess}
            onCancel={() => setShowTransactionModal(false)}
            sections={sections}
            batches={batches}
            transactionType={currentTransactionType}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showTransferModal} onOpenChange={setShowTransferModal}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <ArrowLeftRight className="h-4 w-4 mr-2 text-blue-500" />
              Elementni ko'chirish
            </DialogTitle>
            <DialogDescription>
              Elementni bir sexdan boshqa sexga ko'chirish
            </DialogDescription>
          </DialogHeader>
          
          <TransferItemForm
            itemId={item.id}
            itemName={item.name}
            onSuccess={handleTransactionSuccess}
            onCancel={() => setShowTransferModal(false)}
            sections={sections}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Transactions List Component
interface TransactionsListProps {
  transactions: InventoryTransaction[];
  onPageChange: (page: number) => void;
  currentPage: number;
  totalPages: number;
}

const TransactionsList = ({ transactions, onPageChange, currentPage, totalPages }: TransactionsListProps) => {
  return (
    <div className="space-y-4">
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sana</TableHead>
              <TableHead>Element</TableHead>
              <TableHead>Tur</TableHead>
              <TableHead>Miqdor</TableHead>
              <TableHead>Kim tomonidan</TableHead>
              <TableHead>Sex</TableHead>
              <TableHead>Qo'shimcha ma'lumot</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <Package className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Tranzaksiyalar topilmadi</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    {new Date(transaction.date).toLocaleDateString('uz-UZ')}
                  </TableCell>
                  <TableCell>
                    {transaction.item ? (
                      <div className="flex items-center gap-1">
                        <TypeIcon type={transaction.item.type} />
                        <span>{transaction.item.name}</span>
                      </div>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <TransactionTypeIcon type={transaction.type} />
                      <span>
                        {transaction.type === 'addition' && 'Qoshish'}
                        {transaction.type === 'consumption' && 'Sarflash'}
                        {transaction.type === 'transfer' && 'Kochirish'}
                        {transaction.type === 'disposal' && 'Yoqotish'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {transaction.quantity}
                    {transaction.price && (
                      <span className="text-xs text-muted-foreground block">
                        {new Intl.NumberFormat('uz-UZ').format(transaction.price)} so'm
                      </span>
                    )}
                    {transaction.totalCost && (
                      <span className="text-xs text-muted-foreground block">
                        Jami: {new Intl.NumberFormat('uz-UZ').format(transaction.totalCost)} so'm
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {transaction.performedBy.name}
                  </TableCell>
                  <TableCell>
                    {transaction.section ? transaction.section.name : 
                      (transaction.fromSection && transaction.toSection ? (
                        <span className="flex items-center text-xs">
                          {transaction.fromSection.name} <ChevronRight className="h-3 w-3 mx-1" /> {transaction.toSection.name}
                        </span>
                      ) : '-')}
                  </TableCell>
                  <TableCell>
                    {transaction.notes || (
                      transaction.reason ? `Sabab: ${transaction.reason}` : '-'
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => onPageChange(currentPage - 1)}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            {[...Array(totalPages)].map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink
                  isActive={currentPage === i + 1}
                  onClick={() => onPageChange(i + 1)}
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => onPageChange(currentPage + 1)}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};

// Main Inventory Page Component
const InventoryPage = () => {
  const { toast } = useToast();
  const { user } = useSelector((state: RootState) => state.auth);
  const [activeTab, setActiveTab] = useState<string>('items');
  const [viewMode, setViewMode] = useState<string>('grid');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [inventory, setInventory] = useState<any>({
    total: 0,
    totalPages: 0,
    currentPage: 1,
    summary: {
      totalValue: 0,
      itemsByType: {},
      lowStockItems: 0,
      outOfStockItems: 0,
      expiringItems: 0
    }
  });
  const [transactionsSummary, setTransactionsSummary] = useState<any>({
    total: 0,
    totalPages: 0,
    currentPage: 1,
    summary: {
      totalAdditions: 0,
      totalConsumptions: 0,
      totalTransfers: 0,
      totalDisposals: 0,
      totalCost: 0,
      bySection: []
    }
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [sections, setSections] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  
  // Filter states for inventory items
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sectionFilter, setSectionFilter] = useState<string>('');
  const [expiryFilter, setExpiryFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [limit] = useState<number>(12);
  
  // Filter states for transactions
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<string>('');
  const [transactionItemTypeFilter, setTransactionItemTypeFilter] = useState<string>('');
  const [transactionSectionFilter, setTransactionSectionFilter] = useState<string>('');
  const [transactionBatchFilter, setTransactionBatchFilter] = useState<string>('');
  const [transactionStartDate, setTransactionStartDate] = useState<Date | undefined>(undefined);
  const [transactionEndDate, setTransactionEndDate] = useState<Date | undefined>(undefined);
  const [transactionPage, setTransactionPage] = useState<number>(1);
  
  const fetchInventoryItems = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        limit,
      };
      
      if (typeFilter) {
        params.type = typeFilter;
      }
      
      if (statusFilter) {
        params.status = statusFilter;
      }
      
      if (sectionFilter) {
        params.section = sectionFilter;
      }
      
      if (expiryFilter) {
        params.expiry = expiryFilter;
      }
      
      const response = await InventoryService.getInventoryItems(params);
      setItems(response.items);
      setInventory({
        total: response.total,
        totalPages: response.totalPages,
        currentPage: response.currentPage,
        summary: response.summary
      });
    } catch (error: any) {
      toast({
        title: "Omborxona ma'lumotlarini yuklashda xatolik",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: transactionPage,
        limit,
      };
      
      if (transactionTypeFilter) {
        params.type = transactionTypeFilter;
      }
      
      if (transactionItemTypeFilter) {
        params.itemType = transactionItemTypeFilter;
      }
      
      if (transactionSectionFilter) {
        params.section = transactionSectionFilter;
      }
      
      if (transactionBatchFilter) {
        params.batch = transactionBatchFilter;
      }
      
      if (transactionStartDate) {
        params.startDate = transactionStartDate.toISOString();
      }
      
      if (transactionEndDate) {
        params.endDate = transactionEndDate.toISOString();
      }
      
      const response = await InventoryService.getTransactions(params);
      setTransactions(response.transactions);
      setTransactionsSummary({
        total: response.total,
        totalPages: response.totalPages,
        currentPage: response.currentPage,
        summary: response.summary
      });
    } catch (error: any) {
      toast({
        title: "Tranzaksiyalarni yuklashda xatolik",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSectionsAndBatches = async () => {
    try {
      const [sectionsResponse, batchesResponse] = await Promise.all([
        SectionService.getAllSections(),
        BatchService.getAllBatches()
      ]);
      setSections(sectionsResponse.sections ?? []);
      setBatches(batchesResponse.batches);
    } catch (error: any) {
      toast({
        title: "Ma'lumotlarni yuklashda xatolik",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (activeTab === 'items') {
      fetchInventoryItems();
    } else {
      fetchTransactions();
    }
  }, [
    activeTab, 
    currentPage, 
    typeFilter, 
    statusFilter, 
    sectionFilter, 
    expiryFilter,
    transactionPage,
    transactionTypeFilter,
    transactionItemTypeFilter,
    transactionSectionFilter,
    transactionBatchFilter,
    transactionStartDate,
    transactionEndDate
  ]);

  useEffect(() => {
    fetchSectionsAndBatches();
  }, []);

  // WebSocket handlers for real-time updates
  useEffect(() => {
    const handleItemCreated = () => {
      if (activeTab === 'items') {
        fetchInventoryItems();
      }
      toast({
        title: "Yangi element",
        description: "Yangi omborxona elementi qo'shildi",
      });
    };

    const handleItemUpdated = () => {
      if (activeTab === 'items') {
        fetchInventoryItems();
      }
      if (selectedItem) {
        // If we are viewing an item, refresh its data
        setShowDetailsModal(true);
      }
    };

    const handleTransactionCreated = () => {
      if (activeTab === 'transactions') {
        fetchTransactions();
      } else {
        fetchInventoryItems();
      }
      toast({
        title: "Yangi tranzaksiya",
        description: "Yangi omborxona tranzaksiyasi yaratildi",
      });
    };

    const handleLowStock = (data: any) => {
      toast({
        title: "Kam zaxira ogohlantirishni",
        description: `"${data.itemName}" elementi kam zaxira chegarasidan o'tib ketdi`,
        variant: "warning",
      });
      if (activeTab === 'items') {
        fetchInventoryItems();
      }
    };

    const handleOutOfStock = (data: any) => {
      toast({
        title: "Zaxira tugadi",
        description: `"${data.itemName}" elementi tugadi`,
        variant: "destructive",
      });
      if (activeTab === 'items') {
        fetchInventoryItems();
      }
    };

    // Subscribe to WebSocket events
    WebSocketService.on(WebSocketEventType.INVENTORY_ITEM_CREATED, handleItemCreated);
    WebSocketService.on(WebSocketEventType.INVENTORY_ITEM_UPDATED, handleItemUpdated);
    WebSocketService.on(WebSocketEventType.INVENTORY_TRANSACTION_CREATED, handleTransactionCreated);
    WebSocketService.on(WebSocketEventType.INVENTORY_LOW_STOCK, handleLowStock);
    WebSocketService.on(WebSocketEventType.INVENTORY_OUT_OF_STOCK, handleOutOfStock);

    // Cleanup on unmount
    return () => {
      WebSocketService.off(WebSocketEventType.INVENTORY_ITEM_CREATED, handleItemCreated);
      WebSocketService.off(WebSocketEventType.INVENTORY_ITEM_UPDATED, handleItemUpdated);
      WebSocketService.off(WebSocketEventType.INVENTORY_TRANSACTION_CREATED, handleTransactionCreated);
      WebSocketService.off(WebSocketEventType.INVENTORY_LOW_STOCK, handleLowStock);
      WebSocketService.off(WebSocketEventType.INVENTORY_OUT_OF_STOCK, handleOutOfStock);
    };
  }, [selectedItem, activeTab]);

  const handleViewItem = (id: string) => {
    setSelectedItem(id);
    setShowDetailsModal(true);
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    if (activeTab === 'items') {
      fetchInventoryItems();
    }
    toast({
      title: "Muvaffaqiyatli",
      description: "Yangi omborxona elementi yaratildi",
    });
  };

  const renderSummaryCards = () => {
    if (activeTab === 'items') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SummaryCard
            title="Umumiy qiymat"
            value={new Intl.NumberFormat('uz-UZ').format(inventory.summary.totalValue) + " so'm"}
            icon={<CircleDollarSign className="h-4 w-4 text-muted-foreground" />}
            description="Barcha omborxona elementlari qiymati"
          />
          <SummaryCard
            title="Jami elementlar"
            value={inventory.total}
            icon={<Package className="h-4 w-4 text-muted-foreground" />}
            description={`${Object.entries(inventory.summary.itemsByType).map(([type, count]) => `${type}: ${count}`).join(', ')}`}
          />
          <SummaryCard
            title="Kam zaxiradagi elementlar"
            value={inventory.summary.lowStockItems}
            icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
            description="Minimal zaxira chegarasidan pastda"
            className={inventory.summary.lowStockItems > 0 ? "border-amber-200 bg-amber-50" : ""}
          />
          <SummaryCard
            title="Tugagan elementlar"
            value={inventory.summary.outOfStockItems}
            icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
            description="Omborxonada mavjud emas"
            className={inventory.summary.outOfStockItems > 0 ? "border-red-200 bg-red-50" : ""}
          />
        </div>
      );
    } else {
      return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SummaryCard
            title="Jami tranzaksiyalar"
            value={transactionsSummary.total}
            icon={<Activity className="h-4 w-4 text-muted-foreground" />}
            description="Barcha omborxona harakatlari"
          />
          <SummaryCard
            title="Qo'shish tranzaksiyalari"
            value={transactionsSummary.summary.totalAdditions}
            icon={<ArrowUpRight className="h-4 w-4 text-green-500" />}
            description="Omborxonaga qo'shilgan elementlar"
          />
          <SummaryCard
            title="Sarflash tranzaksiyalari"
            value={transactionsSummary.summary.totalConsumptions}
            icon={<ArrowDownLeft className="h-4 w-4 text-amber-500" />}
            description="Ishlatilgan elementlar"
          />
          <SummaryCard
            title="Jami sarflangan"
            value={new Intl.NumberFormat('uz-UZ').format(transactionsSummary.summary.totalCost) + " so'm"}
            icon={<CircleDollarSign className="h-4 w-4 text-muted-foreground" />}
            description="Barcha sarflangan elementlar qiymati"
          />
        </div>
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Omborxona boshqaruvi</h1>
          <p className="text-muted-foreground">Barcha fermadagi resurslarni saqlash va nazorat qilish</p>
        </div>
        {activeTab === 'items' && (
          <Button onClick={() => setShowCreateModal(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Yangi element
          </Button>
        )}
      </div>

      {renderSummaryCards()}

      <Tabs defaultValue="items" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="items" className="flex items-center">
              <Package className="h-4 w-4 mr-2" />
              <span>Elementlar</span>
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center">
              <Activity className="h-4 w-4 mr-2" />
              <span>Tranzaksiyalar</span>
            </TabsTrigger>
          </TabsList>

          {activeTab === 'items' && (
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                <TableIcon className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <TabsContent value="items" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
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
                  <Tag className="mr-2 h-4 w-4" />
                  <span>Tur</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha turlar</SelectItem>
                <SelectItem value="feed">Yem</SelectItem>
                <SelectItem value="medicine">Dori</SelectItem>
                <SelectItem value="equipment">Jihozlar</SelectItem>
                <SelectItem value="cleaning">Tozalash</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <div className="flex items-center">
                  <Activity className="mr-2 h-4 w-4" />
                  <span>Holat</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha holatlar</SelectItem>
                <SelectItem value="available">Mavjud</SelectItem>
                <SelectItem value="low_stock">Kam zaxira</SelectItem>
                <SelectItem value="out_of_stock">Tugagan</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sectionFilter} onValueChange={setSectionFilter}>
              <SelectTrigger>
                <div className="flex items-center">
                  <Building2 className="mr-2 h-4 w-4" />
                  <span>Sex</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha sexlar</SelectItem>
                {sections.map((section) => (
                  <SelectItem key={section.id} value={section.id}>
                    {section.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={expiryFilter} onValueChange={setExpiryFilter}>
              <SelectTrigger>
                <div className="flex items-center">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  <span>Yaroqlilik</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha muddatlar</SelectItem>
                <SelectItem value="expired">Muddati o'tgan</SelectItem>
                <SelectItem value="expiring_soon">Muddati yaqin</SelectItem>
                <SelectItem value="valid">Yaroqli</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center p-12 border rounded-md">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Elementlar topilmadi</h3>
              <p className="text-muted-foreground mb-4">Hozirda omborxonada elementlar mavjud emas yoki filtrlarga mos elementlar topilmadi</p>
              <Button onClick={() => setShowCreateModal(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Yangi element qo'shish
              </Button>
            </div>
          ) : viewMode === 'grid' ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {items.map((item) => (
                  <Card key={item.id} className="overflow-hidden">
                    <CardHeader className="p-4 pb-2">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <CardTitle className="text-base flex items-center">
                            <TypeIcon type={item.type} className="mr-2" />
                            {item.name}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {item.code}
                          </CardDescription>
                        </div>
                        <StatusBadge status={item.status} />
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Tur:</span>
                          <span>{TypeBadge({ type: item.type })}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Miqdor:</span>
                          <span>{item.quantity} {item.unit}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Narx:</span>
                          <span>{new Intl.NumberFormat('uz-UZ').format(item.price)} so'm</span>
                        </div>
                        {item.section && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Sex:</span>
                            <span>{item.section.name}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="p-4 pt-0">
                      <Button variant="outline" className="w-full" onClick={() => handleViewItem(item.id)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Ko'rish
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>

              {inventory.totalPages > 1 && (
                <Pagination className="mt-4">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    {[...Array(inventory.totalPages)].map((_, i) => (
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
                        onClick={() => setCurrentPage((prev) => (prev < inventory.totalPages ? prev + 1 : prev))}
                        className={currentPage === inventory.totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          ) : (
            <>
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nomi</TableHead>
                      <TableHead>Kod</TableHead>
                      <TableHead>Tur</TableHead>
                      <TableHead>Miqdor</TableHead>
                      <TableHead>Narx</TableHead>
                      <TableHead>Minimal zaxira</TableHead>
                      <TableHead>Holat</TableHead>
                      <TableHead>Amallar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.code}</TableCell>
                        <TableCell>{TypeBadge({ type: item.type })}</TableCell>
                        <TableCell>{item.quantity} {item.unit}</TableCell>
                        <TableCell>{new Intl.NumberFormat('uz-UZ').format(item.price)} so'm</TableCell>
                        <TableCell>{item.safetyStock} {item.unit}</TableCell>
                        <TableCell>{StatusBadge({ status: item.status })}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewItem(item.id)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ko'rish
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {inventory.totalPages > 1 && (
                <Pagination className="mt-4">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    {[...Array(inventory.totalPages)].map((_, i) => (
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
                        onClick={() => setCurrentPage((prev) => (prev < inventory.totalPages ? prev + 1 : prev))}
                        className={currentPage === inventory.totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Select value={transactionTypeFilter} onValueChange={setTransactionTypeFilter}>
              <SelectTrigger>
                <div className="flex items-center">
                  <Tag className="mr-2 h-4 w-4" />
                  <span>Tranzaksiya turi</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha tranzaksiyalar</SelectItem>
                <SelectItem value="addition">Qo'shish</SelectItem>
                <SelectItem value="consumption">Sarflash</SelectItem>
                <SelectItem value="transfer">Ko'chirish</SelectItem>
                <SelectItem value="disposal">Yo'qotish</SelectItem>
              </SelectContent>
            </Select>

            <Select value={transactionItemTypeFilter} onValueChange={setTransactionItemTypeFilter}>
              <SelectTrigger>
                <div className="flex items-center">
                  <Package className="mr-2 h-4 w-4" />
                  <span>Element turi</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha elementlar</SelectItem>
                <SelectItem value="feed">Yem</SelectItem>
                <SelectItem value="medicine">Dori</SelectItem>
                <SelectItem value="equipment">Jihozlar</SelectItem>
                <SelectItem value="cleaning">Tozalash</SelectItem>
              </SelectContent>
            </Select>

            <Select value={transactionSectionFilter} onValueChange={setTransactionSectionFilter}>
              <SelectTrigger>
                <div className="flex items-center">
                  <Building2 className="mr-2 h-4 w-4" />
                  <span>Sex</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha sexlar</SelectItem>
                {sections.map((section) => (
                  <SelectItem key={section.id} value={section.id}>
                    {section.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={transactionBatchFilter} onValueChange={setTransactionBatchFilter}>
              <SelectTrigger>
                <div className="flex items-center">
                  <Package className="mr-2 h-4 w-4" />
                  <span>Partiya</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha partiyalar</SelectItem>
                {batches.map((batch) => (
                  <SelectItem key={batch.id} value={batch.id}>
                    {batch.batchNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="flex flex-col">
                <Label htmlFor="start-date">Boshlang'ich sana</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="start-date"
                      variant={"outline"}
                      className={cn(
                        "pl-3 text-left font-normal",
                        !transactionStartDate && "text-muted-foreground"
                      )}
                    >
                      {transactionStartDate ? (
                        format(transactionStartDate, "PPP")
                      ) : (
                        <span>Sana tanlang</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={transactionStartDate}
                      onSelect={setTransactionStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="flex-1">
              <div className="flex flex-col">
                <Label htmlFor="end-date">Tugash sana</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="end-date"
                      variant={"outline"}
                      className={cn(
                        "pl-3 text-left font-normal",
                        !transactionEndDate && "text-muted-foreground"
                      )}
                    >
                      {transactionEndDate ? (
                        format(transactionEndDate, "PPP")
                      ) : (
                        <span>Sana tanlang</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={transactionEndDate}
                      onSelect={setTransactionEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setTransactionStartDate(undefined);
                  setTransactionEndDate(undefined);
                }}
              >
                Sanalarni tozalash
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <TransactionsList
              transactions={transactions}
              onPageChange={(page) => setTransactionPage(page)}
              currentPage={transactionPage}
              totalPages={transactionsSummary.totalPages}
            />
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yangi omborxona elementi yaratish</DialogTitle>
            <DialogDescription>
              Yangi omborxona elementi yaratish uchun quyidagi formani to'ldiring
            </DialogDescription>
          </DialogHeader>
          <CreateInventoryItemForm
            onSuccess={handleCreateSuccess}
            onCancel={() => setShowCreateModal(false)}
            sections={sections}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Package className="mr-2 h-5 w-5" />
              Omborxona elementi tafsilotlari
            </DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <InventoryItemDetails
              itemId={selectedItem}
              onClose={() => setShowDetailsModal(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryPage;