// cif-admin-panel/src/components/Layout.jsx
import React, { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function Layout() {
  const { signOut, session, isSuperAdmin } = useAuth();

  // State to manage the mobile sidebar drawer
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const NAV_GROUPS = [
    {
      label: "MAIN",
      links: [{ to: "/dashboard", label: "Dashboard" }],
    },
    {
      label: "CONTENT MANAGEMENT",
      links: [
        { to: "/events", label: "Events" },
        { to: "/bookings", label: "Bookings" },
        { to: "/opportunities", label: "Opportunities" },
        { to: "/campus-maps", label: "Campus Maps" },
        { to: "/categories", label: "Categories" },
        { to: "/gallery", label: "Gallery" },
        { to: "/home-settings", label: "Home Settings" },
        { to: "/notifications", label: "Notifications" },
      ],
    },
    {
      label: "USER & ENGAGEMENT",
      links: [
        { to: "/users", label: "Users" },
        { to: "/forum-moderation", label: "Forum Moderation" },
        { to: "/applications", label: "Job Applications" },
        { to: "/admin-roles", label: "Admin Roles", superAdminOnly: true },
      ],
    },
  ];

  return (
    <div className="app-shell">
      {/* 1. MOBILE HEADER - Only visible on small screens */}
      <div className="mobile-header">
        <button
          className="hamburger-btn"
          onClick={() => setIsMobileMenuOpen(true)}
        >
          ☰
        </button>
        <div className="mobile-header-title">CIF Admin</div>
      </div>

      {/* 2. MOBILE OVERLAY - Click outside the sidebar to close it */}
      {isMobileMenuOpen && (
        <div className="sidebar-overlay" onClick={closeMobileMenu}></div>
      )}

      {/* 3. SIDEBAR - Toggles the 'open' class dynamically */}
      <aside className={`sidebar ${isMobileMenuOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-title">CIF Admin</div>
          <div className="sidebar-subtitle">Creative Industries Festival</div>
        </div>

        <nav className="sidebar-nav">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="nav-group">
              <div className="nav-group-label">{group.label}</div>
              {group.links.map((link) => {
                if (link.superAdminOnly && !isSuperAdmin) return null;
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={closeMobileMenu} // Auto-close drawer on navigation
                    className={({ isActive }) =>
                      isActive ? "nav-link active" : "nav-link"
                    }
                  >
                    {link.label}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-email">{session?.email}</div>
          <button className="btn-signout" onClick={signOut}>
            Sign out
          </button>
        </div>
      </aside>

      <main className="content">
        <div className="max-width-wrapper">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
