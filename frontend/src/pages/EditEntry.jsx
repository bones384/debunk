import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../api";
import useCurrentUser from "../components/useCurrentUser.jsx";

export default function EditEntry() {
  const navigate = useNavigate();
  const { id } = useParams(); // /entries/:id/edit :contentReference[oaicite:4]{index=4}
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

  if (loading) return <div>Loading...</div>;

  if (!user) {
    return (
      <div>
        <p>You are not logged in.</p>
        <Link to="/auth" className="btn btn-primary">
          Login / Register
        </Link>
      </div>
    );
  }

  if (entryLoading) return <div>Loading entry...</div>;

  if (entryError) {
    return (
      <div className="alert alert-danger">
        Failed to load entry:
        <pre className="m-0">{JSON.stringify(entryError, null, 2)}</pre>
      </div>
    );
  }

  return (
    <div className="container py-2">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h3 className="m-0">Edit entry #{id}</h3>
        <button className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
          Back
        </button>
      </div>

      {error && (
        <div className="alert alert-danger">
          <pre className="m-0">{JSON.stringify(error, null, 2)}</pre>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Title</label>
          <input
            className="form-control"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={200}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Content</label>
          <textarea
            className="form-control"
            rows={6}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
        </div>

        <div className="form-check mb-4">
          <input
            className="form-check-input"
            type="checkbox"
            checked={isTruthful}
            onChange={(e) => setIsTruthful(e.target.checked)}
            id="isTruthful"
          />
          <label className="form-check-label" htmlFor="isTruthful">
            Mark as truthful
          </label>
        </div>

        <div className="d-flex gap-2">
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </button>
          <button
            className="btn btn-outline-secondary"
            type="button"
            onClick={() => navigate("/")}
            disabled={saving}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
