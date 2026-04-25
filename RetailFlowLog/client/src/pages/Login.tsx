import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Leaf } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/login/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (response.ok) {
        window.location.href = "/";
        return;
      }

      const payload = await response.json().catch(() => null);
      setError(payload?.message || "Invalid credentials");
    } catch (err) {
      console.error("Login error:", err);
      setError("Could not login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            <button className="flex items-center gap-2" onClick={() => setLocation("/")}>
              <Leaf className="h-7 w-7 text-primary" />
              <span className="font-serif text-xl font-semibold text-foreground">NIVARANA</span>
            </button>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Button variant="outline" onClick={() => setLocation("/signup")}>
                Create account
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <Card className="p-6">
            <h1 className="font-serif text-2xl font-semibold mb-2">Login</h1>
            <p className="text-sm text-muted-foreground mb-6">Use your email and password.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <Button type="submit" className="w-full" disabled={isLoading || !email.trim() || !password}>
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </form>
          </Card>
        </div>
      </main>
    </div>
  );
}

