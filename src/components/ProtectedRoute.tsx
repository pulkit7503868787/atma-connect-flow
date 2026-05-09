import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getCurrentSession, signOutUser } from "@/lib/auth";
import { getCurrentUserProfile, isProfileComplete } from "@/lib/db";

export const ProtectedRoute = () => {
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

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
        setNeedsOnboarding(false);
        setIsChecking(false);
        return;
      }

      setIsAuthenticated(true);
      setNeedsOnboarding(!isProfileComplete(profile));
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

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (needsOnboarding && location.pathname.startsWith("/app")) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
};
