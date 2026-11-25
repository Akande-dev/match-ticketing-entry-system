// Shell for the admin area: a title, a sub-navigation (Overview, Users, Audit log) and the page below it.

import { NavLink, Outlet } from 'react-router-dom';

export default function AdminLayout() {
  return (
    <main>
      <h1>Admin console</h1>
      <nav aria-label="Admin sections" className="subnav">
        <NavLink to="/admin" end>Overview</NavLink>
        <NavLink to="/admin/users">Users</NavLink>
        <NavLink to="/admin/audit">Audit log</NavLink>
      </nav>
      <Outlet />
    </main>
  );
}
