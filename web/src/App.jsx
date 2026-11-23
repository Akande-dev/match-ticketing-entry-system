import { Link, NavLink, Route, Routes } from 'react-router-dom';
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
    <>
      <div className="topbar"><b>Official tickets</b> · Instant QR entry · Refunds and ticket transfers · Football, basketball, volleyball, table tennis, boxing</div>
      <nav className="site-nav">
        <div className="wrap">
          <Link to="/" className="brand">MATCH TICKETING<small>BUY. SCAN. ENTER.</small></Link>
          <div className="nav-links">
            <NavLink to="/" end>Events</NavLink>
            {user && <NavLink to="/my-tickets">My tickets</NavLink>}
            {STAFF.includes(role) && <NavLink to="/scanner">Scanner</NavLink>}
            {MANAGERS.includes(role) && <NavLink to="/manager">Manager</NavLink>}
            {role === ROLES.ADMIN && <NavLink to="/admin/audit">Audit log</NavLink>}
          </div>
          {user ? (
            <button type="button" className="btn btn-navy" onClick={logout}>Log out ({user.displayName ?? user.email}, {role})</button>
          ) : (
            <span className="nav-auth"><Link to="/register">Register</Link><Link to="/login" className="btn btn-navy">Log in</Link></span>
          )}
        </div>
      </nav>
    </>
  );
}

function Footer() {
  const { user, role } = useAuth();
  return (
    <footer className="site-footer">
      <div className="wrap footer-grid">
        <div>
          <div className="brand brand-light">MATCH TICKETING<small>BUY. SCAN. ENTER.</small></div>
          <p>Buy tickets for your favourite sports, get a signed QR ticket on your phone, and walk straight in.</p>
        </div>
        <div>
          <h4>Quick links</h4>
          <Link to="/">Events</Link>
          {user ? <Link to="/my-tickets">My tickets</Link> : <Link to="/login">Log in</Link>}
          {!user && <Link to="/register">Register</Link>}
        </div>
        <div>
          <h4>How it works</h4>
          <p>1. Choose an event and your seats.</p>
          <p>2. Pay within 10 minutes.</p>
          <p>3. Show your QR code at the gate.</p>
        </div>
        <div>
          <h4>Staff</h4>
          {STAFF.includes(role) ? <Link to="/scanner">Gate scanner</Link> : <p>Stewards scan tickets at the gate.</p>}
          {MANAGERS.includes(role) ? <Link to="/manager">Manager console</Link> : <p>Managers run events and refunds.</p>}
        </div>
      </div>
      <div className="footer-bottom">&copy; 2026 Match Ticketing and Stadium Entry System. Academic project, demo data only.</div>
    </footer>
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
      <Footer />
    </>
  );
}
