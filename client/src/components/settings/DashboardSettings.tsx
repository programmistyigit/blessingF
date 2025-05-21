import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getDashboardSettings, updateDashboardSettings, getInnerApps } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Loader2, Plus, Trash2, Move, RefreshCw, X, AppWindow } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

interface DashboardWidget {
  id: string;
  type: string;
  title: string;
  enabled: boolean;
  width: "small" | "medium" | "large" | "full";
  position: number;
  refreshInterval: number;
  dataSource: string;
  config: any;
}

interface InnerApp {
  id: string;
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
  category: string;
}

const DashboardSettings: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("layout");
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [innerApps, setInnerApps] = useState<InnerApp[]>([]);
  const [refreshIntervals, setRefreshIntervals] = useState({
    production: 5,
    inventory: 10,
    tasks: 5,
    financial: 15,
    alerts: 1
  });
  
  // Get dashboard settings from API
  const { data: dashboardData, isLoading: dashboardLoading, error: dashboardError } = useQuery({
    queryKey: ["/api/dashboard/settings"],
    queryFn: getDashboardSettings
  });
  
  // Get inner apps
  const { data: appsData, isLoading: appsLoading, error: appsError } = useQuery({
    queryKey: ["/api/dashboard/inner-apps"],
    queryFn: getInnerApps
  });
  
  // Update dashboard settings mutation
  const updateDashboardMutation = useMutation({
    mutationFn: updateDashboardSettings,
    onSuccess: () => {
      toast({
        title: "Sozlamalar saqlandi",
        description: "Boshqaruv paneli sozlamalari muvaffaqiyatli yangilandi",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/settings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Xatolik yuz berdi",
        description: error.message || "Sozlamalarni saqlashda xatolik yuz berdi",
        variant: "destructive",
      });
    },
  });
  
  // Initialize state from API data
  useEffect(() => {
    if (dashboardData?.data?.settings) {
      if (dashboardData.data.settings.widgets) {
        setWidgets(dashboardData.data.settings.widgets);
      }
      
      if (dashboardData.data.settings.refreshIntervals) {
        setRefreshIntervals(dashboardData.data.settings.refreshIntervals);
      }
    }
  }, [dashboardData]);
  
  // Initialize inner apps from API data
  useEffect(() => {
    if (appsData?.data?.apps) {
      setInnerApps(appsData.data.apps);
    }
  }, [appsData]);
  
  // Handle widget drag and drop
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    
    const items = Array.from(widgets);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Update positions
    const updatedItems = items.map((item, index) => ({
      ...item,
      position: index
    }));
    
    setWidgets(updatedItems);
  };
  
  // Toggle widget enabled status
  const toggleWidgetEnabled = (id: string) => {
    setWidgets(prev => 
      prev.map(widget => 
        widget.id === id ? { ...widget, enabled: !widget.enabled } : widget
      )
    );
  };
  
  // Toggle inner app enabled status
  const toggleAppEnabled = (id: string) => {
    setInnerApps(prev => 
      prev.map(app => 
        app.id === id ? { ...app, enabled: !app.enabled } : app
      )
    );
  };
  
  // Update widget property
  const updateWidgetProperty = (id: string, property: string, value: any) => {
    setWidgets(prev => 
      prev.map(widget => 
        widget.id === id ? { ...widget, [property]: value } : widget
      )
    );
  };
  
  // Update refresh interval
  const updateRefreshInterval = (category: string, value: number) => {
    setRefreshIntervals(prev => ({
      ...prev,
      [category]: value
    }));
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    updateDashboardMutation.mutate({
      widgets,
      innerApps: innerApps.map(app => ({ id: app.id, enabled: app.enabled })),
      refreshIntervals
    });
  };
  
  if (dashboardLoading || appsLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (dashboardError || appsError) {
    return (
      <div className="bg-destructive/10 p-4 rounded-md text-destructive">
        Boshqaruv paneli sozlamalarini yuklashda xatolik yuz berdi. Iltimos, sahifani yangilang yoki administratorga murojaat qiling.
      </div>
    );
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="layout">Panel joylashuvi</TabsTrigger>
          <TabsTrigger value="apps">Ichki dasturlar</TabsTrigger>
          <TabsTrigger value="refresh">Yangilanish</TabsTrigger>
        </TabsList>
        
        {/* Panel joylashuvi */}
        <TabsContent value="layout">
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="text-lg font-medium">Panel vidjetlarini sozlash</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Vidjetlarni drag-and-drop yordamida qayta tartiblang yoki sozlamalarini o'zgartiring
              </p>
              
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="widgets">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-4"
                    >
                      {widgets.sort((a, b) => a.position - b.position).map((widget, index) => (
                        <Draggable key={widget.id} draggableId={widget.id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`border rounded-md p-4 ${widget.enabled ? "" : "opacity-60"}`}
                            >
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <div {...provided.dragHandleProps} className="cursor-move">
                                    <Move className="h-5 w-5 text-muted-foreground" />
                                  </div>
                                  <h4 className="font-medium">{widget.title}</h4>
                                  <Badge variant="outline">{widget.type}</Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Switch
                                    id={`enable-${widget.id}`}
                                    checked={widget.enabled}
                                    onCheckedChange={() => toggleWidgetEnabled(widget.id)}
                                  />
                                  <Label htmlFor={`enable-${widget.id}`} className="sr-only">
                                    Enable {widget.title}
                                  </Label>
                                </div>
                              </div>
                              
                              {widget.enabled && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                  <div className="space-y-2">
                                    <Label htmlFor={`width-${widget.id}`}>Kenglik</Label>
                                    <Select 
                                      value={widget.width} 
                                      onValueChange={(value) => updateWidgetProperty(widget.id, "width", value)}
                                    >
                                      <SelectTrigger id={`width-${widget.id}`}>
                                        <SelectValue placeholder="Vidjet kengligini tanlang" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="small">Kichik (1/4)</SelectItem>
                                        <SelectItem value="medium">O'rta (1/3)</SelectItem>
                                        <SelectItem value="large">Katta (1/2)</SelectItem>
                                        <SelectItem value="full">To'liq (1/1)</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <Label htmlFor={`refresh-${widget.id}`}>
                                      Yangilanish vaqti: {widget.refreshInterval} daqiqa
                                    </Label>
                                    <Slider
                                      id={`refresh-${widget.id}`}
                                      min={1}
                                      max={30}
                                      step={1}
                                      value={[widget.refreshInterval]}
                                      onValueChange={(value) => updateWidgetProperty(widget.id, "refreshInterval", value[0])}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Ichki dasturlar */}
        <TabsContent value="apps">
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="text-lg font-medium">Ichki dasturlar</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Tizimga qo'shimcha funksionallik qo'shuvchi ichki dasturlarni yoqish yoki o'chirish
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {innerApps.map((app) => (
                  <div key={app.id} className="border rounded-md p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 flex items-center justify-center bg-primary/10 rounded-md text-primary">
                          <AppWindow className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-medium">{app.name}</h4>
                          <p className="text-sm text-muted-foreground">{app.description}</p>
                          <Badge variant="outline" className="mt-2">{app.category}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Switch
                          id={`enable-app-${app.id}`}
                          checked={app.enabled}
                          onCheckedChange={() => toggleAppEnabled(app.id)}
                        />
                        <Label htmlFor={`enable-app-${app.id}`} className="sr-only">
                          Enable {app.name}
                        </Label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Yangilanish sozlamalari */}
        <TabsContent value="refresh">
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="text-lg font-medium">Yangilanish sozlamalari</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Turli kategoriyalar uchun ma'lumotlar yangilanish vaqtini sozlash (daqiqa)
              </p>
              
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="refresh-production">
                      Ishlab chiqarish ma'lumotlari: {refreshIntervals.production} daqiqa
                    </Label>
                    <span className="text-sm text-muted-foreground">
                      {refreshIntervals.production === 1 ? "Har daqiqa" : `Har ${refreshIntervals.production} daqiqada`}
                    </span>
                  </div>
                  <Slider
                    id="refresh-production"
                    min={1}
                    max={30}
                    step={1}
                    value={[refreshIntervals.production]}
                    onValueChange={(value) => updateRefreshInterval("production", value[0])}
                  />
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="refresh-inventory">
                      Inventar ma'lumotlari: {refreshIntervals.inventory} daqiqa
                    </Label>
                    <span className="text-sm text-muted-foreground">
                      {refreshIntervals.inventory === 1 ? "Har daqiqa" : `Har ${refreshIntervals.inventory} daqiqada`}
                    </span>
                  </div>
                  <Slider
                    id="refresh-inventory"
                    min={1}
                    max={30}
                    step={1}
                    value={[refreshIntervals.inventory]}
                    onValueChange={(value) => updateRefreshInterval("inventory", value[0])}
                  />
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="refresh-tasks">
                      Vazifalar ma'lumotlari: {refreshIntervals.tasks} daqiqa
                    </Label>
                    <span className="text-sm text-muted-foreground">
                      {refreshIntervals.tasks === 1 ? "Har daqiqa" : `Har ${refreshIntervals.tasks} daqiqada`}
                    </span>
                  </div>
                  <Slider
                    id="refresh-tasks"
                    min={1}
                    max={30}
                    step={1}
                    value={[refreshIntervals.tasks]}
                    onValueChange={(value) => updateRefreshInterval("tasks", value[0])}
                  />
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="refresh-financial">
                      Moliyaviy ma'lumotlar: {refreshIntervals.financial} daqiqa
                    </Label>
                    <span className="text-sm text-muted-foreground">
                      {refreshIntervals.financial === 1 ? "Har daqiqa" : `Har ${refreshIntervals.financial} daqiqada`}
                    </span>
                  </div>
                  <Slider
                    id="refresh-financial"
                    min={1}
                    max={60}
                    step={5}
                    value={[refreshIntervals.financial]}
                    onValueChange={(value) => updateRefreshInterval("financial", value[0])}
                  />
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="refresh-alerts">
                      Ogohlantirishlar: {refreshIntervals.alerts} daqiqa
                    </Label>
                    <span className="text-sm text-muted-foreground">
                      {refreshIntervals.alerts === 1 ? "Har daqiqa" : `Har ${refreshIntervals.alerts} daqiqada`}
                    </span>
                  </div>
                  <Slider
                    id="refresh-alerts"
                    min={1}
                    max={10}
                    step={1}
                    value={[refreshIntervals.alerts]}
                    onValueChange={(value) => updateRefreshInterval("alerts", value[0])}
                  />
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
          disabled={updateDashboardMutation.isPending}
        >
          {updateDashboardMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Saqlash
        </Button>
      </div>
    </form>
  );
};

export default DashboardSettings;