import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import notificationReducer from './slices/notificationSlice';
import uiReducer from './slices/uiSlice';
import realtimeReducer from './slices/realtimeSlice';
import employeesReducer from './slices/employeesSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    notifications: notificationReducer,
    ui: uiReducer,
    realtime: realtimeReducer,
    employees: employeesReducer,
  },
});

// Типларни экспорт қиламиз
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;