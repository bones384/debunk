import { useState } from "react";
import api from "../api";
import { useNavigate, Link } from "react-router-dom";
import { ACCESS_TOKEN, REFRESH_TOKEN, AUTH_CHANGED_EVENT } from "../constants.js";

function Form({ route, method, showSwitchLinks = true }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const isLogin = method === "login";
  const title = isLogin ? "Zaloguj" : "Zarejestruj";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post(route, { username, password });

      if (isLogin) {
        localStorage.setItem(ACCESS_TOKEN, response.data.access);
        localStorage.setItem(REFRESH_TOKEN, response.data.refresh);

        window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
        navigate("/");
      } else {
        alert("Registration successful! You can now log in.");
        navigate("/login");
      }
    } catch (error) {
      alert(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="text-start">
      <h1 className="mb-4">{title}</h1>

      <div className="mb-3">
        <input
          className="form-control"
          type="text"
          placeholder="Nazwa użytkownika"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </div>

      <div className="mb-3">
        <input
          className="form-control"
          type="password"
          placeholder="Hasło"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <button className="btn btn-primary" type="submit" disabled={loading}>
        {loading ? "Please wait..." : title}
      </button>

      {showSwitchLinks && (
        <p className="mt-3 mb-0">
          {isLogin ? (
            <>
              Nie posiadasz konta?{" "}
              <Link to="/register" className="btn btn-link p-0 align-baseline">
                Zarejestruj
              </Link>
            </>
          ) : (
            <>
              Masz już konto?{" "}
              <Link to="/login" className="btn btn-link p-0 align-baseline">
                Zaloguj
              </Link>
            </>
          )}
        </p>
      )}
    </form>
  );
}

export default Form;
