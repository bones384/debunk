import axios from "axios";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "./constants.js";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Dodawanie access tokena do każdego requestu
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auto refresh na 401
let isRefreshing = false;
let refreshQueue = [];

function resolveQueue(error, newAccessToken = null) {
  refreshQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(newAccessToken);
  });
  refreshQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Jeśli nie ma response to od razu reject
    if (!error.response) {
      return Promise.reject(error);
    }

    // Tylko przy 401 próbujemy refreshować
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem(REFRESH_TOKEN);
      if (!refreshToken) {
        return Promise.reject(error);
      }

      // Jeśli refresh już trwa to kolejkujemy request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then((newAccess) => {
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          return api(originalRequest);
        });
      }

      isRefreshing = true;

      try {
        
        const refreshResponse = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/auth/token/refresh/`,
          { refresh: refreshToken }
        );

        const newAccess = refreshResponse.data.access;
        localStorage.setItem(ACCESS_TOKEN, newAccess);

        resolveQueue(null, newAccess);

        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return api(originalRequest);
      } catch (refreshError) {
        resolveQueue(refreshError, null);

        
        localStorage.removeItem(ACCESS_TOKEN);
        localStorage.removeItem(REFRESH_TOKEN);

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);


// Requests (zgłoszenia)
export async function getUnassignedRequests() {
  const res = await api.get("/api/requests/unassigned/");
  return res.data;
}

export async function getMyRequests() {
  const res = await api.get("/api/requests/assigned/");
  return res.data;
}

export async function getRequest(id) {
  const res = await api.get(`/api/requests/${id}/`);
  return res.data;
}

export async function assignRequest(id) {
  const res = await api.post(`/api/requests/${id}/assign/`);
  return res.data;
}

export async function unassignRequest(id) {
  const res = await api.delete(`/api/requests/${id}/assign/`);
  return res.data;
}

function isClosedRequest(r) {
  return Boolean(r?.closed_at ?? r?.closedAt ?? r?.closed);
}

export async function getAllOpenRequests() {
  const res = await api.get("/api/requests/");
  const data = res.data;

  const list = Array.isArray(data)
    ? data
    : Array.isArray(data?.results)
      ? data.results
      : [];

  return list.filter((r) => !isClosedRequest(r));
}

export async function getClosedRequests() {
  const res = await api.get("/api/requests/closed/");
  const data = res.data;

  const list = Array.isArray(data)
    ? data
    : Array.isArray(data?.results)
      ? data.results
      : [];

  return list;
}

export default api;
