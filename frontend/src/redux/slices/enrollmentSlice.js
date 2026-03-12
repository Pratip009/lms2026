import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchMyEnrollments = createAsyncThunk('enrollments/fetchMy', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/enrollments/my');
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

const enrollmentSlice = createSlice({
  name: 'enrollments',
  initialState: { list: [], loading: false, error: null },
  reducers: {},
  extraReducers: builder => {
    builder.addCase(fetchMyEnrollments.pending, s => { s.loading = true; });
    builder.addCase(fetchMyEnrollments.fulfilled, (s, a) => {
      s.loading = false;
      s.list = a.payload.enrollments;
    });
    builder.addCase(fetchMyEnrollments.rejected, (s, a) => { s.loading = false; s.error = a.payload; });
  },
});

export default enrollmentSlice.reducer;
