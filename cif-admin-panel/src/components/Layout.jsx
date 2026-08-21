import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../AuthContext";

const NAV_GROUPS = [
  {
    label: "MAIN",
    links: [{ to: "/dashboard", label: "Dashboard" }],
  },
  {
    label: "CONTENT MANAGEMENT",
    links: [
      { to: "/events", label: "Events" },
      { to: "/venues", label: "Venues" },
      { to: "/categories", label: "Categories" },
      { to: "/speakers", label: "Speakers" },
      { to: "/gallery", label: "Gallery" },
      { to: "/sponsors", label: "Sponsors" },
      { to: "/announcements", label: "Announcements" },
      { to: "/home-settings", label: "Home Settings" },
      { to: "/notifications", label: "Notifications" },
    ],
  },
  {
    label: "USER MANAGEMENT",
    links: [{ to: "/users", label: "Users" }],
  },
];

export default function Layout() {
  const { signOut, session } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-title">CIF Admin</div>
          <div className="sidebar-subtitle">Creative Industries Festival</div>
        </div>

        <nav className="sidebar-nav">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="nav-group">
              <div className="nav-group-label">{group.label}</div>
              {group.links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    isActive ? "nav-link active" : "nav-link"
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-email">{session?.email}</div>
          <button className="btn-secondary" onClick={signOut}>
            Sign out
          </button>
        </div>
      </aside>

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
