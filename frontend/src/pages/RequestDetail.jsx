import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";

function absoluteUrl(url) {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const base = import.meta.env.VITE_API_URL?.replace(/\/$/, "");
  return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
}

export default function RequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setError("");
      try {
        const res = await api.get(`/api/applications/${id}/`);
        if (mounted) setItem(res.data);
      } catch (e) {
        setError("Nie udało się wczytać prośby.");
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  const authorId = useMemo(() => item?.author?.id || null, [item]);

  const scans = useMemo(() => {
    if (!item) return [];
    return Array.isArray(item.uploaded_scans) ? item.uploaded_scans : [];
  }, [item]);

  async function handleReject() {
    if (!confirm("Na pewno odrzucić prośbę?")) return;
    setBusy(true);
    setError("");
    try {
      await api.delete(`/api/applications/${id}/`);
      navigate("/prosby");
    } catch (e) {
      setError("Nie udało się odrzucić prośby.");
    } finally {
      setBusy(false);
    }
  }

  async function handleApprove() {
    if (!authorId) {
      setError("Nie mogę znaleźć autora prośby (author.id).");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api.post(`/api/users/${authorId}/request/`);
      navigate("/prosby");
    } catch (e) {
      setError("Nie udało się zatwierdzić prośby.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h2>Prośba #{id}</h2>

      {error && <div className="alert alert-danger">{error}</div>}
      {!item && !error && <p className="text-muted">Ładowanie...</p>}

      {item && (
        <div className="card">
          <div className="card-body">
            <h5 className="card-title">{item.title || "Prośba o status redaktora"}</h5>

            <p className="text-muted mb-2">
              Użytkownik: {item.author?.username || "?"}
            </p>

            <p className="mb-2">
              <strong>Status:</strong>{" "}
              {item.is_accepted ? "zaakceptowana" : "nierozpatrzona"}
            </p>

            {item.tags?.length > 0 && (
              <>
                <hr />
                <h6>Kategorie</h6>
                <div className="d-flex flex-wrap gap-2">
                  {item.tags.map((t, idx) => (
                    <span key={idx} className="badge text-bg-secondary">
                      {String(t)}
                    </span>
                  ))}
                </div>
              </>
            )}

            {item.content && (
              <>
                <hr />
                <h6>Treść</h6>
                <p className="mb-0">{item.content}</p>
              </>
            )}

            {scans.length > 0 && (
              <>
                <hr />
                <h6>Dokumenty / skany</h6>
                <ul className="mb-0">
                  {scans.map((s) => {
                    const url = absoluteUrl(s.image);
                    return (
                      <li key={s.id}>
                        {url ? (
                          <a href={url} target="_blank" rel="noreferrer">
                            {url}
                          </a>
                        ) : (
                          <span>plik</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </>
            )}

            <hr />
            <div className="d-flex gap-2">
              <button className="btn btn-success" onClick={handleApprove} disabled={busy}>
                Zatwierdź
              </button>
              <button className="btn btn-outline-danger" onClick={handleReject} disabled={busy}>
                Odrzuć
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
