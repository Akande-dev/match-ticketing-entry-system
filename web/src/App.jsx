import { Link, Route, Routes } from 'react-router-dom';
import { useAuth } from './features/auth/AuthContext';
import ProtectedRoute from './features/auth/ProtectedRoute';
import { ROLES } from './features/auth/roles';
import LoginPage from './features/auth/LoginPage';
import RegisterPage from './features/auth/RegisterPage';
import MatchListPage from './features/matches/MatchListPage';
import MatchPage from './features/seats/MatchPage';
import CheckoutPage from './features/checkout/CheckoutPage';
import MockPayPage from './features/checkout/MockPayPage';
import MyTicketsPage from './features/tickets/MyTicketsPage';
import ScannerPage from './features/scanner/ScannerPage';
import ManagerLayout from './features/manager/ManagerLayout';
import SalesDashboardPage from './features/manager/SalesDashboardPage';
import MatchAdminPage from './features/manager/MatchAdminPage';
import MatchFormPage from './features/manager/MatchFormPage';
import RefundsPage from './features/manager/RefundsPage';
import AuditLogPage from './features/admin/AuditLogPage';

const STAFF = [ROLES.STEWARD, ROLES.ADMIN];
const MANAGERS = [ROLES.MANAGER, ROLES.ADMIN];
const guard = (el, allow) => <ProtectedRoute allow={allow}>{el}</ProtectedRoute>;

function NavBar() {
  const { user, role, logout } = useAuth();
  return (
    <nav>
      <Link to="/">Matches</Link>
      {user && <Link to="/my-tickets">My tickets</Link>}
      {STAFF.includes(role) && <Link to="/scanner">Scanner</Link>}
      {MANAGERS.includes(role) && <Link to="/manager">Manager</Link>}
      {role === ROLES.ADMIN && <Link to="/admin/audit">Audit log</Link>}
      <span className="spacer" />
      {user ? <button type="button" onClick={logout}>Log out ({user.displayName ?? user.email}, {role})</button>
            : <Link to="/login">Log in</Link>}
    </nav>
  );
}

export default function App() {
  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={<MatchListPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/matches/:matchId" element={guard(<MatchPage />)} />
        <Route path="/checkout/:orderId" element={guard(<CheckoutPage />)} />
        <Route path="/mock-pay" element={guard(<MockPayPage />)} />
        <Route path="/my-tickets" element={guard(<MyTicketsPage />)} />
        <Route path="/scanner" element={guard(<ScannerPage />, STAFF)} />
        <Route path="/manager" element={guard(<ManagerLayout />, MANAGERS)}>
          <Route index element={<SalesDashboardPage />} />
          <Route path="matches" element={<MatchAdminPage />} />
          <Route path="matches/new" element={<MatchFormPage />} />
          <Route path="matches/:matchId/edit" element={<MatchFormPage />} />
          <Route path="refunds" element={<RefundsPage />} />
        </Route>
        <Route path="/admin/audit" element={guard(<AuditLogPage />, [ROLES.ADMIN])} />
      </Routes>
    </>
  );
}
