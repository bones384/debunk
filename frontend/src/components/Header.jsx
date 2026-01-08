import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import useCurrentUser from "./useCurrentUser.jsx";
import { ACCESS_TOKEN, REFRESH_TOKEN, AUTH_CHANGED_EVENT } from "../constants.js";

export default function Header() {
  const navigate = useNavigate();
  const { user, loading } = useCurrentUser();

  const [loggedIn, setLoggedIn] = useState(
    Boolean(localStorage.getItem(ACCESS_TOKEN))
  );

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

  return (
    <nav className="navbar navbar-dark bg-primary sticky-top shadow-sm">
      <div className="container">
        <div
          className="mx-auto w-100 d-flex align-items-center"
          style={{ maxWidth: 900 }}
        >
          <Link to="/" className="navbar-brand m-0 fw-bold fs-3 brand-debunk">
            Debunk
          </Link>

          {loggedIn ? (
            <div className="ms-auto d-flex align-items-center">
              <span className="text-white small me-3 d-flex align-items-center">
                <i className="fa-solid fa-user me-2" aria-hidden="true"></i>

                <span className="fw-bolder">{user?.username}</span>

                {user?.profile?.user_type && (
                  <span className="fw-normal ms-2"> | {user.profile.user_type}</span>
                )}
              </span>


              <button
                type="button"
                className="btn btn-outline-light btn-sm"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          ) : (
            <Link to="/auth" className="btn btn-outline-light btn-sm ms-auto">
              Login / Register
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
