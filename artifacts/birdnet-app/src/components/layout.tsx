import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Bird, Activity, History, BarChart3, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { Cursor } from "@/components/cursor";
import { Button } from "./ui/button";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();

  const navItems = [
    { href: "/", label: "Analyze", icon: Activity },
    { href: "/history", label: "History", icon: History },
    { href: "/stats", label: "Stats", icon: BarChart3 },
  ];

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col relative overflow-hidden font-sans">
      <Cursor />
      
      {/* Background texture/motion */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-30 dark:opacity-20 overflow-hidden mix-blend-soft-light">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[100px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-secondary/20 blur-[120px] animate-pulse" style={{ animationDuration: '12s', animationDelay: '2s' }} />
      </div>

      {/* Desktop Header */}
      <header className="hidden sm:block border-b border-border/50 bg-card/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shadow-inner">
              <Bird className="w-5 h-5" />
            </div>
            <span className="font-serif text-xl font-bold tracking-tight text-foreground">BirdNET</span>
          </Link>
          
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute inset-0 rounded-lg bg-muted z-0"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <Icon className={cn("w-4 h-4", isActive && "text-primary")} />
                    {item.label}
                  </span>
                </Link>
              );
            })}
            <div className="w-px h-6 bg-border mx-2" />
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
          </nav>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="sm:hidden border-b border-border/50 bg-card/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
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

      <main className="flex-1 flex flex-col container mx-auto p-4 sm:p-6 lg:p-8 z-10 pb-20 sm:pb-8">
        {children}
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 border-t border-border/50 bg-card/80 backdrop-blur-xl z-50 pb-safe">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className={cn("relative p-1 rounded-full", isActive && "bg-primary/10")}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
