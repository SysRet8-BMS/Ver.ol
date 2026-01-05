// PrivateRoute.tsx
import { Navigate} from "react-router";
import { useAuthStore } from "./store/authStore";

interface PrivateRouteProps {
  redirectPath?: string;
  children: React.ReactNode;
}

export default function PrivateRoute({
  redirectPath = "/login",
  children,
}: PrivateRouteProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated) || localStorage.getItem('jwtToken');
  if (!isAuthenticated) {
    return <Navigate to={redirectPath} replace />;
  }

  // If children are passed, render them, else render nested routes
  return <>{children}</>;
}
