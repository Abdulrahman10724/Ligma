import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";

// Placeholder reducers to be replaced in future phases
const workspaceReducerPlaceholder = (state = { list: [], activeWorkspace: null, loading: false }, action) => state;
const canvasReducerPlaceholder = (state = { nodes: {}, loading: false }, action) => state;

export const store = configureStore({
  reducer: {
    auth: authReducer,
    workspace: workspaceReducerPlaceholder,
    canvas: canvasReducerPlaceholder,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
