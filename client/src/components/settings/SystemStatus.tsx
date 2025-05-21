import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { getSystemStatus, getSystemInfo, getSystemLogs } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { 
  Loader2, 
  Server, 
  Database, 
  AlertCircle, 
  HardDrive,
  Cpu,
  // Memory piktogrammasi o'rniga Cpu ishlatamiz
  RefreshCw,
  DownloadCloud,
  FileText,
  Calendar,
  Clock,
  Info
} from "lucide-react";

const SystemStatus: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("status");
  const [logLevel, setLogLevel] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [logComponent, setLogComponent] = useState<string>("");
  
  // Get system status
  const { 
    data: statusData, 
    isLoading: statusLoading, 
    error: statusError,
    refetch: refetchStatus
  } = useQuery({
    queryKey: ["/api/system/status"],
    queryFn: getSystemStatus
  });
  
  // Get system info
  const { 
    data: infoData, 
    isLoading: infoLoading, 
    error: infoError,
    refetch: refetchInfo
  } = useQuery({
    queryKey: ["/api/system/info"],
    queryFn: getSystemInfo
  });
  
  // Get system logs
  const { 
    data: logsData, 
    isLoading: logsLoading, 
    error: logsError,
    refetch: refetchLogs
  } = useQuery({
    queryKey: ["/api/system/logs", logLevel, startDate, endDate, logComponent],
    queryFn: () => getSystemLogs({
      level: logLevel !== "all" ? logLevel as any : undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      component: logComponent || undefined
    })
  });
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('uz-UZ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };
  
  // Format uptime
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    return `${days} kun, ${hours} soat, ${minutes} daqiqa`;
  };
  
  // Get badge color based on status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy":
        return <Badge className="bg-green-500">Sog'lom</Badge>;
      case "warning":
        return <Badge variant="warning">Ogohlantirish</Badge>;
      case "critical":
        return <Badge variant="destructive">Kritik</Badge>;
      default:
        return <Badge variant="outline">Noma'lum</Badge>;
    }
  };
  
  // Get badge color based on log level
  const getLogLevelBadge = (level: string) => {
    switch (level) {
      case "info":
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/10">Ma'lumot</Badge>;
      case "warning":
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/10">Ogohlantirish</Badge>;
      case "error":
        return <Badge variant="outline" className="bg-red-500/10 text-red-500 hover:bg-red-500/10">Xato</Badge>;
      case "critical":
        return <Badge variant="outline" className="bg-purple-500/10 text-purple-500 hover:bg-purple-500/10">Kritik</Badge>;
      default:
        return <Badge variant="outline">Noma'lum</Badge>;
    }
  };
  
  // Refresh all data
  const refreshAllData = () => {
    refetchStatus();
    refetchInfo();
    refetchLogs();
    toast({
      title: "Ma'lumotlar yangilandi",
      description: "Tizim holati ma'lumotlari qayta yuklandi",
    });
  };
  
  if (statusLoading || infoLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (statusError || infoError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Xatolik</AlertTitle>
        <AlertDescription>
          Tizim holati ma'lumotlarini yuklashda xatolik yuz berdi. Iltimos, sahifani yangilang yoki administratorga murojaat qiling.
        </AlertDescription>
      </Alert>
    );
  }
  
  const systemStatus = statusData?.data?.status;
  const systemInfo = infoData?.data;
  const logs = logsData?.data?.logs || [];
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Tizim ma'lumotlari</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshAllData}
          className="flex items-center"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Yangilash
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="status" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            Joriy holat
          </TabsTrigger>
          <TabsTrigger value="info" className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            Tizim haqida
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Tizim loglari
          </TabsTrigger>
        </TabsList>
        
        {/* Joriy holat */}
        <TabsContent value="status">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Umumiy holat</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {systemStatus?.overall === "healthy" ? (
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                        <Server className="h-5 w-5" />
                      </div>
                    ) : systemStatus?.overall === "warning" ? (
                      <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
                        <AlertCircle className="h-5 w-5" />
                      </div>
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                        <AlertCircle className="h-5 w-5" />
                      </div>
                    )}
                    <div className="ml-4">
                      <p className="text-sm font-medium">Tizim ishlashi</p>
                      <p className="text-2xl font-bold">
                        {systemStatus?.overall === "healthy" ? "Sog'lom" : 
                         systemStatus?.overall === "warning" ? "Ogohlantirishlar bor" : 
                         "Xatoliklar mavjud"}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(systemStatus?.overall || "unknown")}
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  Oxirgi tekshiruv: {formatDate(systemStatus?.lastCheck || new Date().toISOString())}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Mavjud muammolar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium">Hal qilinmagan muammolar</p>
                    <p className="text-2xl font-bold">
                      {systemStatus?.pendingIssues?.length || 0}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  {(systemStatus?.pendingIssues?.length || 0) > 0 ? (
                    <div className="text-sm text-muted-foreground">
                      <p>Oxirgi muammo: {systemStatus?.pendingIssues[0].message}</p>
                      <p>Status: {systemStatus?.pendingIssues[0].status}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Hozirda hal qilinmagan muammolar yo'q</p>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Xotira foydalanishi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                    <HardDrive className="h-5 w-5" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium">Umumiy xotira</p>
                    <p className="text-2xl font-bold">
                      {systemStatus?.components?.find(c => c.name === "storage")?.usedSpace || 0} / 
                      {systemStatus?.components?.find(c => c.name === "storage")?.totalSpace || 0} GB
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between mb-1 text-sm">
                    <span>Foydalanilgan</span>
                    <span>
                      {systemStatus?.components?.find(c => c.name === "storage")?.usagePercentage || 0}%
                    </span>
                  </div>
                  <Progress 
                    value={systemStatus?.components?.find(c => c.name === "storage")?.usagePercentage || 0} 
                    className="h-2" 
                  />
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Komponentlar holati</CardTitle>
              <CardDescription>
                Tizim komponentlarining joriy holati va ko'rsatkichlari
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Komponent</TableHead>
                    <TableHead>Holat</TableHead>
                    <TableHead>Tafsilotlar</TableHead>
                    <TableHead className="text-right">Ko'rsatkichlar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {systemStatus?.components?.map((component) => (
                    <TableRow key={component.name}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          {component.name === "web_server" && <Server className="h-4 w-4 mr-2" />}
                          {component.name === "database" && <Database className="h-4 w-4 mr-2" />}
                          {component.name === "storage" && <HardDrive className="h-4 w-4 mr-2" />}
                          {component.name === "sms_service" && <DownloadCloud className="h-4 w-4 mr-2" />}
                          {(component.name === "web_server" ? "Web Server" :
                            component.name === "database" ? "Ma'lumotlar bazasi" :
                            component.name === "storage" ? "Xotira" :
                            component.name === "sms_service" ? "SMS Xizmat" :
                            component.name === "websocket" ? "WebSocket" :
                            component.name)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(component.status)}
                      </TableCell>
                      <TableCell>
                        {component.name === "web_server" && (
                          <div className="text-sm">
                            <p>Ishga tushgan vaqt: {formatUptime(component.uptime)}</p>
                            <p>Keyingi restart: {formatDate(component.lastRestart)}</p>
                          </div>
                        )}
                        {component.name === "database" && (
                          <div className="text-sm">
                            <p>Ulanishlar: {component.connectionPool?.active} / {component.connectionPool?.max}</p>
                            <p>So'nggi zaxira: {formatDate(component.lastBackup)}</p>
                          </div>
                        )}
                        {component.name === "storage" && (
                          <div className="text-sm">
                            <p>Ishlatilgan: {component.usedSpace} GB / {component.totalSpace} GB</p>
                            <p>Foydalanish: {component.usagePercentage}%</p>
                          </div>
                        )}
                        {component.name === "sms_service" && (
                          <div className="text-sm">
                            <p>Provider: {component.provider}</p>
                            <p>So'nggi SMS: {formatDate(component.lastMessageSent)}</p>
                          </div>
                        )}
                        {component.name === "websocket" && (
                          <div className="text-sm">
                            <p>Ulanishlar: {component.connections}</p>
                            <p>Xabarlar: {component.messagesSent} yuborilgan, {component.messagesReceived} qabul qilingan</p>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {component.name === "web_server" && (
                          <div className="flex flex-col space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-xs flex items-center">
                                <Cpu className="h-3 w-3 mr-1" /> CPU
                              </span>
                              <span className="text-xs">{component.load.cpu}%</span>
                            </div>
                            <Progress value={component.load.cpu} className="h-1" />
                            
                            <div className="flex justify-between items-center mt-2">
                              <span className="text-xs flex items-center">
                                <Cpu className="h-3 w-3 mr-1" /> RAM
                              </span>
                              <span className="text-xs">{component.load.memory}%</span>
                            </div>
                            <Progress value={component.load.memory} className="h-1" />
                          </div>
                        )}
                        {component.name === "database" && (
                          <div>
                            <span className="text-xs">Response: {component.responseTime}ms</span>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Tizim haqida */}
        <TabsContent value="info">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tizim ma'lumotlari</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tizim nomi</p>
                    <p className="text-base">{systemInfo?.system?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Versiya</p>
                    <p className="text-base">{systemInfo?.system?.version}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Muhit</p>
                    <p className="text-base">{systemInfo?.system?.environment}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Ishga tushgan vaqt</p>
                    <p className="text-base">{formatUptime(systemInfo?.system?.uptime || 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ma'lumotlar bazasi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Turi</p>
                    <p className="text-base">{systemInfo?.database?.type}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Versiya</p>
                    <p className="text-base">{systemInfo?.database?.version}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Hajmi</p>
                    <p className="text-base">{systemInfo?.database?.size?.value} {systemInfo?.database?.size?.unit}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Kolleksiyalar</p>
                    <p className="text-base">{systemInfo?.database?.collections}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Foydalanuvchilar statistikasi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Umumiy foydalanuvchilar</span>
                    <span className="font-medium">{systemInfo?.users?.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Faol foydalanuvchilar</span>
                    <span className="font-medium">{systemInfo?.users?.active}</span>
                  </div>
                  
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-3">Lavozimlar bo'yicha</p>
                    {systemInfo?.users?.byRole?.map((role) => (
                      <div key={role.role} className="flex justify-between items-center py-1">
                        <span className="text-sm capitalize">
                          {role.role === "boss" ? "Boshliq" :
                           role.role === "manager" ? "Menejer" :
                           role.role === "worker" ? "Ishchi" :
                           role.role === "vet" ? "Veterinar" :
                           role.role}
                        </span>
                        <Badge variant="outline">{role.count}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">API Foydalanish</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Umumiy so'rovlar</span>
                    <span className="font-medium">{systemInfo?.apiUsage?.totalRequests.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">O'rtacha kunlik</span>
                    <span className="font-medium">{systemInfo?.apiUsage?.dailyAverage.toLocaleString()}</span>
                  </div>
                  
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-3">Eng ko'p ishlatiladigan endpointlar</p>
                    {systemInfo?.apiUsage?.topEndpoints?.map((endpoint, index) => (
                      <div key={index} className="mb-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs truncate w-3/4">{endpoint.endpoint}</span>
                          <span className="text-xs font-medium">{endpoint.percentage}%</span>
                        </div>
                        <Progress 
                          value={endpoint.percentage} 
                          className="h-1 mt-1" 
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Tizim loglari */}
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tizim loglari</CardTitle>
              <CardDescription>
                Tizim faoliyatini monitoring qilish va xatoliklarni aniqlash uchun loglar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4">
                <div className="flex flex-wrap items-center gap-4 mb-4">
                  <div className="flex-1 min-w-[200px]">
                    <Label htmlFor="logLevel" className="mb-2 block">Log darajasi</Label>
                    <Select 
                      value={logLevel} 
                      onValueChange={setLogLevel}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Log darajasini tanlang" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Barcha darajalar</SelectItem>
                        <SelectItem value="info">Ma'lumot</SelectItem>
                        <SelectItem value="warning">Ogohlantirish</SelectItem>
                        <SelectItem value="error">Xato</SelectItem>
                        <SelectItem value="critical">Kritik</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex-1 min-w-[200px]">
                    <Label htmlFor="logComponent" className="mb-2 block">Komponent</Label>
                    <Select 
                      value={logComponent} 
                      onValueChange={setLogComponent}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Komponentni tanlang" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Barcha komponentlar</SelectItem>
                        <SelectItem value="database">Ma'lumotlar bazasi</SelectItem>
                        <SelectItem value="api">API</SelectItem>
                        <SelectItem value="auth">Autentifikatsiya</SelectItem>
                        <SelectItem value="websocket">WebSocket</SelectItem>
                        <SelectItem value="scheduler">Rejalashtiruvchi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex-1 min-w-[200px]">
                    <Label htmlFor="startDate" className="mb-2 block">
                      <Calendar className="h-4 w-4 inline-block mr-1" />
                      Boshlang'ich sana
                    </Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex-1 min-w-[200px]">
                    <Label htmlFor="endDate" className="mb-2 block">
                      <Calendar className="h-4 w-4 inline-block mr-1" />
                      Tugash sanasi
                    </Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
                
                {logsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : logsError ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Xatolik</AlertTitle>
                    <AlertDescription>
                      Loglarni yuklashda xatolik yuz berdi. Iltimos, sahifani yangilang yoki administratorga murojaat qiling.
                    </AlertDescription>
                  </Alert>
                ) : logs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Tanlangan shartlar bo'yicha loglar topilmadi
                  </div>
                ) : (
                  <ScrollArea className="h-[500px] rounded-md border">
                    <div className="p-4 space-y-4">
                      {logs.map((log, index) => (
                        <div key={index} className="border rounded-md p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                              {getLogLevelBadge(log.level)}
                              <span className="text-sm font-medium">{log.component}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {formatDate(log.timestamp)}
                            </div>
                          </div>
                          <p className="font-medium mb-2">{log.message}</p>
                          {log.details && (
                            <div className="bg-muted p-2 rounded-md text-xs font-mono overflow-x-auto mt-2">
                              <pre>{JSON.stringify(log.details, null, 2)}</pre>
                            </div>
                          )}
                          {log.stackTrace && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="mt-2"
                              onClick={() => {
                                // Toggle stack trace visibility
                                const target = document.getElementById(`stack-${index}`);
                                if (target) {
                                  target.classList.toggle('hidden');
                                }
                              }}
                            >
                              Stack trace ko'rsatish
                            </Button>
                          )}
                          {log.stackTrace && (
                            <div id={`stack-${index}`} className="hidden mt-2 bg-muted p-2 rounded-md text-xs font-mono overflow-x-auto">
                              <pre>{log.stackTrace}</pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SystemStatus;