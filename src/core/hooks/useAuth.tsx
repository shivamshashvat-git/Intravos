import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/core/lib/supabase';

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
  role: 'super_admin' | 'admin' | 'staff' | 'partner';
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
    // Initial session check
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        if (session?.user) {
          await fetchUserData(session.user.id);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        await fetchUserData(session.user.id);
      } else {
        setUser(null);
        setTenant(null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (authId: string) => {
    try {
      // Fetch user profile from public.users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authId)
        .single();

      if (userError) throw userError;
      setUser(userData);

      if (userData?.tenant_id) {
        // Fetch tenant data
        const { data: tenantData, error: tenantError } = await supabase
          .from('tenants')
          .select('*')
          .eq('id', userData.tenant_id)
          .single();

        if (tenantError) throw tenantError;
        setTenant(tenantData);
      }
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
