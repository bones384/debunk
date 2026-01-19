import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../api";
import useCurrentUser from "../components/useCurrentUser.jsx";

export default function EditEntry() {
  const navigate = useNavigate();
  const { id } = useParams(); // /entries/:id/edit
  const { user, loading } = useCurrentUser();

  const [entryLoading, setEntryLoading] = useState(true);
  const [entryError, setEntryError] = useState(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isTruthful, setIsTruthful] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEntry = async () => {
      setEntryLoading(true);
      setEntryError(null);

      try {
        const res = await api.get(`/api/entries/${id}/`);
        const e = res.data;

        setTitle(e?.title ?? "");
        setContent(e?.content ?? "");
        setIsTruthful(!!e?.is_truthful);
      } catch (err) {
        setEntryError(err?.response?.data ?? err.message);
      } finally {
        setEntryLoading(false);
      }
    };

    if (id) fetchEntry();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await api.patch(`/api/entries/${id}/`, {
        title,
        content,
        is_truthful: isTruthful,
      });
      navigate("/");
    } catch (err) {
      setError(err?.response?.data ?? err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Ładowanie...</div>;

  if (!user) {
    return (
      <div>
        <p>Nie jesteś zalogowany.</p>
        <Link to="/auth" className="btn btn-primary btn-sm px-3 py-1">
          Zaloguj / Zarejestruj
        </Link>
      </div>
    );
  }

  if (entryLoading) return <div>Ładowanie wpisu...</div>;

  if (entryError) {
    return (
      <div className="alert alert-danger">
        Nie udało się wczytać wpisu:
        <pre className="m-0">{JSON.stringify(entryError, null, 2)}</pre>
      </div>
    );
  }

  return (
    <div className="container py-2">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h3 className="m-0">Edytuj wpis #{id}</h3>
        <button
          className="btn btn-outline-secondary btn-sm px-3 py-1"
          onClick={() => navigate(-1)}
        >
          Wstecz
        </button>
      </div>

      {error && (
        <div className="alert alert-danger">
          <pre className="m-0">{JSON.stringify(error, null, 2)}</pre>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Tytuł</label>
          <input
            className="form-control"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={200}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Treść</label>
          <textarea
            className="form-control"
            rows={6}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
        </div>

        {/* ✅ RADIO zamiast checkbox */}
        <div className="mb-4">
          <label className="form-label d-block">Prawdziwość</label>

          <div className="form-check form-check-inline">
            <input
              className="form-check-input"
              type="radio"
              name="truthfulness"
              id="truthful-yes"
              checked={isTruthful === true}
              onChange={() => setIsTruthful(true)}
            />
            <label className="form-check-label" htmlFor="truthful-yes">
              Prawdziwe
            </label>
          </div>

          <div className="form-check form-check-inline">
            <input
              className="form-check-input"
              type="radio"
              name="truthfulness"
              id="truthful-no"
              checked={isTruthful === false}
              onChange={() => setIsTruthful(false)}
            />
            <label className="form-check-label" htmlFor="truthful-no">
              Nieprawdziwe
            </label>
          </div>
        </div>

        <div className="d-flex gap-2">
          <button className="btn btn-primary btn-sm px-3 py-1" type="submit" disabled={saving}>
            {saving ? "Zapisywanie..." : "Zapisz"}
          </button>
          <button
            className="btn btn-outline-secondary btn-sm px-3 py-1"
            type="button"
            onClick={() => navigate("/")}
            disabled={saving}
          >
            Anuluj
          </button>
        </div>
      </form>
    </div>
  );
}
