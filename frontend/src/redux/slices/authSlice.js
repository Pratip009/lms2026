import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const register = createAsyncThunk('auth/register', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/register', data);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Registration failed');
  }
});

export const login = createAsyncThunk('auth/login', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/login', data);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Login failed');
  }
});

export const logout = createAsyncThunk('auth/logout', async (sessionId, { rejectWithValue }) => {
  try {
    await api.post('/auth/logout', { sessionId });
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const fetchMe = createAsyncThunk('auth/fetchMe', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/auth/me');
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: localStorage.getItem('token'),
    sessionId: localStorage.getItem('sessionId'),
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => { state.error = null; },
    setToken: (state, action) => { state.token = action.payload; },
  },
  extraReducers: builder => {
    // Register
    builder.addCase(register.pending, s => { s.loading = true; s.error = null; });
    builder.addCase(register.fulfilled, (s, a) => {
      s.loading = false;
      s.user = a.payload.user;
      s.token = a.payload.accessToken;
      s.sessionId = a.payload.sessionId;
      localStorage.setItem('token', a.payload.accessToken);
      localStorage.setItem('sessionId', a.payload.sessionId);
    });
    builder.addCase(register.rejected, (s, a) => { s.loading = false; s.error = a.payload; });

    // Login
    builder.addCase(login.pending, s => { s.loading = true; s.error = null; });
    builder.addCase(login.fulfilled, (s, a) => {
      s.loading = false;
      s.user = a.payload.user;
      s.token = a.payload.accessToken;
      s.sessionId = a.payload.sessionId;
      localStorage.setItem('token', a.payload.accessToken);
      localStorage.setItem('sessionId', a.payload.sessionId);
    });
    builder.addCase(login.rejected, (s, a) => { s.loading = false; s.error = a.payload; });

    // Logout
    builder.addCase(logout.fulfilled, s => {
      s.user = null; s.token = null; s.sessionId = null;
      localStorage.removeItem('token');
      localStorage.removeItem('sessionId');
    });

    // FetchMe
    builder.addCase(fetchMe.fulfilled, (s, a) => { s.user = a.payload.user; });
    builder.addCase(fetchMe.rejected, s => {
      s.user = null; s.token = null;
      localStorage.removeItem('token');
    });
  },
});

export const { clearError, setToken } = authSlice.actions;
export default authSlice.reducer;
