import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { EmployeeService } from '../../services/EmployeeService';
import { RootState } from '../store';

// User tipini to'g'ridan-to'g'ri bu yerda aniqlashtirish
interface User {
  id: string;
  name: string;
  phoneNumber: string;
  role: string;
  isActive: boolean;
  position?: {
    id: string;
    name: string;
    type?: string;
    permissions?: string[];
  };
  section?: {
    id: string;
    name: string;
  };
  sections?: Array<{
    id: string;
    name: string;
  }>;
}

interface EmployeeState {
  employees: User[];
  total: number;
  loading: boolean;
  error: string | null;
}

const initialState: EmployeeState = {
  employees: [],
  total: 0,
  loading: false,
  error: null,
};

// Barcha xodimlarni oluvchi thunk
export const fetchAllEmployees = createAsyncThunk(
  'employees/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      // Faqat birinchi 100 ta xodimni olamiz (limitni ko'paytirish mumkin)
      const response = await EmployeeService.getAllEmployees({ limit: 100 });
      
      if (response && response.users) {
        // API response eski formatda (users field bilan)
        return {
          employees: response.users,
          total: response.total || response.users.length,
        };
      } else if (response && response.data) {
        // API response yangi formatda (data field bilan)
        return {
          employees: response.data,
          total: response.total || response.data.length,
        };
      }
      
      return {
        employees: [],
        total: 0,
      };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const employeesSlice = createSlice({
  name: 'employees',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllEmployees.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllEmployees.fulfilled, (state, action: PayloadAction<{ employees: User[], total: number }>) => {
        state.employees = action.payload.employees;
        state.total = action.payload.total;
        state.loading = false;
      })
      .addCase(fetchAllEmployees.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

// Selektorlar
export const selectAllEmployees = (state: RootState) => state.employees.employees;
export const selectEmployeesLoading = (state: RootState) => state.employees.loading;
export const selectEmployeesError = (state: RootState) => state.employees.error;
export const selectEmployeesTotal = (state: RootState) => state.employees.total;

// Filtrlangan xodimlarni olish uchun selektor
export const selectFilteredEmployees = (
  state: RootState,
  { searchQuery = '', positionFilter = 'all', positionTypeFilter = 'all', statusFilter = 'all', sectionFilter = 'all' }:
  { searchQuery?: string, positionFilter?: string, positionTypeFilter?: string, statusFilter?: string, sectionFilter?: string }
) => {
  const employees = state.employees.employees;
  
  if (!employees.length) return [];

  return employees.filter(employee => {
    // Qidiruv so'rovi bilan filtrlash
    const searchMatch = !searchQuery || 
      employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.phoneNumber.toLowerCase().includes(searchQuery.toLowerCase());

    // Lavozim bo'yicha filtrlash
    const positionMatch = positionFilter === 'all' || employee.position?.id === positionFilter;

    // Lavozim turi bo'yicha filtrlash (position.type)
    const positionTypeMatch = positionTypeFilter === 'all' || (employee.position?.type === positionTypeFilter);

    // Holat bo'yicha filtrlash
    const statusMatch = statusFilter === 'all' || 
      (statusFilter === 'active' && employee.isActive) || 
      (statusFilter === 'inactive' && !employee.isActive);

    // Sex bo'yicha filtrlash
    const sectionMatch = sectionFilter === 'all' || 
      (employee.section && employee.section.id === sectionFilter) ||
      (employee.sections && employee.sections.some(s => s.id === sectionFilter));

    return searchMatch && positionMatch && positionTypeMatch && statusMatch && sectionMatch;
  });
};

export default employeesSlice.reducer;