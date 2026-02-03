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

  const [sources, setSources] = useState([]);
  const [newSource, setNewSource] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Pobranie listy wszystkich kategorii z API
    api.get("/api/categories/")
      .then((res) => setCategories(res.data))
      .catch((err) => console.error("Błąd kategorii", err));

    if (requestId) {
      api.get(`/api/requests/${requestId}/`)
        .then((res) => {
          const data = res.data;
          setTitle(data.title || "");
          setContent(data.comment || "");

          // Inicjalizacja kategorii zaznaczonych przez użytkownika w zgłoszeniu
          if (data.tags && Array.isArray(data.tags)) {
            setSelectedCategories(data.tags.map(t => t.id));
          }
          if (data.articles && data.articles.length > 0) {
            setSources(data.articles);
          }
        })
        .catch(() => setError("Nie udało się pobrać danych."))
        .finally(() => setLoading(false));
    }
  }, [requestId]);

  const handleCheckboxChange = (categoryId) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
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

    try {
      await api.post("/api/entries/", {
        title: title.trim(),
        content: content.trim(),
        is_truthful: isTruthful,
        article_urls: sources.filter(s => s !== ""),
        category_ids: selectedCategories,
        request_id: requestId
      });
      navigate("/");
    } catch (err) {
      setError(err.response?.data ? JSON.stringify(err.response.data) : "Błąd serwera.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="container py-5 text-center">Ładowanie danych...</div>;

  return (
    <div className="container py-4" style={{ maxWidth: "900px" }}>
      <h2 className="fw-bold text-uppercase mb-4">Finalizuj zgłoszenie #{requestId}</h2>

      <form onSubmit={handleSubmit} className="bg-white p-4 shadow-sm rounded">

        {/* Sekcja Kategorii z Checkboxami */}
        <div className="mb-4">
          <label className="form-label fw-bold text-muted small text-uppercase d-block">Wybierz Kategorie</label>
          <div className="d-flex flex-wrap gap-3 p-3 bg-light rounded border mb-3">
            {categories.map((cat) => (
              <div key={cat.id} className="form-check d-flex align-items-center">
                <input
                  className="form-check-input border-secondary"
                  type="checkbox"
                  id={`cat-${cat.id}`}
                  style={{ width: "1.2em", height: "1.2em", cursor: "pointer", border: "1px solid #ced4da" }}
                  checked={selectedCategories.includes(cat.id)}
                  onChange={() => handleCheckboxChange(cat.id)}
                />
                <label className="form-check-label ms-2" htmlFor={`cat-${cat.id}`} style={{ cursor: "pointer" }}>
                  {cat.name}
                </label>
              </div>
            ))}
          </div>

          {/* Dynamiczny podgląd wybranych kategorii pod spodem */}
          <label className="form-label fw-bold text-muted small text-uppercase">Wybrane:</label>
          <div className="d-flex gap-2 flex-wrap min-vh-10">
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

        {/* Tytuł */}
        <div className="mb-4">
          <label className="form-label fw-bold text-muted small text-uppercase">Tytuł</label>
          <input className="form-control bg-light" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>

        {/* Treść */}
        <div className="mb-4">
          <label className="form-label fw-bold text-muted small text-uppercase">Treść</label>
          <textarea className="form-control bg-light" rows={6} value={content} onChange={(e) => setContent(e.target.value)} required />
        </div>

        {/* Werdykt */}
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

        {/* Źródła */}
        <div className="mb-4">
          <label className="form-label fw-bold text-muted small text-uppercase">Źródła (min. 1)</label>
          <div className="d-flex gap-2 mb-3">
            <input className="form-control" placeholder="https://..." value={newSource} onChange={(e) => setNewSource(e.target.value)} />
            <button type="button" className="btn btn-outline-danger" onClick={addSource}>DODAJ</button>
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

        {error && (
          <div className="alert alert-danger small mb-4">
            {error}
          </div>
        )}

        <div className="d-flex gap-2 pt-3 border-top">
          <button type="submit" className="btn btn-dark fw-bold px-4" disabled={saving}>
            {saving ? "TWORZENIE..." : "UTWÓRZ"}
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => navigate(`/zgloszenia/${requestId}`)} // Zamiast navigate("/") lub navigate(-1)
          >
            Anuluj
          </button>
        </div>
      </form>
    </div>
  );
}