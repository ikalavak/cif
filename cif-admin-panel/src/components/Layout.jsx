// cif-admin-panel/src/components/Layout.jsx
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
      { to: "/bookings", label: "Bookings" },
      { to: "/events", label: "Events" },
      { to: "/opportunities", label: "Opportunities" },
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
    label: "USER & ENGAGEMENT",
    links: [
      { to: "/users", label: "Users" },
      { to: "/forum-moderation", label: "Forum Moderation" },
      { to: "/applications", label: "Job Applications" },
      { to: "/admin-roles", label: "Admin Roles", superAdminOnly: true },
    ],
  },
];

export default function Layout() {
  const { signOut, session, isSuperAdmin } = useAuth();

<<<<<<< HEAD
=======
  const NAV_GROUPS = [
    {
      label: "MAIN",
      links: [{ to: "/dashboard", label: "Dashboard" }],
    },
    {
      label: "CONTENT MANAGEMENT",
      links: [
        { to: "/events", label: "Events" },
        { to: "/opportunities", label: "Opportunities" },
        { to: "/venues", label: "Venues" },
        { to: "/categories", label: "Categories" },
        { to: "/speakers", label: "Speakers" },
        { to: "/gallery", label: "Gallery" },
        { to: "/sponsors", label: "Sponsors" },
        { to: "/announcements", label: "Announcements" },
        { to: "/home-settings", label: "Home Settings" },
        { to: "/notifications", label: "Notifications" },
        { to: "/campus-maps", label: "Campus Maps" },
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

>>>>>>> c0df7a9 (feat: implement Campus Maps management and enhance MapsScreen with real-time updates)
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

              {group.links.map((link) => {
                if (link.superAdminOnly && !isSuperAdmin) return null;

                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
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
