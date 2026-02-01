import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useCurrentUser from "../components/useCurrentUser.jsx";
import { getUnassignedRequests, assignRequest } from "../api";

function toInt(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === "number") return Number.isFinite(val) ? val : null;
  const n = parseInt(String(val), 10);
  return Number.isNaN(n) ? null : n;
}

function getReporterId(r) {
  return (
    toInt(r.author_id) ??
    toInt(r.authorId) ??
    toInt(r.author) ?? // czasem backend daje author jako id
    toInt(r.user_id) ??
    toInt(r.userId) ??
    toInt(r.created_by_id) ??
    toInt(r.createdById) ??
    toInt(r.author?.id) ??
    toInt(r.user?.id) ??
    null
  );
}

export default function RequestsUnassigned() {
  const { user } = useCurrentUser();
  const isSuperuser = Boolean(user?.is_superuser);
  const userType = String(user?.profile?.user_type || "").toLowerCase();
  const isEditor =
    userType.includes("redaktor") ||
    userType.includes("redactor") ||
    userType.includes("editor");

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await getUnassignedRequests();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setError("Nie udało się wczytać nieprzypisanych zgłoszeń.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAssign(id) {
    try {
      await assignRequest(id);
      await load();
    } catch {
      setError("Nie udało się przypisać zgłoszenia.");
    }
  }

  return (
    <div>
      <h4 className="mb-3">Nieprzypisane</h4>

      {loading && <p className="text-muted">Ładowanie...</p>}
      {error && <div className="alert alert-danger">{error}</div>}

      {!loading && !error && items.length === 0 && (
        <p className="text-muted">Brak nieprzypisanych zgłoszeń.</p>
      )}

      <div className="list-group">
        {items.map((r) => (
          <div key={r.id} className="list-group-item">
            <div className="d-flex justify-content-between align-items-start gap-3">
              <div>
                <div className="fw-bold">{r.title || `Zgłoszenie #${r.id}`}</div>
                <div className="text-muted small">
                  ID: {r.id} • Zgłaszający: {getReporterId(r) ?? "—"}
                </div>
              </div>

              <div className="d-flex gap-2">
                <Link
                  className="btn btn-sm btn-outline-secondary"
                  to={`/zgloszenia/${r.id}`}
                >
                  Szczegóły
                </Link>

                {/* Przypisz do mnie tylko redaktor, admin NIE widzi */}
                {!isSuperuser && isEditor && (
                  <button
                    className="btn btn-sm btn-dark"
                    onClick={() => handleAssign(r.id)}
                  >
                    Przypisz do mnie
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
