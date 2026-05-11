import { NavLink, useLocation } from "react-router-dom";
import { Home, Heart, Users, MessageCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/app", icon: Home, label: "Home", end: true },
  { to: "/app/matches", icon: Heart, label: "Connections" },
  { to: "/app/community", icon: Users, label: "Community" },
  { to: "/app/chat", icon: MessageCircle, label: "Chat" },
  { to: "/app/profile", icon: User, label: "Profile" },
];

export const BottomNav = () => {
  const { pathname } = useLocation();
  if (pathname.startsWith("/onboarding") || pathname === "/" || pathname.startsWith("/auth")) return null;
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border/60 bg-background/85 backdrop-blur-xl">
      <ul className="mx-auto max-w-md grid grid-cols-5 px-2 pt-2 pb-[max(env(safe-area-inset-bottom),0.5rem)]">
        {items.map(({ to, icon: Icon, label, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end as any}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1 py-2 rounded-xl transition-all",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span className={cn("p-1.5 rounded-full transition-all", isActive && "bg-primary/10")}>
                    <Icon className="h-5 w-5" strokeWidth={isActive ? 2.4 : 1.8} />
                  </span>
                  <span className="text-[10px] font-medium tracking-wide">{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
};
