import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getCategorySettings, updateSettings, uploadLogo } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Upload } from "lucide-react";

const GeneralSettings: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("general");
  const [formData, setFormData] = useState({
    companyName: "",
    companyAddress: "",
    contactPhone: "",
    contactEmail: "",
    businessType: "",
    description: "",
    logoUrl: "",
    language: "uzbek",
    timezone: "Asia/Tashkent",
    dateFormat: "DD.MM.YYYY",
    timeFormat: "24-hour",
  });
  const [logo, setLogo] = useState<File | null>(null);
  
  // Get general settings from API
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/settings/general"],
    queryFn: () => getCategorySettings("general")
  });
  
  // Update settings mutation
  const updateMutation = useMutation({
    mutationFn: (data: any) => updateSettings("general", data),
    onSuccess: () => {
      toast({
        title: "Sozlamalar saqlandi",
        description: "Umumiy sozlamalar muvaffaqiyatli yangilandi",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/settings/general"] });
    },
    onError: (error: any) => {
      toast({
        title: "Xatolik yuz berdi",
        description: error.message || "Sozlamalarni saqlashda xatolik yuz berdi",
        variant: "destructive",
      });
    },
  });
  
  // Upload logo mutation
  const logoMutation = useMutation({
    mutationFn: (file: File) => uploadLogo(file),
    onSuccess: (data) => {
      toast({
        title: "Logo yuklandi",
        description: "Yangi logo muvaffaqiyatli yuklandi",
      });
      setFormData(prev => ({ ...prev, logoUrl: data.logoUrl }));
      queryClient.invalidateQueries({ queryKey: ["/api/settings/general"] });
    },
    onError: (error: any) => {
      toast({
        title: "Xatolik yuz berdi",
        description: error.message || "Logo yuklashda xatolik yuz berdi",
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
  const handleChange = (name: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle logo file upload
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogo(file);
    }
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
    
    if (logo) {
      logoMutation.mutate(logo);
    }
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
        Sozlamarni yuklashda xatolik yuz berdi. Iltimos, sahifani yangilang yoki administratorga murojaat qiling.
      </div>
    );
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="general">Umumiy</TabsTrigger>
          <TabsTrigger value="appearance">Ko'rinish</TabsTrigger>
          <TabsTrigger value="localization">Mintaqaviy</TabsTrigger>
        </TabsList>
        
        {/* Umumiy sozlamalar */}
        <TabsContent value="general">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Tashkilot nomi</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => handleChange("companyName", e.target.value)}
                    placeholder="Tashkilot nomi"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="businessType">Faoliyat turi</Label>
                  <Select 
                    value={formData.businessType} 
                    onValueChange={(value) => handleChange("businessType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Faoliyat turini tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="poultry_farm">Parrandachilik fermasi</SelectItem>
                      <SelectItem value="processing_plant">Qayta ishlash zavodi</SelectItem>
                      <SelectItem value="mixed">Aralash faoliyat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Bog'lanish uchun telefon</Label>
                  <Input
                    id="contactPhone"
                    value={formData.contactPhone}
                    onChange={(e) => handleChange("contactPhone", e.target.value)}
                    placeholder="+998XXXXXXXXX"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Elektron pochta</Label>
                  <Input
                    id="contactEmail"
                    value={formData.contactEmail}
                    onChange={(e) => handleChange("contactEmail", e.target.value)}
                    placeholder="example@company.uz"
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="companyAddress">Tashkilot manzili</Label>
                  <Input
                    id="companyAddress"
                    value={formData.companyAddress}
                    onChange={(e) => handleChange("companyAddress", e.target.value)}
                    placeholder="Tashkilot manzili"
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Tashkilot haqida qisqacha</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    placeholder="Tashkilot haqida qisqacha ma'lumot"
                    rows={4}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Ko'rinish sozlamalari */}
        <TabsContent value="appearance">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="logo">Tashkilot logotipi</Label>
                  <div className="flex flex-col space-y-4">
                    {formData.logoUrl && (
                      <div className="w-32 h-32 border rounded-md overflow-hidden">
                        <img 
                          src={formData.logoUrl} 
                          alt="Tashkilot logotipi" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2">
                      <Input
                        id="logo"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="max-w-sm"
                      />
                      {logo && (
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => logoMutation.mutate(logo)}
                          disabled={logoMutation.isPending}
                        >
                          {logoMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="mr-2 h-4 w-4" />
                          )}
                          Yuklash
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Mintaqaviy sozlamalar */}
        <TabsContent value="localization">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="language">Asosiy til</Label>
                  <Select 
                    value={formData.language} 
                    onValueChange={(value) => handleChange("language", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tilni tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="uzbek">O'zbek tili</SelectItem>
                      <SelectItem value="russian">Rus tili</SelectItem>
                      <SelectItem value="english">Ingliz tili</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="timezone">Vaqt mintaqasi</Label>
                  <Select 
                    value={formData.timezone} 
                    onValueChange={(value) => handleChange("timezone", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Vaqt mintaqasini tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Tashkent">Toshkent (GMT+5)</SelectItem>
                      <SelectItem value="Asia/Samarkand">Samarqand (GMT+5)</SelectItem>
                      <SelectItem value="Asia/Dushanbe">Dushanbe (GMT+5)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Sana formati</Label>
                  <Select 
                    value={formData.dateFormat} 
                    onValueChange={(value) => handleChange("dateFormat", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sana formatini tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD.MM.YYYY">DD.MM.YYYY (28.05.2023)</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (2023-05-28)</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (05/28/2023)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="timeFormat">Vaqt formati</Label>
                  <Select 
                    value={formData.timeFormat} 
                    onValueChange={(value) => handleChange("timeFormat", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Vaqt formatini tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24-hour">24 soatlik (14:30)</SelectItem>
                      <SelectItem value="12-hour">12 soatlik (2:30 PM)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
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

export default GeneralSettings;