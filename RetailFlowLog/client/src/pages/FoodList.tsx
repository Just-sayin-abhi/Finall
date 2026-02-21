import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearch } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { healthGoals, type HealthGoalKey, type TieredFoods, type Food } from "@shared/schema";
import { 
  Leaf,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Sparkles,
  ArrowLeft,
  Star,
  Info,
  ChevronRight
} from "lucide-react";
import Chatbot from "@/components/Chatbot";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";


const tierInfo = {
  tier_1: {
    label: "Highly Recommended",
    description: "Excellent choices for your constitution",
    color: "bg-tier-1/10 text-tier-1 border-tier-1/30",
    badgeColor: "bg-tier-1 text-white",
    icon: Sparkles,
  },
  tier_2: {
    label: "Good Choices",
    description: "Beneficial foods you can enjoy regularly",
    color: "bg-tier-2/10 text-tier-2 border-tier-2/30",
    badgeColor: "bg-tier-2 text-white",
    icon: Star,
  },
  tier_3: {
    label: "Neutral",
    description: "Okay in moderation",
    color: "bg-tier-3/10 text-tier-3 border-tier-3/30",
    badgeColor: "bg-tier-3 text-white",
    icon: CheckCircle,
  },
  tier_4: {
    label: "Use Caution",
    description: "May conflict with your needs",
    color: "bg-tier-4/10 text-tier-4 border-tier-4/30",
    badgeColor: "bg-tier-4 text-white",
    icon: AlertTriangle,
  },
  tier_5: {
    label: "Avoid",
    description: "Not recommended for your dosha",
    color: "bg-tier-5/10 text-tier-5 border-tier-5/30",
    badgeColor: "bg-tier-5 text-white",
    icon: XCircle,
  },
};

const categories = [
  { value: "all", label: "All Categories" },
  { value: "vegetables", label: "Vegetables" },
  { value: "grains", label: "Grains" },
  { value: "legumes", label: "Legumes" },
  { value: "fruits", label: "Fruits" },
  { value: "spices", label: "Spices" },
  { value: "dairy", label: "Dairy" },
  { value: "oils", label: "Oils" },
  { value: "sweeteners", label: "Sweeteners" },
  { value: "nuts", label: "Nuts & Seeds" },
  { value: "beverages", label: "Beverages" },
];

function FoodCard({ food, tier }: { food: Food; tier: keyof typeof tierInfo }) {
  const info = tierInfo[tier];
  const [showDetail, setShowDetail] = useState(false);
  
  return (
    <>
      <motion.div 
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        whileHover={{ scale: 1.02, y: -2 }}
        className={`p-4 rounded-xl border-2 ${info.color} cursor-pointer shadow-sm hover:shadow-md transition-all duration-200 group relative overflow-hidden`}
        onClick={() => setShowDetail(true)}
        data-testid={`food-card-${food.name.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-full -mr-8 -mt-8 group-hover:bg-white/10 transition-colors" />
        <div className="flex items-start justify-between gap-2 relative">
          <div>
            <h4 className="font-bold text-lg leading-tight">{food.name}</h4>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">{food.category}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant="outline" className="text-[10px] bg-background/40 border-current/20 font-bold">
              {food.category}
            </Badge>
            <Info className="w-3.5 h-3.5 opacity-0 group-hover:opacity-40 transition-opacity" />
          </div>
        </div>
      </motion.div>

      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-xl border-border/40">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${info.color} shadow-inner`}>
                <info.icon className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="font-serif text-2xl">{food.name}</DialogTitle>
                <DialogDescription className="capitalize font-medium text-primary">
                  {food.category} • {info.label}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <div className="space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Dosha Balance</h5>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(food.dosha_effects).map(([dosha, effect]) => (
                  <div key={dosha} className="p-2 rounded-xl border border-border/40 bg-muted/20 flex flex-col items-center gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-tighter opacity-60">{dosha}</span>
                    <Badge variant="outline" className={`text-[10px] border-none px-1.5 h-5 flex items-center justify-center ${
                      effect === 'favourable' ? 'bg-emerald-500/10 text-emerald-500' :
                      effect === 'neutral' ? 'bg-amber-500/10 text-amber-500' :
                      'bg-rose-500/10 text-rose-500'
                    }`}>
                      {effect}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Benefit Analysis</h5>
              <div className="flex flex-wrap gap-2">
                {Object.entries(food.health_goal_effects)
                  .filter(([_, effect]) => effect === 'favourable')
                  .map(([goal, _]) => (
                    <Badge key={goal} variant="secondary" className="bg-primary/5 text-primary border-primary/10 px-2 py-1 rounded-lg">
                      Excellent for {healthGoals[goal as HealthGoalKey]}
                    </Badge>
                  ))}
                {Object.entries(food.health_goal_effects)
                  .filter(([_, effect]) => effect === 'favourable').length === 0 && (
                    <p className="text-sm text-muted-foreground italic">Generally balanced for most systems.</p>
                  )}
              </div>
            </div>
            
            <div className={`p-4 rounded-2xl ${info.color} border-none`}>
              <p className="text-sm font-medium leading-relaxed opacity-90">
                <span className="font-bold">Dietician's Note:</span> {info.description}. In Ayurveda, {food.name} is considered {food.dosha_effects.vata === 'favourable' ? 'warming' : 'cooling'} and {food.category === 'grains' ? 'grounding' : 'light'}.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function TierSection({ tier, foods, searchQuery, selectedCategory }: {
  tier: keyof typeof tierInfo;
  foods: Food[];
  searchQuery: string;
  selectedCategory: string;
}) {
  const info = tierInfo[tier];
  const Icon = info.icon;
  
  const filteredFoods = useMemo(() => {
    return foods.filter(food => {
      const matchesSearch = food.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "all" || food.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [foods, searchQuery, selectedCategory]);
  
  if (filteredFoods.length === 0 && foods.length > 0) {
    return null; // Hide tier if all foods are filtered out
  }
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-12"
    >
      <div className="flex items-center gap-4 mb-6">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${info.color} shadow-sm ring-1 ring-current/20`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-serif text-xl font-bold">{info.label}</h3>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground uppercase tracking-wider">
              {filteredFoods.length}
            </span>
          </div>
          <p className="text-sm text-muted-foreground font-medium">{info.description}</p>
        </div>
        <div className="h-px flex-1 bg-gradient-to-r from-border/60 to-transparent ml-4 hidden md:block" />
      </div>
      
      {filteredFoods.length === 0 ? (
        <div className="p-8 rounded-2xl border border-dashed border-border/60 bg-muted/10 text-center">
          <p className="text-sm text-muted-foreground italic">No foods match your current filters in this tier.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredFoods.map((food) => (
              <FoodCard key={food.name} food={food} tier={tier} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}

export default function FoodList() {
  const searchParams = useSearch();
  const params = new URLSearchParams(searchParams);
  const mode = params.get("mode") || "balanced";
  const goalParam = params.get("goal") as HealthGoalKey | null;
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [activeTab, setActiveTab] = useState("all");

  const [showMealDialog, setShowMealDialog] = useState(false);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [mealPlan, setMealPlan] = useState<any | null>(null);
  const { toast } = useToast();
  
  const { data: tieredFoods, isLoading } = useQuery<TieredFoods>({
    queryKey: ["/api/foods/filtered", mode, goalParam],
    queryFn: async () => {
      const url = mode === "goal" && goalParam
        ? `/api/foods/filtered?mode=goal&goal=${goalParam}`
        : "/api/foods/filtered?mode=balanced";
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch foods");
      return response.json();
    },
  });
  
  const goalLabel = goalParam ? healthGoals[goalParam] : null;

  async function generateMealPlan() {
    if (!tieredFoods) return;
    setGeneratingPlan(true);
    try {
      const resp = await fetch('/api/mealplan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          goal: goalParam,
          searchQuery,
          category: selectedCategory,
          days: 7,
        }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ message: 'Failed' }));
        toast({ title: 'Unable to generate meal plan', description: err.message || 'Try different filters' });
        setGeneratingPlan(false);
        return;
      }
      const data = await resp.json();
      setMealPlan(data);
      setShowMealDialog(true);
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Failed to generate meal plan' });
    } finally {
      setGeneratingPlan(false);
    }
  }
  


  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-10 w-64 mb-8" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Leaf className="h-6 w-6 text-primary" />
              <span className="font-serif text-lg font-semibold">Food Recommendations</span>
            </div>
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="gap-2" data-testid="link-dashboard">
                <ArrowLeft className="w-4 h-4" />
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Title Section */}
        <div className="mb-8">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-foreground mb-2">
            {mode === "goal" && goalLabel
              ? `Foods for ${goalLabel}`
              : "Balanced Diet Foods"
            }
          </h1>
          <p className="text-muted-foreground">
            {mode === "goal"
              ? "Foods filtered by your dosha and health goal"
              : "Foods filtered by your dosha constitution for balance"
            }
          </p>
        </div>
        
        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search foods..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-48" data-testid="select-category">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        
        {/* Tabs for tier navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="flex flex-wrap h-auto gap-2">
            <TabsTrigger value="all" data-testid="tab-all">All Tiers</TabsTrigger>
            <TabsTrigger value="tier_1" data-testid="tab-tier-1">Recommended</TabsTrigger>
            <TabsTrigger value="tier_2" data-testid="tab-tier-2">Good</TabsTrigger>
            <TabsTrigger value="tier_3" data-testid="tab-tier-3">Neutral</TabsTrigger>
            {tieredFoods?.tier_4 && tieredFoods.tier_4.length > 0 && (
              <TabsTrigger value="tier_4" data-testid="tab-tier-4">Caution</TabsTrigger>
            )}
            {tieredFoods?.tier_5 && tieredFoods.tier_5.length > 0 && (
              <TabsTrigger value="tier_5" data-testid="tab-tier-5">Avoid</TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="all" className="mt-6">
            {tieredFoods && (
              <>
                <TierSection tier="tier_1" foods={tieredFoods.tier_1} searchQuery={searchQuery} selectedCategory={selectedCategory} />
                <TierSection tier="tier_2" foods={tieredFoods.tier_2} searchQuery={searchQuery} selectedCategory={selectedCategory} />
                <TierSection tier="tier_3" foods={tieredFoods.tier_3} searchQuery={searchQuery} selectedCategory={selectedCategory} />
                {tieredFoods.tier_4 && <TierSection tier="tier_4" foods={tieredFoods.tier_4} searchQuery={searchQuery} selectedCategory={selectedCategory} />}
                {tieredFoods.tier_5 && <TierSection tier="tier_5" foods={tieredFoods.tier_5} searchQuery={searchQuery} selectedCategory={selectedCategory} />}
              </>
            )}
          </TabsContent>
          
          <TabsContent value="tier_1" className="mt-6">
            {tieredFoods && <TierSection tier="tier_1" foods={tieredFoods.tier_1} searchQuery={searchQuery} selectedCategory={selectedCategory} />}
          </TabsContent>
          
          <TabsContent value="tier_2" className="mt-6">
            {tieredFoods && <TierSection tier="tier_2" foods={tieredFoods.tier_2} searchQuery={searchQuery} selectedCategory={selectedCategory} />}
          </TabsContent>
          
          <TabsContent value="tier_3" className="mt-6">
            {tieredFoods && <TierSection tier="tier_3" foods={tieredFoods.tier_3} searchQuery={searchQuery} selectedCategory={selectedCategory} />}
          </TabsContent>
          
          <TabsContent value="tier_4" className="mt-6">
            {tieredFoods?.tier_4 && <TierSection tier="tier_4" foods={tieredFoods.tier_4} searchQuery={searchQuery} selectedCategory={selectedCategory} />}
          </TabsContent>
          
          <TabsContent value="tier_5" className="mt-6">
            {tieredFoods?.tier_5 && <TierSection tier="tier_5" foods={tieredFoods.tier_5} searchQuery={searchQuery} selectedCategory={selectedCategory} />}
          </TabsContent>
        </Tabs>
        
        {/* Legend */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="font-serif text-lg">Understanding the Tiers</CardTitle>
            <CardDescription>How foods are categorized based on your profile</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {Object.entries(tierInfo).map(([key, info]) => {
                const Icon = info.icon;
                return (
                  <div key={key} className={`p-3 rounded-lg ${info.color} text-sm`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-4 h-4" />
                      <span className="font-medium">{info.label}</span>
                    </div>
                    <p className="text-xs opacity-80">{info.description}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* AI Assistant */}
        {tieredFoods && (
          <Chatbot 
            dosha={mode === "goal" ? "Your Custom" : "Balanced"} 
            goal={goalLabel || "General Wellness"} 
            foods={tieredFoods} 
          />
        )}

        {/* CTA: Generate Meal Plan */}
        <div className="mt-8 flex justify-center">
          <Button onClick={async () => { await generateMealPlan(); }} disabled={generatingPlan} size="lg" data-testid="btn-generate-mealplan">
            {generatingPlan ? "Generating..." : "Generate Meal Plan"}
          </Button>
        </div>

        {/* Meal plan dialog */}
        <Dialog open={showMealDialog} onOpenChange={setShowMealDialog}>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>Generated Meal Plan</DialogTitle>
              <DialogDescription>A plan using only foods filtered for your profile.</DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-4 max-h-[60vh] overflow-auto">
              {mealPlan?.days?.map((d: any) => (
                <Card key={d.day} className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Day {d.day}</h4>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {Object.entries(d.meals).map(([mealKey, recipe]: any) => (
                      <div key={mealKey} className="p-3 rounded border">
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium capitalize">{mealKey}</h5>
                        </div>
                        <p className="text-sm font-semibold mt-2">{recipe.title}</p>
                        <p className="text-sm mt-1"><strong>Ingredients:</strong> {recipe.ingredients.join(", ")}</p>
                        <ol className="list-decimal ml-5 mt-2 text-sm">
                          {recipe.instructions.map((ins: string, i: number) => <li key={i}>{ins}</li>)}
                        </ol>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </DialogContent>
        </Dialog>

      </main>
    </div>
  );
}
