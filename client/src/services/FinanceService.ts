import { baseHost } from "@/lib/host";
import { getToken } from "@/lib/auth";

// Xarajatlarni olish
export const getExpenses = async (params?: any) => {
  const token = getToken();
  
  let url = `${baseHost}/api/finance/expenses`;
  if (params) {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key]);
      }
    });
    
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }
  }
  
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Xarajatlarni olishda xatolik yuz berdi");
  }
  
  return await response.json();
};

// Yangi xarajat yaratish
export const createExpense = async (data: any) => {
  const token = getToken();
  
  const response = await fetch(`${baseHost}/api/finance/expenses`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Xarajatni yaratishda xatolik yuz berdi");
  }
  
  return await response.json();
};

// Xarajatni tasdiqlash
export const approveExpense = async (id: string) => {
  const token = getToken();
  
  const response = await fetch(`${baseHost}/api/finance/expenses/${id}/approve`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Xarajatni tasdiqlashda xatolik yuz berdi");
  }
  
  return await response.json();
};

// Xarajatni rad etish
export const rejectExpense = async (id: string, reason: string) => {
  const token = getToken();
  
  const response = await fetch(`${baseHost}/api/finance/expenses/${id}/reject`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ reason }),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Xarajatni rad etishda xatolik yuz berdi");
  }
  
  return await response.json();
};

// Xarajatni to'lash
export const payExpense = async (id: string, paymentData: any) => {
  const token = getToken();
  
  const response = await fetch(`${baseHost}/api/finance/expenses/${id}/pay`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(paymentData),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Xarajatni to'lashda xatolik yuz berdi");
  }
  
  return await response.json();
};

// Byudjetlarni olish
export const getBudgets = async (params?: any) => {
  const token = getToken();
  
  let url = `${baseHost}/api/finance/budgets`;
  if (params) {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key]);
      }
    });
    
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }
  }
  
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Byudjetlarni olishda xatolik yuz berdi");
  }
  
  return await response.json();
};

// Yangi byudjet yaratish
export const createBudget = async (data: any) => {
  const token = getToken();
  
  const response = await fetch(`${baseHost}/api/finance/budgets`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Byudjetni yaratishda xatolik yuz berdi");
  }
  
  return await response.json();
};

// Daromadlarni olish
export const getRevenues = async (params?: any) => {
  const token = getToken();
  
  let url = `${baseHost}/api/finance/revenues`;
  if (params) {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key]);
      }
    });
    
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }
  }
  
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Daromadlarni olishda xatolik yuz berdi");
  }
  
  return await response.json();
};

// Yangi daromad yaratish
export const createRevenue = async (data: any) => {
  const token = getToken();
  
  const response = await fetch(`${baseHost}/api/finance/revenues`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Daromadni yaratishda xatolik yuz berdi");
  }
  
  return await response.json();
};

// Moliyaviy hisobotlarni olish
export const getFinancialReports = async (params?: any) => {
  const token = getToken();
  
  let url = `${baseHost}/api/finance/reports`;
  if (params) {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key]);
      }
    });
    
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }
  }
  
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Moliyaviy hisobotlarni olishda xatolik yuz berdi");
  }
  
  return await response.json();
};

// Foyda va zararlar hisobotini olish
export const getProfitLossReport = async (params: { startDate: string; endDate: string }) => {
  const token = getToken();
  
  let url = `${baseHost}/api/finance/reports/profit-loss`;
  const queryParams = new URLSearchParams();
  queryParams.append('startDate', params.startDate);
  queryParams.append('endDate', params.endDate);
  
  url += `?${queryParams.toString()}`;
  
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Foyda va zararlar hisobotini olishda xatolik yuz berdi");
  }
  
  return await response.json();
};

// Umumiy moliyaviy ko'rsatkichlarni olish
export const getFinancialSummary = async () => {
  const token = getToken();
  
  const response = await fetch(`${baseHost}/api/finance/summary`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Moliyaviy ko'rsatkichlarni olishda xatolik yuz berdi");
  }
  
  return await response.json();
};

// Barcha funksiyalarni FinanceService obyektida eksport qilish
export const FinanceService = {
  getExpenses,
  createExpense,
  approveExpense,
  rejectExpense,
  payExpense,
  getBudgets,
  createBudget,
  getRevenues,
  createRevenue,
  getFinancialReports,
  getProfitLossReport,
  getFinancialSummary,
};