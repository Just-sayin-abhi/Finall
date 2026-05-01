import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";

import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Dashboard from "@/pages/Dashboard";
import Onboarding from "@/pages/Onboarding";
import DoshaQuiz from "@/pages/DoshaQuiz";
import DoshaResults from "@/pages/DoshaResults";
import HealthGoals from "@/pages/HealthGoals";
import FoodList from "@/pages/FoodList";
import WellnessCheckin from "@/pages/WellnessCheckin";
import WellnessProgress from "@/pages/WellnessProgress";
import NotFound from "@/pages/not-found";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  useEffect(() => {
    if (!isLoading && !isAuthenticated) setLocation("/");
  }, [isAuthenticated, isLoading, setLocation]);
  if (isLoading || !isAuthenticated) return null;
  return <>{children}</>;
}

function GuestGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  useEffect(() => {
    if (!isLoading && isAuthenticated) setLocation("/");
  }, [isAuthenticated, isLoading, setLocation]);
  if (isLoading || isAuthenticated) return null;
  return <>{children}</>;
}

function Router() {
  const { isAuthenticated } = useAuth();

  return (
    <Switch>
      <Route path="/">
        {isAuthenticated ? <Dashboard /> : <Landing />}
      </Route>
      <Route path="/login">
        <GuestGuard><Login /></GuestGuard>
      </Route>
      <Route path="/signup">
        <GuestGuard><Signup /></GuestGuard>
      </Route>
      <Route path="/dashboard">
        <AuthGuard><Dashboard /></AuthGuard>
      </Route>
      <Route path="/onboarding">
        <AuthGuard><Onboarding /></AuthGuard>
      </Route>
      <Route path="/quiz">
        <AuthGuard><DoshaQuiz /></AuthGuard>
      </Route>
      <Route path="/results">
        <AuthGuard><DoshaResults /></AuthGuard>
      </Route>
      <Route path="/health-goals">
        <AuthGuard><HealthGoals /></AuthGuard>
      </Route>
      <Route path="/foods">
        <AuthGuard><FoodList /></AuthGuard>
      </Route>
      <Route path="/wellness-checkin">
        <AuthGuard><WellnessCheckin /></AuthGuard>
      </Route>
      <Route path="/wellness-progress">
        <AuthGuard><WellnessProgress /></AuthGuard>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
