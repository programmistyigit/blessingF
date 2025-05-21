import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getRoles, getPermissions, createRole, updateRole, deleteRole, updateRoleStatus } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { 
  Loader2, 
  ShieldCheck, 
  Shield, 
  Trash2, 
  Plus, 
  UserCog, 
  Pencil, 
  Search,
  Check,
  X
} from "lucide-react";

// Role and Permission type interfaces
interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  name: string;
  displayName: string;
  description: string;
  permissions: string[];
}

const RolesAndPermissions: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("roles");
  const [searchTerm, setSearchTerm] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentRoleId, setCurrentRoleId] = useState<string | null>(null);
  const [expandedPermissionCategories, setExpandedPermissionCategories] = useState<string[]>([]);
  
  const [formData, setFormData] = useState<FormData>({
    name: "",
    displayName: "",
    description: "",
    permissions: []
  });
  
  // Get roles
  const { 
    data: rolesData, 
    isLoading: rolesLoading, 
    error: rolesError 
  } = useQuery({
    queryKey: ["/api/roles"],
    queryFn: getRoles
  });
  
  // Get permissions
  const { 
    data: permissionsData, 
    isLoading: permissionsLoading, 
    error: permissionsError 
  } = useQuery({
    queryKey: ["/api/permissions"],
    queryFn: getPermissions
  });
  
  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: createRole,
    onSuccess: () => {
      toast({
        title: "Lavozim yaratildi",
        description: "Yangi lavozim muvaffaqiyatli yaratildi",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      resetForm();
      setShowDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Xatolik yuz berdi",
        description: error.message || "Lavozim yaratishda xatolik yuz berdi",
        variant: "destructive",
      });
    },
  });
  
  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateRole(id, data),
    onSuccess: () => {
      toast({
        title: "Lavozim yangilandi",
        description: "Lavozim muvaffaqiyatli yangilandi",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      resetForm();
      setShowDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Xatolik yuz berdi",
        description: error.message || "Lavozimni yangilashda xatolik yuz berdi",
        variant: "destructive",
      });
    },
  });
  
  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: deleteRole,
    onSuccess: () => {
      toast({
        title: "Lavozim o'chirildi",
        description: "Lavozim muvaffaqiyatli o'chirildi",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
    },
    onError: (error: any) => {
      toast({
        title: "Xatolik yuz berdi",
        description: error.message || "Lavozimni o'chirishda xatolik yuz berdi",
        variant: "destructive",
      });
    },
  });
  
  // Update role status mutation
  const updateRoleStatusMutation = useMutation({
    mutationFn: ({ id, statusData }: { id: string; statusData: { isActive: boolean, reason?: string } }) => 
      updateRoleStatus(id, statusData),
    onSuccess: () => {
      toast({
        title: "Lavozim statusi yangilandi",
        description: "Lavozim statusi muvaffaqiyatli yangilandi",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
    },
    onError: (error: any) => {
      toast({
        title: "Xatolik yuz berdi",
        description: error.message || "Lavozim statusini yangilashda xatolik yuz berdi",
        variant: "destructive",
      });
    },
  });
  
  // Group permissions by category
  const groupedPermissions = React.useMemo(() => {
    if (!permissionsData?.data?.permissions) return {};
    
    return (permissionsData.data.permissions as Permission[]).reduce((acc, permission) => {
      if (!acc[permission.category]) {
        acc[permission.category] = [];
      }
      acc[permission.category].push(permission);
      return acc;
    }, {} as Record<string, Permission[]>);
  }, [permissionsData]);
  
  // Filter roles by search term
  const filteredRoles = React.useMemo(() => {
    if (!rolesData?.data?.roles) return [];
    
    return (rolesData.data.roles as Role[]).filter(role => 
      role.displayName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      role.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [rolesData, searchTerm]);
  
  // Handle permission category toggle
  const togglePermissionCategory = (category: string) => {
    setExpandedPermissionCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category) 
        : [...prev, category]
    );
  };
  
  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      displayName: "",
      description: "",
      permissions: []
    });
    setEditMode(false);
    setCurrentRoleId(null);
  };
  
  // Handle dialog close
  const handleDialogClose = () => {
    resetForm();
    setShowDialog(false);
  };
  
  // Handle role edit
  const handleEditRole = (role: Role) => {
    setFormData({
      name: role.name,
      displayName: role.displayName,
      description: role.description,
      permissions: role.permissions
    });
    setEditMode(true);
    setCurrentRoleId(role.id);
    setShowDialog(true);
  };
  
  // Handle form field changes
  const handleChange = (name: string, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle permission check
  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        permissions: [...prev.permissions, permissionId]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        permissions: prev.permissions.filter(id => id !== permissionId)
      }));
    }
  };
  
  // Handle role status toggle
  const handleRoleStatusToggle = (roleId: string, isActive: boolean) => {
    updateRoleStatusMutation.mutate({
      id: roleId,
      statusData: {
        isActive,
        reason: isActive ? undefined : "Administrator tomonidan o'chirilgan"
      }
    });
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editMode && currentRoleId) {
      updateRoleMutation.mutate({
        id: currentRoleId,
        data: formData
      });
    } else {
      createRoleMutation.mutate(formData);
    }
  };
  
  if (rolesLoading || permissionsLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (rolesError || permissionsError) {
    return (
      <div className="bg-destructive/10 p-4 rounded-md text-destructive">
        Lavozimlar yoki ruxsatlarni yuklashda xatolik yuz berdi. Iltimos, sahifani yangilang yoki administratorga murojaat qiling.
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <UserCog className="h-4 w-4" />
            Lavozimlar
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Ruxsatlar
          </TabsTrigger>
        </TabsList>
        
        {/* Lavozimlar */}
        <TabsContent value="roles">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-center mb-6">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Lavozimlarni qidirish..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 w-[300px]"
                  />
                </div>
                
                <Button onClick={() => setShowDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Yangi lavozim
                </Button>
              </div>
              
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lavozim nomi</TableHead>
                      <TableHead>Tavsif</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amallar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRoles.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                          Lavozimlar topilmadi
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRoles.map((role) => (
                        <TableRow key={role.id}>
                          <TableCell className="font-medium">
                            {role.displayName}
                            <div className="text-xs text-muted-foreground mt-1">
                              {role.name}
                            </div>
                          </TableCell>
                          <TableCell>
                            {role.description || "Tavsif mavjud emas"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge variant={role.isActive ? "default" : "outline"}>
                                {role.isActive ? "Faol" : "Faol emas"}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEditRole(role)}
                              >
                                <Pencil className="h-4 w-4" />
                                <span className="sr-only">Tahrirlash</span>
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleRoleStatusToggle(role.id, !role.isActive)}
                              >
                                {role.isActive ? (
                                  <X className="h-4 w-4" />
                                ) : (
                                  <Check className="h-4 w-4" />
                                )}
                                <span className="sr-only">
                                  {role.isActive ? "O'chirish" : "Yoqish"}
                                </span>
                              </Button>
                              {/* Delete button only for non-system roles */}
                              {!["admin", "boss", "manager", "worker"].includes(role.name) && (
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  onClick={() => deleteRoleMutation.mutate(role.id)}
                                  disabled={deleteRoleMutation.isPending}
                                >
                                  {deleteRoleMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                  <span className="sr-only">O'chirish</span>
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Ruxsatlar */}
        <TabsContent value="permissions">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="mb-4">
                <div className="text-lg font-medium mb-2">Tizim ruxsatlari</div>
                <p className="text-muted-foreground">
                  Quyidagi ruxsatlar tizimda mavjud bo'lib, ularni lavozimlar bilan bog'lash mumkin
                </p>
              </div>
              
              <div className="space-y-6">
                {Object.entries(groupedPermissions).map(([category, permissions]) => (
                  <div key={category} className="border rounded-md overflow-hidden">
                    <div 
                      className="flex items-center justify-between p-4 bg-muted cursor-pointer"
                      onClick={() => togglePermissionCategory(category)}
                    >
                      <div className="font-medium capitalize flex items-center">
                        <Shield className="mr-2 h-5 w-5 text-primary" />
                        {category.replace('.', ' ')}
                        <Badge className="ml-2" variant="outline">
                          {permissions.length}
                        </Badge>
                      </div>
                      <div>
                        {expandedPermissionCategories.includes(category) ? (
                          <Button variant="ghost" size="sm">
                            <X className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm">
                            <Plus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {expandedPermissionCategories.includes(category) && (
                      <div className="p-4 space-y-2">
                        {permissions.map(permission => (
                          <div 
                            key={permission.id} 
                            className="flex justify-between items-start py-2 px-4 hover:bg-muted/50 rounded-md"
                          >
                            <div>
                              <div className="font-medium text-sm">
                                {permission.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {permission.description}
                              </div>
                            </div>
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {permission.id}
                            </code>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Create/Edit Role Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editMode ? "Lavozimni tahrirlash" : "Yangi lavozim yaratish"}
              </DialogTitle>
              <DialogDescription>
                {editMode 
                  ? "Mavjud lavozim ma'lumotlarini va ruxsatlarini tahrirlang" 
                  : "Tizimda yangi lavozim va uning ruxsatlarini yarating"}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Lavozim nomi</Label>
                  <Input 
                    id="displayName" 
                    value={formData.displayName}
                    onChange={(e) => handleChange("displayName", e.target.value)}
                    placeholder="Masalan: Muhandis"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="name">Tizim nomi (lotin harflarda)</Label>
                  <Input 
                    id="name" 
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="Masalan: engineer"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Faqat kichik lotin harflari, raqamlar va pastki chiziqdan foydalaning
                  </p>
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Tavsif</Label>
                  <Textarea 
                    id="description" 
                    value={formData.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    placeholder="Lavozim vazifasini qisqacha tavsiflang"
                    rows={3}
                  />
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <h4 className="font-medium">Ruxsatlarni tanlang</h4>
                <p className="text-sm text-muted-foreground">
                  Bu lavozimga berilishi kerak bo'lgan barcha ruxsatlarni tanlang
                </p>
                
                <div className="h-[300px] overflow-y-auto pr-4 space-y-4">
                  {Object.entries(groupedPermissions).map(([category, permissions]) => (
                    <div key={category} className="border rounded-md">
                      <div className="p-3 bg-muted font-medium capitalize">
                        {category.replace('.', ' ')}
                      </div>
                      <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                        {permissions.map(permission => (
                          <div key={permission.id} className="flex items-start space-x-2">
                            <Checkbox 
                              id={permission.id}
                              checked={formData.permissions.includes(permission.id)}
                              onCheckedChange={(checked) => 
                                handlePermissionChange(permission.id, checked as boolean)
                              }
                            />
                            <div>
                              <Label 
                                htmlFor={permission.id}
                                className="text-sm font-medium cursor-pointer"
                              >
                                {permission.name}
                              </Label>
                              <p className="text-xs text-muted-foreground">
                                {permission.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleDialogClose}
              >
                Bekor qilish
              </Button>
              <Button 
                type="submit"
                disabled={createRoleMutation.isPending || updateRoleMutation.isPending}
              >
                {(createRoleMutation.isPending || updateRoleMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editMode ? "Saqlash" : "Yaratish"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RolesAndPermissions;