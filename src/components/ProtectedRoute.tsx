import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { getCurrentSession, signOutUser } from "@/lib/auth";
import { getCurrentUserProfile } from "@/lib/db";

export const ProtectedRoute = () => {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      const session = await getCurrentSession();
      if (!isMounted) {
        return;
      }

      if (!session) {
        setIsAuthenticated(false);
        setIsChecking(false);
        return;
      }

      const profile = await getCurrentUserProfile();
      if (!isMounted) {
        return;
      }

      if (profile?.is_blocked) {
        await signOutUser();
        setIsAuthenticated(false);
        setIsChecking(false);
        return;
      }

      setIsAuthenticated(true);
      setIsChecking(false);
    };

    void checkSession();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isChecking) {
    return null;
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/auth" replace />;
};
