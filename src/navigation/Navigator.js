import React, { createContext, useContext, useState, useCallback } from 'react';

const NavContext = createContext(null);

export function NavigationProvider({ children }) {
  const [stack, setStack] = useState([
    { name: '__ROOT__', params: {} }
  ]);

  // Navigate forward
  const navigate = useCallback((name, params = {}) => {
    setStack(prev => [...prev, { name, params }]);
  }, []);

  // Go back
  const goBack = useCallback(() => {
    setStack(prev => {
      if (prev.length > 1) {
        return prev.slice(0, -1);
      }
      return prev;
    });
  }, []);

  // Replace current screen
  const replace = useCallback((name, params = {}) => {
    setStack(prev => {
      const newStack = [...prev];
      newStack[newStack.length - 1] = { name, params };
      return newStack;
    });
  }, []);

  // Reset navigation (IMPORTANT for login/logout)
  const reset = useCallback((name, params = {}) => {
    setStack([{ name, params }]);
  }, []);

  const current = stack[stack.length - 1];

  return (
    <NavContext.Provider
      value={{
        navigate,
        goBack,
        replace,
        reset,
        current,
        stack
      }}
    >
      {children}
    </NavContext.Provider>
  );
}

export function useNav() {
  const context = useContext(NavContext);

  if (!context) {
    throw new Error('useNav must be used inside NavigationProvider');
  }

  return context;
}