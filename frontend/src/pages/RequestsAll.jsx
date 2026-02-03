import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getAllOpenRequests, getClosedRequests } from "../api";
import useCurrentUser from "../components/useCurrentUser.jsx";

// FUNKCJE POMOCNICZE - Muszą być w pliku
function toInt(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === "number") return Number.isFinite(val) ? val : null;
  if (typeof val === "string") {
    const n = parseInt(val, 10);
    return Number.isNaN(n) ? null : n;
  }
  return null;
}

function getReporterId(r) {
  return (
    toInt(r.reporter_id) ??
    toInt(r.reporterId) ??
    toInt(r.user_id) ??
    toInt(r.userId) ??
    toInt(r.created_by_id) ??
    toInt(r.createdById) ??
    toInt(r.reporter?.id) ??
    toInt(r.user?.id) ??
    toInt(r.created_by?.id) ??
    toInt(r.author?.id) ??
    toInt(r.submitter?.id) ??
    null
  );
}

function getEditorId(r) {
  const raw =
    r.r_id ?? r.r ?? r.redactor_id ?? r.redactorId ?? r.redactor ??
    r.editor_id ?? r.editorId ?? r.editor ?? r.assigned_to_id ??
    r.assignedToId ?? r.assigned_to ?? r.assigned_editor_id ??
    r.assignedEditorId ?? r.assigned_editor ?? r.assignee_id ??
    r.assigneeId ?? r.assignee ?? null;

  const asInt = toInt(raw);
  if (asInt !== null) return asInt;
  return toInt(raw?.id) ?? null;
}

function getEditorLabel(r) {
  const id = getEditorId(r);
  const name =
    r.redactor?.username ?? r.editor?.username ?? r.assigned_to?.username ??
    r.assigned_editor?.username ?? r.assignee?.username ??
    r.redactor_username ?? r.editor_username ?? r.assigned_username ?? null;

  if (!id) return "—";
  return name ? `${name} (ID: ${id})` : `ID: ${id}`;
}

export default function RequestsAll() {
  const { user } = useCurrentUser();
  const [statusMode, setStatusMode] = useState("open");
  const [assignMode, setAssignMode] = useState("all");
  const [reporterId, setReporterId] = useState("");
  const [editorId, setEditorId] = useState("");
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const isSuperuser = Boolean(user?.is_superuser);

  const load = useCallback(async (nextStatusMode = statusMode) => {
    setLoading(true);
    setError("");
    try {
      let merged = [];
      if (nextStatusMode === "open") {
        const open = await getAllOpenRequests();
        merged = (Array.isArray(open) ? open : []).map((x) => ({ ...x, __status: "open" }));
      } else if (nextStatusMode === "closed") {
        const closed = await getClosedRequests();
        merged = (Array.isArray(closed) ? closed : []).map((x) => ({ ...x, __status: "closed" }));
      } else {
        const [open, closed] = await Promise.all([getAllOpenRequests(), getClosedRequests()]);
        const openTagged = (Array.isArray(open) ? open : []).map((x) => ({ ...x, __status: "open" }));
        const closedTagged = (Array.isArray(closed) ? closed : []).map((x) => ({ ...x, __status: "closed" }));
        const map = new Map();
        for (const x of openTagged) map.set(x.id, x);
        for (const x of closedTagged) map.set(x.id, x);
        merged = Array.from(map.values());
      }
      merged.sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
      setItems(merged);
    } catch {
      setError("Nie udało się wczytać zgłoszeń.");
    } finally {
      setLoading(false);
    }
  }, [statusMode]);

  useEffect(() => { load(statusMode); }, [statusMode, load]);

  const filtered = useMemo(() => {
    let list = items;
    if (assignMode === "assigned") list = list.filter((r) => Boolean(getEditorId(r)));
    else if (assignMode === "unassigned") list = list.filter((r) => !getEditorId(r));
    const rid = parseInt(reporterId, 10);
    if (!Number.isNaN(rid)) list = list.filter((r) => getReporterId(r) === rid);
    const eid = parseInt(editorId, 10);
    if (!Number.isNaN(eid)) list = list.filter((r) => getEditorId(r) === eid);
    return list;
  }, [items, assignMode, reporterId, editorId]);

  return (
    <div className="container-fluid px-0">
      <div className="mb-4">
        <h4 className="fw-bold text-uppercase mb-1">Wszystkie (admin)</h4>
        <div className="text-muted small mb-4">Wyświetlasz {filtered.length} / {items.length}</div>
        
        <div className="d-flex flex-column gap-3">
          <div className="d-flex gap-4 flex-wrap">
            <div>
              <div className="form-label mb-1 small text-muted text-uppercase fw-bold">Status</div>
              <div className="btn-group">
                {["open", "closed", "all"].map((m) => (
                  <button key={m} className={`btn btn-sm ${statusMode === m ? "btn-dark" : "btn-outline-dark"}`} onClick={() => setStatusMode(m)}>
                    {m === "open" ? "OTWARTE" : m === "closed" ? "ZAMKNIĘTE" : "WSZYSTKIE"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="form-label mb-1 small text-muted text-uppercase fw-bold">Przypisanie</div>
              <div className="btn-group">
                {["all", "assigned", "unassigned"].map((m) => (
                  <button key={m} className={`btn btn-sm ${assignMode === m ? "btn-dark" : "btn-outline-dark"}`} onClick={() => setAssignMode(m)}>
                    {m === "all" ? "WSZYSTKIE" : m === "assigned" ? "PRZYPISANE" : "NIEPRZYPISANE"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="d-flex gap-3 flex-wrap">
            <div style={{ width: "200px" }}>
              <label className="form-label mb-1 small text-muted text-uppercase fw-bold">ID zgłaszającego</label>
              <input 
                className="form-control form-control-sm border-secondary-subtle bg-body-secondary" 
                style={{ "--bs-bg-opacity": ".5" }}
                value={reporterId} 
                onChange={(e) => setReporterId(e.target.value)} 
                placeholder="np. 12" 
              />
            </div>
            <div style={{ width: "200px" }}>
              <label className="form-label mb-1 small text-muted text-uppercase fw-bold">ID redaktora</label>
              <input 
                className="form-control form-control-sm border-secondary-subtle bg-body-secondary" 
                style={{ "--bs-bg-opacity": ".5" }}
                value={editorId} 
                onChange={(e) => setEditorId(e.target.value)} 
                placeholder="np. 7" 
              />
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 mt-2">
  <button 
    className="btn btn-sm btn-outline-secondary text-uppercase fw-bold px-3" 
    onClick={() => { 
      // ZMIANA: Dodano reset statusu na "open" (lub "all", zależnie od preferencji)
      setStatusMode("open"); 
      setAssignMode("all"); 
      setReporterId(""); 
      setEditorId(""); 
    }}
  >
    WYCZYŚĆ FILTRY
  </button>
  <button 
    className="btn btn-sm btn-outline-dark text-uppercase fw-bold px-3" 
    onClick={() => load(statusMode)} 
    disabled={loading}
  >
    ODŚWIEŻ
  </button>
</div>
        </div>
      </div>

      {loading && <p className="text-muted mb-4">Ładowanie...</p>}
      {error && <div className="alert alert-danger mb-4">{error}</div>}

      <div className="list-group list-group-flush border-top">
        {filtered.map((r) => (
          <div key={r.id} className="list-group-item py-3 px-0 bg-transparent border-bottom">
            <div className="d-flex justify-content-between align-items-center gap-3">
              <div>
                <div className="d-flex align-items-center gap-2">
                  <span className="fw-bold">{r.title || `Zgłoszenie #${r.id}`}</span>
                  <span className={`small fw-bold text-uppercase ${r.__status === "closed" ? "text-secondary" : "text-success"}`} style={{ fontSize: '0.75rem' }}>
                    {r.__status === "closed" ? "zamknięte" : "otwarte"}
                  </span>
                </div>
                <div className="text-muted small mt-1">
                  ID: {r.id} • Zgłaszający: {getReporterId(r) ?? "—"} • Redaktor: {getEditorLabel(r)}
                </div>
              </div>
              <div className="d-flex align-items-center gap-2">
                {/* Finalizuj ukryte dla admina */}
                {!isSuperuser && (
                  <Link className="btn btn-sm btn-dark text-uppercase fw-bold" style={{ fontSize: '0.7rem', padding: '5px 15px' }} to={`/zgloszenia/${r.id}/finalize?requestId=${r.id}`}>
                    Finalizuj
                  </Link>
                )}
                <Link className="btn btn-sm btn-outline-secondary text-uppercase fw-bold" style={{ fontSize: '0.7rem', padding: '5px 15px' }} to={`/zgloszenia/${r.id}`}>
                  Szczegóły
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {!loading && filtered.length > 5 && (
        <div className="text-center py-4">
          <button className="btn btn-link text-muted small text-decoration-none" onClick={() => window.scrollTo(0,0)}>Wróć do góry</button>
        </div>
      )}
    </div>
  );
}