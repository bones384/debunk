import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound.jsx";
import Header from "./components/Header";
import Auth from "./pages/Auth.jsx"
import NewEntry from "./pages/NewEntry.jsx";
import EditEntry from "./pages/EditEntry.jsx";


function Centered({ children }) {
  return <div className="text-center">{children}</div>;
}

function Logout() {
  localStorage.clear();
  return <Navigate to="/login" />;
}

function RegisterAndLogout() {
  localStorage.clear();
  return <Register />;
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-vh-100 d-flex flex-column bg-body-tertiary">
        <Header />

        <main className="flex-grow-1 d-flex justify-content-center px-3">
          <div className="w-100 d-flex" style={{ maxWidth: 1200 }}>
            <div className="card shadow-lg border-0 flex-grow-1 rounded-0">
              <div className="card-body p-4 p-md-5">
                <div style={{ paddingTop: "12vh" }}>
                  <Routes>
                    <Route path="/" element={<Centered><Index /></Centered>} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/entries/new" element={<NewEntry />} />
                    <Route path="/entries/:id/edit" element={<EditEntry />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/logout" element={<Logout />} />
                    <Route path="/register" element={<RegisterAndLogout />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}


export default App;
