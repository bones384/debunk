import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import useCurrentUser from "./useCurrentUser.jsx";
import { ACCESS_TOKEN, REFRESH_TOKEN, AUTH_CHANGED_EVENT } from "../constants.js";

export default function Header() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();

  const [loggedIn, setLoggedIn] = useState(
    Boolean(localStorage.getItem(ACCESS_TOKEN))
  );

  const isAuthPage = window.location.pathname === "/auth" ||
    window.location.pathname === "/login" ||
    window.location.pathname === "/register";

  useEffect(() => {
    const syncAuth = () => {
      setLoggedIn(Boolean(localStorage.getItem(ACCESS_TOKEN)));
    };

    window.addEventListener(AUTH_CHANGED_EVENT, syncAuth);
    window.addEventListener("storage", syncAuth);

    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, syncAuth);
      window.removeEventListener("storage", syncAuth);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem(ACCESS_TOKEN);
    localStorage.removeItem(REFRESH_TOKEN);
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
    navigate("/auth");
  };

  const isSuperuser = Boolean(user?.is_superuser);

  return (
    <nav className="navbar navbar-dark bg-primary sticky-top shadow-sm py-2">
      <div className="container py-0">
        <div
          className="mx-auto w-100 d-flex align-items-center py-0"
          style={{ maxWidth: 1200 }}
        >
          <Link to="/" className="navbar-brand m-0 fw-bold fs-4 lh-1 brand-debunk me-4">
            Debunk
          </Link>

          <Link
            to="/ranking"
            className="nav-link-custom me-auto"
          >
            Ranking
          </Link>

          {loggedIn ? (
            <div className="ms-auto d-flex align-items-center">
              {isSuperuser && (
                <Link
                  to="/konta"
                  className="nav-link-custom me-4"
                >
                  Konta
                </Link>
              )}

              <span className="text-white small me-2 d-flex align-items-center lh-1">
                <i className="fa-solid fa-user me-1" aria-hidden="true"></i>
                <span className="fw-bolder">{user?.username}</span>
                {isSuperuser ? (
                  <span className="fw-normal ms-2"> | administrator</span>
                ) : (
                  user?.profile?.user_type && (
                    <span className="fw-normal ms-2"> | {user.profile.user_type}</span>
                  )
                )}
              </span>

              <button
                type="button"
                className="btn btn-outline-light btn-sm py-0 px-1"
                onClick={handleLogout}
              >
                Wyloguj
              </button>
            </div>
          ) : (
            !isAuthPage && (
              <Link to="/auth" className="btn btn-outline-light btn-sm ms-auto py-0 px-2">
                Zaloguj / Zarejestruj
              </Link>
            )
          )}
        </div>
      </div>
    </nav>
  );
}
