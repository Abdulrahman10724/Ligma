import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import invitationReducer from "./invitationSlice";
import workspaceReducer from "./workspaceSlice";
import memberReducer from "./memberSlice";
import canvasReducer from "./canvasSlice";
import taskReducer from "./taskSlice";
import eventReducer from "./eventSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    invitations: invitationReducer,
    workspace: workspaceReducer,
    members: memberReducer,
    canvas: canvasReducer,
    tasks: taskReducer,
    events: eventReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
