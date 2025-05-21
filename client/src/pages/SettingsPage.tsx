import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Settings2, Users, Bell, FileText, LayoutDashboard, Shield, Server, Database, History } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getCategorySettings } from "@/lib/api";

// Sozlamalar sahifa komponentlari
import GeneralSettings from "@/components/settings/GeneralSettings";
import NotificationSettings from "@/components/settings/NotificationSettings";
import SecuritySettings from "@/components/settings/SecuritySettings";
import RolesAndPermissions from "@/components/settings/RolesAndPermissions";
import ReportSettings from "@/components/settings/ReportSettings";
import DashboardSettings from "@/components/settings/DashboardSettings";
import SystemStatus from "@/components/settings/SystemStatus";
import UserSessions from "@/components/settings/UserSessions";

// Sozlamalar kategoriyalari
type SettingsCategory = 
  | "general" 
  | "notifications" 
  | "security" 
  | "roles" 
  | "reports" 
  | "dashboard" 
  | "system" 
  | "sessions";

// Tab ma'lumotlari turi
interface TabInfo {
  id: SettingsCategory;
  title: string;
  description: string;
  icon: React.ReactNode;
  component: React.ReactNode;
  permissions: string[];
}

const SettingsPage: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<SettingsCategory>("general");
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useSelector((state: RootState) => state.auth);

  // Permissions tekshirish funktsiyasi
  const hasPermission = (requiredPermissions: string[]): boolean => {
    // Agar user yo'q bo'lsa yoki permissions mavjud bo'lmasa false qaytaramiz
    if (!user || !user.permissions) return false;
    
    // Boss rolga tekshiramiz (boss roli barcha sozlamalarga kirishga ruxsat beradi)
    if (user.role === "boss") return true;
    
    // Foydalanuvchi ruxsatlarini tekshiramiz
    return requiredPermissions.some(permission => 
      user.permissions?.includes(permission)
    );
  };

  // Tabs ma'lumotlarini belgilash
  const tabs: TabInfo[] = [
    {
      id: "general",
      title: "Umumiy sozlamalar",
      description: "Tizimning asosiy sozlamalari: tashkilot ma'lumotlari, til va interfeys sozlamalari",
      icon: <Settings2 className="h-5 w-5" />,
      component: <GeneralSettings />,
      permissions: ["settings.view", "settings.update"]
    },
    {
      id: "notifications",
      title: "Xabarnomalar",
      description: "SMS xabarnomalar sozlamalari, qoliplar va qabul qiluvchilar guruhlari",
      icon: <Bell className="h-5 w-5" />,
      component: <NotificationSettings />,
      permissions: ["notification.view", "notification.update"]
    },
    {
      id: "security",
      title: "Xavfsizlik",
      description: "Kirish sozlamalari, autentifikatsiya va ruxsatnomalar",
      icon: <Shield className="h-5 w-5" />,
      component: <SecuritySettings />,
      permissions: ["settings.system", "settings.update"]
    },
    {
      id: "roles",
      title: "Lavozimlar va ruxsatlar",
      description: "Foydalanuvchi lavozimlarini boshqarish va ruxsatlarni tayinlash",
      icon: <Users className="h-5 w-5" />,
      component: <RolesAndPermissions />,
      permissions: ["role.view", "role.update", "permission.view"]
    },
    {
      id: "reports",
      title: "Hisobotlar",
      description: "Hisobot shablonlari va eksport sozlamalari",
      icon: <FileText className="h-5 w-5" />,
      component: <ReportSettings />,
      permissions: ["report.view", "report.update"]
    },
    {
      id: "dashboard",
      title: "Boshqaruv paneli",
      description: "Interfeys ko'rinishi, widget sozlamalari va yangilanish chastotasi",
      icon: <LayoutDashboard className="h-5 w-5" />,
      component: <DashboardSettings />,
      permissions: ["dashboard.view", "dashboard.update"]
    },
    {
      id: "system",
      title: "Tizim holati",
      description: "Tizim holati, resurslar monitoringi va loglarni ko'rish",
      icon: <Server className="h-5 w-5" />,
      component: <SystemStatus />,
      permissions: ["settings.system"]
    },
    {
      id: "sessions",
      title: "Sessiyalar",
      description: "Faol foydalanuvchi sessiyalarini boshqarish",
      icon: <Database className="h-5 w-5" />,
      component: <UserSessions />,
      permissions: ["settings.system"]
    }
  ];

  // Bu funksiya yordamida tablarni almashtiramiz
  const handleTabChange = (value: string) => {
    setActiveTab(value as SettingsCategory);
  };

  // Foydalanuvchi mavjud bo'lgan tab ruxsatlarini tekshiramiz
  const accessibleTabs = tabs.filter(tab => hasPermission(tab.permissions));

  // Agar hech qanday tab mavjud bo'lmasa, ruxsat yo'q habarni ko'rsatamiz
  if (accessibleTabs.length === 0) {
    return (
      <div className="container px-4 py-8">
        <Alert variant="destructive">
          <AlertTitle>Ruxsat yo'q</AlertTitle>
          <AlertDescription>
            Kechirasiz, bu bo'limni ko'rish uchun sizda yetarli ruxsatlar mavjud emas.
            Iltimos, tizim administratori bilan bog'laning.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8">
      <div className="flex flex-col space-y-6">
        {/* Sarlavha */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tizim sozlamalari</h1>
            <p className="text-muted-foreground">
              Tizim ishlashi va ko'rinishi uchun barcha sozlamalarni boshqaring
            </p>
          </div>
        </div>

        {/* Tab paneli */}
        <Card className="w-full border border-border">
          <CardContent className="p-0">
            <Tabs
              value={activeTab}
              onValueChange={handleTabChange}
              className="w-full"
            >
              <div className="flex flex-col md:flex-row">
                {/* Tab list chap tomonda */}
                <div className="md:w-64 border-r border-border">
                  <TabsList className="grid grid-flow-row h-auto bg-card p-0 md:p-2 gap-1">
                    {accessibleTabs.map((tab) => (
                      <TabsTrigger
                        key={tab.id}
                        value={tab.id}
                        className={`justify-start px-5 py-3 gap-3 data-[state=active]:bg-accent`}
                      >
                        {tab.icon}
                        <span className="text-left">{tab.title}</span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>

                {/* Tab content o'ng tomonda */}
                <div className="md:flex-1 p-4 md:p-6">
                  {accessibleTabs.map((tab) => (
                    <TabsContent key={tab.id} value={tab.id} className="m-0">
                      <div className="mb-6">
                        <h2 className="text-2xl font-semibold mb-2">{tab.title}</h2>
                        <p className="text-muted-foreground">{tab.description}</p>
                      </div>
                      <div className="mt-4">
                        {tab.component}
                      </div>
                    </TabsContent>
                  ))}
                </div>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;