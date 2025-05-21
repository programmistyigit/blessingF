import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { baseHost } from '@/lib/host';
import { setToken, removeToken, setUser, removeUser, parseJwt } from '@/lib/auth';

interface User {
  id: string;
  name: string;
  phoneNumber: string;
  role: string;
  section: {
    id: string;
    name: string;
  };
  position?: {
    id: string;
    name: string;
  };
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  phoneNumber: string | null;
  smsRequested: boolean;
}

// Boshlang'ich holat
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  phoneNumber: null,
  smsRequested: false
};

// Async thunk для запроса SMS коду
export const requestSmsCode = createAsyncThunk(
  'auth/requestSmsCode',
  async (phoneNumber: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`${baseHost}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'Serverda xatolik yuz berdi');
      }

      const data = await response.json();
      return { success: true, phoneNumber };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Serverga ulanishda xatolik');
    }
  }
);

// Async thunk для проверки SMS кода и входа
export const verifySmsCode = createAsyncThunk(
  'auth/verifySmsCode',
  async ({ phoneNumber, code }: { phoneNumber: string; code: string }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${baseHost}/api/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber, code }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'Serverda xatolik yuz berdi');
      }

      const responseData = await response.json();
      
      // API response strukturasini tekshirish
      if (!responseData.success) {
        return rejectWithValue(responseData.message || 'Autentifikatsiya muvaffaqiyatsiz');
      }
      
      const { token, user } = responseData.data ? responseData.data : { token: null, user: null };
      
      // Token va user ma'lumotlarini saqlash
      setToken(token);
      setUser(user);
      
      return { user, token };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Serverga ulanishda xatolik');
    }
  }
);

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setPhoneNumber: (state, action: PayloadAction<string | null>) => {
      state.phoneNumber = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.phoneNumber = null;
      state.smsRequested = false;
      
      // Token va user ma'lumotlarini o'chirish
      removeToken();
      removeUser();
    },
    // JWT tokendan foydalanuvchi ma'lumotlarini yuklash
    checkAuthState: (state) => {
      try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        
        if (token && user) {
          // Token muddati o'tib ketmaganligini tekshirish
          const decodedToken = parseJwt(token);
          const isExpired = decodedToken && decodedToken.exp ? (decodedToken.exp * 1000 < Date.now()) : true;
          
          if (!isExpired) {
            state.user = user;
            state.isAuthenticated = true;
          } else {
            // Token muddati o'tib ketgan, tozalab tashlash
            state.user = null;
            state.isAuthenticated = false;
            removeToken();
            removeUser();
          }
        } else {
          // Token yoki user yo'q - login kerak
          state.user = null;
          state.isAuthenticated = false;
        }
      } catch (error) {
        console.error('Auth state tekshirishda xatolik:', error);
        state.user = null;
        state.isAuthenticated = false;
        removeToken();
        removeUser();
      }
    }
  },
  extraReducers: (builder) => {
    // Request SMS Code
    builder.addCase(requestSmsCode.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(requestSmsCode.fulfilled, (state, action: PayloadAction<{ success: boolean; phoneNumber: string }>) => {
      state.loading = false;
      state.phoneNumber = action.payload.phoneNumber;
      state.smsRequested = true;
    });
    builder.addCase(requestSmsCode.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // Verify SMS Code
    builder.addCase(verifySmsCode.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(verifySmsCode.fulfilled, (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.loading = false;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.smsRequested = false;
    });
    builder.addCase(verifySmsCode.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const { setPhoneNumber, logout, checkAuthState } = authSlice.actions;
export default authSlice.reducer;