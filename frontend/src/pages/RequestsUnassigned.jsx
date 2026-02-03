import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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

export default function RequestsUnassigned() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
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

  const filtered = useMemo(() => {
    if (statusMode === "all") return items;
    const wantClosed = statusMode === "closed";
    return items.filter((r) => Boolean(r.closed_at || r.closedAt || r.closed) === wantClosed);
  }, [items, statusMode]);

  async function handleAssign(id) {
    try {
      await assignRequest(id);
      await load();
    } catch {
      setError("Nie udało się przypisać zgłoszenia.");
    }
  }

  return (
    <div className="container-fluid px-0">
      {/* SEKCJA FILTRÓW - Zmniejszony odstęp od góry (mt-3 zamiast mt-5) */}
      <div className="mb-4 mt-3 pt-3 border-top">
        <div className="d-flex flex-column align-items-start gap-4">
          
          {/* Przełącznik statusów */}
          <div className="d-inline-flex border border-dark border-1 shadow-sm">
            {["open", "closed", "all"].map((m) => (
              <button
                key={m}
                type="button"
                className={`px-3 py-2 fw-bold text-uppercase border-0 rounded-0 ${
                  statusMode === m ? "bg-dark text-white" : "bg-white text-dark"
                }`}
                style={{ 
                  fontSize: '0.75rem',
                  borderRight: m !== "all" ? "1px solid #000" : "none" 
                }}
                onClick={() => setStatusMode(m)}
              >
                {m === "open" ? "OTWARTE" : m === "closed" ? "ZAMKNIĘTE" : "WSZYSTKIE"}
              </button>
            ))}
          </div>

          {/* Nagłówek sekcji - Pozostawiony duży odstęp (mt-5) */}
          <div className="mt-5">
            <h4 className="fw-bold text-uppercase mb-0">Nieprzypisane</h4>
            <div className="text-muted small">
              Wyświetlasz {filtered.length} / {items.length}
            </div>
          </div>
        </div>
      </div>

      {loading && <p className="text-muted p-3">Ładowanie...</p>}
      {error && <div className="alert alert-danger mx-3">{error}</div>}

      <div className="list-group list-group-flush border-top">
        {filtered.map((r) => {
          const isClosed = Boolean(r.closed_at || r.closedAt || r.closed);

          return (
            <div key={r.id} className="list-group-item py-3 px-0 bg-transparent border-bottom">
              <div className="d-flex justify-content-between align-items-center gap-3">
                <div>
                  <div className="d-flex align-items-center gap-2">
                    <span className="fw-bold">{r.title || `Zgłoszenie #${r.id}`}</span>
                    <span 
                      className={`small fw-bold text-uppercase ${isClosed ? "text-secondary" : "text-success"}`}
                      style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}
                    >
                      {isClosed ? "zamknięte" : "otwarte"}
                    </span>
                  </div>
                  <div className="text-muted small mt-1">
                    ID: {r.id} • Zgłaszający: {getReporterId(r) ?? "—"}
                  </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <Link
                    className="btn btn-sm btn-outline-secondary text-uppercase fw-bold"
                    style={{ fontSize: '0.7rem', padding: '5px 15px' }}
                    to={`/zgloszenia/${r.id}`}
                  >
                    Szczegóły
                  </Link>

                  {!isSuperuser && isEditor && !isClosed && (
                    <>
                      <button
                        className="btn btn-sm btn-dark text-uppercase fw-bold"
                        style={{ fontSize: '0.7rem', padding: '5px 15px' }}
                        onClick={() => handleAssign(r.id)}
                      >
                        Przypisz do mnie
                      </button>
                      
                      <button
                        className="btn btn-sm btn-dark text-uppercase fw-bold"
                        style={{ fontSize: '0.7rem', padding: '5px 15px' }}
                        onClick={() => navigate(`/zgloszenia/${r.id}/finalize?requestId=${r.id}`)}
                      >
                        Finalizuj
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