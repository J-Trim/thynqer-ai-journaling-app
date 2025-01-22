import { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext, LoadingScreen } from "@/contexts/AuthContext";
import Header from "@/components/Header";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useContext(AuthContext);
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <LoadingScreen />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="animate-fade-in">{children}</div>
    </div>
  );
};

export default ProtectedRoute;