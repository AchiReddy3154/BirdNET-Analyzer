import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Bird, Activity, History, BarChart3, Sun, Moon, LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { useAuth } from "@/context/auth";
import { useAnalysisSession } from "@/context/analysis";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { theme, setTheme } = useTheme();
  const { username, logout } = useAuth();
  const { clearSession } = useAnalysisSession();
  const isAnalyzePage = location === "/";

  const navItems = [
    { href: "/", label: "Analyze", icon: Activity },
    { href: "/history", label: "History", icon: History },
    { href: "/stats", label: "Stats", icon: BarChart3 },
  ];

  const handleLogout = () => {
    clearSession();
    logout();
    setLocation("/login");
  };

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col relative overflow-hidden font-sans">

      {/* Background ambient glow */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-15%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px] animate-pulse" style={{ animationDuration: "9s" }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-secondary/10 blur-[140px] animate-pulse" style={{ animationDuration: "13s", animationDelay: "3s" }} />
      </div>

      {/* Desktop Header */}
      <header className="hidden sm:block border-b border-border/50 bg-card/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
              <Bird className="w-5 h-5" />
            </div>
            <span className="font-serif text-xl font-bold tracking-tight text-foreground">BirdNET</span>
          </Link>

          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));

              return (
                <motion.div
                  key={item.href}
                  whileHover={{ scale: 1.06, y: -1 }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  <Link
                    href={item.href}
                    className={cn(
                      "relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors select-none",
                      isActive
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute inset-0 rounded-lg bg-muted z-0"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-2">
                      <Icon className={cn("w-4 h-4", isActive && "text-primary")} />
                      {item.label}
                    </span>
                  </Link>
                </motion.div>
              );
            })}

            <div className="w-px h-6 bg-border mx-2" />

            <span className="text-xs text-muted-foreground hidden lg:inline">
              Signed in as {username ?? "team-07"}
            </span>

            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                Logout
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.1, rotate: 15 }} whileTap={{ scale: 0.9 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="rounded-full w-9 h-9"
              >
                <Sun className="w-4 h-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute w-4 h-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </motion.div>
          </nav>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="sm:hidden border-b border-border/50 bg-card/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Bird className="w-4 h-4" />
            </div>
            <span className="font-serif text-lg font-bold tracking-tight">BirdNET</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-full w-8 h-8"
          >
            <Sun className="w-4 h-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute w-4 h-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
        </div>
      </header>

      <main className={cn(
        "flex-1 flex flex-col container mx-auto p-4 sm:p-6 lg:p-8 z-10",
        isAnalyzePage ? "pb-0" : "pb-20 sm:pb-8"
      )}>
        {children}
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 border-t border-border/50 bg-card/80 backdrop-blur-xl z-50">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));

            return (
              <motion.div
                key={item.href}
                whileTap={{ scale: 0.88, y: -2 }}
                transition={{ type: "spring", stiffness: 500, damping: 20 }}
                className="flex-1"
              >
                <Link
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center w-full h-16 gap-1 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <motion.div
                    animate={isActive ? { scale: 1.15, y: -2 } : { scale: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className={cn("p-1.5 rounded-full", isActive && "bg-primary/10")}
                  >
                    <Icon className="w-5 h-5" />
                  </motion.div>
                  <span className="text-[10px] font-medium">{item.label}</span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
