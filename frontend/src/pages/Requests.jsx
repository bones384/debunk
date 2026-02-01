import { NavLink, Outlet } from "react-router-dom";
import useCurrentUser from "../components/useCurrentUser.jsx";

export default function Requests() {
  const { user, loading } = useCurrentUser();

  const tabClass = ({ isActive }) => `nav-link ${isActive ? "active" : ""}`;

  const isSuperuser = Boolean(user?.is_superuser);
  const userType = String(user?.profile?.user_type || "").toLowerCase();
  const isEditor =
    userType.includes("redaktor") ||
    userType.includes("redactor") ||
    userType.includes("editor");

  if (loading) return <div>Ładowanie...</div>;

  // admin: tylko "Wszystkie"
  // redaktor: "Nieprzypisane" + "Moje"
  const tabs = isSuperuser
    ? [{ to: "all", label: "Wszystkie" }]
    : [
        { to: "unassigned", label: "Nieprzypisane" },
        { to: "mine", label: "Moje" },
      ];

  // safety: jeśli ktoś nie ma roli a wejdzie linkiem
  if (!isSuperuser && !isEditor) {
    return (
      <div className="alert alert-warning">
        Brak uprawnień do wyświetlania zgłoszeń.
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-3">Zgłoszenia</h2>

      <ul className="nav nav-tabs mb-3">
        {tabs.map((t) => (
          <li className="nav-item" key={t.to}>
            <NavLink className={tabClass} to={t.to}>
              {t.label}
            </NavLink>
          </li>
        ))}
      </ul>

      <Outlet />
    </div>
  );
}
