import { useState } from "react";
import { Bird, Lock, User } from "lucide-react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/context/auth";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    const ok = login(username, password);
    if (!ok) {
      toast.error("Invalid username or password.");
      setIsSubmitting(false);
      return;
    }

    toast.success("Welcome back.");
    setLocation("/");
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-[100dvh] bg-background flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-8%] w-[45%] h-[45%] rounded-full bg-primary/10 blur-[130px] animate-pulse" style={{ animationDuration: "11s" }} />
        <div className="absolute bottom-[-15%] right-[-10%] w-[55%] h-[55%] rounded-full bg-secondary/10 blur-[150px] animate-pulse" style={{ animationDuration: "14s", animationDelay: "2s" }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="bg-card/70 backdrop-blur-xl border-border/60">
          <CardHeader className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Bird className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="font-serif text-2xl">BirdNET Login</CardTitle>
              <CardDescription>Sign in to access the analyze page.</CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    className="pl-9"
                    placeholder="Enter username"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="pl-9"
                    placeholder="Enter password"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Signing in..." : "Sign in"}
              </Button>
            </form>

          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
