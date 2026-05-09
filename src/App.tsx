import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import OTP from "./pages/OTP";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Matches from "./pages/Matches";
import Profile from "./pages/Profile";
import Community from "./pages/Community";
import Chat from "./pages/Chat";
import Events from "./pages/Events";
import Subscription from "./pages/Subscription";
import { AppShell } from "./components/AppShell";
<<<<<<< HEAD
import { AdminRoute } from "./components/AdminRoute";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Admin from "./pages/Admin";
=======
>>>>>>> da101e9a528a6a7e757745cde99a6b6840993682

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth/otp" element={<OTP />} />
          <Route path="/onboarding" element={<Onboarding />} />
<<<<<<< HEAD
          <Route element={<ProtectedRoute />}>
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<Admin />} />
            </Route>
            <Route path="/app" element={<AppShell />}>
              <Route index element={<Dashboard />} />
              <Route path="matches" element={<Matches />} />
              <Route path="profile" element={<Profile />} />
              <Route path="profile/:id" element={<Profile />} />
              <Route path="community" element={<Community />} />
              <Route path="chat" element={<Chat />} />
              <Route path="chat/:id" element={<Chat />} />
              <Route path="events" element={<Events />} />
              <Route path="subscription" element={<Subscription />} />
            </Route>
=======
          <Route path="/app" element={<AppShell />}>
            <Route index element={<Dashboard />} />
            <Route path="matches" element={<Matches />} />
            <Route path="profile" element={<Profile />} />
            <Route path="profile/:id" element={<Profile />} />
            <Route path="community" element={<Community />} />
            <Route path="chat" element={<Chat />} />
            <Route path="chat/:id" element={<Chat />} />
            <Route path="events" element={<Events />} />
            <Route path="subscription" element={<Subscription />} />
>>>>>>> da101e9a528a6a7e757745cde99a6b6840993682
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
