import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api";

export default function FinalizeRequest() {
  const [searchParams] = useSearchParams();
  const requestId = searchParams.get("requestId");
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isTruthful, setIsTruthful] = useState(true);

  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);

  const [existingArticles, setExistingArticles] = useState([]); 
  const [addedArticles, setAddedArticles] = useState([]);       
  const [tempArticle, setTempArticle] = useState("");

  const [sources, setSources] = useState([]); 
  const [newSource, setNewSource] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/api/categories/")
      .then((res) => setCategories(res.data))
      .catch((err) => console.error("Błąd kategorii", err));

    if (requestId) {
      api.get(`/api/requests/${requestId}/`)
        .then((res) => {
          const data = res.data;
          setTitle(data.title || "");
          setContent(data.content || data.comment || "");

          if (data.tags && Array.isArray(data.tags)) {
            const ids = data.tags.map(t => (typeof t === 'object' ? t.id : t));
            setSelectedCategories(ids);
          }

          if (data.articles && Array.isArray(data.articles)) {
            setExistingArticles(data.articles);
          }
        })
        .catch(() => setError("Nie udało się pobrać danych zgłoszenia."))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [requestId]);

  const handleCheckboxChange = (categoryId) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const addEditorArticle = () => {
    if (tempArticle.trim()) {
      setAddedArticles([...addedArticles, tempArticle.trim()]);
      setTempArticle("");
    }
  };
  const removeEditorArticle = (index) => {
    setAddedArticles(addedArticles.filter((_, i) => i !== index));
  };

  const addSource = () => {
    if (newSource.trim()) {
      setSources([...sources, newSource.trim()]);
      setNewSource("");
    }
  };
  const removeSource = (index) => {
    setSources(sources.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const cleanSources = sources.filter(s => s.trim() !== "");
    if (cleanSources.length === 0) {
      setError("Musisz dodać co najmniej jedno źródło weryfikacji.");
      setSaving(false);
      return;
    }
    if (selectedCategories.length === 0) {
      setError("Musisz wybrać co najmniej jedną kategorię.");
      setSaving(false);
      return;
    }

    const allArticles = [...existingArticles, ...addedArticles].filter(a => a.trim() !== "");

    try {
      await api.post("/api/entries/", {
        title: title.trim(),
        content: content.trim(),
        is_truthful: isTruthful,
        
        sources: cleanSources, 
        articles: allArticles, 
        
        tag_ids: selectedCategories,
        request_id: requestId
      });
      navigate("/");
    } catch (err) {
      if (err.response?.data) {
        setError(JSON.stringify(err.response.data));
      } else {
        setError("Błąd serwera przy tworzeniu wpisu.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="container py-5 text-center">Ładowanie danych...</div>;

  return (
    <div className="container py-4" style={{ maxWidth: "900px" }}>
      <h2 className="fw-bold text-uppercase mb-4">Finalizuj zgłoszenie #{requestId}</h2>

      <form onSubmit={handleSubmit} className="bg-white p-4 shadow-sm rounded">

        <div className="mb-4">
          <label className="form-label fw-bold text-muted small text-uppercase d-block">Wybierz Kategorie</label>
          <div className="d-flex flex-wrap gap-2 p-3 bg-light rounded border mb-3">
            {categories.map((cat) => (
              <div key={cat.id} className="form-check d-inline-flex align-items-center m-0">
                <input
                  className="form-check-input border-secondary"
                  type="checkbox"
                  id={`cat-${cat.id}`}
                  style={{ width: "1.2em", height: "1.2em", cursor: "pointer", marginTop: 0 }}
                  checked={selectedCategories.includes(cat.id)}
                  onChange={() => handleCheckboxChange(cat.id)}
                />
                <label 
                  className="form-check-label ms-2 small text-uppercase fw-bold" 
                  htmlFor={`cat-${cat.id}`} 
                  style={{ cursor: "pointer", userSelect: "none" }}
                >
                  {cat.name}
                </label>
              </div>
            ))}
          </div>

          <label className="form-label fw-bold text-muted small text-uppercase">Wybrane:</label>
          <div className="d-flex gap-2 flex-wrap">
            {selectedCategories.length > 0 ? (
              categories
                .filter(c => selectedCategories.includes(c.id))
                .map(c => (
                  <span key={c.id} className="badge bg-primary px-3 py-2 text-uppercase">
                    {c.name}
                  </span>
                ))
            ) : (
              <span className="text-muted small">Brak wybranych kategorii</span>
            )}
          </div>
        </div>

        <div className="mb-4">
          <label className="form-label fw-bold text-muted small text-uppercase">Tytuł</label>
          <input className="form-control bg-light" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>

        <div className="mb-4">
          <label className="form-label fw-bold text-muted small text-uppercase">Treść</label>
          <textarea className="form-control bg-light" rows={6} value={content} onChange={(e) => setContent(e.target.value)} required />
        </div>

        <div className="mb-4">
          <label className="form-label fw-bold text-muted small text-uppercase d-block">Werdykt</label>
          <div className="d-flex gap-4">
            <div className="form-check">
              <input className="form-check-input" type="radio" name="truth" id="true" checked={isTruthful} onChange={() => setIsTruthful(true)} />
              <label className="form-check-label" htmlFor="true">Prawdziwe</label>
            </div>
            <div className="form-check">
              <input className="form-check-input" type="radio" name="truth" id="false" checked={!isTruthful} onChange={() => setIsTruthful(false)} />
              <label className="form-check-label" htmlFor="false">Nieprawdziwe</label>
            </div>
          </div>
        </div>

        <hr className="my-5" />

        <div className="mb-5">
          <label className="form-label fw-bold text-muted small text-uppercase">
            Adresy artykułów
          </label>
          
          <div className="d-flex gap-2 mb-2">
             <input 
               className="form-control" 
               placeholder="https://..." 
               value={tempArticle} 
               onChange={(e) => setTempArticle(e.target.value)} 
             />
             <button type="button" className="btn btn-outline-secondary" onClick={addEditorArticle}>DODAJ</button>
          </div>

          <div className="list-group">
            {existingArticles.map((art, i) => (
              <div key={`orig-${i}`} className="list-group-item d-flex justify-content-between align-items-center bg-light border-0 mb-1 rounded text-muted">
                <span className="text-truncate" title="Link od zgłaszającego (nieedytowalny)">
                  <i className="fa-solid fa-lock me-2 text-secondary"></i> {art}
                </span>
              </div>
            ))}
            
            {addedArticles.map((art, i) => (
              <div key={`new-${i}`} className="list-group-item d-flex justify-content-between align-items-center bg-white border mb-1 rounded">
                <span className="text-truncate">{art}</span>
                <button type="button" className="btn btn-link text-danger p-0" onClick={() => removeEditorArticle(i)}>USUŃ</button>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="form-label fw-bold text-muted small text-uppercase">Źródła Weryfikacji (min. 1)</label>
          <div className="d-flex gap-2 mb-2">
            <input className="form-control" placeholder="https://..." value={newSource} onChange={(e) => setNewSource(e.target.value)} />
            <button type="button" className="btn btn-outline-secondary" onClick={addSource}>DODAJ</button>
          </div>
          <div className="list-group">
            {sources.map((src, index) => (
              <div key={index} className="list-group-item d-flex justify-content-between align-items-center bg-light border-0 mb-1 rounded">
                <span className="text-truncate">{src}</span>
                <button type="button" className="btn btn-link text-danger p-0" onClick={() => removeSource(index)}>USUŃ</button>
              </div>
            ))}
          </div>
        </div>

        {error && <div className="alert alert-danger small mb-4">{error}</div>}

        <div className="d-flex gap-2 pt-3 border-top">
          <button type="submit" className="btn btn-dark fw-bold px-4" disabled={saving}>
            {saving ? "TWORZENIE..." : "UTWÓRZ WPIS"}
          </button>
          <button type="button" className="btn btn-outline-secondary" onClick={() => navigate(`/zgloszenia/${requestId}`)} disabled={saving}>
            Anuluj
          </button>
        </div>
      </form>
    </div>
  );
}