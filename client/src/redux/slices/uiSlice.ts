import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  sidebarCollapsed: boolean;
  currentTheme: 'light' | 'dark' | 'system';
  isMobileMenuOpen: boolean;
  currentSection: string | null;
  loading: boolean;
}

const initialState: UIState = {
  sidebarCollapsed: false,
  currentTheme: 'light',
  isMobileMenuOpen: false,
  currentSection: null,
  loading: false
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.currentTheme = action.payload;
    },
    toggleMobileMenu: (state) => {
      state.isMobileMenuOpen = !state.isMobileMenuOpen;
    },
    setCurrentSection: (state, action: PayloadAction<string | null>) => {
      state.currentSection = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    }
  },
});

export const {
  toggleSidebar,
  setTheme,
  toggleMobileMenu,
  setCurrentSection,
  setLoading
} = uiSlice.actions;

export default uiSlice.reducer;