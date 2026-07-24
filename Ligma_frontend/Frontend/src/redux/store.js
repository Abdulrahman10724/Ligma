import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import invitationReducer from "./invitationSlice";
import workspaceReducer from "./workspaceSlice";
import memberReducer from "./memberSlice";
import canvasReducer from "./canvasSlice";
import taskReducer from "./taskSlice";
import eventReducer from "./eventSlice";
import replayReducer from "../replay/replaySlice";
import zoneReducer from "./zoneSlice";   // 👈 uncomment/add karo

// import presenceZoneReducer from "./presenceZoneSlice";
import chatReducer from "./chatSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    invitations: invitationReducer,
    workspace: workspaceReducer,
    members: memberReducer,
    canvas: canvasReducer,
    tasks: taskReducer,
    events: eventReducer,
    // Phase 13 — Time Travel Replay: fully isolated from canvas/tasks/events.
    replay: replayReducer,
    // presenceZones: presenceZoneReducer,
    zones: zoneReducer,   

    chat: chatReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
