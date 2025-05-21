import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getCategorySettings, updateSettings } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trash2 } from "lucide-react";

const NotificationSettings: React.FC = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    smsProvider: "twilio",
    apiKey: "",
    apiSecret: "",
    defaultSender: "",
    templatesEnabled: true,
    templates: [
      { id: "1", name: "Xush kelibsiz", content: "Hurmatli {name}, tizimga xush kelibsiz!" },
      { id: "2", name: "Eslatma", content: "Hurmatli {name}, bugun soat {time}da {event} bo'lib o'tadi." }
    ],
    notificationGroups: [
      { id: "1", name: "Barcha xodimlar", recipients: [] },
      { id: "2", name: "Bo'lim boshliqlari", recipients: [] }
    ]
  });
  
  // Get notification settings from API
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/settings/notifications"],
    queryFn: () => getCategorySettings("notifications")
  });
  
  // Update settings mutation
  const updateMutation = useMutation({
    mutationFn: (data: any) => updateSettings("notifications", data),
    onSuccess: () => {
      toast({
        title: "Sozlamalar saqlandi",
        description: "Xabarnoma sozlamalari muvaffaqiyatli yangilandi",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/settings/notifications"] });
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
  const handleChange = (name: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle template change
  const handleTemplateChange = (index: number, field: string, value: string) => {
    const updatedTemplates = [...formData.templates];
    updatedTemplates[index] = {
      ...updatedTemplates[index],
      [field]: value
    };
    
    setFormData(prev => ({
      ...prev,
      templates: updatedTemplates
    }));
  };
  
  // Add new template
  const addTemplate = () => {
    const newTemplate = {
      id: Date.now().toString(),
      name: "Yangi shablon",
      content: "Shablon matni"
    };
    
    setFormData(prev => ({
      ...prev,
      templates: [...prev.templates, newTemplate]
    }));
  };
  
  // Remove template
  const removeTemplate = (id: string) => {
    const updatedTemplates = formData.templates.filter(template => template.id !== id);
    
    setFormData(prev => ({
      ...prev,
      templates: updatedTemplates
    }));
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
        Xabarnoma sozlamalarini yuklashda xatolik yuz berdi. Iltimos, sahifani yangilang yoki administratorga murojaat qiling.
      </div>
    );
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-8">
        {/* SMS Provider sozlamalari */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="text-lg font-medium">SMS xabar yuborish sozlamalari</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="smsProvider">SMS Provider</Label>
                <Select 
                  value={formData.smsProvider} 
                  onValueChange={(value) => handleChange("smsProvider", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="SMS provayderini tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="twilio">Twilio</SelectItem>
                    <SelectItem value="nexmo">Nexmo (Vonage)</SelectItem>
                    <SelectItem value="messagebird">MessageBird</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="defaultSender">Standart jo'natuvchi</Label>
                <Input
                  id="defaultSender"
                  value={formData.defaultSender}
                  onChange={(e) => handleChange("defaultSender", e.target.value)}
                  placeholder="Standart jo'natuvchi nomi"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="apiKey">API kalit</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) => handleChange("apiKey", e.target.value)}
                  placeholder="API kalitni kiriting"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="apiSecret">API maxfiy kalit</Label>
                <Input
                  id="apiSecret"
                  type="password"
                  value={formData.apiSecret}
                  onChange={(e) => handleChange("apiSecret", e.target.value)}
                  placeholder="API maxfiy kalitni kiriting"
                />
              </div>
              
              <div className="md:col-span-2 flex items-center space-x-2">
                <Switch
                  id="templatesEnabled"
                  checked={formData.templatesEnabled}
                  onCheckedChange={(checked) => handleChange("templatesEnabled", checked)}
                />
                <Label htmlFor="templatesEnabled">SMS shablonlaridan foydalanish</Label>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* SMS Shablonlar */}
        {formData.templatesEnabled && (
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">SMS shablonlar</h3>
                <Button type="button" variant="outline" size="sm" onClick={addTemplate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Shablon qo'shish
                </Button>
              </div>
              
              {formData.templates.map((template, index) => (
                <div key={template.id} className="border border-border rounded-md p-4 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <Label htmlFor={`template-${index}-name`}>Shablon nomi</Label>
                      <Input
                        id={`template-${index}-name`}
                        value={template.name}
                        onChange={(e) => handleTemplateChange(index, "name", e.target.value)}
                        placeholder="Shablon nomini kiriting"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => removeTemplate(template.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">O'chirish</span>
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`template-${index}-content`}>Shablon matni</Label>
                    <Textarea
                      id={`template-${index}-content`}
                      value={template.content}
                      onChange={(e) => handleTemplateChange(index, "content", e.target.value)}
                      placeholder="Shablon matnini kiriting"
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">
                      O'zgaruvchilar: {"{name}"} - foydalanuvchining ismi, {"{time}"} - vaqt, {"{event}"} - voqea, {"{date}"} - sana
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
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

export default NotificationSettings;