import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import api from "../api";
import { REFRESH_TOKEN, ACCESS_TOKEN, AUTH_CHANGED_EVENT } from "../constants.js";

export default function ProtectedRoute({
  children,
  requireSuperuser = false,
  requireEditorOrSuperuser = false,
}) {

  const [status, setStatus] = useState("loading"); 
  const [isSuperuser, setIsSuperuser] = useState(false);
  const [roleOk, setRoleOk] = useState(true);

  useEffect(() => {
    let mounted = true;

    const refreshAccessToken = async () => {
      const refresh = localStorage.getItem(REFRESH_TOKEN);
      if (!refresh) return false;

      try {
        const response = await api.post("/api/auth/token/refresh/", { refresh });
        if (response.status === 200 && response.data?.access) {
          localStorage.setItem(ACCESS_TOKEN, response.data.access);
          window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
          return true;
        }
        return false;
      } catch {
        return false;
      }
    };

    const ensureAuth = async () => {
      const token = localStorage.getItem(ACCESS_TOKEN);
      if (!token) {
        if (mounted) setStatus("unauthorized");
        return;
      }

      try {
        const decoded = jwtDecode(token);
        const now = Date.now() / 1000;

        if (decoded?.exp && decoded.exp < now) {
          const ok = await refreshAccessToken();
          if (!ok) {
            if (mounted) setStatus("unauthorized");
            return;
          }
        }

        if (requireSuperuser || requireEditorOrSuperuser) {
  const me = await api.get("/api/users/me/");

  const su = Boolean(me?.data?.is_superuser);
  const userType = (me?.data?.profile?.user_type || "")
    .toString()
    .toLowerCase();
  const editor = ["redaktor", "editor", "redactor"].some((w) =>
  userType.includes(w)
);


  const ok = requireSuperuser ? su : (su || editor);

  if (mounted) {
    setIsSuperuser(su);
    setRoleOk(ok);
    setStatus("ok");
  }
  return;
}


       if (mounted) {
  setRoleOk(true);
  setStatus("ok");
}

      } catch {
        if (mounted) setStatus("unauthorized");
      }
    };

    ensureAuth();

    return () => {
      mounted = false;
    };
  }, [requireSuperuser, requireEditorOrSuperuser]);


  if (status === "loading") return <div>Loading...</div>;

  if (status === "unauthorized") {
    return <Navigate to="/auth" replace />;
  }

 if ((requireSuperuser || requireEditorOrSuperuser) && !roleOk) {
  return <Navigate to="/" replace />;
}


  return children;
}
