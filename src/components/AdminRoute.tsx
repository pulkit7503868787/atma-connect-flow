import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { checkIsAdmin } from "@/lib/admin";

export const AdminRoute = () => {
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      const ok = await checkIsAdmin();
      if (mounted) {
        setAllowed(ok);
      }
    };

    void run();

    return () => {
      mounted = false;
    };
  }, []);

  if (allowed === null) {
    return null;
  }

  return allowed ? <Outlet /> : <Navigate to="/app" replace />;
};
