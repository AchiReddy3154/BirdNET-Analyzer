import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import Home from "@/pages/home";
import LoginPage from "@/pages/login";
import HistoryList from "@/pages/history/index";
import HistoryDetail from "@/pages/history/detail";
import Stats from "@/pages/stats";
import NotFound from "@/pages/not-found";
import { ThemeProvider } from "next-themes";
import { AnimatePresence, motion } from "framer-motion";
import { AuthProvider, useAuth } from "@/context/auth";
import { AnalysisProvider } from "@/context/analysis";

const queryClient = new QueryClient();

function AnimatedRoutes() {
  const [location] = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className="flex-1 flex flex-col"
      >
        <Switch location={location}>
          <Route path="/" component={Home} />
          <Route path="/history" component={HistoryList} />
          <Route path="/history/:id" component={HistoryDetail} />
          <Route path="/stats" component={Stats} />
          <Route component={NotFound} />
        </Switch>
      </motion.div>
    </AnimatePresence>
  );
}

function AppShell() {
  const [location, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated && location !== "/login") {
      setLocation("/login");
      return;
    }

    if (isAuthenticated && location === "/login") {
      setLocation("/");
      return;
    }

  }, [isAuthenticated, location, setLocation]);

  if (!isAuthenticated && location !== "/login") {
    return null;
  }

  if (isAuthenticated && location === "/login") {
    return null;
  }

  if (location === "/login") {
    return <LoginPage />;
  }

  return (
    <Layout>
      <AnimatedRoutes />
    </Layout>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <AuthProvider>
        <AnalysisProvider>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "") }>
                <AppShell />
              </WouterRouter>
              <Toaster />
            </TooltipProvider>
          </QueryClientProvider>
        </AnalysisProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
