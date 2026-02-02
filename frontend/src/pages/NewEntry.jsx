import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import useCurrentUser from "../components/useCurrentUser.jsx";

export default function NewEntry() {
  const { user } = useCurrentUser();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");

  const [articles, setArticles] = useState([""]);
  const [tags, setTags] = useState([""]);

  const [error, setError] = useState(null);

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

  const handleAddTag = () => setTags((prev) => [...prev, ""]);
  const handleTagChange = (i, val) =>
    setTags((prev) => prev.map((x, idx) => (i === idx ? val : x)));

  const handleRemoveTag = (i) =>
    setTags((prev) => prev.filter((_, idx) => idx !== i));

const handleSubmit = async (e) => {
  e.preventDefault();
  setError(null);

  // walidacje
  if (!title.trim()) {
    setError("Tytuł jest wymagany!");
    return;
  }
  const goodArticles = articles.map((a) => a.trim()).filter(Boolean);
  if (goodArticles.length === 0) {
    setError("Podaj przynajmniej jeden artykuł.");
    return;
  }
  const goodTags = tags.map((t) => t.trim()).filter(Boolean);
  if (goodTags.length === 0) {
    setError("Podaj przynajmniej jeden tag.");
    return;
  }

  try {
    const tagIds = await Promise.all(
      goodTags.map(async (name) => {
        const cleanName = name.trim().toLowerCase();

        const existing = await api.get(`/api/categories/?search=${cleanName}`);
        const found = Array.isArray(existing.data)
          ? existing.data.find((t) => t.name.toLowerCase() === cleanName)
          : existing.data?.results?.find((t) => t.name.toLowerCase() === cleanName);

        if (found?.id) return found.id;

        const created = await api.post("/api/categories/", { name: cleanName });
        return created.data.id;
      })
    );

    await api.post("/api/requests/", {
      title: title.trim(),
      comment: comment.trim(),
      articles: goodArticles,
      tag_ids: tagIds,
    });

    navigate("/zgloszenia");

  } catch (err) {
    setError(err?.response?.data ?? err.message);
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

        {/* Tagi */}
        <div className="mb-3">
          <label className="form-label">Tagi *</label>
          {tags.map((t, i) => (
            <div key={i} className="d-flex gap-2 mb-2">
              <input
                type="text"
                className="form-control"
                value={t}
                onChange={(e) => handleTagChange(i, e.target.value)}
                placeholder="np. #fake"
                required
              />
              <button
                type="button"
                className="btn btn-outline-danger"
                onClick={() => handleRemoveTag(i)}
              >
                Usuń
              </button>
            </div>
          ))}
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={handleAddTag}
          >
            Dodaj tag
          </button>
        </div>

        <button className="btn btn-primary" type="submit">
          Wyślij zgłoszenie
        </button>
      </form>
    </div>
  );
}
