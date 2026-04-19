import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/core/lib/supabase';
import { apiClient } from '@/core/lib/apiClient';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  plan: string;
  subscription_status: string;
  features_enabled: string[];
  max_seats: number;
  is_active: boolean;
}

interface AppUser {
  id: string;
  tenant_id: string;
  auth_id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'platform_manager' | 'ivobot' | 'agency_admin' | 'secondary_admin' | 'admin' | 'staff' | 'partner';
  avatar_url: string | null;
  designation: string | null;
  is_active: boolean;
}

interface AuthContextType {
  user: AppUser | null;
  tenant: Tenant | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initial session check with 5s timeout safety net
    const initAuth = async () => {
      const authPromise = (async () => {
        try {
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          setSession(currentSession);
          if (currentSession?.user) {
            await fetchUserData(currentSession.access_token);
          }
        } catch (error) {
          console.error('Inner auth initialization error:', error);
        }
      })();

      const timeoutPromise = new Promise((resolve) => 
        setTimeout(() => {
          console.warn('Auth initialization timed out after 5s');
          resolve(null);
        }, 5000)
      );

      try {
        await Promise.race([authPromise, timeoutPromise]);
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      setSession(currentSession);
      if (currentSession?.user) {
        await fetchUserData(currentSession.access_token);
      } else {
        setUser(null);
        setTenant(null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (token: string) => {
    try {
      const res = await apiClient('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error('Identity verification failed');
      const result = await res.json();
      
      const userData = result.data?.user;
      const tenantData = result.data?.tenant;

      setUser(userData || null);
      setTenant(tenantData || null);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const value = {
    user,
    tenant,
    session,
    isLoading,
    isAuthenticated: !!session?.user && !!user && !!tenant,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
