import { useState, useEffect } from 'react';
import { AuthStore } from '../store/AuthStore';

export function useAuth() {
  const [state, setState] = useState({
    user:  AuthStore.getUser(),
    token: AuthStore.getToken(),
  });

  useEffect(() => {
    return AuthStore.subscribe(setState);
  }, []);

  return {
    user:      state.user,
    token:     state.token,
    isLoggedIn: !!state.token,
    isAdmin:   state.user?.role === 'admin',
  };
}
