import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Leaf, ArrowLeft, Mail, CheckCircle } from "lucide-react";

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (res.ok) {
        setSent(true);
      } else {
        const d = await res.json().catch(() => null);
        setError(d?.message || "Something went wrong");
      }
    } catch {
      setError("Could not connect to server");
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
            <Button variant="ghost" size="sm" onClick={() => setLocation("/?tab=login")} className="gap-1.5">
              <ArrowLeft className="w-4 h-4" /> Back to login
            </Button>
          </div>
        </div>
      </nav>

      <main className="pt-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <Card className="p-6">
            {sent ? (
              <div className="text-center py-4">
                <CheckCircle className="w-12 h-12 text-primary mx-auto mb-4" />
                <h2 className="font-serif text-xl font-semibold mb-2">Check your email</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  If an account exists for <span className="font-medium text-foreground">{email}</span>, we've sent a password reset link. Check your inbox (and spam folder).
                </p>
                <Button variant="outline" className="w-full" onClick={() => setLocation("/?tab=login")}>
                  Back to login
                </Button>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <h1 className="font-serif text-2xl font-semibold mb-1">Forgot password?</h1>
                  <p className="text-sm text-muted-foreground">
                    Enter your email and we'll send you a reset link.
                  </p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button type="submit" className="w-full" disabled={!email.trim() || isLoading}>
                    {isLoading ? "Sending…" : "Send reset link"}
                  </Button>
                  <Button type="button" variant="ghost" className="w-full" onClick={() => setLocation("/?tab=login")}>
                    Back to login
                  </Button>
                </form>
              </>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
