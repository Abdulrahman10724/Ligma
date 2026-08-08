import apiClient from "./api.service";

export const authService = {
  register: (payload) => apiClient.post("/auth/register", payload),
  login: (payload) => apiClient.post("/auth/login", payload),
  verifyEmail: (token) => apiClient.post("/auth/verify-email", { token }),
  resendVerification: () => apiClient.post("/auth/resend-verification"),
  me: () => apiClient.get("/auth/me"),
  logout: () => apiClient.post("/auth/logout"),
};

export default authService; 