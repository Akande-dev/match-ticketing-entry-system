import { NavLink, Outlet } from 'react-router-dom';

export default function ManagerLayout() {
  return (
    <main>
      <h1>Manager console</h1>
      <nav aria-label="Manager sections" className="subnav">
        <NavLink to="/manager" end>Sales</NavLink>
        <NavLink to="/manager/matches">Matches</NavLink>
        <NavLink to="/manager/refunds">Refunds</NavLink>
      </nav>
      <Outlet />
    </main>
  );
}
