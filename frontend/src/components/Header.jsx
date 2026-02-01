import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import useCurrentUser from "./useCurrentUser.jsx";
import { ACCESS_TOKEN, REFRESH_TOKEN, AUTH_CHANGED_EVENT } from "../constants.js";

export default function Header() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();

  const [loggedIn, setLoggedIn] = useState(
    Boolean(localStorage.getItem(ACCESS_TOKEN))
  );

  const isAuthPage =
    window.location.pathname === "/auth" ||
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

  const userType = (user?.profile?.user_type || "").toString().toLowerCase();
  const isEditor = ["redaktor", "editor", "redactor"].some((w) =>
  userType.includes(w)
);

  const canRequestEditor = loggedIn && !isSuperuser && !isEditor;
  const canSeeRequests = loggedIn && (isSuperuser || isEditor);


  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    const onEsc = (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  return (
    <nav className="navbar navbar-dark bg-primary sticky-top shadow-sm py-2">
      <div className="container py-0">
        <div
          className="mx-auto w-100 d-flex align-items-center py-0"
          style={{ maxWidth: 1200 }}
        >
          <Link
            to="/"
            className="navbar-brand m-0 fw-bold fs-4 lh-1 brand-debunk me-4"
          >
            Debunk
          </Link>

          <Link to="/ranking" className="nav-link-custom me-auto">
            Ranking
          </Link>

          {loggedIn ? (
            <div className="ms-auto d-flex align-items-center" ref={menuRef}>
              {isSuperuser && (
                <>
                  <Link to="/prosby" className="nav-link-custom me-4">
                    Prośby
                  </Link>
                  <Link to="/konta" className="nav-link-custom me-4">
                    Konta
                  </Link>
                </>
              )}
              
              {canSeeRequests && (
  <Link to="/zgloszenia" className="nav-link-custom me-4">
    Zgłoszenia
  </Link>
)}


              <span className="text-white small me-2 d-flex align-items-center lh-1">
                <i className="fa-solid fa-user me-1" aria-hidden="true"></i>
                <span className="fw-bolder">{user?.username}</span>
                {isSuperuser ? (
                  <span className="fw-normal ms-2"> | administrator</span>
                ) : user?.profile?.user_type ? (
                  <span className="fw-normal ms-2">
                    {" "}
                    | {user.profile.user_type}
                  </span>
                ) : null}
              </span>

              <div className="position-relative">
                <button
                  type="button"
                  className="btn btn-outline-light btn-sm py-0 px-2 d-flex align-items-center"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-expanded={menuOpen}
                >
                  <i className="fa-solid fa-chevron-down" aria-hidden="true"></i>
                </button>

                {menuOpen && (
                  <div
                    className="position-absolute end-0 mt-2 bg-white rounded shadow"
                    style={{ minWidth: 240, zIndex: 2000 }}
                  >
                    {canRequestEditor && (
                      <button
                        type="button"
                        className="dropdown-item d-flex align-items-center w-100 px-3 py-2 border-0 bg-transparent text-start"
                        onClick={() => {
                          setMenuOpen(false);
                          navigate("/zgloszenia/new");
                        }}
                      >
                        <i
                          className="fa-solid fa-user-pen me-2"
                          aria-hidden="true"
                        ></i>
                        Poproś o status Redaktora
                      </button>
                    )}

                    <button
                      type="button"
                      className="dropdown-item d-flex align-items-center w-100 px-3 py-2 border-0 bg-transparent text-start"
                      onClick={() => {
                        setMenuOpen(false);
                        handleLogout();
                      }}
                    >
                      <i
                        className="fa-solid fa-right-from-bracket me-2"
                        aria-hidden="true"
                      ></i>
                      Wyloguj
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            !isAuthPage && (
              <Link
                to="/auth"
                className="btn btn-outline-light btn-sm ms-auto py-0 px-2"
              >
                Zaloguj / Zarejestruj
              </Link>
            )
          )}
        </div>
      </div>
    </nav>
  );
}
