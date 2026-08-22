// cif-admin-panel/src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./AuthContext";
import AdminRoute from "./components/AdminRoute";
import Layout from "./components/Layout";
import Bookings from "./pages/Bookings";
import HomeSettings from "./pages/HomeSettings";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Events from "./pages/Events";
import Opportunities from "./pages/Opportunities";
import Applications from "./pages/Applications";
import Venues from "./pages/Venues";
import Categories from "./pages/Categories";
import Speakers from "./pages/Speakers";
import Gallery from "./pages/Gallery";
import Sponsors from "./pages/Sponsors";
import Announcements from "./pages/Announcements";
import Users from "./pages/Users";
import NotificationsPage from "./pages/NotificationsPage";
import AdminRolesManager from "./pages/AdminRolesManager";
import ForumModeration from "./pages/ForumModeration"; // <-- 1. Import

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          element={
            <AdminRoute>
              <Layout />
            </AdminRoute>
          }
        >
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/events" element={<Events />} />
          <Route path="/opportunities" element={<Opportunities />} />
          <Route path="/applications" element={<Applications />} />
          <Route path="/venues" element={<Venues />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/speakers" element={<Speakers />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/sponsors" element={<Sponsors />} />
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/forum-moderation" element={<ForumModeration />} /> {/* <-- 2. Add Route */}
          <Route path="/users" element={<Users />} />
          <Route path="/admin-roles" element={<AdminRolesManager />} />
          <Route path="/home-settings" element={<HomeSettings />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route index element={<Navigate to="/dashboard" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}