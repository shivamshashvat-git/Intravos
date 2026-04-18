import { useState, useEffect } from 'react';

// In-memory state persistent across hook instances
let globalSudoToken: string | null = null;
let globalSudoExpiry: number | null = null;
let isModalOpen = false;
let resolveSudo: ((token: string | null) => void) | null = null;

const listeners = new Set<() => void>();

const notify = () => listeners.forEach(l => l());

export const useSudo = () => {
  const [token, setToken] = useState<string | null>(globalSudoToken);
  const [isOpen, setIsOpen] = useState(isModalOpen);

  useEffect(() => {
    const handleUpdate = () => {
      setToken(globalSudoToken);
      setIsOpen(isModalOpen);
    };
    listeners.add(handleUpdate);
    
    // Check for expiry
    const checkExpiry = () => {
      if (globalSudoExpiry && Date.now() > globalSudoExpiry) {
        clearSudo();
      }
    };
    const interval = setInterval(checkExpiry, 1000);

    return () => {
      listeners.delete(handleUpdate);
      clearInterval(interval);
    };
  }, []);

  const setSudo = (token: string) => {
    globalSudoToken = token;
    globalSudoExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes
    isModalOpen = false;
    if (resolveSudo) {
      resolveSudo(token);
      resolveSudo = null;
    }
    notify();
  };

  const clearSudo = () => {
    globalSudoToken = null;
    globalSudoExpiry = null;
    notify();
  };

  const requestSudo = (): Promise<string | null> => {
    if (globalSudoToken && globalSudoExpiry && Date.now() < globalSudoExpiry) {
      return Promise.resolve(globalSudoToken);
    }
    
    isModalOpen = true;
    notify();
    
    return new Promise((resolve) => {
      resolveSudo = resolve;
    });
  };

  const cancelSudo = () => {
    isModalOpen = false;
    if (resolveSudo) {
      resolveSudo(null);
      resolveSudo = null;
    }
    notify();
  };

  return {
    sudoToken: token,
    isSudoActive: !!token && !!globalSudoExpiry && Date.now() < globalSudoExpiry,
    isModalOpen: isOpen,
    requestSudo,
    setSudo,
    clearSudo,
    cancelSudo
  };
};

// Stateless helper for the interceptor
export const getActiveSudoToken = () => {
  if (globalSudoToken && globalSudoExpiry && Date.now() < globalSudoExpiry) {
    return globalSudoToken;
  }
  return null;
};

export const triggerSudoModal = (): Promise<string | null> => {
  if (isModalOpen) return new Promise((resolve) => {
    const originalResolve = resolveSudo;
    resolveSudo = (token) => {
      if (originalResolve) originalResolve(token);
      resolve(token);
    };
  });

  isModalOpen = true;
  notify();

  return new Promise((resolve) => {
    resolveSudo = resolve;
  });
};
