import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

const apiClient = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Request Interceptor: Attach JWT Token from localStorage if present
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("Scrybe_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle errors globally (e.g., unauthorized)
const AUTH_ROUTES_SKIP_REDIRECT = [
  "/auth/login",
  "/auth/register",
  "/auth/resend-verification",
  "/auth/verify-email",
];

apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;
    const isAuthRoute = AUTH_ROUTES_SKIP_REDIRECT.some((route) =>
      originalRequest?.url?.includes(route)
    );

    // Sirf protected routes ke 401 par hi force-logout + redirect karo.
    // Auth-flow routes (login/register/resend/verify) apna error khud
    // Redux state mein show karte hain — inhe redirect nahi karna chahiye.
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      !isAuthRoute
    ) {
      originalRequest._retry = true;
      localStorage.removeItem("Scrybe_token");
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }

    return Promise.reject({
      data: error.response?.data || error,
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
    });
  }
);

export default apiClient;
