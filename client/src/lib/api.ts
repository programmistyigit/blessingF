import { apiRequest } from "./queryClient";
import { baseHost } from "./host";
import { getToken } from "./auth";

// Authentication - ikki bosqichli SMS autentifikatsiya

// Birinchi bosqich - telefon raqamni yuborish va SMS kodini so'rash
export const requestLoginCode = async (phoneNumber: string) => {
  console.log('API: requestLoginCode called with phone:', phoneNumber);

  try {
    // Tashqi API server manzili - host.ts dan import qilindi
    const url = `${baseHost}/api/auth/login`;
    
    console.log('API: Preparing request data:', { phoneNumber });
    console.log('API: Sending request to', url);
    
    // API so'rovni yuborish
    console.log('API: Full URL:', url);
    console.log('API: Request body:', JSON.stringify({ phoneNumber }));
    
    // Cross-Origin Resource Sharing (CORS) muammolarini oldini olish uchun
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ phoneNumber }),
      mode: 'cors'
    });
    
    console.log('API: requestLoginCode response status:', response.status);
    
    // Agar server xatolik qaytarsa
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error:', response.status, response.statusText, 'Response body:', errorText);
      
      return {
        success: false, 
        message: `Server xatosi: ${response.status} ${response.statusText}`
      };
    }
    
    // API serveri muvaffaqiyatli javob berdi
    const data = await response.json();
    console.log('API: Server response data:', data);
    return data;
    
  } catch (error) {
    console.error('API: requestLoginCode error:', error);
    
    return { 
      success: false, 
      message: "Server bilan bog'lanishda xatolik yuz berdi"
    };
  }
};

// Ikkinchi bosqich - SMS kodi bilan autentifikatsiya
export const verifyLoginCode = async (phoneNumber: string, code: string) => {
  console.log('API: verifyLoginCode called with phone:', phoneNumber, 'and code:', code);
  
  try {
    // Tashqi API server manzili - host.ts dan import qilindi
    const url = `${baseHost}/api/auth/verify`;
    
    // So'rov ma'lumotlari
    console.log('API: Preparing verify request data:', { phoneNumber, code });
    
    // API so'rovi yuborish
    console.log('API: Sending verify request to:', url);
    console.log('API: Verify request body:', JSON.stringify({ phoneNumber, code }));
    
    // CORS muammolarini oldini olish uchun
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ phoneNumber, code }),
      mode: 'cors'
    });
    
    console.log('API: verifyLoginCode response status:', response.status);
    
    // Agar server xatolik qaytarsa
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API: Server error response:', response.status, errorText);
      
      return { 
        success: false, 
        message: "Server xatoligi: " + (errorText || response.statusText) 
      };
    }
    
    // Serverdan muvaffaqiyatli javob olindi
    const data = await response.json();
    console.log('API: Server response data for verification:', data);
    
    // Serverdan kelgan javobni tekshirish
    if (data && data.success) {
      return data;
    } else {
      console.error('API: Response was not successful:', data);
      return {
        success: false,
        message: data?.message || "Noma'lum xatolik yuz berdi"
      };
    }
    
  } catch (error) {
    console.error('API: verifyLoginCode network error:', error);
    
    return { 
      success: false, 
      message: "Server bilan bog'lanishda xatolik yuz berdi" 
    };
  }
};

// User Management
export const getUsers = async (params?: { role?: string; section?: string; limit?: number; page?: number }) => {
  const queryParams = new URLSearchParams();
  if (params?.role) queryParams.append("role", params.role);
  if (params?.section) queryParams.append("section", params.section);
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  if (params?.page) queryParams.append("page", params.page.toString());
  
  const url = `/api/user?${queryParams.toString()}`;
  const response = await apiRequest("GET", url);
  return response.json();
};

export const createUser = async (userData: any) => {
  const response = await apiRequest("POST", "/api/user", userData);
  return response.json();
};

export const updateUser = async (id: string, userData: any) => {
  const response = await apiRequest("PUT", `/api/user/${id}`, userData);
  return response.json();
};

export const deleteUser = async (id: string) => {
  const response = await apiRequest("DELETE", `/api/user/${id}`);
  return response.json();
};

// Attendance Management
export const createAttendanceTask = async (taskData: any) => {
  const response = await apiRequest("POST", "/api/attendance/tasks", taskData);
  return response.json();
};

export const getAttendanceStats = async (params: { startDate: string; endDate: string; section: string }) => {
  const queryParams = new URLSearchParams();
  queryParams.append("startDate", params.startDate);
  queryParams.append("endDate", params.endDate);
  queryParams.append("section", params.section);
  
  const url = `/api/attendance/stats?${queryParams.toString()}`;
  const response = await apiRequest("GET", url);
  return response.json();
};

// Position Management
export const createPosition = async (positionData: any) => {
  const response = await apiRequest("POST", "/api/positions", positionData);
  return response.json();
};

// Batch Management
export const getBatches = async (params?: { section?: string; status?: string }) => {
  const queryParams = new URLSearchParams();
  if (params?.section) queryParams.append("section", params.section);
  if (params?.status) queryParams.append("status", params.status);
  
  const url = `/api/batches${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  const response = await apiRequest("GET", url);
  return response.json();
};

export const createBatch = async (batchData: any) => {
  const response = await apiRequest("POST", "/api/batches", batchData);
  return response.json();
};

export const updateBatch = async (id: string, batchData: any) => {
  const response = await apiRequest("PUT", `/api/batches/${id}`, batchData);
  return response.json();
};

export const deleteBatch = async (id: string) => {
  const response = await apiRequest("DELETE", `/api/batches/${id}`);
  return response.json();
};

// Slaughter Management
export const getSlaughterBatches = async (params?: { status?: string }) => {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.append("status", params.status);
  
  const url = `/api/slaughter-batches${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  const response = await apiRequest("GET", url);
  return response.json();
};

export const createSlaughterBatch = async (slaughterBatchData: any) => {
  const response = await apiRequest("POST", "/api/slaughter-batches", slaughterBatchData);
  return response.json();
};

export const updateSlaughterBatch = async (id: string, slaughterBatchData: any) => {
  const response = await apiRequest("PUT", `/api/slaughter-batches/${id}`, slaughterBatchData);
  return response.json();
};

export const deleteSlaughterBatch = async (id: string) => {
  const response = await apiRequest("DELETE", `/api/slaughter-batches/${id}`);
  return response.json();
};

// Reports
export const getSectionReport = async (sectionId: string, reportParams: any) => {
  const response = await apiRequest("POST", `/api/reports/section/${sectionId}`, reportParams);
  return response.json();
};

export const exportSectionReport = async (sectionId: string, reportParams: any, format: 'pdf' | 'excel') => {
  const response = await apiRequest("POST", `/api/reports/section/${sectionId}/export`, { 
    ...reportParams,
    format
  });
  return response.json();
};

export const getSections = async () => {
  const response = await apiRequest("GET", "/api/sections");
  return response.json();
};

// Dashboard
export const getDashboardStats = async () => {
  const response = await apiRequest("GET", "/api/dashboard/stats");
  return response.json();
};

export const getReadyBatches = async () => {
  const response = await apiRequest("GET", "/api/dashboard/ready-batches");
  return response.json();
};

export const getLowInventoryItems = async () => {
  const response = await apiRequest("GET", "/api/dashboard/low-inventory");
  return response.json();
};

export const getAlerts = async () => {
  const response = await apiRequest("GET", "/api/dashboard/alerts");
  return response.json();
};

export const getDashboardAttendance = async () => {
  const response = await apiRequest("GET", "/api/dashboard/attendance");
  return response.json();
};

export const getBatchGrowthData = async (batchId: string) => {
  const response = await apiRequest("GET", `/api/batches/${batchId}/growth`);
  return response.json();
};

// Boss API - Tizim Sozlamalari

// Barcha tizim sozlamalarini olish
export const getAllSettings = async () => {
  const response = await apiRequest("GET", "/api/settings");
  return response.json();
};

// SMS Xabarnomalar Sozlamalari

// SMS Xabarnomalar Sozlamalarini Olish
export const getSmsSettings = async () => {
  const response = await apiRequest("GET", "/api/settings/notifications/sms");
  return response.json();
};

// SMS Xabarnomalar Sozlamalarini Yangilash
export const updateSmsSettings = async (smsSettingsData: any) => {
  const response = await apiRequest("PUT", "/api/settings/notifications/sms", smsSettingsData);
  return response.json();
};

// SMS Provider Sozlamalarini Yangilash
export const updateSmsProviderSettings = async (providerData: any) => {
  const response = await apiRequest("PUT", "/api/settings/notifications/sms/provider", providerData);
  return response.json();
};

// SMS Qoliplarini (Templates) Yangilash
export const updateSmsTemplates = async (templatesData: { templates: Record<string, string> }) => {
  const response = await apiRequest("PUT", "/api/settings/notifications/sms/templates", templatesData);
  return response.json();
};

// SMS Xabarnoma Qabul Qiluvchilar Guruhini Yaratish
export const createSmsRecipientGroup = async (groupData: { name: string, recipients: string[] }) => {
  const response = await apiRequest("POST", "/api/settings/notifications/sms/recipient-groups", groupData);
  return response.json();
};

// SMS Xabar Yuborish
export const sendSmsMessage = async (messageData: {
  recipients: {
    users?: string[],
    groups?: string[],
    phoneNumbers?: string[]
  },
  message: string,
  template?: string,
  saveAsTemplate?: boolean,
  templateName?: string
}) => {
  const response = await apiRequest("POST", "/api/notifications/sms/send", messageData);
  return response.json();
};

// SMS Xabarlar Tarixini Olish
export const getSmsHistory = async (params?: {
  startDate?: string,
  endDate?: string,
  status?: 'sent' | 'delivered' | 'failed',
  page?: number,
  limit?: number
}) => {
  const queryParams = new URLSearchParams();
  if (params?.startDate) queryParams.append("startDate", params.startDate);
  if (params?.endDate) queryParams.append("endDate", params.endDate);
  if (params?.status) queryParams.append("status", params.status);
  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  
  const url = `/api/notifications/sms/history?${queryParams.toString()}`;
  const response = await apiRequest("GET", url);
  return response.json();
};

// Hisobot Sozlamalari API

// Hisobot Sozlamalarini Olish
export const getReportSettings = async () => {
  const response = await apiRequest("GET", "/api/settings/reports");
  return response.json();
};

// Hisobot Sozlamalarini Yangilash
export const updateReportSettings = async (settingsData: any) => {
  const response = await apiRequest("PUT", "/api/settings/reports", settingsData);
  return response.json();
};

// Yangi Hisobot Shabloni Yaratish
export const createReportTemplate = async (templateData: any) => {
  const response = await apiRequest("POST", "/api/settings/reports/templates", templateData);
  return response.json();
};

// Hisobot Bilan Ishlash Turlari
export const getReportSections = async () => {
  const response = await apiRequest("GET", "/api/settings/reports/sections");
  return response.json();
};

// Real-Vaqt Boshqaruv Paneli (Dashboard) API

// Yangilangan Dashboard API - Yangi API hujjatlariga muvofiq

// 1. Umumiy Dashboard Ma'lumotlari
// Periods API
export const getPeriods = async () => {
  const response = await apiRequest("GET", "/api/periods");
  return response.json();
};

export const getDashboardData = async (params?: {
  period?: 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'custom',
  startDate?: string,
  endDate?: string,
  periodId?: string
}) => {
  const queryParams = new URLSearchParams();
  if (params?.period) queryParams.append("period", params.period);
  if (params?.startDate) queryParams.append("startDate", params.startDate);
  if (params?.endDate) queryParams.append("endDate", params.endDate);
  if (params?.periodId) queryParams.append("periodId", params.periodId);
  
  const url = `/api/dashboard?${queryParams.toString()}`;
  const response = await apiRequest("GET", url);
  return response.json();
};

// 2. Moliyaviy Dashboard Ma'lumotlari
export const getFinancialDashboardData = async (params?: {
  period?: 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'custom',
  startDate?: string,
  endDate?: string,
  periodId?: string
}) => {
  const queryParams = new URLSearchParams();
  if (params?.period) queryParams.append("period", params.period);
  if (params?.startDate) queryParams.append("startDate", params.startDate);
  if (params?.endDate) queryParams.append("endDate", params.endDate);
  if (params?.periodId) queryParams.append("periodId", params.periodId);
  
  const url = `/api/dashboard/financial?${queryParams.toString()}`;
  const response = await apiRequest("GET", url);
  return response.json();
};

// 3. Ishlab Chiqarish Dashboard Ma'lumotlari
export const getProductionDashboardData = async (params?: {
  period?: 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'custom',
  startDate?: string,
  endDate?: string,
  periodId?: string,
  batchId?: string,
  sectionId?: string
}) => {
  const queryParams = new URLSearchParams();
  if (params?.period) queryParams.append("period", params.period);
  if (params?.startDate) queryParams.append("startDate", params.startDate);
  if (params?.endDate) queryParams.append("endDate", params.endDate);
  if (params?.periodId) queryParams.append("periodId", params.periodId);
  if (params?.batchId) queryParams.append("batchId", params.batchId);
  if (params?.sectionId) queryParams.append("sectionId", params.sectionId);
  
  const url = `/api/dashboard/production?${queryParams.toString()}`;
  const response = await apiRequest("GET", url);
  return response.json();
};

// 4. Inventar Dashboard Ma'lumotlari
export const getInventoryDashboardData = async (params?: {
  period?: 'week' | 'month' | 'year' | 'custom',
  startDate?: string,
  endDate?: string,
  periodId?: string
}) => {
  const queryParams = new URLSearchParams();
  if (params?.period) queryParams.append("period", params.period);
  if (params?.startDate) queryParams.append("startDate", params.startDate);
  if (params?.endDate) queryParams.append("endDate", params.endDate);
  if (params?.periodId) queryParams.append("periodId", params.periodId);
  
  const url = `/api/dashboard/inventory?${queryParams.toString()}`;
  const response = await apiRequest("GET", url);
  return response.json();
};

// 5. Go'sht Sotish Dashboard Ma'lumotlari
export const getMeatSalesDashboardData = async (params?: {
  period?: 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'custom',
  startDate?: string,
  endDate?: string,
  periodId?: string
}) => {
  const queryParams = new URLSearchParams();
  if (params?.period) queryParams.append("period", params.period);
  if (params?.startDate) queryParams.append("startDate", params.startDate);
  if (params?.endDate) queryParams.append("endDate", params.endDate);
  if (params?.periodId) queryParams.append("periodId", params.periodId);
  
  const url = `/api/dashboard/meat-sales?${queryParams.toString()}`;
  const response = await apiRequest("GET", url);
  return response.json();
};

// Ichki Dastur (Inner Applications) Ro'yxatini Olish
export const getDashboardApps = async () => {
  const response = await apiRequest("GET", "/api/dashboard/apps");
  return response.json();
};

// Ichki Dastur (Inner Application) Ochish
export const openDashboardApp = async (
  appId: string,
  params?: {
    period?: 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'custom',
    startDate?: string,
    endDate?: string,
    filters?: Record<string, any>
  }
) => {
  const queryParams = new URLSearchParams();
  if (params?.period) queryParams.append("period", params.period);
  if (params?.startDate) queryParams.append("startDate", params.startDate);
  if (params?.endDate) queryParams.append("endDate", params.endDate);
  if (params?.filters) queryParams.append("filters", JSON.stringify(params.filters));
  
  const url = `/api/dashboard/apps/${appId}?${queryParams.toString()}`;
  const response = await apiRequest("GET", url);
  return response.json();
};

// Boshqaruv Paneli Sozlamalarini Olish
export const getDashboardSettings = async () => {
  const response = await apiRequest("GET", "/api/dashboard/settings");
  return response.json();
};

// Boshqaruv Paneli Sozlamalarini Yangilash
export const updateDashboardSettings = async (settingsData: any) => {
  const response = await apiRequest("PUT", "/api/dashboard/settings", settingsData);
  return response.json();
};

// Ichki dasturlar ro'yxatini olish
export const getInnerApps = async () => {
  const response = await apiRequest("GET", "/api/dashboard/inner-apps");
  return response.json();
};

// Tizim Boshqaruvi API

// Tizim Ma'lumotlarini Olish
export const getSystemInfo = async () => {
  const response = await apiRequest("GET", "/api/system/info");
  return response.json();
};

// Tizim Loglarini Olish
export const getSystemLogs = async (params?: {
  level?: 'info' | 'warning' | 'error' | 'critical',
  startDate?: string,
  endDate?: string,
  component?: string,
  page?: number,
  limit?: number
}) => {
  const queryParams = new URLSearchParams();
  if (params?.level) queryParams.append("level", params.level);
  if (params?.startDate) queryParams.append("startDate", params.startDate);
  if (params?.endDate) queryParams.append("endDate", params.endDate);
  if (params?.component) queryParams.append("component", params.component);
  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  
  const url = `/api/system/logs?${queryParams.toString()}`;
  const response = await apiRequest("GET", url);
  return response.json();
};

// Tizim Holatini Olish
export const getSystemStatus = async () => {
  const response = await apiRequest("GET", "/api/system/status");
  return response.json();
};

// Foylanuvchi Sessiyalarini Boshqarish
export const getUserSessions = async () => {
  const response = await apiRequest("GET", "/api/sessions");
  return response.json();
};

// Foydalanuvchi Sessiyasini Tugatish
export const terminateUserSession = async (sessionId: string) => {
  const response = await apiRequest("DELETE", `/api/sessions/${sessionId}`);
  return response.json();
};

// Ma'lum kategoriya sozlamalarini olish
export const getCategorySettings = async (category: string) => {
  const response = await apiRequest("GET", `/api/settings/${category}`);
  return response.json();
};

// Tizim sozlamalarini yangilash
export const updateSettings = async (category: string, settingsData: any) => {
  const response = await apiRequest("PUT", `/api/settings/${category}`, settingsData);
  return response.json();
};

// Logo yuklash
export const uploadLogo = async (logoFile: File) => {
  const formData = new FormData();
  formData.append("logo", logoFile);
  
  const token = getToken();
  const response = await fetch(`${baseHost}/api/settings/general/logo`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`
    },
    body: formData
  });
  
  return response.json();
};

// Tizim sozlamalari tarixini olish
export const getSettingsHistory = async (category: string) => {
  const response = await apiRequest("GET", `/api/settings/${category}/history`);
  return response.json();
};

// Hisobot maydanlarini olish
export const getReportFields = async () => {
  const response = await apiRequest("GET", "/api/reports/available-fields");
  return response.json();
};

// Boss API - Lavozimlar va Ruxsatlar Boshqaruvi

// Barcha lavozimlarni olish
export const getRoles = async () => {
  const response = await apiRequest("GET", "/api/roles");
  return response.json();
};

// Ma'lum lavozimni olish
export const getRole = async (roleId: string) => {
  const response = await apiRequest("GET", `/api/roles/${roleId}`);
  return response.json();
};

// Yangi lavozim yaratish
export const createRole = async (roleData: any) => {
  const response = await apiRequest("POST", "/api/roles", roleData);
  return response.json();
};

// Lavozimni yangilash
export const updateRole = async (roleId: string, roleData: any) => {
  const response = await apiRequest("PUT", `/api/roles/${roleId}`, roleData);
  return response.json();
};

// Lavozimni o'chirish
export const deleteRole = async (roleId: string) => {
  const response = await apiRequest("DELETE", `/api/roles/${roleId}`);
  return response.json();
};

// Lavozim statusini yangilash
export const updateRoleStatus = async (roleId: string, statusData: { isActive: boolean, reason?: string }) => {
  const response = await apiRequest("PUT", `/api/roles/${roleId}/status`, statusData);
  return response.json();
};

// Foydalanuvchiga lavozim tayinlash
export const assignRoleToUser = async (userId: string, assignmentData: { roleId: string, notes?: string }) => {
  const response = await apiRequest("POST", `/api/users/${userId}/roles`, assignmentData);
  return response.json();
};

// Foydalanuvchidan lavozimni chiqarib tashlash
export const removeRoleFromUser = async (userId: string, roleId: string, reason?: string) => {
  const queryParams = new URLSearchParams();
  if (reason) queryParams.append("reason", reason);
  
  const url = `/api/users/${userId}/roles/${roleId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  const response = await apiRequest("DELETE", url);
  return response.json();
};

// Barcha ruxsatlarni olish
export const getPermissions = async () => {
  const response = await apiRequest("GET", "/api/positions/permissions");
  return response.json();
};

// Canteen Management
export const createDailyMenu = async (menuData: any) => {
  const response = await apiRequest("POST", "/api/canteen/daily-menus", menuData);
  return response.json();
};

export const getDailyMenus = async (params?: { date?: string }) => {
  const queryParams = new URLSearchParams();
  if (params?.date) queryParams.append("date", params.date);
  
  const url = `/api/canteen/daily-menus${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  const response = await apiRequest("GET", url);
  return response.json();
};

export const getMenuItems = async () => {
  const response = await apiRequest("GET", "/api/canteen/menu-items");
  return response.json();
};

export const updateDailyMenu = async (id: string, menuData: any) => {
  const response = await apiRequest("PUT", `/api/canteen/daily-menus/${id}`, menuData);
  return response.json();
};

// Inventory Management
export const getInventoryItems = async () => {
  const response = await apiRequest("GET", "/api/inventory/items");
  return response.json();
};

export const createInventoryTransaction = async (transactionData: any) => {
  const response = await apiRequest("POST", "/api/inventory/items/" + transactionData.itemId + "/transactions", transactionData);
  return response.json();
};

export const updateInventoryItem = async (id: string, itemData: any) => {
  const response = await apiRequest("PUT", `/api/inventory/items/${id}`, itemData);
  return response.json();
};

export const getInventoryTransactions = async (params?: { itemId?: string, limit?: number; page?: number }) => {
  const queryParams = new URLSearchParams();
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  if (params?.page) queryParams.append("page", params.page.toString());
  
  let url;
  if (params?.itemId) {
    url = `/api/inventory/items/${params.itemId}/transactions?${queryParams.toString()}`;
  } else {
    url = `/api/inventory/stats?${queryParams.toString()}`;
  }
  
  const response = await apiRequest("GET", url);
  return response.json();
};

// Management Tasks API - Boshliq uchun vazifalarni boshqarish

// Get all management tasks with optional filtering
export const getManagementTasks = async (params?: { 
  status?: string; // pending, in_progress, completed, cancelled, overdue
  assignedTo?: string; // user ID
  supervisor?: string; // manager ID
  priority?: string; // low, medium, high, urgent
  type?: string; // feeding, cleaning, vaccination, etc.
  search?: string; // search query
}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append("status", params.status);
    if (params?.assignedTo) queryParams.append("assignedTo", params.assignedTo);
    if (params?.supervisor) queryParams.append("supervisor", params.supervisor);
    if (params?.priority) queryParams.append("priority", params.priority);
    if (params?.type) queryParams.append("type", params.type);
    if (params?.search) queryParams.append("search", params.search);
    
    const url = `/api/management/tasks?${queryParams.toString()}`;
    const response = await apiRequest("GET", url);
    return response.json();
  } catch (error) {
    console.error('Error fetching management tasks:', error);
    throw error;
  }
};

// Get a specific management task by ID
export const getManagementTask = async (taskId: string) => {
  try {
    const response = await apiRequest("GET", `/api/management/tasks/${taskId}`);
    return response.json();
  } catch (error) {
    console.error('Error fetching management task:', error);
    throw error;
  }
};

// Create a new management task
export const createManagementTask = async (taskData: any) => {
  try {
    const response = await apiRequest("POST", `/api/management/tasks`, taskData);
    return response.json();
  } catch (error) {
    console.error('Error creating management task:', error);
    throw error;
  }
};

// Update a management task
export const updateManagementTask = async (taskId: string, taskData: any) => {
  try {
    const response = await apiRequest("PUT", `/api/management/tasks/${taskId}`, taskData);
    return response.json();
  } catch (error) {
    console.error('Error updating management task:', error);
    throw error;
  }
};

// Delete a management task
export const deleteManagementTask = async (taskId: string) => {
  try {
    const response = await apiRequest("DELETE", `/api/management/tasks/${taskId}`);
    return response.json();
  } catch (error) {
    console.error('Error deleting management task:', error);
    throw error;
  }
};

// Get task statistics for dashboard
export const getTaskStatistics = async () => {
  try {
    const response = await apiRequest("GET", `/api/management/tasks/statistics`);
    return response.json();
  } catch (error) {
    console.error('Error fetching task statistics:', error);
    throw error;
  }
};

// =====================
// Oshxona Boshqaruvi API
// =====================

// Menyu API
export const getMenus = async (params?: { status?: string; type?: string; date?: string; page?: number; limit?: number }) => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append("status", params.status);
    if (params?.type) queryParams.append("type", params.type);
    if (params?.date) queryParams.append("date", params.date);
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const response = await apiRequest("GET", `/api/canteen/menus?${queryParams.toString()}`);
    return response.json();
  } catch (error) {
    console.error('Error fetching menus:', error);
    throw error;
  }
};

export const getMenuById = async (id: string) => {
  try {
    const response = await apiRequest("GET", `/api/canteen/menus/${id}`);
    return response.json();
  } catch (error) {
    console.error('Error fetching menu by ID:', error);
    throw error;
  }
};

export const createMenu = async (menuData: any) => {
  try {
    const response = await apiRequest("POST", `/api/canteen/menus`, menuData);
    return response.json();
  } catch (error) {
    console.error('Error creating menu:', error);
    throw error;
  }
};

export const updateMenu = async (id: string, menuData: any) => {
  try {
    const response = await apiRequest("PUT", `/api/canteen/menus/${id}`, menuData);
    return response.json();
  } catch (error) {
    console.error('Error updating menu:', error);
    throw error;
  }
};

export const updateMenuStatus = async (id: string, statusData: { status: string; notes?: string }) => {
  try {
    const response = await apiRequest("PUT", `/api/canteen/menus/${id}/status`, statusData);
    return response.json();
  } catch (error) {
    console.error('Error updating menu status:', error);
    throw error;
  }
};

export const getDailyMenu = async (date?: string) => {
  try {
    const queryParams = new URLSearchParams();
    if (date) queryParams.append("date", date);

    const response = await apiRequest("GET", `/api/canteen/menus/daily?${queryParams.toString()}`);
    return response.json();
  } catch (error) {
    console.error('Error fetching daily menu:', error);
    throw error;
  }
};

export const getMenuStats = async (params: { startDate: string; endDate: string; format?: 'json' | 'excel' | 'pdf' }) => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append("startDate", params.startDate);
    queryParams.append("endDate", params.endDate);
    if (params.format) queryParams.append("format", params.format);

    const response = await apiRequest("GET", `/api/canteen/menus/stats?${queryParams.toString()}`);
    return response.json();
  } catch (error) {
    console.error('Error fetching menu statistics:', error);
    throw error;
  }
};

// Taomlar API
export const getDishes = async (params?: { category?: string; search?: string; page?: number; limit?: number }) => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append("category", params.category);
    if (params?.search) queryParams.append("search", params.search);
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const response = await apiRequest("GET", `/api/canteen/dishes?${queryParams.toString()}`);
    return response.json();
  } catch (error) {
    console.error('Error fetching dishes:', error);
    throw error;
  }
};

export const getDishById = async (id: string) => {
  try {
    const response = await apiRequest("GET", `/api/canteen/dishes/${id}`);
    return response.json();
  } catch (error) {
    console.error('Error fetching dish by ID:', error);
    throw error;
  }
};

export const createDish = async (dishData: any) => {
  try {
    const response = await apiRequest("POST", `/api/canteen/dishes`, dishData);
    return response.json();
  } catch (error) {
    console.error('Error creating dish:', error);
    throw error;
  }
};

export const updateDish = async (id: string, dishData: any) => {
  try {
    const response = await apiRequest("PUT", `/api/canteen/dishes/${id}`, dishData);
    return response.json();
  } catch (error) {
    console.error('Error updating dish:', error);
    throw error;
  }
};

export const updateDishStatus = async (id: string, statusData: { isActive: boolean; notes?: string }) => {
  try {
    const response = await apiRequest("PUT", `/api/canteen/dishes/${id}/status`, statusData);
    return response.json();
  } catch (error) {
    console.error('Error updating dish status:', error);
    throw error;
  }
};

export const uploadDishImage = async (id: string, imageFile: File) => {
  try {
    const formData = new FormData();
    formData.append("image", imageFile);

    const response = await fetch(`${baseHost}/api/canteen/dishes/${id}/image`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      },
      body: formData
    });

    return response.json();
  } catch (error) {
    console.error('Error uploading dish image:', error);
    throw error;
  }
};

// Mahsulotlar (Ingredients) API
export const getIngredients = async (params?: { search?: string; page?: number; limit?: number }) => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append("search", params.search);
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const response = await apiRequest("GET", `/api/canteen/ingredients?${queryParams.toString()}`);
    return response.json();
  } catch (error) {
    console.error('Error fetching ingredients:', error);
    throw error;
  }
};

export const getIngredientById = async (id: string) => {
  try {
    const response = await apiRequest("GET", `/api/canteen/ingredients/${id}`);
    return response.json();
  } catch (error) {
    console.error('Error fetching ingredient by ID:', error);
    throw error;
  }
};

export const createIngredient = async (ingredientData: any) => {
  try {
    const response = await apiRequest("POST", `/api/canteen/ingredients`, ingredientData);
    return response.json();
  } catch (error) {
    console.error('Error creating ingredient:', error);
    throw error;
  }
};

export const updateIngredient = async (id: string, ingredientData: any) => {
  try {
    const response = await apiRequest("PUT", `/api/canteen/ingredients/${id}`, ingredientData);
    return response.json();
  } catch (error) {
    console.error('Error updating ingredient:', error);
    throw error;
  }
};

export const deleteIngredient = async (id: string) => {
  try {
    const response = await apiRequest("DELETE", `/api/canteen/ingredients/${id}`);
    return response.json();
  } catch (error) {
    console.error('Error deleting ingredient:', error);
    throw error;
  }
};

// Ovqatlanish Sessiyalari API
export const getMealSessions = async (params?: { date?: string; type?: string; status?: string }) => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.date) queryParams.append("date", params.date);
    if (params?.type) queryParams.append("type", params.type);
    if (params?.status) queryParams.append("status", params.status);

    const response = await apiRequest("GET", `/api/canteen/meal-sessions?${queryParams.toString()}`);
    return response.json();
  } catch (error) {
    console.error('Error fetching meal sessions:', error);
    throw error;
  }
};

export const createMealSession = async (sessionData: any) => {
  try {
    const response = await apiRequest("POST", `/api/canteen/meal-sessions`, sessionData);
    return response.json();
  } catch (error) {
    console.error('Error creating meal session:', error);
    throw error;
  }
};

export const updateMealSession = async (id: string, sessionData: any) => {
  try {
    const response = await apiRequest("PUT", `/api/canteen/meal-sessions/${id}`, sessionData);
    return response.json();
  } catch (error) {
    console.error('Error updating meal session:', error);
    throw error;
  }
};

export const getMealSessionStats = async (params: { startDate: string; endDate: string }) => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append("startDate", params.startDate);
    queryParams.append("endDate", params.endDate);

    const response = await apiRequest("GET", `/api/canteen/meal-sessions/stats?${queryParams.toString()}`);
    return response.json();
  } catch (error) {
    console.error('Error fetching meal session statistics:', error);
    throw error;
  }
};

// Ovoz berishlar API
export const getCanteenVotings = async (params?: { isActive?: boolean; page?: number; limit?: number }) => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.isActive !== undefined) queryParams.append("isActive", params.isActive.toString());
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const response = await apiRequest("GET", `/api/canteen/votings?${queryParams.toString()}`);
    return response.json();
  } catch (error) {
    console.error('Error fetching canteen votings:', error);
    throw error;
  }
};

export const getCanteenVotingById = async (id: string) => {
  try {
    const response = await apiRequest("GET", `/api/canteen/votings/${id}`);
    return response.json();
  } catch (error) {
    console.error('Error fetching canteen voting by ID:', error);
    throw error;
  }
};

export const createCanteenVoting = async (votingData: any) => {
  try {
    const response = await apiRequest("POST", `/api/canteen/votings`, votingData);
    return response.json();
  } catch (error) {
    console.error('Error creating canteen voting:', error);
    throw error;
  }
};

export const updateCanteenVoting = async (id: string, votingData: any) => {
  try {
    const response = await apiRequest("PUT", `/api/canteen/votings/${id}`, votingData);
    return response.json();
  } catch (error) {
    console.error('Error updating canteen voting:', error);
    throw error;
  }
};

export const deleteCanteenVoting = async (id: string) => {
  try {
    const response = await apiRequest("DELETE", `/api/canteen/votings/${id}`);
    return response.json();
  } catch (error) {
    console.error('Error deleting canteen voting:', error);
    throw error;
  }
};

export const submitCanteenVote = async (votingId: string, dishId: string) => {
  try {
    const response = await apiRequest("POST", `/api/canteen/votings/${votingId}/vote`, { dishId });
    return response.json();
  } catch (error) {
    console.error('Error submitting canteen vote:', error);
    throw error;
  }
};
