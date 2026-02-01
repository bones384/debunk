import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

export default function RequestsList() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      setError("");
      try {
        const res = await api.get("/api/applications/");
        if (mounted) setItems(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        setError("Nie udało się wczytać próśb.");
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const pending = useMemo(
    () => items.filter((x) => x?.is_accepted === false),
    [items]
  );

  return (
    <div>
      <h2>Prośby (nierozpatrzone)</h2>

      {error && <div className="alert alert-danger">{error}</div>}

      {!error && pending.length === 0 && (
        <p className="text-muted">Brak nierozpatrzonych próśb.</p>
      )}

      <div className="list-group">
        {pending.map((r) => (
          <Link
            key={r.id}
            to={`/prosby/${r.id}`}
            className="list-group-item list-group-item-action"
          >
            <div className="d-flex justify-content-between align-items-center">
              <strong>{r.title || `Prośba #${r.id}`}</strong>
              <span className="text-muted">{r.author?.username || ""}</span>
            </div>
            <small className="text-muted">
              {r.tags?.length ? `Kategorie: ${r.tags.join(", ")}` : "Brak kategorii"}
            </small>
          </Link>
        ))}
      </div>
    </div>
  );
}
