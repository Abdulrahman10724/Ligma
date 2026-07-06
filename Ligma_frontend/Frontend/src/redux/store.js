import { configureStore } from "@reduxjs/toolkit";

// Placeholder reducers to be replaced in future phases
const authReducerPlaceholder = (state = { user: null, isAuthenticated: false, loading: false }, action) => state;
const workspaceReducerPlaceholder = (state = { list: [], activeWorkspace: null, loading: false }, action) => state;
const canvasReducerPlaceholder = (state = { nodes: {}, loading: false }, action) => state;

export const store = configureStore({
  reducer: {
    auth: authReducerPlaceholder,
    workspace: workspaceReducerPlaceholder,
    canvas: canvasReducerPlaceholder,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
