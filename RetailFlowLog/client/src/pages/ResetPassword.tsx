import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Leaf, CheckCircle, XCircle, KeyRound } from "lucide-react";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const token = new URLSearchParams(search).get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mismatch = confirm.length > 0 && password !== confirm;
  const canSubmit = token && password.length >= 8 && password === confirm && !isLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (res.ok) {
        setDone(true);
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
          <div className="flex items-center h-16">
            <button className="flex items-center gap-2" onClick={() => setLocation("/")}>
              <Leaf className="h-7 w-7 text-primary" />
              <span className="font-serif text-xl font-semibold text-foreground">NIVARANA</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="pt-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <Card className="p-6">
            {!token ? (
              <div className="text-center py-4">
                <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
                <h2 className="font-serif text-xl font-semibold mb-2">Invalid link</h2>
                <p className="text-sm text-muted-foreground mb-6">This reset link is missing or malformed.</p>
                <Button className="w-full" onClick={() => setLocation("/forgot-password")}>Request a new link</Button>
              </div>
            ) : done ? (
              <div className="text-center py-4">
                <CheckCircle className="w-12 h-12 text-primary mx-auto mb-4" />
                <h2 className="font-serif text-xl font-semibold mb-2">Password updated</h2>
                <p className="text-sm text-muted-foreground mb-6">Your password has been changed. You can now log in with your new password.</p>
                <Button className="w-full" onClick={() => setLocation("/?tab=login")}>Go to login</Button>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <KeyRound className="w-5 h-5 text-primary" />
                  </div>
                  <h1 className="font-serif text-2xl font-semibold mb-1">Set new password</h1>
                  <p className="text-sm text-muted-foreground">Choose a strong password for your account.</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">New password</label>
                    <Input
                      type="password"
                      placeholder="At least 8 characters"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Confirm password</label>
                    <Input
                      type="password"
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      disabled={isLoading}
                      className={mismatch ? "border-destructive focus-visible:ring-destructive" : ""}
                    />
                    {mismatch && <p className="text-xs text-destructive">Passwords don't match</p>}
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button type="submit" className="w-full" disabled={!canSubmit}>
                    {isLoading ? "Updating…" : "Update password"}
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
