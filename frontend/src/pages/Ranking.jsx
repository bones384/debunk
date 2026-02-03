import { useEffect, useState } from "react";
import api from "../api";

function Ranking() {
  const [rankedEntries, setRankedEntries] = useState([]);
  const [rankedDomains, setRankedDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("domains");

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        const [entriesRes, domainsRes] = await Promise.all([
          api.get("/api/entries/"),
          api.get("/api/ranking/").catch(() => ({ data: [] }))
        ]);

        const entriesData = Array.isArray(entriesRes.data) ? entriesRes.data : entriesRes.data?.results ?? [];
        const sortedEntries = entriesData.sort((a, b) => b.upvotes_count - a.upvotes_count);

        const domainsData = Array.isArray(domainsRes.data) ? domainsRes.data : domainsRes.data?.results ?? [];

        setRankedEntries(sortedEntries);
        setRankedDomains(domainsData);
      } catch (e) {
        console.error("Błąd ładowania rankingów", e);
      } finally {
        setLoading(false);
      }
    };
    fetchRankings();
  }, []);

  const renderMedal = (index) => {
    if (index === 0) return <i className="fa-solid fa-medal text-warning ms-2" style={{ fontSize: '1.2rem' }} title="Złoto"></i>;
    if (index === 1) return <i className="fa-solid fa-medal text-secondary ms-2" style={{ fontSize: '1.2rem' }} title="Srebro"></i>;
    if (index === 2) return <i className="fa-solid fa-medal ms-2" style={{ color: '#cd7f32', fontSize: '1.2rem' }} title="Brąz"></i>;
    return null;
  };

  // Pomocnik do tworzenia linku
  const formatUrl = (domain) => {
    if (!domain) return "#";
    return domain.startsWith("http") ? domain : `https://${domain}`;
  };

  if (loading) return <div className="container pt-2 text-center">Ładowanie rankingu...</div>;

  return (
    <div className="container pt-0 pb-5">
      <div className="d-flex justify-content-center" style={{ marginBottom: '70px' }}>
        <div className="p-1 bg-light rounded-pill border shadow-sm d-inline-flex" style={{ backgroundColor: '#f8f9fa' }}>
          <button
            onClick={() => setActiveTab("domains")}
            className={`btn rounded-pill px-4 py-2 fw-bold btn-sm text-uppercase transition-all ${activeTab === "domains" ? "btn-dark shadow" : "btn-light text-muted border-0"}`}
            style={{ fontSize: '0.8rem', letterSpacing: '1px' }}
          >
            Najbardziej kłamliwe domeny
          </button>
          <button
            onClick={() => setActiveTab("entries")}
            className={`btn rounded-pill px-4 py-2 fw-bold btn-sm text-uppercase transition-all ${activeTab === "entries" ? "btn-dark shadow" : "btn-light text-muted border-0"}`}
            style={{ fontSize: '0.8rem', letterSpacing: '1px' }}
          >
            Najpopularniejsze wpisy
          </button>
        </div>
      </div>

      <h2 className="text-center mb-1 fw-bold text-uppercase">
        {activeTab === "entries" ? "Ranking najpopularniejszych wpisów" : "Ranking najbardziej kłamliwych domen"}
      </h2>
      <p className="text-center text-muted mb-4 small"></p>

      <div className="card shadow-sm border-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead style={{ backgroundColor: '#e9ecef', borderBottom: '2px solid #dee2e6' }}>
              <tr style={{ color: '#495057', height: '50px' }}>
                <th style={{ width: '120px' }} className="ps-4 text-uppercase small fw-bold">Poz.</th>
                <th className="text-uppercase small fw-bold">{activeTab === "entries" ? "Tytuł wpisu i domena" : "Domena"}</th>
                <th className="text-center text-uppercase small fw-bold">
                  {activeTab === "entries" ? "Liczba podbić" : "Liczba zgłoszeń"}
                </th>
                <th className="text-end pe-4 text-uppercase small fw-bold">Data</th>
              </tr>
            </thead>
            <tbody>
              {(activeTab === "entries" ? rankedEntries : rankedDomains).map((item, index) => (
                <tr key={item.id || index}>
                  <td className="ps-4">
                    <div className="d-flex align-items-center fw-bold fs-5">
                      {index + 1}. {renderMedal(index)}
                    </div>
                  </td>
                  <td>
                    {activeTab === "entries" ? (
                      <>
                        <div className="fw-bold fs-6 text-dark">{item.title}</div>
                        <small className="text-muted d-block">{item.articles || "Brak domeny"}</small>
                      </>
                    ) : (
                      // KLIKALNA DOMENA TYLKO W RANKINGU DOMEN
                      <a 
                        href={formatUrl(item.domain)} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="fw-bold fs-6 text-dark text-uppercase text-decoration-none hover-link"
                      >
                        {item.domain} <i className="fa-solid fa-arrow-up-right-from-square ms-1 small text-muted"></i>
                      </a>
                    )}
                  </td>
                  <td className="text-center">
                    <span className={`badge rounded-pill px-3 fs-6 ${activeTab === "entries" ? "bg-primary" : "bg-danger"}`}>
                      {activeTab === "entries" ? item.upvotes_count : item.count}
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