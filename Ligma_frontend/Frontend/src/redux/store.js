import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import workspaceReducer from "./workspaceSlice";

const canvasReducerPlaceholder = (state = { nodes: {}, loading: false }) => state;

export const store = configureStore({
  reducer: {
    auth: authReducer,
    workspace: workspaceReducer,
    canvas: canvasReducerPlaceholder,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
