import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useCurrentUser from "../components/useCurrentUser.jsx";
import { getMyRequests, unassignRequest } from "../api";

function toInt(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === "number") return Number.isFinite(val) ? val : null;
  const n = parseInt(String(val), 10);
  return Number.isNaN(n) ? null : n;
}

function isClosedRequest(r) {
  return Boolean(r.closed_at ?? r.closedAt ?? r.closed);
}

function getReporterId(r) {
  return (
    toInt(r.author_id) ??
    toInt(r.authorId) ??
    toInt(r.author) ??
    toInt(r.user_id) ??
    toInt(r.userId) ??
    toInt(r.created_by_id) ??
    toInt(r.createdById) ??
    toInt(r.author?.id) ??
    toInt(r.user?.id) ??
    null
  );
}

export default function RequestsMine() {
  const navigate = useNavigate();
  const { user, loading: userLoading } = useCurrentUser();

  const [statusMode, setStatusMode] = useState("open"); 
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isSuperuser = Boolean(user?.is_superuser);
  const userType = String(user?.profile?.user_type || "").toLowerCase();
  const isEditor =
    userType.includes("redaktor") ||
    userType.includes("redactor") ||
    userType.includes("editor");

  const canSee = Boolean(user) && (isSuperuser || isEditor);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await getMyRequests();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setError("Nie udało się wczytać Twoich zgłoszeń.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!userLoading && canSee) load();
  }, [userLoading, canSee]);

  const filtered = useMemo(() => {
    if (statusMode === "all") return items;
    const wantClosed = statusMode === "closed";
    return items.filter((r) => isClosedRequest(r) === wantClosed);
  }, [items, statusMode]);

  async function handleUnassign(id) {
    if (!window.confirm("Cofnąć przypisanie zgłoszenia?")) return;
    try {
      await unassignRequest(id);
      await load();
    } catch {
      setError("Nie udało się cofnąć przypisania.");
    }
  }

  if (userLoading) return <div>Ładowanie...</div>;
  if (!canSee) return <div className="alert alert-warning">Brak uprawnień.</div>;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-start mb-3">
        <div>
          <h4 className="mb-0">Moje</h4>
          <div className="text-muted small">
            Wyświetlasz {filtered.length} / {items.length}
          </div>
        </div>

        <div className="btn-group" role="group" aria-label="status">
          <button
            type="button"
            className={`btn btn-sm ${
              statusMode === "open" ? "btn-dark" : "btn-outline-dark"
            }`}
            onClick={() => setStatusMode("open")}
          >
            Otwarte
          </button>
          <button
            type="button"
            className={`btn btn-sm ${
              statusMode === "closed" ? "btn-dark" : "btn-outline-dark"
            }`}
            onClick={() => setStatusMode("closed")}
          >
            Zamknięte
          </button>
          <button
            type="button"
            className={`btn btn-sm ${
              statusMode === "all" ? "btn-dark" : "btn-outline-dark"
            }`}
            onClick={() => setStatusMode("all")}
          >
            Wszystkie
          </button>
        </div>
      </div>

      {loading && <p className="text-muted">Ładowanie...</p>}
      {error && <div className="alert alert-danger">{error}</div>}

      {!loading && !error && filtered.length === 0 && (
        <p className="text-muted">Brak zgłoszeń dla wybranego filtra.</p>
      )}

      <div className="list-group">
        {filtered.map((r) => {
          const closed = isClosedRequest(r);

          return (
            <div key={r.id} className="list-group-item">
              <div className="d-flex justify-content-between align-items-start gap-3">
                <div>
                  <div className="fw-bold">{r.title || `Zgłoszenie #${r.id}`}</div>
                  <div className="text-muted small">
                    ID: {r.id} • Zgłaszający: {getReporterId(r) ?? "—"}
                  </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <span className={`badge ${closed ? "bg-secondary" : "bg-success"}`}>
                    {closed ? "zamknięte" : "otwarte"}
                  </span>

                  <Link
                    className="btn btn-sm btn-outline-secondary"
                    to={`/zgloszenia/${r.id}`}
                  >
                    Szczegóły
                  </Link>

                  {/* Finalizacja tylko dla OTWARTYCH */}
                  {!closed && isEditor && (
                    <>
                      <button
                        className="btn btn-sm btn-outline-dark"
                        onClick={() => navigate(`/entries/new?requestId=${r.id}`)}
                      >
                        Finalizuj
                      </button>

                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleUnassign(r.id)}
                      >
                        Cofnij przypisanie
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
