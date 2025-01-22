import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState, createContext, useContext } from "react";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import AuthPage from "./pages/Auth";
import JournalList from "./pages/JournalList";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5000,
    },
  },
});

export const AuthContext = createContext<{
  isAuthenticated: boolean | null;
  isLoading: boolean;
}>({
  isAuthenticated: null,
  isLoading: true,
});

const LoadingScreen = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-background animate-fade-in">
    <div className="space-y-4 text-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
      <div className="text-muted-foreground animate-pulse">Loading...</div>
    </div>
  </div>
);

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AuthProvider] Auth state changed:', event);
      setIsAuthenticated(!!session);
      setIsLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[AuthProvider] Initial session check:', session ? 'Authenticated' : 'Not authenticated');
      setIsAuthenticated(!!session);
      setIsLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading }}>
      <div className="animate-fade-in">
        {children}
      </div>
    </AuthContext.Provider>
  );
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useContext(AuthContext);
  const location = useLocation();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <div className="animate-fade-in">{children}</div>;
};

const AppRoutes = () => {
  const { isAuthenticated, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="animate-fade-in">
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/"
          element={<Navigate to="/journal" replace />}
        />
        <Route
          path="/journal"
          element={
            <ProtectedRoute>
              <JournalList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/journal/new"
          element={
            <ProtectedRoute>
              <Index />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;