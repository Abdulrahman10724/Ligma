import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import authService from "../services/auth.service";

const tokenKey = "ligma_token";

const initialState = {
  user: null,
  token: localStorage.getItem(tokenKey),
  isAuthenticated: Boolean(localStorage.getItem(tokenKey)),
  loading: false,
  bootstrapping: true,
  error: null,
};

const persistSession = (token) => {
  if (token) {
    localStorage.setItem(tokenKey, token);
  } else {
    localStorage.removeItem(tokenKey);
  }
};

export const bootstrapAuth = createAsyncThunk("auth/bootstrap", async (_, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem(tokenKey);

    if (!token) {
      return { user: null, token: null };
    }

    return await authService.me();
  } catch (error) {
    persistSession(null);
    return rejectWithValue(error?.message || "Unable to restore session");
  }
});

export const loginUser = createAsyncThunk("auth/login", async (credentials, { rejectWithValue }) => {
  try {
    return await authService.login(credentials);
  } catch (error) {
    return rejectWithValue(error?.message || "Login failed");
  }
});

export const registerUser = createAsyncThunk("auth/register", async (payload, { rejectWithValue }) => {
  try {
    return await authService.register(payload);
  } catch (error) {
    return rejectWithValue(error?.message || "Registration failed");
  }
});

export const logoutUser = createAsyncThunk("auth/logout", async (_, { rejectWithValue }) => {
  try {
    await authService.logout();
    persistSession(null);
    return null;
  } catch (error) {
    persistSession(null);
    return rejectWithValue(error?.message || "Logout failed");
  }
});

const setAuthenticatedUser = (state, payload) => {
  state.user = payload?.data?.user || null;
  state.token = payload?.data?.token || localStorage.getItem(tokenKey);
  state.isAuthenticated = Boolean(state.user && state.token);

  if (state.token) {
    persistSession(state.token);
  }
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuthState(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      persistSession(null);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(bootstrapAuth.pending, (state) => {
        state.bootstrapping = true;
      })
      .addCase(bootstrapAuth.fulfilled, (state, action) => {
        state.bootstrapping = false;

        if (action.payload?.data?.user) {
          state.user = action.payload.data.user;
          state.token = localStorage.getItem(tokenKey);
          state.isAuthenticated = true;
        } else {
          state.user = null;
          state.token = null;
          state.isAuthenticated = false;
        }
      })
      .addCase(bootstrapAuth.rejected, (state) => {
        state.bootstrapping = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      })
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        setAuthenticatedUser(state, action.payload);
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        setAuthenticatedUser(state, action.payload);
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Login failed";
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Registration failed";
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
      });
  },
});

export const { clearAuthState } = authSlice.actions;

export default authSlice.reducer;