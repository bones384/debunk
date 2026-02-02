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

  // Pobierz kategorie z backendu
  useEffect(() => {
    api.get("/api/categories/")
      .then(res => setCategories(res.data))
      .catch(err => console.error("Błąd pobierania kategorii", err));
  }, []);

  if (!user) {
    return (
      <div className="container py-5 text-center">
        <p>Musisz być zalogowany, żeby dodać zgłoszenie.</p>
      </div>
    );
  }

  const handleAddArticle = () => setArticles((prev) => [...prev, ""]);
  const handleArticleChange = (i, val) =>
    setArticles((prev) => prev.map((x, idx) => (i === idx ? val : x)));

  const handleRemoveArticle = (i) =>
    setArticles((prev) => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // WALIDACJE
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
        comment: comment.trim(),
        articles: goodArticles,
        category_ids: selectedCategories,
        tag_ids: selectedCategories  // KATEGORIE traktujemy jako TAGI
      };

      console.log("sending data:", payload);

      const res = await api.post("/api/requests/", payload);

      console.log("backend response:", res.data);
      navigate("/zgloszenia");
    } catch (err) {
      console.error("SUBMIT ERROR:", err);
      setError(err?.response?.data ?? err?.message);
    }
  };

  return (
    <div className="container py-4">
      <h3 className="mb-4">Dodaj nowe zgłoszenie</h3>

      {error && (
        <div className="alert alert-danger small">
          {JSON.stringify(error)}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Tytuł */}
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

        {/* Komentarz */}
        <div className="mb-3">
          <label className="form-label">Opis (opcjonalnie)</label>
          <textarea
            className="form-control"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Opcjonalny komentarz"
          />
        </div>

        {/* Kategorie */}
        <div className="mb-3">
          <label className="form-label fw-bold">Kategorie *</label>
          <select
            className="form-select"
            multiple
            value={selectedCategories.map(String)}
            onChange={(e) =>
              setSelectedCategories(
                Array.from(e.target.selectedOptions, (o) => Number(o.value))
              )
            }
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <div className="form-text">
            Przytrzymaj Ctrl (Cmd), aby wybrać wiele kategorii.
          </div>
        </div>

        {/* Artykuły */}
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
