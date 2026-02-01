import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getAllOpenRequests, getClosedRequests } from "../api";

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
    r.r_id ??
    r.r ??
    r.redactor_id ??
    r.redactorId ??
    r.redactor ??
    r.editor_id ??
    r.editorId ??
    r.editor ??
    r.assigned_to_id ??
    r.assignedToId ??
    r.assigned_to ??
    r.assigned_editor_id ??
    r.assignedEditorId ??
    r.assigned_editor ??
    r.assignee_id ??
    r.assigneeId ??
    r.assignee ??
    null;

  const asInt = toInt(raw);
  if (asInt !== null) return asInt;

  return toInt(raw?.id) ?? null;
}

function getEditorLabel(r) {
  const id = getEditorId(r);

  const name =
    r.redactor?.username ??
    r.editor?.username ??
    r.assigned_to?.username ??
    r.assigned_editor?.username ??
    r.assignee?.username ??
    r.redactor_username ??
    r.editor_username ??
    r.assigned_username ??
    null;

  if (!id) return "—";
  return name ? `${name} (ID: ${id})` : `ID: ${id}`;
}

export default function RequestsAll() {
  const [statusMode, setStatusMode] = useState("open");
  const [assignMode, setAssignMode] = useState("all");

  const [reporterId, setReporterId] = useState("");
  const [editorId, setEditorId] = useState("");

  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    async (nextStatusMode = statusMode) => {
      setLoading(true);
      setError("");

      try {
        let merged = [];

        if (nextStatusMode === "open") {
          const open = await getAllOpenRequests();
          merged = (Array.isArray(open) ? open : []).map((x) => ({
            ...x,
            __status: "open",
          }));
        } else if (nextStatusMode === "closed") {
          const closed = await getClosedRequests();
          merged = (Array.isArray(closed) ? closed : []).map((x) => ({
            ...x,
            __status: "closed",
          }));
        } else {
          const [open, closed] = await Promise.all([
            getAllOpenRequests(),
            getClosedRequests(),
          ]);

          const openTagged = (Array.isArray(open) ? open : []).map((x) => ({
            ...x,
            __status: "open",
          }));
          const closedTagged = (Array.isArray(closed) ? closed : []).map((x) => ({
            ...x,
            __status: "closed",
          }));

          const map = new Map();
          for (const x of openTagged) map.set(x.id, x);
          for (const x of closedTagged) map.set(x.id, x);
          merged = Array.from(map.values());
        }

        merged.sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
        setItems(merged);
      } catch {
        setError("Nie udało się wczytać zgłoszeń (admin).");
      } finally {
        setLoading(false);
      }
    },
    [statusMode]
  );

  useEffect(() => {
    load(statusMode);
  }, [statusMode, load]);

  const filtered = useMemo(() => {
    let list = items;

    if (assignMode === "assigned") {
      list = list.filter((r) => Boolean(getEditorId(r)));
    } else if (assignMode === "unassigned") {
      list = list.filter((r) => !getEditorId(r));
    }

    const rid = reporterId.trim() === "" ? null : parseInt(reporterId, 10);
    if (rid !== null && !Number.isNaN(rid)) {
      list = list.filter((r) => getReporterId(r) === rid);
    }

    const eid = editorId.trim() === "" ? null : parseInt(editorId, 10);
    if (eid !== null && !Number.isNaN(eid)) {
      list = list.filter((r) => getEditorId(r) === eid);
    }

    return list;
  }, [items, assignMode, reporterId, editorId]);

  return (
    <div>
      <div className="card mb-3">
        <div className="card-body p-3">
          <div className="mb-3">
            <h4 className="mb-0">Wszystkie (admin)</h4>
            <div className="text-muted small">
              Wyświetlasz {filtered.length} / {items.length}
            </div>
          </div>

          <div className="d-flex flex-wrap gap-3 align-items-end">
            <div>
              <div className="form-label mb-1 small">Status</div>
              <div className="btn-group" role="group" aria-label="status">
                <button
                  type="button"
                  className={`btn btn-sm ${
                    statusMode === "open" ? "btn-primary" : "btn-outline-primary"
                  }`}
                  onClick={() => setStatusMode("open")}
                >
                  Otwarte
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${
                    statusMode === "closed" ? "btn-primary" : "btn-outline-primary"
                  }`}
                  onClick={() => setStatusMode("closed")}
                >
                  Zamknięte
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${
                    statusMode === "all" ? "btn-primary" : "btn-outline-primary"
                  }`}
                  onClick={() => setStatusMode("all")}
                >
                  Wszystkie
                </button>
              </div>
            </div>

            <div>
              <div className="form-label mb-1 small">Przypisanie</div>
              <div className="btn-group" role="group" aria-label="assign">
                <button
                  type="button"
                  className={`btn btn-sm ${
                    assignMode === "all" ? "btn-dark" : "btn-outline-dark"
                  }`}
                  onClick={() => setAssignMode("all")}
                >
                  Wszystkie
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${
                    assignMode === "assigned" ? "btn-dark" : "btn-outline-dark"
                  }`}
                  onClick={() => setAssignMode("assigned")}
                >
                  Przypisane
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${
                    assignMode === "unassigned" ? "btn-dark" : "btn-outline-dark"
                  }`}
                  onClick={() => setAssignMode("unassigned")}
                >
                  Nieprzypisane
                </button>
              </div>
            </div>

            <div>
              <label className="form-label mb-1 small">ID zgłaszającego</label>
              <input
                className="form-control form-control-sm"
                style={{ width: 180 }}
                value={reporterId}
                onChange={(e) => setReporterId(e.target.value)}
                placeholder="np. 12"
                inputMode="numeric"
              />
            </div>

            <div>
              <label className="form-label mb-1 small">ID redaktora</label>
              <input
                className="form-control form-control-sm"
                style={{ width: 180 }}
                value={editorId}
                onChange={(e) => setEditorId(e.target.value)}
                placeholder="np. 7"
                inputMode="numeric"
              />
            </div>

            <div className="d-flex gap-2 ms-auto">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => {
                  setAssignMode("all");
                  setReporterId("");
                  setEditorId("");
                }}
              >
                Wyczyść filtry
              </button>

              <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                onClick={() => load(statusMode)}
                disabled={loading}
              >
                Odśwież
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading && <p className="text-muted">Ładowanie...</p>}
      {error && <div className="alert alert-danger">{error}</div>}

      {!loading && !error && filtered.length === 0 && (
        <p className="text-muted">Brak zgłoszeń spełniających filtry.</p>
      )}

      <div className="list-group">
        {filtered.map((r) => (
          <div key={r.id} className="list-group-item">
            <div className="d-flex justify-content-between align-items-start gap-3">
              <div>
                <div className="fw-bold">{r.title || `Zgłoszenie #${r.id}`}</div>
                <div className="text-muted small">
                  ID: {r.id} • Zgłaszający: {getReporterId(r) ?? "—"} • Redaktor:{" "}
                  {getEditorLabel(r)}
                </div>
              </div>

              <div className="d-flex align-items-center gap-2">
                <span
                  className={`badge ${
                    r.__status === "closed" ? "bg-secondary" : "bg-success"
                  }`}
                >
                  {r.__status === "closed" ? "zamknięte" : "otwarte"}
                </span>

                <Link
                  className="btn btn-sm btn-outline-secondary"
                  to={`/zgloszenia/${r.id}`}
                >
                  Szczegóły
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
