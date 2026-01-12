import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api";
import useCurrentUser from "../components/useCurrentUser.jsx";
import { ACCESS_TOKEN } from "../constants.js";

function Index() {
  const { user, loading } = useCurrentUser();

  const [entries, setEntries] = useState([]);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [entriesError, setEntriesError] = useState(null);

  const getAuthorLabel = (entry) => {
    if (typeof entry.author_username === "string") return entry.author_username;
    if (typeof entry.author?.username === "string") return entry.author.username;
    if (typeof entry.author === "string") return entry.author;
    if (typeof entry.author === "number") return `User #${entry.author}`;
    return "—";
  };

  const getTitleText = (entry) => {
    if (typeof entry.title === "string" && entry.title.trim()) return entry.title;
    if (typeof entry.name === "string" && entry.name.trim()) return entry.name;
    return `Entry #${entry.id ?? "?"}`;
  };

  const getBodyText = (entry) => {
    const candidates = [entry.content, entry.text, entry.body];
    const firstString = candidates.find(
      (v) => typeof v === "string" && v.trim().length > 0
    );
    return firstString ?? "";
  };

  useEffect(() => {
    const fetchEntries = async () => {
      if (!user) {
        setEntries([]);
        return;
      }

      setEntriesLoading(true);
      setEntriesError(null);

      try {
        const token = localStorage.getItem(ACCESS_TOKEN);

        const res = await api.get("/api/entries/", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        const data = Array.isArray(res.data) ? res.data : res.data?.results ?? [];
        setEntries(data);
      } catch (e) {
        setEntriesError(e?.response?.data ?? e.message);
      } finally {
        setEntriesLoading(false);
      }
    };

    fetchEntries();
  }, [user]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container py-4">
      <h1 className="mb-4">Welcome to Debunk</h1>

      {!user ? (
        <>
          <p>You are not logged in.</p>
          <Link to="/auth" className="btn btn-primary">
            Login / Register
          </Link>
        </>
      ) : (
        <>
          {/* BLOK: info + przycisk "Add new entry" */}
          <div className="mb-4 d-flex align-items-center justify-content-between">
            <div>
              <h5 className="mb-0">All entries</h5>
              <small className="text-muted">
                Logged in as <strong>{user.username}</strong>
              </small>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {}}
              title="Coming soon"
            >
              <i className="fa-solid fa-plus me-2" aria-hidden="true"></i>
              Add new entry
            </button>
          </div>

          {entriesLoading && <div>Loading entries...</div>}

          {entriesError && (
            <div className="alert alert-danger">
              Failed to load entries:{" "}
              <pre className="m-0">{JSON.stringify(entriesError, null, 2)}</pre>
            </div>
          )}

          {!entriesLoading && !entriesError && entries.length === 0 && (
            <div className="text-muted">No entries yet.</div>
          )}

          <div className="d-grid gap-3">
            {entries.map((entry) => (
              <div
                className="card shadow-sm border border-2 border-secondary border-opacity-25"
                key={entry.id ?? `${entry.title}-${entry.created_at}`}
              >
                <div className="card-body d-flex flex-column">
                  <h5 className="card-title mb-2">{getTitleText(entry)}</h5>

                  <p className="card-text mb-2">{getBodyText(entry)}</p>

                  <small className="text-muted">
                    Author: {getAuthorLabel(entry)}
                  </small>

                  {/* DÓŁ KARTY: lewo "+" / prawo edit+delete */}
                  <div className="d-flex align-items-center justify-content-between mt-auto pt-3">
                    <button
                      type="button"
                      className="btn btn-outline-success btn-sm"
                      aria-label="Upvote"
                      title="Upvote"
                      onClick={() => {}}
                    >
                      +
                    </button>

                    <div className="d-flex justify-content-end gap-2">
                      <button type="button" className="btn btn-outline-secondary btn-sm">
                        Edit
                      </button>
                      <button type="button" className="btn btn-outline-danger btn-sm">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default Index;
