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

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }
  if (!item) {
    return <p className="text-muted">Ładowanie…</p>;
  }

  return (
    <div className="container py-4">
      <h4 className="mb-3">Zgłoszenie #{item.id}</h4>

      {/* Tytuł */}
      <div className="mb-3">
        <strong>Tytuł:</strong>{" "}
        {item.title || <span className="text-muted">Brak tytułu</span>}
      </div>

      {/* Opis / treść */}
      {item.comment && (
        <div className="mb-3">
          <strong>Opis:</strong>
          <div>{item.comment}</div>
        </div>
      )}

      {/* Kategorie / Tagi */}
      {Array.isArray(item.tags) && item.tags.length > 0 && (
        <div className="mb-3">
          <strong>Tagi / Kategorie:</strong>
          <div className="d-flex flex-wrap gap-2 mt-1">
            {item.tags.map((t) => (
              <span key={t.id} className="badge bg-secondary">
                {t.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Artykuły */}
      <div className="mb-3">
        <strong>Artykuły powiązane:</strong>
        {Array.isArray(item.articles) && item.articles.length > 0 ? (
          <ul>
            {item.articles.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        ) : (
          <div className="text-muted">Brak artykułów</div>
        )}
      </div>

      {/* Autor i redaktor */}
      <div className="mb-3">
        <strong>Zgłaszający:</strong> {item.author?.username || "-"}
      </div>
      <div className="mb-3">
        <strong>Przypisany redaktor:</strong>{" "}
        {item.redactor?.username ?? <span className="text-muted">Brak</span>}
      </div>

      {/* Status */}
      <div className="mb-3">
        <strong>Status:</strong>{" "}
        {item.closed_at ? (
          <span className="text-danger">zamknięte</span>
        ) : (
          <span className="text-success">otwarte</span>
        )}
      </div>

      <div className="d-flex gap-2 flex-wrap">
        <button
          className="btn btn-primary"
          onClick={handleAssign}
          disabled={busy}
        >
          Przypisz do mnie
        </button>

        <button
          className="btn btn-outline-danger"
          onClick={handleUnassign}
          disabled={busy}
        >
          Cofnij przypisanie
        </button>

        <button
          className="btn btn-success"
          onClick={handleFinalize}
          disabled={busy}
        >
          Finalizuj (utwórz wpis)
        </button>
      </div>
    </div>
  );
}
