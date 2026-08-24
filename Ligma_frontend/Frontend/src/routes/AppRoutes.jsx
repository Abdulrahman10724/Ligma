import "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import LandingPage from "../pages/LandingPage";
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
import VerifyEmailPage from "../pages/VerifyEmailPage";
import VerifyRequiredPage from "../pages/VerifyRequiredPage";
import ProtectedRoute from "./ProtectedRoute";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing page */}
        <Route path="/" element={<LandingPage />} />

        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/invite/:token" element={<AcceptInvitationPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/verify-required" element={<VerifyRequiredPage />} />

        {/* Dashboard Route */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />

        {/* Workspace Scoped Routes */}
        <Route path="/workspace/:id" element={<ProtectedRoute><WorkspacePage /></ProtectedRoute>}>
          <Route index element={<Navigate to="canvas" replace />} />
          <Route path="canvas" element={<CanvasPage />} />
          <Route path="tasks" element={<TaskBoardPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="members" element={<MembersPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Catch-all route -> redirect to landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
