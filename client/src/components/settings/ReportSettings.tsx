import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getCategorySettings, updateSettings, getReportFields, createReportTemplate } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Loader2, 
  Plus, 
  Trash2, 
  FileText, 
  Download, 
  Pencil,
  Save
} from "lucide-react";

interface ReportField {
  id: string;
  name: string;
  displayName: string;
  category: string;
  dataType: string;
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  fields: string[];
  includeCharts: boolean;
  chartType?: string;
  createdAt: string;
  lastUsed?: string;
}

interface FormData {
  exportFormat: "excel" | "pdf" | "csv";
  defaultTemplate: string;
  companyHeaderInReports: boolean;
  includeLogoInReports: boolean;
  footerText: string;
  dateFormat: string;
  numberFormat: string;
  currencySymbol: string;
  autoExportReports: boolean;
  autoExportSchedule: string;
  emailReportsTo: string[];
}

interface NewTemplateData {
  name: string;
  description: string;
  type: string;
  fields: string[];
  includeCharts: boolean;
  chartType?: string;
}

const ReportSettings: React.FC = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<FormData>({
    exportFormat: "excel",
    defaultTemplate: "",
    companyHeaderInReports: true,
    includeLogoInReports: true,
    footerText: "",
    dateFormat: "DD.MM.YYYY",
    numberFormat: "1,234.56",
    currencySymbol: "UZS",
    autoExportReports: false,
    autoExportSchedule: "weekly",
    emailReportsTo: []
  });
  
  const [reportTemplates, setReportTemplates] = useState<ReportTemplate[]>([]);
  const [showNewTemplateDialog, setShowNewTemplateDialog] = useState(false);
  const [newTemplate, setNewTemplate] = useState<NewTemplateData>({
    name: "",
    description: "",
    type: "production",
    fields: [],
    includeCharts: true,
    chartType: "bar"
  });
  
  // Get report settings from API
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/settings/reports"],
    queryFn: () => getCategorySettings("reports")
  });
  
  // Get available report fields
  const { data: fieldsData, isLoading: fieldsLoading } = useQuery({
    queryKey: ["/api/reports/available-fields"],
    queryFn: getReportFields
  });
  
  // Update settings mutation
  const updateMutation = useMutation({
    mutationFn: (data: any) => updateSettings("reports", data),
    onSuccess: () => {
      toast({
        title: "Sozlamalar saqlandi",
        description: "Hisobot sozlamalari muvaffaqiyatli yangilandi",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/settings/reports"] });
    },
    onError: (error: any) => {
      toast({
        title: "Xatolik yuz berdi",
        description: error.message || "Sozlamalarni saqlashda xatolik yuz berdi",
        variant: "destructive",
      });
    },
  });
  
  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: createReportTemplate,
    onSuccess: () => {
      toast({
        title: "Shablon yaratildi",
        description: "Yangi hisobot shabloni muvaffaqiyatli yaratildi",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/settings/reports"] });
      setShowNewTemplateDialog(false);
      resetNewTemplateForm();
    },
    onError: (error: any) => {
      toast({
        title: "Xatolik yuz berdi",
        description: error.message || "Shablon yaratishda xatolik yuz berdi",
        variant: "destructive",
      });
    },
  });
  
  // Group fields by category
  const groupedFields = React.useMemo(() => {
    if (!fieldsData?.data?.fields) return {};
    
    return (fieldsData.data.fields as ReportField[]).reduce((acc, field) => {
      if (!acc[field.category]) {
        acc[field.category] = [];
      }
      acc[field.category].push(field);
      return acc;
    }, {} as Record<string, ReportField[]>);
  }, [fieldsData]);
  
  // Update form data when settings are loaded
  useEffect(() => {
    if (data?.data?.settings) {
      setFormData(prev => ({
        ...prev,
        ...data.data.settings
      }));
      
      if (data.data.reportTemplates) {
        setReportTemplates(data.data.reportTemplates);
      }
    }
  }, [data]);
  
  // Handle form field changes
  const handleChange = (name: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle new template form changes
  const handleTemplateChange = (name: string, value: any) => {
    setNewTemplate(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Toggle field selection in new template
  const toggleFieldSelection = (fieldId: string) => {
    setNewTemplate(prev => {
      if (prev.fields.includes(fieldId)) {
        return {
          ...prev,
          fields: prev.fields.filter(id => id !== fieldId)
        };
      } else {
        return {
          ...prev,
          fields: [...prev.fields, fieldId]
        };
      }
    });
  };
  
  // Reset new template form
  const resetNewTemplateForm = () => {
    setNewTemplate({
      name: "",
      description: "",
      type: "production",
      fields: [],
      includeCharts: true,
      chartType: "bar"
    });
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };
  
  // Handle new template submission
  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newTemplate.fields.length === 0) {
      toast({
        title: "Maydonlar tanlanmagan",
        description: "Iltimos, hisobot uchun kamida bitta maydonni tanlang",
        variant: "destructive",
      });
      return;
    }
    
    createTemplateMutation.mutate(newTemplate);
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
        Hisobot sozlamalarini yuklashda xatolik yuz berdi. Iltimos, sahifani yangilang yoki administratorga murojaat qiling.
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="exportFormat">Eksport formati</Label>
                <Select 
                  value={formData.exportFormat} 
                  onValueChange={(value) => handleChange("exportFormat", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Eksport formatini tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
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
                    <SelectItem value="DD.MM.YYYY">DD.MM.YYYY (31.12.2023)</SelectItem>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (12/31/2023)</SelectItem>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (2023-12-31)</SelectItem>
                    <SelectItem value="DD-MMM-YYYY">DD-MMM-YYYY (31-Dec-2023)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="numberFormat">Son formati</Label>
                <Select 
                  value={formData.numberFormat} 
                  onValueChange={(value) => handleChange("numberFormat", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Son formatini tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1,234.56">1,234.56 (minglik vergul bilan)</SelectItem>
                    <SelectItem value="1.234,56">1.234,56 (Evropa formati)</SelectItem>
                    <SelectItem value="1234.56">1234.56 (ajratuvchisiz)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="currencySymbol">Valyuta belgisi</Label>
                <Select 
                  value={formData.currencySymbol} 
                  onValueChange={(value) => handleChange("currencySymbol", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Valyuta belgisini tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UZS">UZS (O'zbek so'mi)</SelectItem>
                    <SelectItem value="USD">USD (AQSh dollari)</SelectItem>
                    <SelectItem value="EUR">EUR (Evro)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="footerText">Hisobotlar pastki satri</Label>
                <Input 
                  id="footerText"
                  value={formData.footerText}
                  onChange={(e) => handleChange("footerText", e.target.value)}
                  placeholder="Hisobot pastki satri uchun matn"
                />
                <p className="text-xs text-muted-foreground">
                  Barcha hisobotlar pastki qismida ko'rsatiladigan matn
                </p>
              </div>
              
              <div className="md:col-span-2 flex flex-col gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="companyHeaderInReports"
                    checked={formData.companyHeaderInReports}
                    onCheckedChange={(checked) => handleChange("companyHeaderInReports", checked)}
                  />
                  <Label htmlFor="companyHeaderInReports">Hisobotlarda kompaniya ma'lumotlarini ko'rsatish</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="includeLogoInReports"
                    checked={formData.includeLogoInReports}
                    onCheckedChange={(checked) => handleChange("includeLogoInReports", checked)}
                  />
                  <Label htmlFor="includeLogoInReports">Hisobotlarda logotipni ko'rsatish</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="autoExportReports"
                    checked={formData.autoExportReports}
                    onCheckedChange={(checked) => handleChange("autoExportReports", checked)}
                  />
                  <Label htmlFor="autoExportReports">Hisobotlarni avtomatik eksport qilish</Label>
                </div>
                
                {formData.autoExportReports && (
                  <>
                    <div className="space-y-2 pl-7">
                      <Label htmlFor="autoExportSchedule">Eksport jadvali</Label>
                      <Select 
                        value={formData.autoExportSchedule} 
                        onValueChange={(value) => handleChange("autoExportSchedule", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Eksport jadvalini tanlang" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Har kuni</SelectItem>
                          <SelectItem value="weekly">Har hafta</SelectItem>
                          <SelectItem value="monthly">Har oy</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2 pl-7">
                      <Label htmlFor="emailReportsTo">Hisobotlarni yuborish uchun email</Label>
                      <Textarea 
                        id="emailReportsTo"
                        value={formData.emailReportsTo.join("\n")}
                        onChange={(e) => handleChange("emailReportsTo", e.target.value.split("\n").filter(email => email.trim() !== ""))}
                        placeholder="Har bir emailni yangi qatorga kiriting"
                        rows={3}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
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
      
      {/* Hisobot shablonlari */}
      <div className="mt-10 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Hisobot shablonlari</h3>
          <Button onClick={() => setShowNewTemplateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Yangi shablon
          </Button>
        </div>
        
        <Card>
          <CardContent className="p-6">
            {reportTemplates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-10 w-10 mx-auto mb-4 text-muted-foreground/60" />
                <p>Hozircha hisobot shablonlari mavjud emas</p>
                <p className="text-sm mt-2">Yangi shablon yaratish uchun yuqoridagi tugmani bosing</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nomi</TableHead>
                      <TableHead>Turi</TableHead>
                      <TableHead className="hidden md:table-cell">Maydanlar soni</TableHead>
                      <TableHead className="hidden md:table-cell">Yaratilgan vaqt</TableHead>
                      <TableHead className="text-right">Amallar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportTemplates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell className="font-medium">
                          {template.name}
                          {template.description && (
                            <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {template.type === "production" ? "Ishlab chiqarish" :
                             template.type === "inventory" ? "Inventar" :
                             template.type === "financial" ? "Moliyaviy" :
                             template.type === "employee" ? "Xodimlar" :
                             template.type}
                          </Badge>
                          {template.includeCharts && (
                            <Badge variant="outline" className="ml-2">Grafiklar</Badge>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {template.fields.length}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {new Date(template.createdAt).toLocaleDateString("uz-UZ")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm">
                              <Pencil className="h-4 w-4 mr-1" />
                              <span className="hidden md:inline">Tahrirlash</span>
                            </Button>
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4 mr-1" />
                              <span className="hidden md:inline">Generatsiya</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Yangi shablon yaratish dialogi */}
      <Dialog open={showNewTemplateDialog} onOpenChange={setShowNewTemplateDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleCreateTemplate}>
            <DialogHeader>
              <DialogTitle>Yangi hisobot shabloni yaratish</DialogTitle>
              <DialogDescription>
                Hisobot shablonini yarating va uning maydonlarini tanlang
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="templateName">Shablon nomi</Label>
                  <Input 
                    id="templateName" 
                    value={newTemplate.name}
                    onChange={(e) => handleTemplateChange("name", e.target.value)}
                    placeholder="Shablon nomini kiriting"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="templateType">Hisobot turi</Label>
                  <Select 
                    value={newTemplate.type} 
                    onValueChange={(value) => handleTemplateChange("type", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Hisobot turini tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="production">Ishlab chiqarish</SelectItem>
                      <SelectItem value="inventory">Inventar</SelectItem>
                      <SelectItem value="financial">Moliyaviy</SelectItem>
                      <SelectItem value="employee">Xodimlar</SelectItem>
                      <SelectItem value="maintenance">Texnik xizmat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="templateDescription">Tavsif</Label>
                  <Textarea 
                    id="templateDescription" 
                    value={newTemplate.description}
                    onChange={(e) => handleTemplateChange("description", e.target.value)}
                    placeholder="Shablon tavsifini kiriting"
                    rows={3}
                  />
                </div>
                
                <div className="md:col-span-2 flex items-center space-x-2">
                  <Switch
                    id="includeCharts"
                    checked={newTemplate.includeCharts}
                    onCheckedChange={(checked) => handleTemplateChange("includeCharts", checked)}
                  />
                  <Label htmlFor="includeCharts">Hisobotga grafiklar qo'shish</Label>
                </div>
                
                {newTemplate.includeCharts && (
                  <div className="space-y-2">
                    <Label htmlFor="chartType">Grafik turi</Label>
                    <Select 
                      value={newTemplate.chartType} 
                      onValueChange={(value) => handleTemplateChange("chartType", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Grafik turini tanlang" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bar">Ustun diagramma</SelectItem>
                        <SelectItem value="line">Chiziqli grafik</SelectItem>
                        <SelectItem value="pie">Doira diagramma</SelectItem>
                        <SelectItem value="scatter">Sochma diagramma</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              
              <Separator />
              
              {fieldsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-3">
                  <h4 className="font-medium">Hisobot maydonlarini tanlang</h4>
                  <p className="text-sm text-muted-foreground">
                    Hisobotda ko'rsatilishi kerak bo'lgan barcha maydonlarni tanlang
                  </p>
                  
                  <div className="h-[400px] overflow-y-auto pr-4 space-y-4">
                    {Object.entries(groupedFields).map(([category, fields]) => (
                      <div key={category} className="border rounded-md">
                        <div className="p-3 bg-muted font-medium capitalize">
                          {category === "production" ? "Ishlab chiqarish" :
                           category === "inventory" ? "Inventar" :
                           category === "financial" ? "Moliyaviy" :
                           category === "employee" ? "Xodimlar" :
                           category}
                        </div>
                        <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                          {fields.map(field => (
                            <div key={field.id} className="flex items-start space-x-2">
                              <Checkbox 
                                id={field.id}
                                checked={newTemplate.fields.includes(field.id)}
                                onCheckedChange={() => toggleFieldSelection(field.id)}
                              />
                              <div>
                                <Label 
                                  htmlFor={field.id}
                                  className="text-sm font-medium cursor-pointer"
                                >
                                  {field.displayName}
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                  {field.dataType === "string" ? "Matn" :
                                   field.dataType === "number" ? "Son" :
                                   field.dataType === "date" ? "Sana" :
                                   field.dataType === "boolean" ? "Ha/Yo'q" :
                                   field.dataType}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowNewTemplateDialog(false)}
              >
                Bekor qilish
              </Button>
              <Button 
                type="submit"
                disabled={createTemplateMutation.isPending || newTemplate.fields.length === 0}
              >
                {createTemplateMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Saqlash
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReportSettings;