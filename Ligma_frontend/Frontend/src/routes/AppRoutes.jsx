import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import DashboardPage from "../pages/DashboardPage";
import WorkspacePage from "../pages/WorkspacePage";
import CanvasPage from "../pages/CanvasPage";
import TaskBoardPage from "../pages/TaskBoardPage";
import ChatPage from "../pages/ChatPage";
import MembersPage from "../pages/MembersPage";
import HistoryPage from "../pages/HistoryPage";
import SettingsPage from "../pages/SettingsPage";
import AcceptInvitationPage from "../pages/AcceptInvitationPage";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/invite/:token" element={<AcceptInvitationPage />} />

        {/* Dashboard Route */}
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Workspace Scoped Routes */}
        <Route path="/workspace/:id" element={<WorkspacePage />}>
          <Route index element={<Navigate to="canvas" replace />} />
          <Route path="canvas" element={<CanvasPage />} />
          <Route path="tasks" element={<TaskBoardPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="members" element={<MembersPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Catch-all route -> redirect to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
