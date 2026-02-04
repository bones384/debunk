import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { assignRequest, getRequest, unassignRequest } from "../api";
import useCurrentUser from "../components/useCurrentUser.jsx"; // IMPORT HOOKA

export default function RequestDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useCurrentUser(); // POBRANIE DANYCH UŻYTKOWNIKA

  const [item, setItem] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Sprawdzamy czy użytkownik jest administratorem
  const isSuperuser = Boolean(user?.is_superuser);

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
    navigate(`/zgloszenia/${id}/finalize?requestId=${id}`);
  }

  if (error) {
    return (
      <div className="container py-4">
        <div className="alert alert-danger">{error}</div>
        <button className="btn btn-link text-dark fw-bold p-0" onClick={() => navigate("/zgloszenia")}>
          ← POWRÓT DO LISTY
        </button>
      </div>
    );
  }

  if (!item) {
    return <p className="text-muted p-4">Ładowanie…</p>;
  }

  return (
    <div className="container py-4">
      {/* PRZYCISK POWROTU NAD NAGŁÓWKIEM */}
      <div className="mb-4">
        <button 
          className="btn btn-link text-dark text-decoration-none fw-bold p-0" 
          onClick={() => navigate("/zgloszenia")}
          style={{ fontSize: '0.9rem' }}
        >
          ← POWRÓT DO LISTY
        </button>
      </div>

      <h4 className="mb-4 fw-bold text-uppercase">Zgłoszenie #{item.id}</h4>

      <div className="card border-0 shadow-sm p-4 bg-light">
        {/* Tytuł */}
        <div className="mb-3">
          <strong className="text-muted small text-uppercase d-block mb-1">Tytuł:</strong>
          <span className="fs-5 fw-bold">{item.title || "Brak tytułu"}</span>
        </div>

        {/* Opis */}
        {item.comment && (
          <div className="mb-3">
            <strong className="text-muted small text-uppercase d-block mb-1">Opis:</strong>
            <div className="bg-white p-3 rounded border">{item.comment}</div>
          </div>
        )}

        {/* Kategorie / Tagi */}
        {Array.isArray(item.tags) && item.tags.length > 0 && (
          <div className="mb-3">
            <strong className="text-muted small text-uppercase d-block mb-1">Tagi / Kategorie:</strong>
            <div className="d-flex flex-wrap gap-2 mt-1">
              {item.tags.map((t) => (
                <span key={t.id} className="badge bg-dark px-3 py-2 text-uppercase">
                  {t.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Artykuły */}
        <div className="mb-3">
          <strong className="text-muted small text-uppercase d-block mb-1">Artykuły powiązane:</strong>
          {Array.isArray(item.articles) && item.articles.length > 0 ? (
            <ul className="list-group list-group-flush rounded border">
              {item.articles.map((a, i) => (
                <li key={i} className="list-group-item small bg-white">
                  <a href={a} target="_blank" rel="noopener noreferrer" className="text-primary text-break">
                    {a}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-muted small">Brak artykułów</div>
          )}
        </div>

        <div className="row mb-4">
          <div className="col-md-6">
            <strong className="text-muted small text-uppercase d-block">Zgłaszający:</strong>
            <span>{item.author?.username || "-"}</span>
          </div>
          <div className="col-md-6">
            <strong className="text-muted small text-uppercase d-block">Przypisany redaktor:</strong>
            <span>{item.redactor?.username ?? "Brak"}</span>
          </div>
        </div>

        {/* Status */}
        <div className="mb-4">
          <strong className="text-muted small text-uppercase d-block mb-1">Status:</strong>
          <span className={`fw-bold text-uppercase ${item.closed_at ? "text-danger" : "text-success"}`}>
            {item.closed_at ? "zamknięte" : "otwarte"}
          </span>
        </div>

        {/* WARUNKOWE RENDEROWANIE PRZYCISKÓW: Ukryte dla administratora */}
        {!isSuperuser && (
          <div className="d-flex gap-2 flex-wrap pt-3 border-top">
            <button
              className="btn btn-dark text-uppercase fw-bold px-4"
              onClick={handleAssign}
              disabled={busy || item.redactor}
            >
              Przypisz do mnie
            </button>

            <button
              className="btn btn-outline-danger text-uppercase fw-bold px-4"
              onClick={handleUnassign}
              disabled={busy || !item.redactor}
            >
              Cofnij przypisanie
            </button>

            {!item.closed_at && (
              <button
                className="btn btn-success text-uppercase fw-bold px-4"
                onClick={handleFinalize}
                disabled={busy}
              >
                Finalizuj (utwórz wpis)
              </button>
            )}
          </div>
        )}
        
        {isSuperuser && (
          <div className="pt-3 border-top text-muted small italic">
            Tryb podglądu administratora (akcje edycji są zablokowane).
          </div>
        )}
      </div>
    </div>
  );
}