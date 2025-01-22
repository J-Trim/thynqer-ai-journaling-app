import { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext, LoadingScreen } from "@/contexts/AuthContext";

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

export default ProtectedRoute;