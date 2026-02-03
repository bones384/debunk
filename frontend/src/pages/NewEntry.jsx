import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import useCurrentUser from "../components/useCurrentUser.jsx";

export default function NewEntry() {
  const { user } = useCurrentUser();
  const navigate = useNavigate();

  const [articles, setArticles] = useState([""]);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get("/api/categories/")
      .then((res) => setCategories(res.data))
      .catch((err) => console.error("Błąd pobierania kategorii", err));
  }, []);

  if (!user) {
    return (
      <div className="container py-5 text-center">
        <p>Musisz być zalogowany, żeby dodać zgłoszenie.</p>
      </div>
    );
  }

  // Obsługa zaznaczania checkboxów
  const handleCheckboxChange = (categoryId) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleAddArticle = () => setArticles((prev) => [...prev, ""]);
  const handleArticleChange = (i, val) =>
    setArticles((prev) => prev.map((x, idx) => (i === idx ? val : x)));

  const handleRemoveArticle = (i) =>
    setArticles((prev) => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Tytuł jest wymagany!");
      return;
    }

    if (selectedCategories.length === 0) {
      setError("Wybierz przynajmniej jedną kategorię!");
      return;
    }

    const goodArticles = articles.map((a) => a.trim()).filter(Boolean);
    if (goodArticles.length === 0) {
      setError("Podaj przynajmniej jeden artykuł.");
      return;
    }

    try {
      const payload = {
        title: title.trim(),
        content: comment.trim(),
        articles: goodArticles,
        category_ids: selectedCategories,
        tag_ids: selectedCategories, 
      };

      await api.post("/api/requests/", payload);

      const userType = (user?.profile?.user_type || "").toString().toLowerCase();
      const isEditor = ["redaktor", "editor", "redactor"].some((w) =>
        userType.includes(w)
      );
      const isSuperuser = Boolean(user?.is_superuser);

      navigate(isSuperuser || isEditor ? "/zgloszenia" : "/");
    } catch (err) {
      setError(err?.response?.data ?? err?.message);
    }
  };

  return (
    <div className="container py-4">
      <h3 className="mb-4">Dodaj nowe zgłoszenie</h3>

      {error && (
        <div className="alert alert-danger small">{JSON.stringify(error)}</div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Tytuł *</label>
          <input
            type="text"
            className="form-control"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Tytuł zgłoszenia"
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Opis (opcjonalnie)</label>
          <textarea
            className="form-control"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Opcjonalny komentarz"
          />
        </div>

        {/* Sekcja Kategorii z Checkboxami - identycznie jak w FinalizeRequest */}
        <div className="mb-4">
          <label className="form-label fw-bold text-muted small text-uppercase d-block">Wybierz Kategorie *</label>
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

          <label className="form-label fw-bold text-muted small text-uppercase">Wybrane:</label>
          <div className="d-flex gap-2 flex-wrap">
            {selectedCategories.length > 0 ? (
              categories
                .filter((c) => selectedCategories.includes(c.id))
                .map((c) => (
                  <span key={c.id} className="badge bg-primary px-3 py-2 text-uppercase">
                    {c.name}
                  </span>
                ))
            ) : (
              <span className="text-muted small">Brak wybranych kategorii</span>
            )}
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label">Adresy artykułów *</label>
          {articles.map((a, i) => (
            <div key={i} className="d-flex gap-2 mb-2">
              <input
                type="text"
                className="form-control"
                value={a}
                onChange={(e) => handleArticleChange(i, e.target.value)}
                placeholder="https://…"
                required
              />
              <button
                type="button"
                className="btn btn-outline-danger"
                onClick={() => handleRemoveArticle(i)}
              >
                Usuń
              </button>
            </div>
          ))}
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={handleAddArticle}
          >
            Dodaj artykuł
          </button>
        </div>

        <button className="btn btn-primary" type="submit">
          Wyślij zgłoszenie
        </button>
      </form>
    </div>
  );
}