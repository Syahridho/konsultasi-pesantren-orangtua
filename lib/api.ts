import axios from "axios";

// Extend axios config type to include metadata
declare module "axios" {
  interface InternalAxiosRequestConfig {
    metadata?: {
      startTime: number;
    };
  }
}

// Create an instance of axios with default configuration
const api = axios.create({
  baseURL: process.env.NEXTAUTH_URL || "http://localhost:3000",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 seconds - increased to handle slow DB queries
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    // Log request details
    console.log(
      `[API] Making ${config.method?.toUpperCase()} request to: ${config.url}`
    );
    config.metadata = { startTime: Date.now() };
    return config;
  },
  (error) => {
    // Handle request error
    console.error("[API] Request error:", error);
    return Promise.reject(error);
  }
);

// Add a response interceptor
api.interceptors.response.use(
  (response) => {
    // Log response details
    const duration =
      Date.now() - (response.config.metadata?.startTime || Date.now());
    console.log(
      `[API] Response received from ${response.config.url} in ${duration}ms`
    );
    return response;
  },
  (error) => {
    // Log error details
    if (error.config) {
      const duration =
        Date.now() - (error.config.metadata?.startTime || Date.now());
      console.error(
        `[API] Request to ${error.config.url} failed after ${duration}ms:`,
        error.message
      );

      if (error.code === "ECONNABORTED") {
        console.error(
          `[API] Request timed out after ${error.config.timeout}ms`
        );
      }
    } else {
      console.error("[API] Error:", error);
    }
    return Promise.reject(error);
  }
);

export default api;
