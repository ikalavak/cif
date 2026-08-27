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
import Categories from "./pages/Categories";
import Gallery from "./pages/Gallery";
import Users from "./pages/Users";
import NotificationsPage from "./pages/NotificationsPage";
import AdminRolesManager from "./pages/AdminRolesManager";
import ForumModeration from "./pages/ForumModeration";
import CampusMaps from "./pages/CampusMaps"; // <-- Ensure imported

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Protected Dashboard Layout (Contains Sidebar + <Outlet />) */}
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
          <Route path="/campus-maps" element={<CampusMaps />} />{" "}
          {/* <-- MUST BE INSIDE HERE */}
          <Route path="/categories" element={<Categories />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/forum-moderation" element={<ForumModeration />} />
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
