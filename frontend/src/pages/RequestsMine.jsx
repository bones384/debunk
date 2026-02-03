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
    <div className="container-fluid px-0">
      {/* SEKCJA FILTRÓW - Zmniejszony odstęp od góry (mt-3) */}
      <div className="mb-4 mt-3 pt-3 border-top">
        <div className="d-flex flex-column align-items-start gap-4">
          
          {/* Przełącznik statusów - wspólna ramka */}
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

          {/* Nagłówek sekcji - Duży odstęp (mt-5) */}
          <div className="mt-5">
            <h4 className="fw-bold text-uppercase mb-0">Moje</h4>
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
          const closed = isClosedRequest(r);

          return (
            <div key={r.id} className="list-group-item py-3 px-0 bg-transparent border-bottom">
              <div className="d-flex justify-content-between align-items-center gap-3">
                <div>
                  <div className="d-flex align-items-center gap-2">
                    <span className="fw-bold">{r.title || `Zgłoszenie #${r.id}`}</span>
                    {/* Status jako zielony napis obok tytułu bez bordera */}
                    <span 
                      className={`small fw-bold text-uppercase ${closed ? "text-secondary" : "text-success"}`}
                      style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}
                    >
                      {closed ? "zamknięte" : "otwarte"}
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

                  {!closed && isEditor && (
                    <>
                      {/* Przycisk finalizuj czarny w środku */}
                      <button
                        className="btn btn-sm btn-dark text-uppercase fw-bold"
                        style={{ fontSize: '0.7rem', padding: '5px 15px' }}
                        onClick={() => navigate(`/zgloszenia/${r.id}/finalize?requestId=${r.id}`)}
                      >
                        Finalizuj
                      </button>

                      <button
                        className="btn btn-sm btn-outline-danger text-uppercase fw-bold"
                        style={{ fontSize: '0.7rem', padding: '5px 15px' }}
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