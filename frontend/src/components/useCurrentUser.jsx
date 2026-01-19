import { useState, useEffect } from "react";
import api from "../api";
import { ACCESS_TOKEN, AUTH_CHANGED_EVENT } from "../constants.js";

export default function useCurrentUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);

        const token = localStorage.getItem(ACCESS_TOKEN);
        if (!token) {
          setUser(null);
          return;
        }

        const response = await api.get("/api/users/me/", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUser(response.data);
      } catch (error) {
        console.error("Failed to fetch current user", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();

    const handler = () => fetchUser();
    window.addEventListener(AUTH_CHANGED_EVENT, handler);
    window.addEventListener("storage", handler); 

    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  return { user, loading };
}
