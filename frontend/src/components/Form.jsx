import { useState } from "react";
import api from "../api";
import { useNavigate, Link } from "react-router-dom";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants.js";

function Form({ route, method }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const isLogin = method === "login";
  const title = isLogin ? "Login" : "Register";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post(route, { username, password });

      if (isLogin) {
        localStorage.setItem(ACCESS_TOKEN, response.data.access);
        localStorage.setItem(REFRESH_TOKEN, response.data.refresh);
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
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          style={{ width: "25%" }}
        />
      </div>

      <div className="mb-3">
        <input
          className="form-control"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ width: "25%" }}
        />
      </div>

      <button className="btn btn-primary" type="submit" disabled={loading}>
        {loading ? "Please wait..." : title}
      </button>

      <p className="mt-3 mb-0">
        {isLogin ? (
          <>
            Don't have an account?{" "}
            <Link to="/register" className="btn btn-link p-0 align-baseline">
              Register
            </Link>
          </>
        ) : (
          <>
            Have an account?{" "}
            <Link to="/login" className="btn btn-link p-0 align-baseline">
              Login 
            </Link>
          </>
        )}
      </p>
    </form>
  );
}

export default Form;
