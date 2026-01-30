import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api";
import useCurrentUser from "../components/useCurrentUser.jsx";

function Index() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();

  const [entries, setEntries] = useState([]);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [entriesError, setEntriesError] = useState(null);

  // entryId -> true/false (blokuje spam klików w czasie requestu)
  const [busyById, setBusyById] = useState({});

  // --- helpers pod Twoje API ---
  const getTitleText = (entry) =>
    typeof entry?.title === "string" && entry.title.trim()
      ? entry.title
      : `Wpis #${entry?.id ?? "?"}`;

  const getBodyText = (entry) =>
    typeof entry?.content === "string" ? entry.content : "";

  const getAuthorLabel = (entry) => entry?.author?.username ?? "—";
  const getAuthorId = (entry) => entry?.author?.id ?? null;

  const getUpvotesCount = (entry) =>
    typeof entry?.upvotes_count === "number" ? entry.upvotes_count : 0;

  const getIsUpvoted = (entry) =>
    typeof entry?.user_vote === "boolean" ? entry.user_vote : false;

  // --- role / uprawnienia ---
  const userTypeRaw = user?.profile?.user_type ?? user?.user_type ?? user?.role ?? "";
  const userType = String(userTypeRaw).toLowerCase();

  const isAdmin =  user?.is_superuser === true;
  const isRedactor =
    userType === "redactor" ||
    userType === "redaktor" ||
    userType === "editor" ||
    user?.is_superuser === true;

  // create tylko redactor
  const canCreateEntry = !!user && isRedactor && !isAdmin;

  const canEditEntry = (entry) => {
    if (!user) return false;
    const authorId = getAuthorId(entry);
    return typeof user?.id === "number" && typeof authorId === "number"
      ? user.id === authorId
      : false;
  };

  // delete tylko admin
  const canDeleteEntry = () => !!user && isAdmin;

  // --- fetch entries (ZAWSZE, bez względu na login) ---
  useEffect(() => {
    const fetchEntries = async () => {
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
    navigate("/entries/new");
  };

  const handleEdit = (id) => {
    navigate(`/entries/${id}/edit`);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Usunąć ten wpis?")) return;

    try {
      await api.delete(`/api/entries/${id}/`);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch (e) {
      alert(
        "Nie udało się usunąć:\n" +
        JSON.stringify(e?.response?.data ?? e.message, null, 2)
      );
    }
  };

  const toggleUpvote = async (entry) => {
  if (!user) {
    navigate("/auth"); // Jeśli nie ma usera, przenieś go do logowania
    return;
  }

    const id = entry?.id;
    if (!id) return;
    if (busyById[id]) return;

    const wasUpvoted = getIsUpvoted(entry);
    const prevCount = getUpvotesCount(entry);

    const nextUpvoted = !wasUpvoted;
    const nextCount = Math.max(0, prevCount + (nextUpvoted ? 1 : -1));

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
      setEntries((prev) =>
        prev.map((e2) =>
          e2.id === id
            ? { ...e2, user_vote: wasUpvoted, upvotes_count: prevCount }
            : e2
        )
      );
      alert(
        "Błąd podbijania:\n" +
        JSON.stringify(e?.response?.data ?? e.message, null, 2)
      );
    } finally {
      setBusyById((m) => ({ ...m, [id]: false }));
    }
  };

  return (
    <div className="container py-4">
      <h1 className="mb-4">Witamy w Debunk</h1>

      <div className="mb-3">
        <h5 className="mb-2 text-center">Wszystkie wpisy</h5>

        {canCreateEntry && (
          <div className="d-flex justify-content-end">
            <button
              type="button"
              className="btn btn-primary btn-sm px-3 py-1"
              onClick={handleCreate}
            >
              <i className="fa-solid fa-plus me-2" aria-hidden="true"></i>
              Dodaj wpis
            </button>
          </div>
        )}
      </div>

      {entriesLoading && <div>Ładowanie wpisów...</div>}

      {entriesError && (
        <div className="alert alert-danger">
          Nie udało się wczytać wpisów:
          <pre className="m-0">{JSON.stringify(entriesError, null, 2)}</pre>
        </div>
      )}

      {!entriesLoading && !entriesError && entries.length === 0 && (
        <div className="text-muted">Brak wpisów.</div>
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

                <small className="text-muted">Autor: {getAuthorLabel(entry)}</small>

                <div className="d-flex align-items-center justify-content-between mt-auto pt-3">
                  <button
                    type="button"
                    className={`btn btn-sm px-3 py-1 ${upvoted ? "btn-success" : "btn-outline-success"
                      }`}
                    title={
                      !user
                        ? "Zaloguj się, aby podbić"
                        : upvoted
                          ? "Usuń podbicie"
                          : "Podbij"
                    }
                    disabled={!id || !!busyById[id]}
                    onClick={() => toggleUpvote(entry)}
                  >
                    {upvoted ? "✓ Podbito" : "+ Podbij"}
                    <span className="ms-2 badge text-bg-light">{count}</span>
                  </button>

                  <div className="d-flex justify-content-end gap-2">
                    {canEditEntry(entry) && (
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm px-2 py-1"
                        onClick={() => handleEdit(id)}
                      >
                        Edytuj
                      </button>
                    )}

                    {canDeleteEntry() && (
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm px-2 py-1"
                        onClick={() => handleDelete(id)}
                      >
                        <i class="fa-solid fa-trash"></i>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Index;
