import { useEffect, useState } from "react";
import api from "../api";

const ROLE_STANDARD = "standard";
const ROLE_REDACTOR = "redactor";

export default function Accounts() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/api/users/");
      setUsers(res.data || []);
    } catch (e) {
      setError("Nie udało się pobrać listy użytkowników (sprawdź uprawnienia / token).");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const setRole = async (userId, newRole) => {
    setBusyId(userId);
    setError("");
    try {
      await api.patch(`/api/users/${userId}/role/`, { user_type: newRole });

      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, profile: { ...(u.profile || {}), user_type: newRole } }
            : u
        )
      );
    } catch (e) {
      setError("Nie udało się zmienić roli. Upewnij się, że jesteś adminem (superuser).");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="container">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h2 className="m-0">Konta</h2>
        <button className="btn btn-outline-secondary btn-sm" onClick={fetchUsers} disabled={loading}>
          Odśwież
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div>Ładowanie...</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped align-middle">
            <thead>
              <tr>
                <th style={{ width: 80 }}>ID</th>
                <th>Użytkownik</th>
                <th style={{ width: 180 }}>Rola</th>
                <th style={{ width: 320 }}>Akcje</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const role = u?.profile?.user_type || "(brak)";
                const isBusy = busyId === u.id;

                return (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td className="fw-semibold">{u.username}</td>
                    <td>{role}</td>
                    <td>
                      <div className="d-flex gap-2 flex-wrap">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          disabled={isBusy || role === ROLE_REDACTOR}
                          onClick={() => setRole(u.id, ROLE_REDACTOR)}
                        >
                          Ustaw redaktora
                        </button>

                        <button
                          className="btn btn-sm btn-outline-secondary"
                          disabled={isBusy || role === ROLE_STANDARD}
                          onClick={() => setRole(u.id, ROLE_STANDARD)}
                        >
                          Ustaw użytkownika
                        </button>

                        {isBusy && <span className="small text-muted">Zapisywanie…</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center text-muted py-4">
                    Brak użytkowników.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
