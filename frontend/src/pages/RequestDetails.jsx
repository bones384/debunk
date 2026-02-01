import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { assignRequest, getRequest, unassignRequest } from "../api";

export default function RequestDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setError("");
    try {
      const data = await getRequest(id);
      setItem(data);
    } catch (e) {
      setError("Nie udało się wczytać zgłoszenia.");
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function handleAssign() {
    setBusy(true);
    setError("");
    try {
      await assignRequest(id);
      await load();
    } catch {
      setError("Nie udało się przypisać.");
    } finally {
      setBusy(false);
    }
  }

  async function handleUnassign() {
    setBusy(true);
    setError("");
    try {
      await unassignRequest(id);
      await load();
    } catch {
      setError("Nie udało się cofnąć przypisania.");
    } finally {
      setBusy(false);
    }
  }

  function handleFinalize() {
    navigate(`/new-entry?requestId=${id}`);
  }

  const categoryText = item
    ? String(
        item.category?.name ??
          item.category?.label ??
          item.category_name ??
          item.category ??
          (Array.isArray(item.tags) && item.tags.length ? item.tags[0] : "") ??
          "-"
      )
    : "-";

  return (
    <div>
      <h4 className="mb-3">Zgłoszenie #{id}</h4>

      {error && <div className="alert alert-danger">{error}</div>}
      {!item && !error && <p className="text-muted">Ładowanie...</p>}

      {item && (
        <div className="card">
          <div className="card-body">
            <h5 className="card-title">{item.title || "Brak tytułu"}</h5>

            <p className="mb-2">
              <strong>Kategoria:</strong> {categoryText}
            </p>

            {item.comment && <p className="mb-2">{item.comment}</p>}

            <pre className="bg-body-tertiary p-3 rounded small mb-3">
{JSON.stringify(item, null, 2)}
            </pre>

            <div className="d-flex gap-2 flex-wrap">
              <button className="btn btn-primary" onClick={handleAssign} disabled={busy}>
                Przypisz do mnie
              </button>

              <button className="btn btn-outline-danger" onClick={handleUnassign} disabled={busy}>
                Cofnij przypisanie
              </button>

              <button className="btn btn-success" onClick={handleFinalize} disabled={busy}>
                Finalizuj (utwórz wpis)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
