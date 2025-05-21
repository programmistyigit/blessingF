import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getCategorySettings, updateSettings } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Loader2 } from "lucide-react";

const SecuritySettings: React.FC = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    twoFactorAuthEnabled: false,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: false,
      expiryDays: 90
    },
    ipRestriction: {
      enabled: false,
      allowedIps: []
    }
  });
  
  // Get security settings from API
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/settings/security"],
    queryFn: () => getCategorySettings("security")
  });
  
  // Update settings mutation
  const updateMutation = useMutation({
    mutationFn: (data: any) => updateSettings("security", data),
    onSuccess: () => {
      toast({
        title: "Sozlamalar saqlandi",
        description: "Xavfsizlik sozlamalari muvaffaqiyatli yangilandi",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/settings/security"] });
    },
    onError: (error: any) => {
      toast({
        title: "Xatolik yuz berdi",
        description: error.message || "Sozlamalarni saqlashda xatolik yuz berdi",
        variant: "destructive",
      });
    },
  });
  
  // Update form data when settings are loaded
  useEffect(() => {
    if (data?.data?.settings) {
      setFormData(prev => ({
        ...prev,
        ...data.data.settings
      }));
    }
  }, [data]);
  
  // Handle form field changes
  const handleChange = (name: string, value: any) => {
    const parts = name.split('.');
    
    if (parts.length === 1) {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    } else if (parts.length === 2) {
      const [parent, child] = parts;
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev],
          [child]: value
        }
      }));
    }
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-destructive/10 p-4 rounded-md text-destructive">
        Xavfsizlik sozlamalarini yuklashda xatolik yuz berdi. Iltimos, sahifani yangilang yoki administratorga murojaat qiling.
      </div>
    );
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-8">
        {/* Autentifikatsiya sozlamalari */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="text-lg font-medium">Autentifikatsiya sozlamalari</h3>
            
            <div className="grid grid-cols-1 gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="twoFactorAuthEnabled" className="block mb-1">
                    Ikki faktorli autentifikatsiya
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Tizimga kirishda ikki faktorli autentifikatsiyani yoqing
                  </p>
                </div>
                <Switch
                  id="twoFactorAuthEnabled"
                  checked={formData.twoFactorAuthEnabled}
                  onCheckedChange={(checked) => handleChange("twoFactorAuthEnabled", checked)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">
                  Sessiya muddati (daqiqalarda): {formData.sessionTimeout}
                </Label>
                <Slider
                  id="sessionTimeout"
                  min={5}
                  max={120}
                  step={5}
                  value={[formData.sessionTimeout]}
                  onValueChange={(value) => handleChange("sessionTimeout", value[0])}
                />
                <p className="text-sm text-muted-foreground">
                  Harakatsizlik vaqti tugagandan so'ng foydalanuvchilar qayta kirishi kerak bo'ladi
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="maxLoginAttempts">Maksimal urinishlar soni</Label>
                <Select
                  value={formData.maxLoginAttempts.toString()}
                  onValueChange={(value) => handleChange("maxLoginAttempts", parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Maksimal urinishlar sonini tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 urinish</SelectItem>
                    <SelectItem value="5">5 urinish</SelectItem>
                    <SelectItem value="10">10 urinish</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Maksimal urinishlar sonidan so'ng, hisob 30 daqiqaga blokirovka qilinadi
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Parol siyosati */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="text-lg font-medium">Parol siyosati</h3>
            
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <Label htmlFor="passwordPolicy.minLength">
                  Parol minimal uzunligi: {formData.passwordPolicy.minLength}
                </Label>
                <Slider
                  id="passwordPolicy.minLength"
                  min={6}
                  max={16}
                  step={1}
                  value={[formData.passwordPolicy.minLength]}
                  onValueChange={(value) => handleChange("passwordPolicy.minLength", value[0])}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between space-x-4">
                  <Label htmlFor="passwordPolicy.requireUppercase">
                    Bosh harflar talab qilish
                  </Label>
                  <Switch
                    id="passwordPolicy.requireUppercase"
                    checked={formData.passwordPolicy.requireUppercase}
                    onCheckedChange={(checked) => handleChange("passwordPolicy.requireUppercase", checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between space-x-4">
                  <Label htmlFor="passwordPolicy.requireLowercase">
                    Kichik harflar talab qilish
                  </Label>
                  <Switch
                    id="passwordPolicy.requireLowercase"
                    checked={formData.passwordPolicy.requireLowercase}
                    onCheckedChange={(checked) => handleChange("passwordPolicy.requireLowercase", checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between space-x-4">
                  <Label htmlFor="passwordPolicy.requireNumbers">
                    Raqamlar talab qilish
                  </Label>
                  <Switch
                    id="passwordPolicy.requireNumbers"
                    checked={formData.passwordPolicy.requireNumbers}
                    onCheckedChange={(checked) => handleChange("passwordPolicy.requireNumbers", checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between space-x-4">
                  <Label htmlFor="passwordPolicy.requireSpecialChars">
                    Maxsus belgilar talab qilish
                  </Label>
                  <Switch
                    id="passwordPolicy.requireSpecialChars"
                    checked={formData.passwordPolicy.requireSpecialChars}
                    onCheckedChange={(checked) => handleChange("passwordPolicy.requireSpecialChars", checked)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="passwordPolicy.expiryDays">
                  Parol amal qilish muddati (kunlarda): {formData.passwordPolicy.expiryDays}
                </Label>
                <Slider
                  id="passwordPolicy.expiryDays"
                  min={30}
                  max={180}
                  step={15}
                  value={[formData.passwordPolicy.expiryDays]}
                  onValueChange={(value) => handleChange("passwordPolicy.expiryDays", value[0])}
                />
                <p className="text-sm text-muted-foreground">
                  Bu muddatdan so'ng foydalanuvchilar parollarini yangilashlari kerak bo'ladi
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* IP cheklovlari */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">IP manzillari cheklovlari</h3>
                <p className="text-sm text-muted-foreground">
                  Faqat ruxsat berilgan IP manzillardan tizimga kirishni cheklang
                </p>
              </div>
              <Switch
                id="ipRestriction.enabled"
                checked={formData.ipRestriction.enabled}
                onCheckedChange={(checked) => handleChange("ipRestriction.enabled", checked)}
              />
            </div>
            
            {formData.ipRestriction.enabled && (
              <div className="space-y-2 mt-4">
                <Label htmlFor="ipRestriction">Ruxsat berilgan IP manzillar</Label>
                <Textarea
                  id="ipRestriction"
                  placeholder="Har bir IP manzilni yangi qatorga kiriting, masalan:
192.168.1.1
10.0.0.1/24"
                  rows={4}
                  value={formData.ipRestriction.allowedIps.join('\n')}
                  onChange={(e) => handleChange("ipRestriction.allowedIps", e.target.value.split('\n').filter(ip => ip.trim() !== ''))}
                />
                <p className="text-sm text-muted-foreground">
                  Diqqat: IP cheklovlarni noto'g'ri sozlash tizimga kirishni to'sib qo'yishi mumkin!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="flex justify-end mt-6">
        <Button 
          type="submit" 
          className="min-w-[120px]"
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Saqlash
        </Button>
      </div>
    </form>
  );
};

export default SecuritySettings;