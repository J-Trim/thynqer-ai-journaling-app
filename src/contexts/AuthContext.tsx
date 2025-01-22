import { createContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const AuthContext = createContext<{
  isAuthenticated: boolean | null;
  isLoading: boolean;
}>({
  isAuthenticated: null,
  isLoading: true,
});

export const LoadingScreen = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-background animate-fade-in">
    <div className="space-y-4 text-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
      <div className="text-muted-foreground animate-pulse">Loading...</div>
    </div>
  </div>
);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // First, check the current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[AuthProvider] Initial session check:', session ? 'Authenticated' : 'Not authenticated');
      setIsAuthenticated(!!session);
      setIsLoading(false);
    });

    // Then set up the auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[AuthProvider] Auth state changed:', event);
      setIsAuthenticated(!!session);
      setIsLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};