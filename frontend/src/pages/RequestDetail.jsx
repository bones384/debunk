import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";

function getFullUrl(url) {
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

  const openProtectedImage = async (fileUrl) => {
    try {
      const response = await api.get(fileUrl, { responseType: "blob" });
      
      const blobUrl = window.URL.createObjectURL(response.data);
      
      window.open(blobUrl, "_blank");
    } catch (err) {
      console.error(err);
      alert("Nie udało się otworzyć pliku. Sprawdź uprawnienia lub logowanie.");
    }
  };

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
        <div className="card shadow-sm border-0">
          <div className="card-body">
            <h5 className="card-title fw-bold text-uppercase mb-3">
              {item.title || "Prośba o status redaktora"}
            </h5>

            <div className="mb-2">
              <span className="text-muted small text-uppercase fw-bold">Użytkownik: </span>
              <span>{item.author?.username || "?"}</span>
            </div>

            <div className="mb-3">
              <span className="text-muted small text-uppercase fw-bold">Status: </span>
              <span className={item.is_accepted ? "text-success fw-bold" : "text-warning fw-bold"}>
                {item.is_accepted ? "ZAAKCEPTOWANA" : "NIEROZPATRZONA"}
              </span>
            </div>

            {item.tags?.length > 0 && (
              <div className="mb-3">
                <hr className="text-muted opacity-25" />
                <h6 className="text-uppercase small fw-bold text-muted mb-2">Kategorie</h6>
                <div className="d-flex flex-wrap gap-2">
                  {item.tags.map((t, idx) => (
                    <span key={idx} className="badge bg-secondary fw-normal">
                      {String(t)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {item.content && (
              <div className="mb-3">
                <hr className="text-muted opacity-25" />
                <h6 className="text-uppercase small fw-bold text-muted mb-2">Treść / Uzasadnienie</h6>
                <p className="mb-0 bg-light p-3 rounded">{item.content}</p>
              </div>
            )}

            {scans.length > 0 && (
              <div className="mb-4">
                <hr className="text-muted opacity-25" />
                <h6 className="text-uppercase small fw-bold text-muted mb-2">Załączone dokumenty</h6>
                <ul className="list-group">
                  {scans.map((s) => {
                    const fullUrl = getFullUrl(s.image);
                    return (
                      <li key={s.id} className="list-group-item d-flex justify-content-between align-items-center">
                        <span className="text-truncate me-3" style={{ maxWidth: "300px" }}>
                          {s.image.split("/").pop()} 
                        </span>
                        
                        <button 
                          className="btn btn-sm btn-outline-primary fw-bold"
                          onClick={() => openProtectedImage(fullUrl)}
                        >
                          <i className="fa-solid fa-eye me-2"></i> PODGLĄD
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            <hr className="mt-4 mb-3" />
            <div className="d-flex gap-2">
              <button className="btn btn-success px-4 fw-bold" onClick={handleApprove} disabled={busy}>
                ZATWIERDŹ
              </button>
              <button className="btn btn-outline-danger px-4 fw-bold" onClick={handleReject} disabled={busy}>
                ODRZUĆ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}