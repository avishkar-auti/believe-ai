import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider.js";
import { Spinner } from "../../components/ui/Spinner.js";

export function ProtectedRoute() {
  const { firebaseUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-6 w-6 text-brand-500" />
      </div>
    );
  }

  if (!firebaseUser) return <Navigate to="/login" replace />;

  return <Outlet />;
}
