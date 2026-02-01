import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import useCurrentUser from "../components/useCurrentUser.jsx";

export default function NewEntry() {
  const navigate = useNavigate();
  const { user, loading } = useCurrentUser();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isTruthful, setIsTruthful] = useState(true);
  const [articleUrl, setArticleUrl] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get("/api/categories/")
      .then(res => setCategories(res.data))
      .catch(err => console.error("Błąd kategorii", err));
  }, []);

  const userTypeRaw = user?.profile?.user_type ?? user?.user_type ?? user?.role ?? "";
  const userType = String(userTypeRaw).toLowerCase();

  const canCreate =
    userType === "redactor" ||
    userType === "redaktor" ||
    userType === "editor" ||
    user?.is_superuser === true;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await api.post("/api/entries/", {
        title,
        content,
        is_truthful: isTruthful,
        article_url: articleUrl,
        category: category,
      });
      navigate("/");
    } catch (err) {
      setError(err?.response?.data ?? err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="container py-5 text-center">Ładowanie...</div>;

  if (!user) {
    return (
      <div className="container py-5 text-center">
        <p>Nie jesteś zalogowany.</p>
        <Link to="/auth" className="btn btn-primary btn-sm px-4">
          Zaloguj / Zarejestruj
        </Link>
      </div>
    );
  }

  if (!canCreate) {
    return (
      <div className="container py-5">
        <div className="alert alert-warning">Twoja rola nie pozwala na dodawanie wpisów.</div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h3 className="fw-bold m-0 text-uppercase">Dodaj nową weryfikację</h3>
        <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate(-1)}>Wstecz</button>
      </div>

      {error && (
        <div className="alert alert-danger shadow-sm">
          <pre className="m-0 small">{JSON.stringify(error, null, 2)}</pre>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card p-4 shadow-sm border-0">
        <div className="row">
          {/* Lewa strona - Tytuł i URL */}
          <div className="col-md-8">
            <div className="mb-3">
              <label className="form-label fw-bold small text-uppercase">Tytuł artykułu</label>
              <input
                className="form-control"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Np. Szokujące odkrycie naukowców..."
              />
            </div>
            <div className="mb-3">
              <label className="form-label fw-bold small text-uppercase">Źródło (Adres URL)</label>
              <input
                className="form-control"
                value={articleUrl}
                onChange={(e) => setArticleUrl(e.target.value)}
                placeholder="https://facebook.com/jakis-post"
              />
              <div className="form-text">To z tego adresu wyciągniemy domenę do rankingu.</div>
            </div>
          </div>

          {/* Prawa strona - Kategoria i Werdykt */}
          <div className="col-md-4">
            <div className="mb-3">
              <label className="form-label fw-bold small text-uppercase">Kategoria</label>
              <select
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                <option value="">Wybierz kategorię...</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="form-label fw-bold small text-uppercase d-block">Werdykt</label>
              <div className="btn-group w-100 shadow-sm">
                <input
                  type="radio"
                  className="btn-check"
                  name="truth"
                  id="v-true"
                  checked={isTruthful === true}
                  onChange={() => setIsTruthful(true)}
                />
                <label className="btn btn-outline-success" htmlFor="v-true">Prawda</label>

                <input
                  type="radio"
                  className="btn-check"
                  name="truth"
                  id="v-false"
                  checked={isTruthful === false}
                  onChange={() => setIsTruthful(false)}
                />
                <label className="btn btn-outline-danger" htmlFor="v-false">Fałsz</label>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label fw-bold small text-uppercase">Uzasadnienie (Treść)</label>
          <textarea
            className="form-control"
            rows={5}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            placeholder="Opisz, dlaczego ten wpis jest prawdziwy lub fałszywy..."
          />
        </div>

        <div className="d-flex gap-2 justify-content-end">
          <button className="btn btn-dark px-5 py-2 fw-bold" type="submit" disabled={saving}>
            {saving ? "Zapisywanie..." : "OPUBLIKUJ"}
          </button>
        </div>
      </form>
    </div>
  );
}