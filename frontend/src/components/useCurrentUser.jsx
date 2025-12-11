import { useState, useEffect } from "react";
import api from "../api";
import { ACCESS_TOKEN } from "../constants";

export default function useCurrentUser() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const token = localStorage.getItem(ACCESS_TOKEN);
                if (!token) {
                    setUser(null);
                    setLoading(false);
                    return;
                }

                const response = await api.get("/api/user/me/", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setUser(response.data);
            } catch (error) {
                alert(error);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        fetchUser().catch((error) => {
            console.error("Failed to fetch current user", error);
            setLoading(false);
        } );
    }, []);

    return { user, loading };
}