// useAxios.js — no interceptors, minimal + correct
import { useAuth } from "@clerk/clerk-react";
import axios from "axios";
import { useMemo } from "react";

const useAxios = () => {
  const { getToken } = useAuth();

  return useMemo(() => {
    const instance = axios.create({
      baseURL: import.meta.env.VITE_BACKEND_URL,
      headers: { "Content-Type": "application/json" },
    });

    const request = async (config) => {
      const token = await getToken();
      const authHeader = token ? { Authorization: `Bearer ${token}` } : {};
      const headers = { ...authHeader, ...(config.headers || {}) };
      return instance.request({ ...config, headers });
    };

    const get = (url, config = {}) =>
      request({ method: "get", url, ...config });

    const del = (url, config = {}) =>
      request({ method: "delete", url, ...config });

    const post = (url, data, config = {}) =>
      request({ method: "post", url, data, ...config });

    const put = (url, data, config = {}) =>
      request({ method: "put", url, data, ...config });

    const patch = (url, data, config = {}) =>
      request({ method: "patch", url, data, ...config });

    
    return { get, delete: del, post, put, patch, request };
  }, [getToken]);
};

export default useAxios;