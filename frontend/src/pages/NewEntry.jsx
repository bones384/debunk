import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import useCurrentUser from "../components/useCurrentUser.jsx";

export default function NewEntry() {
  const navigate = useNavigate();
  const { user, loading } = useCurrentUser();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isTruthful, setIsTruthful] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const userType = String(user?.profile?.user_type ?? "").toLowerCase();
  const canCreate = userType === "redactor" || userType === "admin";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await api.post("/api/entries/", {
        title,
        content,
        is_truthful: isTruthful,
      });
      navigate("/"); // wracasz na listę, Index pobierze wpisy na nowo
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

  if (!canCreate) {
    return (
      <div className="alert alert-warning">
        Your role does not allow creating entries.
      </div>
    );
  }

  return (
    <div className="container py-2">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h3 className="m-0">Add new entry</h3>
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
            {saving ? "Saving..." : "Create"}
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
