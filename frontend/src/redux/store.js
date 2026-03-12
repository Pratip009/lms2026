import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import courseReducer from './slices/courseSlice';
import enrollmentReducer from './slices/enrollmentSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    courses: courseReducer,
    enrollments: enrollmentReducer,
  },
});

export default store;
