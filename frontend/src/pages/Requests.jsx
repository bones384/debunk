import { NavLink, Outlet } from "react-router-dom";
import useCurrentUser from "../components/useCurrentUser.jsx";

export default function Requests() {
  const { user, loading } = useCurrentUser();

  // STYLIZACJA: Brak zaokrągleń, wspólna ramka dzięki marginLeft -1px
  const tabClass = ({ isActive }) => 
    `nav-link px-4 py-2 fw-bold text-uppercase rounded-0 ${
      isActive 
        ? "bg-dark text-white" 
        : "bg-white text-dark"
    }`;

  const isSuperuser = Boolean(user?.is_superuser);
  const userType = String(user?.profile?.user_type || "").toLowerCase();
  const isEditor =
    userType.includes("redaktor") ||
    userType.includes("redactor") ||
    userType.includes("editor");

  if (loading) return <div>Ładowanie...</div>;

  const tabs = isSuperuser
    ? [] 
    : [
        { to: "unassigned", label: "Nieprzypisane" },
        { to: "mine", label: "Moje" },
      ];

  if (!isSuperuser && !isEditor) {
    return (
      <div className="alert alert-warning">
        Brak uprawnień do wyświetlania zgłoszeń.
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-4 fw-bold text-uppercase">Zgłoszenia</h2>

      {tabs.length > 0 && (
        <div className="d-flex mb-4">
          {/* Grupa przycisków złączona w jeden blok */}
          <div className="nav d-inline-flex border border-dark border-1 shadow-sm">
            {tabs.map((t) => (
              <NavLink 
                key={t.to}
                className={tabClass} 
                to={t.to}
                style={({ isActive }) => ({
                  borderRight: "1px solid #000",
                  textDecoration: "none",
                  // Usuwamy prawą ramkę dla ostatniego elementu, żeby nie była podwójna
                  borderRight: tabs.indexOf(t) === tabs.length - 1 ? "none" : "1px solid #000"
                })}
              >
                {t.label}
              </NavLink>
            ))}
          </div>
        </div>
      )}

      <Outlet />
    </div>
  );
}