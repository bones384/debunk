import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../api";
import useCurrentUser from "../components/useCurrentUser.jsx";

function toInt(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === "number") return Number.isFinite(val) ? val : null;
  const n = parseInt(String(val), 10);
  return Number.isNaN(n) ? null : n;
}

function normalizeList(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(String).map((s) => s.trim()).filter(Boolean);
  return [];
}

function pickFirstNonEmptyList(...lists) {
  for (const l of lists) {
    const arr = normalizeList(l);
    if (arr.length > 0) return arr;
  }
  return [];
}

function extractTagIds(r) {
  const direct = Array.isArray(r?.tag_ids)
    ? r.tag_ids.map(toInt).filter((x) => x !== null)
    : [];
  if (direct.length > 0) return direct;

  if (Array.isArray(r?.tags) && r.tags.length > 0) {
    const idsFromTags = r.tags
      .map((t) => {
        if (typeof t === "number") return toInt(t);
        if (typeof t === "string") return toInt(t);
        if (t && typeof t === "object") return toInt(t.id);
        return null;
      })
      .filter((x) => x !== null);

    if (idsFromTags.length > 0) return idsFromTags;
  }

  const catObj = r?.category;
  if (catObj && typeof catObj === "object" && catObj.id !== undefined) {
    const id = toInt(catObj.id);
    return id !== null ? [id] : [];
  }

  const catId = toInt(r?.category_id ?? r?.tag_id);
  return catId !== null ? [catId] : [];
}

function extractCategoryLabel(r, fallbackTagIds = []) {
  const c = r?.category ?? null;
  if (c && typeof c === "object") {
    const label = c.name ?? c.label ?? c.title ?? c.slug ?? "";
    if (label) return String(label);
  }

  if (r?.category_name) return String(r.category_name);

  if (Array.isArray(r?.tags) && r.tags.length > 0) {
    const names = r.tags
      .map((t) => {
        if (typeof t === "string") return t;
        if (typeof t === "number") return `#${t}`;
        if (t && typeof t === "object") return t.name ?? t.label ?? t.title ?? (t.id ? `#${t.id}` : "");
        return "";
      })
      .map((s) => String(s).trim())
      .filter(Boolean);

    if (names.length > 0) return names.join(", ");
  }

  if (Array.isArray(r?.tag_names) && r.tag_names.length > 0) {
    const names = r.tag_names.map(String).map((s) => s.trim()).filter(Boolean);
    if (names.length > 0) return names.join(", ");
  }

  if (Array.isArray(fallbackTagIds) && fallbackTagIds.length > 0) {
    return `ID: ${fallbackTagIds.join(", ")}`;
  }

  return "";
}

async function postEntryWithRequestFallback(basePayload, requestIdValue) {
  const variants = [
    { ...basePayload, request_id: Number(requestIdValue) },
    { ...basePayload, request: Number(requestIdValue) },
    { ...basePayload, requestId: Number(requestIdValue) },
  ];

  let lastErr = null;

  for (const p of variants) {
    try {
      return await api.post("/api/entries/", p);
    } catch (err) {
      lastErr = err;

      const isBadRequest = err?.response?.status === 400;
      if (!isBadRequest) break;

      const data = err?.response?.data;
      const text = typeof data === "string" ? data : JSON.stringify(data || {});
      const looksLikeFieldError =
        text.includes("request_id") || text.includes("request") || text.includes("requestId");

      if (!looksLikeFieldError) break;
    }
  }

  throw lastErr;
}

export default function NewEntry() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const requestId = params.get("requestId");

  const { user, loading } = useCurrentUser();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isTruthful, setIsTruthful] = useState(true);

  const [sources, setSources] = useState([""]);
  const [articles, setArticles] = useState([]);
  const [lockedArticlesCount, setLockedArticlesCount] = useState(0);

  const [categoryLabel, setCategoryLabel] = useState("");
  const [tagIds, setTagIds] = useState([]);

  const [newArticle, setNewArticle] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [loadingRequest, setLoadingRequest] = useState(false);

  const userTypeRaw = user?.profile?.user_type ?? user?.user_type ?? user?.role ?? "";
  const userType = String(userTypeRaw).toLowerCase();

  const canCreate =
    userType === "redactor" ||
    userType === "redaktor" ||
    userType === "editor" ||
    user?.is_superuser === true;

  useEffect(() => {
    if (!requestId) return;

    let mounted = true;
    setLoadingRequest(true);
    setError(null);

    api
      .get(`/api/requests/${requestId}/`)
      .then((res) => {
        if (!mounted) return;
        const r = res?.data ?? {};

        setTitle(r.title ?? "");
        setContent(r.content ?? "");

        const reqArticles = pickFirstNonEmptyList(
          r.articles,
          r.articles_to_check,
          r.articlesToCheck
        );
        setArticles(reqArticles);
        setLockedArticlesCount(reqArticles.length);

        const ids = extractTagIds(r);
        setTagIds(ids);

        const catLabel = extractCategoryLabel(r, ids);
        setCategoryLabel(catLabel ? String(catLabel) : "");
      })
      .catch(() => {
        if (mounted) setError("Nie udało się wczytać danych zgłoszenia do finalizacji.");
      })
      .finally(() => {
        if (mounted) setLoadingRequest(false);
      });

    return () => {
      mounted = false;
    };
  }, [requestId]);

  const sourcesValid = useMemo(() => {
    const cleaned = sources.map((s) => s.trim()).filter(Boolean);
    return cleaned.length >= 1 ? cleaned : null;
  }, [sources]);

  const addArticle = () => {
    const a = newArticle.trim();
    if (!a) return;
    setArticles((prev) => {
      if (prev.includes(a)) return prev;
      return [...prev, a];
    });
    setNewArticle("");
  };

  const removeArticle = (idx) => {
    if (requestId && idx < lockedArticlesCount) return;
    setArticles((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateSource = (idx, val) => {
    setSources((prev) => prev.map((s, i) => (i === idx ? val : s)));
  };

  const addSource = () => setSources((prev) => [...prev, ""]);
  const removeSource = (idx) => {
    setSources((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!sourcesValid) {
      setError("Dodaj co najmniej 1 źródło.");
      return;
    }

    if (requestId && (!Array.isArray(tagIds) || tagIds.length === 0)) {
      setError("Brak tag_ids (nie udało się odczytać kategorii/tagów ze zgłoszenia).");
      return;
    }

    setSaving(true);

    try {
      const cleanedArticles = articles.map((a) => a.trim()).filter(Boolean);

      const payload = {
        title,
        content,
        is_truthful: isTruthful,
        sources: sourcesValid,
      };

      if (requestId) payload.tag_ids = tagIds;

      if (cleanedArticles.length > 0) payload.articles = cleanedArticles;

      if (requestId) {
        await postEntryWithRequestFallback(payload, requestId);
      } else {
        await api.post("/api/entries/", payload);
      }

      navigate(requestId ? "/zgloszenia/mine" : "/");
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

  if (!canCreate) {
    return <div className="alert alert-warning">Twoja rola nie pozwala na dodawanie wpisów.</div>;
  }

  return (
    <div className="container py-2">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h3 className="m-0">
          {requestId ? `Finalizuj zgłoszenie #${requestId}` : "Dodaj nowy wpis"}
        </h3>
        <button className="btn btn-outline-secondary btn-sm px-3 py-1" onClick={() => navigate(-1)}>
          Wstecz
        </button>
      </div>

      {loadingRequest && <div className="text-muted mb-3">Ładowanie danych zgłoszenia…</div>}

      {error && (
        <div className="alert alert-danger">
          <pre className="m-0">{JSON.stringify(error, null, 2)}</pre>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {requestId && (
          <div className="mb-3">
            <label className="form-label">Kategoria</label>
            <input className="form-control" value={categoryLabel || "-"} disabled readOnly />
            {Array.isArray(tagIds) && tagIds.length > 0 && (
              <div className="text-muted small mt-1">tag_ids: {tagIds.join(", ")}</div>
            )}
          </div>
        )}

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

        <div className="mb-4">
          <label className="form-label d-block">Werdykt</label>

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

        <div className="mb-4">
          <label className="form-label d-block">Adresy artykułów (opcjonalnie)</label>

          {articles.length > 0 && (
            <ul className="list-group mb-2">
              {articles.map((a, idx) => {
                const locked = Boolean(requestId) && idx < lockedArticlesCount;
                return (
                  <li key={`${a}-${idx}`} className="list-group-item d-flex justify-content-between">
                    <span>{a}</span>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => removeArticle(idx)}
                      disabled={locked}
                      title={locked ? "Nie można usuwać artykułów ze zgłoszenia" : "Usuń"}
                    >
                      Usuń
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="d-flex gap-2">
            <input
              className="form-control"
              value={newArticle}
              onChange={(e) => setNewArticle(e.target.value)}
              placeholder="https://..."
            />
            <button type="button" className="btn btn-outline-dark" onClick={addArticle}>
              Dodaj
            </button>
          </div>
        </div>

        <div className="mb-4">
          <label className="form-label d-block">Źródła (min. 1)</label>

          {sources.map((s, idx) => (
            <div className="d-flex gap-2 mb-2" key={idx}>
              <input
                className="form-control"
                value={s}
                onChange={(e) => updateSource(idx, e.target.value)}
                placeholder="np. https://..."
                required={idx === 0}
              />
              <button
                type="button"
                className="btn btn-outline-danger"
                onClick={() => removeSource(idx)}
                disabled={sources.length <= 1}
              >
                Usuń
              </button>
            </div>
          ))}

          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={addSource}>
            Dodaj źródło
          </button>
        </div>

        <div className="d-flex gap-2">
          <button className="btn btn-primary btn-sm px-3 py-1" type="submit" disabled={saving}>
            {saving ? "Zapisywanie..." : "Utwórz"}
          </button>
          <button
            className="btn btn-outline-secondary btn-sm px-3 py-1"
            type="button"
            onClick={() => navigate(requestId ? "/zgloszenia/mine" : "/")}
            disabled={saving}
          >
            Anuluj
          </button>
        </div>
      </form>
    </div>
  );
}
