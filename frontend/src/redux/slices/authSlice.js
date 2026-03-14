import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

export const register = createAsyncThunk(
  "auth/register",
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.post("/auth/register", data);
      return res.data; // { email } only — no user/token yet
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Registration failed",
      );
    }
  },
);

export const verifyOtp = createAsyncThunk(
  "auth/verifyOtp",
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.post("/auth/verify-otp", data); // { email, otp }
      return res.data; // { success, user, accessToken, sessionId }
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Verification failed",
      );
    }
  },
);

export const login = createAsyncThunk(
  "auth/login",
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.post("/auth/login", data);
      return res.data; // { success, user, accessToken, sessionId }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Login failed");
    }
  },
);

export const logout = createAsyncThunk(
  "auth/logout",
  async (sessionId, { rejectWithValue }) => {
    try {
      await api.post("/auth/logout", { sessionId });
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  },
);

export const fetchMe = createAsyncThunk(
  "auth/fetchMe",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/auth/me");
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  },
);

// ─── helper: set auth state after login/verify ────────────
// receives full action object — reads action.payload
const setAuthState = (state, action) => {
  const p         = action.payload;
  state.loading   = false;
  state.error     = null;
  state.user      = p?.user        ?? null;
  state.token     = p?.accessToken ?? null;
  state.sessionId = p?.sessionId   ?? null;
  if (p?.accessToken) localStorage.setItem("token",     p.accessToken);
  if (p?.sessionId)   localStorage.setItem("sessionId", p.sessionId);
};

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user:      null,
    token:     localStorage.getItem("token"),
    sessionId: localStorage.getItem("sessionId"),
    loading:   false,
    error:     null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setToken: (state, action) => {
      state.token = action.payload;
    },
  },
  extraReducers: (builder) => {

    // ── Register ──────────────────────────────────────────
    // Backend returns { email } only — user is NOT logged in yet
    builder.addCase(register.pending,   (s)    => { s.loading = true;  s.error = null; });
    builder.addCase(register.fulfilled, (s)    => { s.loading = false; s.error = null; });
    builder.addCase(register.rejected,  (s, a) => { s.loading = false; s.error = a.payload; });

    // ── Verify OTP ────────────────────────────────────────
    // User is logged in here after email verification
    builder.addCase(verifyOtp.pending,   (s)    => { s.loading = true;  s.error = null; });
    builder.addCase(verifyOtp.fulfilled, (s, a) => { setAuthState(s, a); });
    builder.addCase(verifyOtp.rejected,  (s, a) => { s.loading = false; s.error = a.payload; });

    // ── Login ─────────────────────────────────────────────
    builder.addCase(login.pending,   (s)    => { s.loading = true;  s.error = null; });
    builder.addCase(login.fulfilled, (s, a) => { setAuthState(s, a); });
    builder.addCase(login.rejected,  (s, a) => { s.loading = false; s.error = a.payload; });

    // ── Logout ────────────────────────────────────────────
    builder.addCase(logout.fulfilled, (s) => {
      s.user      = null;
      s.token     = null;
      s.sessionId = null;
      localStorage.removeItem("token");
      localStorage.removeItem("sessionId");
    });

    // ── Fetch me ──────────────────────────────────────────
    // handles both flat { user } and nested { data: { user } } shapes
    builder.addCase(fetchMe.fulfilled, (s, a) => {
      s.user = a.payload?.user ?? a.payload?.data?.user ?? null;
    });
    builder.addCase(fetchMe.rejected, (s) => {
      s.user  = null;
      s.token = null;
      localStorage.removeItem("token");
    });
  },
});

export const { clearError, setToken } = authSlice.actions;
export default authSlice.reducer;