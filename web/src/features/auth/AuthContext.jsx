// Holds who is logged in and their role, and offers login, register and logout to every screen.

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut, updateProfile,
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { normaliseRole, ROLES } from './roles';

const AuthContext = createContext(null);

// Wrap the app in this so any component can call useAuth().
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(ROLES.FAN);
  const [loading, setLoading] = useState(true);

  // Runs whenever the login state changes. The role comes from the login token (a custom claim);
  // an unknown or missing role counts as 'fan'. The token is refreshed so new roles apply at login.
  useEffect(() => onAuthStateChanged(auth, async (u) => {
    if (u) {
      const token = await u.getIdTokenResult(true);
      setRole(normaliseRole(token.claims.role));
    } else {
      setRole(ROLES.FAN);
    }
    setUser(u);
    setLoading(false);
  }), []);

  const value = useMemo(() => ({
    user, role, loading,
    login: (email, password) => signInWithEmailAndPassword(auth, email, password),
    async register(name, email, password) {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
      await setDoc(doc(db, 'users', cred.user.uid), {
        name, email: cred.user.email, role: ROLES.FAN, active: true, createdAt: serverTimestamp(),
      });
    },
    logout: () => signOut(auth),
  }), [user, role, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Access to the current user, role and login functions. Must be used inside AuthProvider.
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
