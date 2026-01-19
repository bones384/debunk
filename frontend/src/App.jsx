import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Header from "./components/Header";
import ProtectedRoute from "./components/ProtectedRoute";

import Index from "./pages/Index";
import Auth from "./pages/Auth.jsx";
import NewEntry from "./pages/NewEntry.jsx";
import EditEntry from "./pages/EditEntry.jsx";
import NotFound from "./pages/NotFound.jsx";
import Accounts from "./pages/Accounts.jsx";

function Centered({ children }) {
  return <div className="text-center">{children}</div>;
}

function Logout() {
  localStorage.clear();
  return <Navigate to="/auth" replace />;
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

                    <Route
                      path="/entries/new"
                      element={
                        <ProtectedRoute>
                          <NewEntry />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/entries/:id/edit"
                      element={
                        <ProtectedRoute>
                          <EditEntry />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/konta"
                      element={
                        <ProtectedRoute requireSuperuser>
                          <Accounts />
                        </ProtectedRoute>
                      }
                    />

                    <Route path="/logout" element={<Logout />} />
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
