import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Users, MessageSquare, Leaf, BarChart3,
  ChevronDown, ChevronUp, Trash2, Plus,
  ArrowLeft, Search, ShieldAlert,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { healthGoals } from "@shared/schema";

type Tab = "stats" | "users" | "conversations" | "foods";

// ── Stat card ──────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: number; icon: any; color: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold mt-1">{value.toLocaleString()}</p>
          </div>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Stats tab ──────────────────────────────────────────────────────────────
function StatsTab() {
  const { data, isLoading } = useQuery<any>({ queryKey: ["/api/admin/stats"] });
  if (isLoading) return <Spinner />;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <StatCard label="Total Users" value={data?.totalUsers ?? 0} icon={Users} color="bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400" />
      <StatCard label="Quiz Completions" value={data?.quizCompleted ?? 0} icon={BarChart3} color="bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400" />
      <StatCard label="Wellness Check-ins" value={data?.wellnessCheckins ?? 0} icon={Leaf} color="bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400" />
      <StatCard label="AI Conversations" value={data?.totalConversations ?? 0} icon={MessageSquare} color="bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400" />
    </div>
  );
}

// ── Users tab ──────────────────────────────────────────────────────────────
function UsersTab() {
  const [search, setSearch] = useState("");
  const { data: users = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/admin/users"] });

  const filtered = users.filter(u =>
    !search ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    `${u.firstName ?? ""} ${u.lastName ?? ""}`.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <Spinner />;

  return (
    <div className="space-y-4">
      <SearchBar value={search} onChange={setSearch} placeholder="Search by name or email…" />
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground text-xs uppercase tracking-wide">
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Email</th>
                <th className="px-4 py-3 text-left font-medium">Dosha</th>
                <th className="px-4 py-3 text-left font-medium">Health Goal</th>
                <th className="px-4 py-3 text-left font-medium">Joined</th>
                <th className="px-4 py-3 text-left font-medium">Last Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">
                    {u.firstName || u.lastName
                      ? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim()
                      : <span className="text-muted-foreground italic">—</span>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3">
                    {u.primaryDosha
                      ? <DoshaBadge dosha={u.primaryDosha} />
                      : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {u.healthGoal
                      ? healthGoals[u.healthGoal as keyof typeof healthGoals] ?? u.healthGoal
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{fmtDate(u.createdAt)}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{fmtDate(u.lastActive)}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 border-t text-xs text-muted-foreground">
          {filtered.length} of {users.length} users
        </div>
      </Card>
    </div>
  );
}

// ── Conversations tab ──────────────────────────────────────────────────────
function ConversationsTab() {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const { data: convs = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/admin/conversations"] });

  const filtered = convs.filter(c =>
    !search ||
    c.userEmail?.toLowerCase().includes(search.toLowerCase()) ||
    c.title?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <Spinner />;

  return (
    <div className="space-y-4">
      <SearchBar value={search} onChange={setSearch} placeholder="Search by email or topic…" />
      {filtered.length === 0 && <EmptyState text="No conversations found" />}
      <div className="space-y-2">
        {filtered.map((c) => (
          <Card key={c.id} className="overflow-hidden">
            <button
              className="w-full px-5 py-4 flex items-start justify-between gap-4 hover:bg-muted/30 transition-colors text-left"
              onClick={() => setExpanded(expanded === c.id ? null : c.id)}
            >
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{c.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {c.userEmail} · {c.messages?.length ?? 0} messages · {fmtDate(c.createdAt)}
                </p>
              </div>
              {expanded === c.id
                ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />}
            </button>
            {expanded === c.id && (
              <ScrollArea className="max-h-72 border-t">
                <div className="p-4 space-y-3">
                  {c.messages?.map((m: any) => (
                    <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        m.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted text-foreground rounded-bl-sm"
                      }`}>
                        <p className="text-[10px] opacity-60 mb-1 font-medium uppercase tracking-wide">{m.role}</p>
                        {m.content}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── Food Manager tab ───────────────────────────────────────────────────────
const DOSHA_EFFECTS = ["favourable", "neutral", "unfavourable"] as const;
const HEALTH_GOALS_KEYS = [
  "heart_health","gut_health","inflammation","liver_function",
  "immunity","diabetes","skin_hair","weight_management","sleep","energy",
];

function FoodsTab() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "", category: "",
    vata: "neutral" as typeof DOSHA_EFFECTS[number],
    pitta: "neutral" as typeof DOSHA_EFFECTS[number],
    kapha: "neutral" as typeof DOSHA_EFFECTS[number],
  });
  const [formError, setFormError] = useState("");

  const { data: foods = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/admin/foods"] });

  const addFood = useMutation({
    mutationFn: async () => {
      const body = {
        name: form.name.trim(),
        category: form.category.trim().toLowerCase(),
        dosha_effects: { vata: form.vata, pitta: form.pitta, kapha: form.kapha },
        health_goal_effects: Object.fromEntries(HEALTH_GOALS_KEYS.map(k => [k, "neutral"])),
      };
      const res = await fetch("/api/admin/foods", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/foods"] });
      setForm({ name: "", category: "", vata: "neutral", pitta: "neutral", kapha: "neutral" });
      setShowForm(false); setFormError("");
    },
    onError: (e: Error) => setFormError(e.message),
  });

  const deleteFood = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch(`/api/admin/foods/${encodeURIComponent(name)}`, {
        method: "DELETE", credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/admin/foods"] }),
  });

  const categories = Array.from(new Set(foods.map((f: any) => f.category as string))).sort();
  const filtered = foods.filter((f: any) =>
    !search ||
    f.name?.toLowerCase().includes(search.toLowerCase()) ||
    f.category?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <Spinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search foods or category…" className="flex-1" />
        <Button size="sm" onClick={() => { setShowForm(!showForm); setFormError(""); }} className="gap-1.5 shrink-0">
          <Plus className="w-4 h-4" />{showForm ? "Cancel" : "Add Food"}
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">New Food</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Food Name *</label>
                <Input placeholder="e.g. Ashwagandha" value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Category *</label>
                <Input placeholder="e.g. herbs" list="cat-list" value={form.category}
                  onChange={e => setForm(p => ({ ...p, category: e.target.value }))} />
                <datalist id="cat-list">{categories.map(c => <option key={c} value={c} />)}</datalist>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {(["vata", "pitta", "kapha"] as const).map(d => (
                <div key={d} className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground capitalize">{d} Effect</label>
                  <select
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                    value={form[d]}
                    onChange={e => setForm(p => ({ ...p, [d]: e.target.value as any }))}
                  >
                    {DOSHA_EFFECTS.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
              ))}
            </div>
            {formError && <p className="text-xs text-destructive">{formError}</p>}
            <div className="flex gap-2">
              <Button size="sm" onClick={() => addFood.mutate()}
                disabled={!form.name.trim() || !form.category.trim() || addFood.isPending}>
                {addFood.isPending ? "Adding…" : "Add Food"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setShowForm(false); setFormError(""); }}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground text-xs uppercase tracking-wide">
                <th className="px-4 py-3 text-left font-medium">Food</th>
                <th className="px-4 py-3 text-left font-medium">Category</th>
                <th className="px-4 py-3 text-left font-medium">Vata</th>
                <th className="px-4 py-3 text-left font-medium">Pitta</th>
                <th className="px-4 py-3 text-left font-medium">Kapha</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filtered.map((f: any) => (
                <tr key={f.name} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-2.5 font-medium">{f.name}</td>
                  <td className="px-4 py-2.5 text-muted-foreground capitalize">{f.category}</td>
                  {(["vata", "pitta", "kapha"] as const).map(d => (
                    <td key={d} className="px-4 py-2.5">
                      <EffectBadge effect={f.dosha_effects?.[d]} />
                    </td>
                  ))}
                  <td className="px-4 py-2.5 text-right">
                    <Button size="icon" variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => { if (window.confirm(`Delete "${f.name}"?`)) deleteFood.mutate(f.name); }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6}><EmptyState text="No foods found" /></td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 border-t text-xs text-muted-foreground">
          {filtered.length} of {foods.length} foods
        </div>
      </Card>
    </div>
  );
}

// ── Shared helpers ─────────────────────────────────────────────────────────
function SearchBar({ value, onChange, placeholder, className = "" }: {
  value: string; onChange: (v: string) => void; placeholder: string; className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      <Input className="pl-9" placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} />
    </div>
  );
}

function DoshaBadge({ dosha }: { dosha: string }) {
  const colors: Record<string, string> = {
    vata: "border-sky-400 text-sky-600 dark:text-sky-400",
    pitta: "border-orange-400 text-orange-600 dark:text-orange-400",
    kapha: "border-emerald-400 text-emerald-600 dark:text-emerald-400",
  };
  return <Badge variant="outline" className={`capitalize ${colors[dosha] ?? ""}`}>{dosha}</Badge>;
}

function EffectBadge({ effect }: { effect: string }) {
  const cls =
    effect === "favourable" ? "border-green-400 text-green-600 dark:text-green-400" :
    effect === "unfavourable" ? "border-red-400 text-red-500 dark:text-red-400" : "";
  return <Badge variant="outline" className={`capitalize text-xs ${cls}`}>{effect ?? "—"}</Badge>;
}

function Spinner() {
  return <div className="py-10 text-center text-sm text-muted-foreground">Loading…</div>;
}

function EmptyState({ text }: { text: string }) {
  return <div className="py-10 text-center text-sm text-muted-foreground">{text}</div>;
}

function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

// ── Main Admin page ────────────────────────────────────────────────────────
const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: "stats", label: "Overview", icon: BarChart3 },
  { id: "users", label: "Users", icon: Users },
  { id: "conversations", label: "Conversations", icon: MessageSquare },
  { id: "foods", label: "Food Manager", icon: Leaf },
];

export default function Admin() {
  const [tab, setTab] = useState<Tab>("stats");
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  if (!(user as any)?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="p-8 text-center max-w-sm w-full">
          <ShieldAlert className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold mb-2">Access Denied</h2>
          <p className="text-sm text-muted-foreground mb-6">
            You don't have admin access. Set <code className="bg-muted px-1 rounded text-xs">ADMIN_EMAIL</code> in your environment to your email address.
          </p>
          <Button variant="outline" className="w-full" onClick={() => setLocation("/")}>
            Go to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Header */}
      <div className="bg-background border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/")} className="gap-1.5 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <div className="w-px h-5 bg-border" />
          <span className="font-semibold">Admin Panel</span>
          <Badge variant="outline" className="ml-auto text-xs">{user?.email}</Badge>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Tab bar */}
        <div className="flex gap-1 bg-background border rounded-xl p-1 w-fit shadow-sm">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              <t.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        {tab === "stats" && <StatsTab />}
        {tab === "users" && <UsersTab />}
        {tab === "conversations" && <ConversationsTab />}
        {tab === "foods" && <FoodsTab />}
      </div>
    </div>
  );
}
