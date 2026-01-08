import { Link, useNavigate } from "react-router-dom";
import useCurrentUser from "../components/useCurrentUser.jsx";
import { ACCESS_TOKEN, REFRESH_TOKEN, AUTH_CHANGED_EVENT } from "../constants.js";

function Index() {
  const { user, loading } = useCurrentUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem(ACCESS_TOKEN);
    localStorage.removeItem(REFRESH_TOKEN);
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
    navigate("/auth");
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Welcome to the Index Page</h1>

      {user ? (
        <>
          <h1>Welcome back, {user.username}!</h1>
          <p>User Type: {user.profile.user_type}</p>
          {user.profile.photo && <img src={user.profile.photo} alt="Profile" />}

          <button className="btn btn-link p-0" onClick={handleLogout}>
            Logout
          </button>
        </>
      ) : (
        <>
          <p>You are not logged in.</p>
          <Link to="/auth" className="btn btn-primary">
            Login / Register
          </Link>
        </>
      )}
    </div>
  );
}

export default Index;
