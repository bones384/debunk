import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound.jsx";
import ProtectedRoute from "./components/ProtectedRoute";

function Centered({ children }) {
    return <div className="text-center">{children}</div>;
}

function Logout() {
    localStorage.clear()
    return <Navigate to="/login" />
}

function RegisterAndLogout() {
    localStorage.clear()
    return <Register />
}

function App() {

    return (
        <BrowserRouter>
            <div
                className="min-vh-100 d-flex align-items-center justify-content-center px-3"
                data-bs-theme="dark"
                style={{ backgroundColor: "#0b1220" }}
            >
                <div className="w-100" style={{ maxWidth: 900 }}>
                    <div
                        className="p-4 p-md-5 rounded-4 shadow text-light"
                        style={{ backgroundColor: "#111b2e" }}
                    >
                        <style>{`
              a { color: #9ec5fe; text-decoration: none; }
              a:hover { color: #cfe2ff; text-decoration: underline; }
            `}</style>

                        <Routes>
                            <Route path="/" element={<Centered><Index /></Centered>} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/logout" element={<Logout />} />
                            <Route path="/register" element={<RegisterAndLogout />} />
                            <Route path="*" element={<NotFound />} />
                        </Routes>
                    </div>
                </div>
            </div>
        </BrowserRouter>
    )
}

export default App
