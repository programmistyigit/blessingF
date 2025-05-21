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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

// Form validation schema
const employeeFormSchema = z.object({
  name: z.string().min(3, { message: "Ism kamida 3 ta belgidan iborat bo'lishi kerak" }),
  phoneNumber: z.string().regex(/^\+?\d{10,15}$/, { message: "Telefon raqam to'g'ri formatda bo'lishi kerak" }),
  role: z.string().min(1, { message: "Rolni tanlash majburiy" }),
  section: z.string().min(1, { message: "Bo'limni tanlash majburiy" }),
  position: z.string().min(1, { message: "Lavozimni tanlash majburiy" }),
  password: z.string().min(6, { message: "Parol kamida 6 ta belgidan iborat bo'lishi kerak" }).optional(),
});

type EmployeeFormValues = z.infer<typeof employeeFormSchema>;

interface Section {
  id: string;
  name: string;
}

interface Position {
  id: string;
  name: string;
}

interface EmployeeFormProps {
  sections: Section[];
  positions: Position[];
  onSubmit: (data: EmployeeFormValues) => void;
  isSubmitting?: boolean;
  defaultValues?: Partial<EmployeeFormValues>;
  isEditing?: boolean;
  title?: string;
}

const EmployeeForm: React.FC<EmployeeFormProps> = ({
  sections,
  positions,
  onSubmit,
  isSubmitting = false,
  defaultValues,
  isEditing = false,
  title = isEditing ? "Xodimni Tahrirlash" : "Yangi Xodim Qo'shish"
}) => {
  // Adjust schema if editing (password not required)
  const schema = isEditing 
    ? employeeFormSchema.omit({ password: true }) 
    : employeeFormSchema;
  
  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultValues?.name || '',
      phoneNumber: defaultValues?.phoneNumber || '',
      role: defaultValues?.role || 'worker',
      section: defaultValues?.section || '',
      position: defaultValues?.position || '',
      ...(isEditing ? {} : { password: '' })
    }
  });

  const roles = [
    { id: 'worker', name: 'Ishchi' },
    { id: 'manager', name: 'Menejer' },
    { id: 'boss', name: "Bo'lim boshlig'i" }
  ];

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
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>To'liq Ism</FormLabel>
                    <FormControl>
                      <Input placeholder="Alisher Zokirov" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefon Raqami</FormLabel>
                    <FormControl>
                      <Input placeholder="+998901234567" {...field} />
                    </FormControl>
                    <FormDescription>
                      Xalqaro format: +998XXXXXXXXX
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Rolni tanlang" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name}
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
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lavozim</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Lavozimni tanlang" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {positions.map((position) => (
                          <SelectItem key={position.id} value={position.id}>
                            {position.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {!isEditing && (
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parol</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormDescription>
                        Kamida 6 ta belgi
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
            
            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline">
                Bekor qilish
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saqlanmoqda...' : isEditing ? "Yangilash" : "Qo'shish"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default EmployeeForm;
