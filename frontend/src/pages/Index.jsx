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

  const isAdmin = user?.is_superuser === true;
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
      navigate("/auth"); 
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
      <h1 className="mb-4"></h1>

      <div className="mb-3">
        <h5 className="mb-2 text-start">Wszystkie wpisy:</h5>

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
            <div className="card shadow-sm border border-2 border-secondary border-opacity-25 mb-3" key={id} style={{ position: 'relative' }}>
              <div className="card-body d-flex flex-column p-4">

                {canDeleteEntry() && (
                  <button
                    className="btn btn-link p-0"
                    onClick={() => handleDelete(id)}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '4px',
                      fontSize: '1.2rem', 
                      color: '#dc3545',
                      zIndex: 10,
                      lineHeight: 1
                    }}
                  >
                    <i className="fa-solid fa-trash"></i>
                  </button>
                )}

                {/* 1. AUTOR */}
                <div className="text-end mb-1 pe-4">
                  <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                    Autor: {getAuthorLabel(entry)}
                  </small>
                </div>

                {/* 2. TYTUŁ*/}
                <h2 className="card-title h3 text-center fw-bold mb-3">
                  {getTitleText(entry)}
                </h2>

                {/* 3. TREŚĆ */}
                <p className="card-text text-center mb-4" style={{ fontSize: '1.1rem' }}>
                  {getBodyText(entry)}
                </p>

                {/* 3.5 KATEGORIE */}
                <div className="mb-2 text-start">
                  <span
                    className="badge rounded-pill bg-light text-secondary border"
                    style={{ fontSize: '0.7rem', fontWeight: '500', letterSpacing: '0.5px' }}
                  >
                    <i className="fa-solid fa-tag me-1" style={{ fontSize: '0.6rem' }}></i>
                    {entry?.category ? entry.category.toUpperCase() : "BRAK KATEGORII"}
                  </span>
                </div>

                {/* 4. LINKI */}
                <div className="mb-4 text-start">
                  <div className="mb-1">
                    <small className="text-muted" style={{ fontSize: '0.8rem' }}>
                      <strong>Opisywany artykuł:</strong>
                      {entry?.article_url ? (
                        <a
                          href={String(entry.article_url).includes('http') ? entry.article_url : `https://${entry.article_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ms-1 text-primary text-decoration-underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {entry.article_url}
                        </a>
                      ) : <span className="ms-1">brak</span>}
                    </small>
                  </div>

                  <div>
                    <small className="text-muted" style={{ fontSize: '0.8rem' }}>
                      <strong>Źródła:</strong>
                      {entry?.sources ? (
                        <a
                          href={String(entry.sources).includes('http') ? entry.sources : `https://${entry.sources}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ms-1 text-primary text-decoration-underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {entry.sources}
                        </a>
                      ) : <span className="ms-1">brak</span>}
                    </small>
                  </div>
                </div>

                {/* 5. STOPKA */}
                <div className="d-flex align-items-center justify-content-between mt-auto pt-3 border-top">

                  {/* PODBIJANIE */}
                  <button
                    type="button"
                    className={`btn btn-sm px-3 py-1 ${upvoted ? "btn-primary" : "btn-outline-primary"}`}
                    disabled={!id || !!busyById[id]}
                    onClick={() => toggleUpvote(entry)}
                  >
                    {upvoted ? "✓ Podbito" : "+ Podbij"}
                    <span className="ms-2 badge text-bg-light text-primary border border-primary-subtle">{count}</span>
                  </button>

                  {/* WERDYKT I EDYCJA */}
                  <div className="d-flex align-items-center gap-3">
                    <span className={`text-uppercase ${entry?.verdict === "Prawda" ? "text-success" : "text-danger"
                      }`} style={{
                        fontSize: '1.1rem',
                        fontWeight: '900',
                        letterSpacing: '1.5px'
                      }}>
                      {entry?.verdict === "Prawda" ? "Werdykt: PRAWDA" : "Werdykt: FAŁSZ"}
                    </span>

                    {canEditEntry(entry) && (
                      <button
                        className="btn btn-link btn-sm text-secondary text-decoration-none"
                        onClick={() => handleEdit(id)}
                      >
                        Edytuj
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
