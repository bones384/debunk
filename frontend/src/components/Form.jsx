import { useState } from "react";
import api from "../api";
import { useNavigate, Link } from "react-router-dom";
import { ACCESS_TOKEN, REFRESH_TOKEN, AUTH_CHANGED_EVENT } from "../constants.js";

function Form({ route, method, showSwitchLinks = true }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const navigate = useNavigate();
  const isLogin = method === "login";
  const title = isLogin ? "Zaloguj" : "Zarejestruj";

  const handleSubmit = async (e) => {
    setLoading(true);
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (method === "register") {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#])[A-Za-z\d@$!%*?&.#]{6,}$/;
      if (!passwordRegex.test(password)) {
        setErrorMessage("Hasło musi mieć min. 6 znaków, zawierać dużą i małą literę, cyfrę oraz znak specjalny.");
        setLoading(false);
        return;
      }
    }

    try {
      const res = await api.post(route, { username, password });

      if (method === "login") {
        localStorage.setItem(ACCESS_TOKEN, res.data.access);
        localStorage.setItem(REFRESH_TOKEN, res.data.refresh);
        window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
        navigate("/");
      } else {
        setSuccessMessage("Konto utworzone pomyślnie! Możesz się teraz zalogować.");
        setUsername("");
        setPassword("");
      }
    } catch (error) {
      console.log("Pełny błąd z serwera:", error.response?.data);

      if (error.response && error.response.status === 400) {
        const data = error.response.data;

        if (data.username && (data.username[0].includes("already exists") || data.username[0].includes("zajęta"))) {
          setErrorMessage("Wybrana nazwa użytkownika jest już zajęta.");
        } else if (data.password) {
          setErrorMessage("Błąd hasła: " + data.password[0]);
        } else {
          setErrorMessage("Niepoprawne dane. Spróbuj ponownie.");
        }
      } else if (error.response && error.response.status === 401) {
        setErrorMessage("Niepoprawna nazwa użytkownika lub hasło.");
      } else {
        setErrorMessage("Wystąpił nieoczekiwany błąd. Spróbuj później.");
      }
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

      {errorMessage && (
        <div className="text-danger small mb-3">
          {errorMessage}
        </div>
      )}

      {successMessage &&
        <div className="alert alert-success small py-2 mb-3">
          {successMessage}
        </div>
      }

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
