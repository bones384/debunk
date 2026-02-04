import { Navigate } from "react-router-dom";
import useCurrentUser from "../components/useCurrentUser.jsx";

export default function RequestsIndex() {
  const { user, loading } = useCurrentUser();

  if (loading) return <p className="text-muted">Ładowanie...</p>;

  const isSuperuser = Boolean(user?.is_superuser);
  const userType = (user?.profile?.user_type || "").toString().toLowerCase();
  const isEditor =
    userType.includes("redaktor") ||
    userType.includes("redactor") ||
    userType.includes("editor");

  if (isSuperuser) return <Navigate to="all" replace />;
  if (isEditor) return <Navigate to="unassigned" replace />;
  return <Navigate to="/" replace />;
}
