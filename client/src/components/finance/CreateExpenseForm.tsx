import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ExpenseCategory, getCategoryName } from "./ExpenseCategoryIcon";
import { useToast } from "@/hooks/use-toast";
import { FinanceService } from "@/services/FinanceService";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Form sxemasi
const expenseFormSchema = z.object({
  title: z.string().min(3, {
    message: "Nom kamida 3 ta belgidan iborat bo'lishi kerak",
  }),
  amount: z.coerce.number().positive({
    message: "Miqdor musbat son bo'lishi kerak",
  }),
  category: z.enum([
    "feed", 
    "medicine", 
    "labor", 
    "maintenance", 
    "utilities", 
    "transport",
    "infrastructure",
    "equipment",
    "electricity",
    "other"
  ] as const),
  description: z.string().optional(),
  invoiceNumber: z.string().optional(),
  vendorName: z.string().min(2, {
    message: "Yetkazib beruvchi nomi kamida 2 ta belgidan iborat bo'lishi kerak",
  }),
  expenseDate: z.date({
    required_error: "Xarajat sanasini tanlash kerak",
  }),
  dueDate: z.date().optional(),
  attachments: z.array(z.string()).optional(),
});

// Form ma'lumotlari turi
type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

interface CreateExpenseFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function CreateExpenseForm({ onSuccess, onCancel }: CreateExpenseFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Xarajat yaratish uchun mutatsiya
  const createExpenseMutation = useMutation({
    mutationFn: (data: ExpenseFormValues) => 
      FinanceService.createExpense(data),
    onSuccess: () => {
      toast({
        title: "Xarajat muvaffaqiyatli yaratildi",
        description: "Yangi xarajat ma'lumotlari saqlandi",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/finance/expenses'] });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Xatolik yuz berdi",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form
  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      title: "",
      amount: undefined,
      category: "other",
      description: "",
      invoiceNumber: "",
      vendorName: "",
      expenseDate: new Date(),
      attachments: [],
    },
  });

  // Forma yuborilganda
  function onSubmit(data: ExpenseFormValues) {
    createExpenseMutation.mutate(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Nom */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Xarajat nomi</FormLabel>
                <FormControl>
                  <Input placeholder="Xarajat nomini kiriting" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Summa */}
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Summa (so'm)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Kategoriya */}
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kategoriya</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Kategoriya tanlang" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(Object.keys(getCategoryName) as ExpenseCategory[]).map(
                      (category) => (
                        <SelectItem key={category} value={category}>
                          {getCategoryName(category)}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Yetkazib beruvchi */}
          <FormField
            control={form.control}
            name="vendorName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Yetkazib beruvchi</FormLabel>
                <FormControl>
                  <Input placeholder="Yetkazib beruvchi nomini kiriting" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Xarajat sanasi */}
          <FormField
            control={form.control}
            name="expenseDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Xarajat sanasi</FormLabel>
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
                          format(field.value, "dd.MM.yyyy")
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

          {/* To'lov sanasi */}
          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>To'lov sanasi (ixtiyoriy)</FormLabel>
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
                          format(field.value, "dd.MM.yyyy")
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
                      selected={field.value || undefined}
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

        {/* Hisob-faktura raqami */}
        <FormField
          control={form.control}
          name="invoiceNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hisob-faktura raqami (ixtiyoriy)</FormLabel>
              <FormControl>
                <Input placeholder="Hisob-faktura raqamini kiriting" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tavsif */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tavsif (ixtiyoriy)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Xarajat haqida qo'shimcha ma'lumotlar"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Bekor qilish
          </Button>
          <Button 
            type="submit"
            disabled={createExpenseMutation.isPending}
          >
            {createExpenseMutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </div>
      </form>
    </Form>
  );
}