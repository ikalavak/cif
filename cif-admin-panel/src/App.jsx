// cif-admin-panel/src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./AuthContext";
import AdminRoute from "./components/AdminRoute";
import Layout from "./components/Layout";

import HomeSettings from "./pages/HomeSettings";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Events from "./pages/Events";
import Venues from "./pages/Venues";
import Categories from "./pages/Categories";
import Speakers from "./pages/Speakers";
import Gallery from "./pages/Gallery";
import Sponsors from "./pages/Sponsors";
import Announcements from "./pages/Announcements";
import Users from "./pages/Users";
import NotificationsPage from "./pages/NotificationsPage";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* 1. Public Route */}
        <Route path="/login" element={<Login />} />

        {/* 2. Protected Admin Area */}
        <Route
          element={
            <AdminRoute>
              <Layout />
            </AdminRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/events" element={<Events />} />
          <Route path="/venues" element={<Venues />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/speakers" element={<Speakers />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/sponsors" element={<Sponsors />} />
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/users" element={<Users />} />
          <Route path="/home-settings" element={<HomeSettings />} />
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/notifications" element={<NotificationsPage />} />
        </Route>

        {/* 3. Fallback Route: send unknown paths to /login to prevent redirect loops */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}
