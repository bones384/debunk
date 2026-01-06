import { Link } from "react-router-dom";

export default function Header() {
  return (
    <nav className="navbar navbar-dark bg-primary sticky-top shadow-sm">
      <div className="container">
        <div
          className="mx-auto w-100 d-flex align-items-center"
          style={{ maxWidth: 900 }}
        >
          <Link to="/" className="navbar-brand m-0 fw-semibold">
            Strona główna
          </Link>

          <Link to="/login" className="btn btn-outline-light btn-sm ms-auto">
            Zaloguj
          </Link>
        </div>
      </div>
    </nav>
  );
}
