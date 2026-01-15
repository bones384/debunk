import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api";
import useCurrentUser from "../components/useCurrentUser.jsx";

function Index() {
  const navigate = useNavigate();
  const { user, loading } = useCurrentUser();

  const [entries, setEntries] = useState([]);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [entriesError, setEntriesError] = useState(null);

  // entryId -> true/false (blokuje spam klików w czasie requestu)
  const [busyById, setBusyById] = useState({});

  // --- helpers pod Twoje API ---
  const getTitleText = (entry) =>
    typeof entry?.title === "string" && entry.title.trim()
      ? entry.title
      : `Entry #${entry?.id ?? "?"}`;

  const getBodyText = (entry) =>
    typeof entry?.content === "string" ? entry.content : "";

  const getAuthorLabel = (entry) => entry?.author?.username ?? "—";
  const getAuthorId = (entry) => entry?.author?.id ?? null;

  const getUpvotesCount = (entry) =>
    typeof entry?.upvotes_count === "number" ? entry.upvotes_count : 0;

  const getIsUpvoted = (entry) =>
    typeof entry?.user_vote === "boolean" ? entry.user_vote : false;

  // --- role / uprawnienia ---
  // minimalnie bardziej odporne na różne formaty /api/users/me/
  const userTypeRaw = user?.profile?.user_type ?? user?.user_type ?? user?.role ?? "";
  const userType = String(userTypeRaw).toLowerCase();

  const isAdmin = userType === "admin" || user?.is_superuser === true;
  const isRedactor =
    userType === "redactor" ||
    userType === "redaktor" ||
    userType === "editor" ||
    user?.is_staff === true;

  const canCreateEntry = isAdmin || isRedactor;

  const canEditEntry = (entry) => {
    if (!user) return false;
    const authorId = getAuthorId(entry);
    return typeof user?.id === "number" && typeof authorId === "number"
      ? user.id === authorId
      : false;
  };

  // ✅ ZMIANA #1: delete tylko admin
  const canDeleteEntry = () => !!user && isAdmin;

  useEffect(() => {
    const fetchEntries = async () => {
      if (!user) {
        setEntries([]);
        return;
      }

      setEntriesLoading(true);
      setEntriesError(null);

      try {
        const res = await api.get("/api/entries/");
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

  // --- akcje ---
  const handleCreate = () => {
    // nawigacja programowa react-router
    navigate("/entries/new");
  };

  const handleEdit = (id) => {
    navigate(`/entries/${id}/edit`);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this entry?")) return;

    try {
      await api.delete(`/api/entries/${id}/`);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch (e) {
      alert(
        "Failed to delete:\n" +
        JSON.stringify(e?.response?.data ?? e.message, null, 2)
      );
    }
  };

  const toggleUpvote = async (entry) => {
    const id = entry?.id;
    if (!id) return;
    if (busyById[id]) return;

    const wasUpvoted = getIsUpvoted(entry);
    const prevCount = getUpvotesCount(entry);

    const nextUpvoted = !wasUpvoted;
    const nextCount = Math.max(0, prevCount + (nextUpvoted ? 1 : -1));

    // optimistic update: UI od razu się przełącza
    setBusyById((m) => ({ ...m, [id]: true }));
    setEntries((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, user_vote: nextUpvoted, upvotes_count: nextCount } : e
      )
    );

    try {
      if (nextUpvoted) {
        await api.post(`/api/entries/${id}/upvote/`);
      } else {
        await api.delete(`/api/entries/${id}/upvote/`);
      }
    } catch (e) {
      // rollback
      setEntries((prev) =>
        prev.map((e2) =>
          e2.id === id
            ? { ...e2, user_vote: wasUpvoted, upvotes_count: prevCount }
            : e2
        )
      );
      alert("Upvote failed:\n" + JSON.stringify(e?.response?.data ?? e.message, null, 2));
    } finally {
      setBusyById((m) => ({ ...m, [id]: false }));
    }
  };

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
          <div className="mb-4 d-flex align-items-center justify-content-between">
            <div>
              <h5 className="mb-0">All entries</h5>
              <small className="text-muted">
                Logged in as <strong>{user.username}</strong>
              </small>
            </div>

            {/* Przycisk ZAWSZE widoczny, tylko disabled gdy brak uprawnień */}
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleCreate}
              disabled={!canCreateEntry}
              title={!canCreateEntry ? `No permission (role: ${userTypeRaw || "?"})` : ""}
            >
              <i className="fa-solid fa-plus me-2" aria-hidden="true"></i>
              Add new entry
            </button>
          </div>

          {entriesLoading && <div>Loading entries...</div>}

          {entriesError && (
            <div className="alert alert-danger">
              Failed to load entries:
              <pre className="m-0">{JSON.stringify(entriesError, null, 2)}</pre>
            </div>
          )}

          {!entriesLoading && !entriesError && entries.length === 0 && (
            <div className="text-muted">No entries yet.</div>
          )}

          <div className="d-grid gap-3">
            {entries.map((entry) => {
              const id = entry.id;
              const upvoted = getIsUpvoted(entry);
              const count = getUpvotesCount(entry);

              return (
                <div
                  className="card shadow-sm border border-2 border-secondary border-opacity-25"
                  key={id}
                >
                  <div className="card-body d-flex flex-column">
                    <h5 className="card-title mb-2">{getTitleText(entry)}</h5>

                    <p className="card-text mb-2">{getBodyText(entry)}</p>

                    <small className="text-muted">Author: {getAuthorLabel(entry)}</small>

                    <div className="d-flex align-items-center justify-content-between mt-auto pt-3">
                      <button
                        type="button"
                        className={`btn btn-sm ${upvoted ? "btn-success" : "btn-outline-success"
                          }`}
                        title={upvoted ? "Remove upvote" : "Upvote"}
                        disabled={!id || !!busyById[id]}
                        onClick={() => toggleUpvote(entry)}
                      >
                        {upvoted ? "✓ Upvoted" : "+ Upvote"}
                        <span className="ms-2 badge text-bg-light">{count}</span>
                      </button>

                      <div className="d-flex justify-content-end gap-2">
                        {canEditEntry(entry) && (
                          <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => handleEdit(id)}
                          >
                            Edit
                          </button>
                        )}

                        {/* ✅ ZMIANA #2: render delete tylko admin */}
                        {canDeleteEntry() && (
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => handleDelete(id)}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default Index;
