import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchCourses = createAsyncThunk('courses/fetchAll', async (params = {}, { rejectWithValue }) => {
  try {
    const res = await api.get('/courses', { params });
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const fetchCourseById = createAsyncThunk('courses/fetchById', async (id, { rejectWithValue }) => {
  try {
    const res = await api.get(`/courses/${id}`);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

const courseSlice = createSlice({
  name: 'courses',
  initialState: {
    list: [],
    current: null,
    pagination: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearCurrent: (state) => { state.current = null; },
  },
  extraReducers: builder => {
    builder.addCase(fetchCourses.pending, s => { s.loading = true; s.error = null; });
    builder.addCase(fetchCourses.fulfilled, (s, a) => {
      s.loading = false;
      s.list = a.payload.data;
      s.pagination = a.payload.pagination;
    });
    builder.addCase(fetchCourses.rejected, (s, a) => { s.loading = false; s.error = a.payload; });

    builder.addCase(fetchCourseById.pending, s => { s.loading = true; s.error = null; });
    builder.addCase(fetchCourseById.fulfilled, (s, a) => {
      s.loading = false;
      s.current = a.payload.course;
    });
    builder.addCase(fetchCourseById.rejected, (s, a) => { s.loading = false; s.error = a.payload; });
  },
});

export const { clearCurrent } = courseSlice.actions;
export default courseSlice.reducer;
