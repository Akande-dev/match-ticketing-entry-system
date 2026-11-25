// Route guard: sends logged-out visitors to the login page and users without the right role home.

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { hasAnyRole } from './roles';

/** UX convenience only. Real enforcement is in Firestore rules and Cloud Functions. */
export default function ProtectedRoute({ allow, children }) {
  const { user, role, loading } = useAuth();
  const location = useLocation();
  if (loading) return <p>Loading…</p>;
  // Not logged in: remember the wanted page so login can return there.
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (allow && !hasAnyRole(role, allow)) return <Navigate to="/" replace />;
  return children;
}
