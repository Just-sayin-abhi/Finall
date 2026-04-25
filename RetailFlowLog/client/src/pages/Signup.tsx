import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Leaf } from "lucide-react";

export default function Signup() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return (
      email.trim().length > 0 &&
      password.length >= 8 &&
      confirmPassword.length > 0 &&
      password === confirmPassword
    );
  }, [email, password, confirmPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          firstName: firstName.trim() || undefined,
          lastName: lastName.trim() || undefined,
        }),
      });

      if (response.ok) {
        window.location.href = "/";
        return;
      }

      const payload = await response.json().catch(() => null);
      setError(payload?.message || "Could not create account");
    } catch (err) {
      console.error("Signup error:", err);
      setError("Could not create account");
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
              <Button variant="outline" onClick={() => setLocation("/login")}>
                Log in
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <Card className="p-6">
            <h1 className="font-serif text-2xl font-semibold mb-2">Create account</h1>
            <p className="text-sm text-muted-foreground mb-6">
              Sign up with email and password.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  disabled={isLoading}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">First name</label>
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} disabled={isLoading} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Last name</label>
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} disabled={isLoading} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Confirm password</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <Button type="submit" className="w-full" disabled={!canSubmit || isLoading}>
                {isLoading ? "Creating account..." : "Create account"}
              </Button>
            </form>
          </Card>
        </div>
      </main>
    </div>
  );
}

