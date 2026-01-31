import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

const MAX_FILES = 5;
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export default function EditorRequest() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const [categories, setCategories] = useState([]); // [{id,name}]
  const [selectedTagIds, setSelectedTagIds] = useState([]);

  const [files, setFiles] = useState([]); // File[]
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadCategories() {
      setError("");
      try {
        const res = await api.get("/api/categories/");
        if (mounted) setCategories(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        setError("Nie udało się wczytać kategorii.");
      }
    }

    loadCategories();
    return () => {
      mounted = false;
    };
  }, []);

  const selectedCount = selectedTagIds.length;

  const selectedNames = useMemo(() => {
    const map = new Map(categories.map((c) => [c.id, c.name]));
    return selectedTagIds.map((id) => map.get(id)).filter(Boolean);
  }, [categories, selectedTagIds]);

  function toggleTag(id) {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function onFilesChange(e) {
    setError("");
    setSuccess("");

    const picked = Array.from(e.target.files || []);

    if (picked.length === 0) {
      setFiles([]);
      return;
    }

    if (picked.length > MAX_FILES) {
      setError(`Możesz dodać maksymalnie ${MAX_FILES} plików.`);
      setFiles([]);
      return;
    }

    for (const f of picked) {
      if (!f.type.startsWith("image/")) {
        setError("Dozwolone są tylko pliki graficzne (jpg/png/webp itd.).");
        setFiles([]);
        return;
      }
      if (f.size > MAX_FILE_SIZE_BYTES) {
        setError(`Plik "${f.name}" jest za duży. Max ${MAX_FILE_SIZE_MB}MB.`);
        setFiles([]);
        return;
      }
    }

    setFiles(picked);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const t = title.trim();
    const c = content.trim();

    if (!t) {
      setError("Podaj tytuł prośby.");
      return;
    }
    if (!c) {
      setError("Podaj treść/uzasadnienie prośby.");
      return;
    }
    if (selectedTagIds.length === 0) {
      setError("Zaznacz przynajmniej jedną kategorię.");
      return;
    }
    if (files.length === 0) {
      setError("Dodaj przynajmniej jedno zdjęcie (scan).");
      return;
    }

    const formData = new FormData();
    formData.append("title", t);
    formData.append("content", c);

    // backend: models.JSONField, DRF zwykle przyjmie JSON-string w multipart
    formData.append("tags", JSON.stringify(selectedTagIds));

    // backend serializer expects ListField(scans), więc wysyłamy wiele pól "scans"
    for (const f of files) {
      formData.append("scans", f);
    }

    setLoading(true);
    try {
      await api.post("/api/applications/", formData);
      setSuccess("Prośba została wysłana ✅");
      // możesz przekierować np. na stronę główną albo zostawić
      setTitle("");
      setContent("");
      setSelectedTagIds([]);
      setFiles([]);
      // czyścimy input file (prosty trick: nawigacja/refresh niepotrzebna)
      // opcjonalnie: navigate("/");
    } catch (e) {
      const data = e.response?.data;
      // spróbujmy wyciągnąć sensowny komunikat
      if (data) {
        if (typeof data === "string") setError(data);
        else if (data.detail) setError(String(data.detail));
        else if (data.title) setError(`Błąd tytułu: ${data.title}`);
        else if (data.content) setError(`Błąd treści: ${data.content}`);
        else if (data.tags) setError(`Błąd kategorii: ${data.tags}`);
        else if (data.scans) setError(`Błąd plików: ${data.scans}`);
        else setError("Nie udało się wysłać prośby.");
      } else {
        setError("Nie udało się wysłać prośby.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2>Prośba o status Redaktora</h2>
      <p className="text-muted">
        Wypełnij dane, wybierz kategorie i dodaj zdjęcia/dokumenty.
      </p>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Tytuł</label>
          <input
            className="form-control"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Treść / uzasadnienie</label>
          <textarea
            className="form-control"
            rows={5}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">
            Kategorie ({selectedCount} wybrane)
          </label>

          {categories.length === 0 ? (
            <p className="text-muted mb-0">Ładowanie kategorii…</p>
          ) : (
            <div className="d-flex flex-wrap gap-3">
              {categories.map((cat) => (
                <div className="form-check" key={cat.id}>
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id={`tag-${cat.id}`}
                    checked={selectedTagIds.includes(cat.id)}
                    onChange={() => toggleTag(cat.id)}
                  />
                  <label className="form-check-label" htmlFor={`tag-${cat.id}`}>
                    {cat.name}
                  </label>
                </div>
              ))}
            </div>
          )}

          {selectedNames.length > 0 && (
            <div className="mt-2">
              <small className="text-muted">
                Wybrane: {selectedNames.join(", ")}
              </small>
            </div>
          )}
        </div>

        <div className="mb-3">
          <label className="form-label">
            Zdjęcia / skany (max {MAX_FILES}, max {MAX_FILE_SIZE_MB}MB każde)
          </label>
          <input
            className="form-control"
            type="file"
            accept="image/*"
            multiple
            onChange={onFilesChange}
          />
          {files.length > 0 && (
            <div className="mt-2">
              <small className="text-muted">
                Dodane: {files.map((f) => f.name).join(", ")}
              </small>
            </div>
          )}
        </div>

        <div className="d-flex gap-2">
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Wysyłanie..." : "Wyślij prośbę"}
          </button>

          <button
            className="btn btn-outline-secondary"
            type="button"
            disabled={loading}
            onClick={() => navigate("/")}
          >
            Anuluj
          </button>
        </div>
      </form>
    </div>
  );
}
