import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getUserSessions, terminateUserSession } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Loader2, Search, X, AlertCircle, LogOut, Laptop, Smartphone, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Session {
  id: string;
  user: {
    id: string;
    name: string;
    role: string;
  };
  device: string;
  browser: string;
  os: string;
  ip: string;
  createdAt: string;
  lastActivity: string;
  expiresAt: string;
}

const UserSessions: React.FC = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [showTerminateDialog, setShowTerminateDialog] = useState(false);
  
  // Get sessions
  const { 
    data: sessionsData, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ["/api/sessions"],
    queryFn: getUserSessions
  });
  
  // Terminate session mutation
  const terminateSessionMutation = useMutation({
    mutationFn: (sessionId: string) => terminateUserSession(sessionId),
    onSuccess: () => {
      toast({
        title: "Sessiya tugatildi",
        description: "Foydalanuvchi sessiyasi muvaffaqiyatli tugatildi",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      setShowTerminateDialog(false);
      setSelectedSession(null);
    },
    onError: (error: any) => {
      toast({
        title: "Xatolik yuz berdi",
        description: error.message || "Sessiyani tugatishda xatolik yuz berdi",
        variant: "destructive",
      });
    },
  });
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('uz-UZ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Calculate time ago
  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds} soniya oldin`;
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)} daqiqa oldin`;
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)} soat oldin`;
    } else {
      return `${Math.floor(diffInSeconds / 86400)} kun oldin`;
    }
  };
  
  // Filter sessions by search term
  const filteredSessions = React.useMemo(() => {
    if (!sessionsData?.data?.sessions) return [];
    
    return (sessionsData.data.sessions as Session[]).filter(session => 
      session.user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      session.user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.ip.includes(searchTerm) ||
      session.browser.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sessionsData, searchTerm]);
  
  // Handle session termination
  const handleTerminateSession = (session: Session) => {
    setSelectedSession(session);
    setShowTerminateDialog(true);
  };
  
  // Confirm session termination
  const confirmTerminateSession = () => {
    if (selectedSession) {
      terminateSessionMutation.mutate(selectedSession.id);
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
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Xatolik</AlertTitle>
        <AlertDescription>
          Sessiya ma'lumotlarini yuklashda xatolik yuz berdi. Iltimos, sahifani yangilang yoki administratorga murojaat qiling.
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Faol sessiyalar</h3>
          <p className="text-sm text-muted-foreground">
            Hozirda tizimga kirgan foydalanuvchilarning sessiyalari
          </p>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="flex items-center"
        >
          <Clock className="h-4 w-4 mr-2" />
          Yangilash
        </Button>
      </div>
      
      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="relative md:w-[300px]">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Sessiyalarni qidirish..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="px-2 py-1">
                <span className="font-normal mr-1">Jami:</span>
                <span className="font-medium">{sessionsData?.data?.total || 0}</span>
              </Badge>
              {Object.entries(sessionsData?.data?.byRole || {}).map(([role, count]) => (
                <Badge key={role} variant="outline" className="px-2 py-1">
                  <span className="font-normal mr-1">{role}:</span>
                  <span className="font-medium">{count}</span>
                </Badge>
              ))}
            </div>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Foydalanuvchi</TableHead>
                  <TableHead>Qurilma</TableHead>
                  <TableHead className="hidden md:table-cell">IP Manzil</TableHead>
                  <TableHead className="hidden md:table-cell">Kirish vaqti</TableHead>
                  <TableHead className="hidden md:table-cell">Oxirgi faollik</TableHead>
                  <TableHead className="text-right">Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSessions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                      Faol sessiyalar topilmadi
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{session.user.name}</span>
                          <span className="text-xs text-muted-foreground">{session.user.role}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {session.device === "Desktop" ? (
                            <Laptop className="h-4 w-4 mr-2 text-muted-foreground" />
                          ) : (
                            <Smartphone className="h-4 w-4 mr-2 text-muted-foreground" />
                          )}
                          <span className="text-sm">{session.browser}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{session.os}</span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <code className="text-xs bg-muted px-1 py-0.5 rounded">{session.ip}</code>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="text-sm">{formatDate(session.createdAt)}</div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="text-sm">{timeAgo(session.lastActivity)}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleTerminateSession(session)}
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          <span>Tugatish</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* Sessiyani tugatish dialogi */}
      <Dialog open={showTerminateDialog} onOpenChange={setShowTerminateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sessiyani tugatishni tasdiqlang</DialogTitle>
            <DialogDescription>
              Ushbu amal foydalanuvchini tizimdan chiqarib yuboradi va ular qayta kirishlari kerak bo'ladi.
            </DialogDescription>
          </DialogHeader>
          
          {selectedSession && (
            <div className="py-4">
              <div className="flex flex-col space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Foydalanuvchi:</span>
                  <span className="font-medium">{selectedSession.user.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lavozim:</span>
                  <span>{selectedSession.user.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Qurilma:</span>
                  <span>{selectedSession.device}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Brauzer:</span>
                  <span>{selectedSession.browser}</span>
                </div>
              </div>
              
              <Alert variant="warning" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Ogohlantirish</AlertTitle>
                <AlertDescription>
                  Bu amal darhol bajariladi va uni bekor qilib bo'lmaydi.
                </AlertDescription>
              </Alert>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowTerminateDialog(false)}
            >
              Bekor qilish
            </Button>
            <Button
              variant="destructive"
              onClick={confirmTerminateSession}
              disabled={terminateSessionMutation.isPending}
            >
              {terminateSessionMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4 mr-2" />
              )}
              Sessiyani tugatish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserSessions;