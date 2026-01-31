import { useEffect, useState } from "react";
import api from "../api";

function Ranking() {
  const [rankedEntries, setRankedEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        const res = await api.get("/api/entries/");
        const data = Array.isArray(res.data) ? res.data : res.data?.results ?? [];
        const sorted = data.sort((a, b) => b.upvotes_count - a.upvotes_count);
        setRankedEntries(sorted);
      } catch (e) {
        console.error("Błąd ładowania rankingu", e);
      } finally {
        setLoading(false);
      }
    };
    fetchRanking();
  }, []);

  const renderMedal = (index) => {
    if (index === 0) return <i className="fa-solid fa-medal text-warning ms-2" style={{ fontSize: '1.2rem' }} title="Złoto"></i>;
    if (index === 1) return <i className="fa-solid fa-medal text-secondary ms-2" style={{ fontSize: '1.2rem' }} title="Srebro"></i>;
    if (index === 2) return <i className="fa-solid fa-medal ms-2" style={{ color: '#cd7f32', fontSize: '1.2rem' }} title="Brąz"></i>;
    return null;
  };

  if (loading) return <div className="container pt-2 text-center">Ładowanie rankingu...</div>;

  return (
    <div className="container pt-2 pb-5">
      <h2 className="text-center mb-1 fw-bold text-uppercase">
        Ranking najpopularniejszych wpisów
      </h2>
      <p className="text-center text-muted mb-4 small">
      </p>

      <div className="card shadow-sm border-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-dark">
              <tr>
                <th style={{ width: '120px' }} className="ps-4">Poz.</th>
                <th>Tytuł wpisu i domena</th>
                <th className="text-center">Liczba podbić</th>
                <th className="text-end pe-4">Data</th>
              </tr>
            </thead>
            <tbody>
              {rankedEntries.map((entry, index) => (
                <tr key={entry.id}>
                  <td className="ps-4">
                    <div className="d-flex align-items-center fw-bold fs-5">
                      {index + 1}. {renderMedal(index)}
                    </div>
                  </td>
                  <td>
                    <div className="fw-bold fs-10 text-dark">{entry.title}</div>
                    <small className="text-muted d-block">
                      {entry.article_url || "Brak domeny"}
                    </small>
                  </td>
                  <td className="text-center">
                    <span className="badge bg-primary rounded-pill px-3 fs-6">
                      {entry.upvotes_count}
                    </span>
                  </td>
                  <td className="text-end pe-4 text-muted small">
                    {new Date().toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Ranking;