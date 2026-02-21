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
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/60 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Leaf className="h-5 w-5 text-primary" />
              </div>
              <span className="font-serif text-lg font-bold tracking-tight">Food Wisdom</span>
            </div>
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="gap-2 hover:bg-muted/60" data-testid="link-dashboard">
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Title Section */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest mb-3">
            <Sparkles className="w-3 h-3" />
            Personalized Nutrition
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-foreground mb-2">
            {mode === "goal" && goalLabel
              ? `Nutrition for ${goalLabel}`
              : "Ayurvedic Balanced Diet"
            }
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl leading-relaxed">
            {mode === "goal"
              ? "A specialized selection of foods optimized for your primary dosha and specific health objectives."
              : "Foundational nutritional choices curated to maintain equilibrium across your unique Ayurvedic constitution."
            }
          </p>
        </motion.div>
        
        {/* Filters */}
        <Card className="mb-8 bg-card/40 backdrop-blur-md border-border/40 shadow-sm overflow-visible">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="Search dietary elements..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background/50 border-border/60 focus:border-primary/50 transition-all rounded-xl"
                  data-testid="input-search"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-56 bg-background/50 border-border/60 rounded-xl" data-testid="select-category">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <SelectValue placeholder="Category" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/40">
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value} className="rounded-lg m-1">
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        
        {/* Tabs for tier navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-10">
          <div className="flex items-center justify-between gap-4 mb-6">
            <TabsList className="bg-muted/40 p-1 rounded-2xl border border-border/40 h-auto flex flex-wrap flex-1">
              <TabsTrigger value="all" className="rounded-xl px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm" data-testid="tab-all">All Tiers</TabsTrigger>
              <TabsTrigger value="tier_1" className="rounded-xl px-4 py-2 data-[state=active]:bg-tier-1/10 data-[state=active]:text-tier-1" data-testid="tab-tier-1">Highly Recommended</TabsTrigger>
              <TabsTrigger value="tier_2" className="rounded-xl px-4 py-2 data-[state=active]:bg-tier-2/10 data-[state=active]:text-tier-2" data-testid="tab-tier-2">Good</TabsTrigger>
              <TabsTrigger value="tier_3" className="rounded-xl px-4 py-2 data-[state=active]:bg-tier-3/10 data-[state=active]:text-tier-3" data-testid="tab-tier-3">Neutral</TabsTrigger>
            </TabsList>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={async () => { await generateMealPlan(); }} 
                    disabled={generatingPlan} 
                    className="rounded-2xl shadow-lg shadow-primary/20 gap-2 h-11 px-6 whitespace-nowrap hidden md:flex"
                    data-testid="btn-generate-mealplan"
                  >
                    {generatingPlan ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                        <Sparkles className="w-4 h-4" />
                      </motion.div>
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    Generate 7-Day Plan
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-background/95 backdrop-blur-md border-border/40 max-w-xs p-3 rounded-xl">
                  <p className="text-xs font-medium leading-relaxed">Let AI create a customized week-long menu using only your recommended foods.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <TabsContent value="all" className="mt-0 outline-none">
            {tieredFoods && (
              <>
                <TierSection tier="tier_1" foods={tieredFoods.tier_1} searchQuery={searchQuery} selectedCategory={selectedCategory} />
                <TierSection tier="tier_2" foods={tieredFoods.tier_2} searchQuery={searchQuery} selectedCategory={selectedCategory} />
                <TierSection tier="tier_3" foods={tieredFoods.tier_3} searchQuery={searchQuery} selectedCategory={selectedCategory} />
                {tieredFoods.tier_4 && tieredFoods.tier_4.length > 0 && <TierSection tier="tier_4" foods={tieredFoods.tier_4} searchQuery={searchQuery} selectedCategory={selectedCategory} />}
                {tieredFoods.tier_5 && tieredFoods.tier_5.length > 0 && <TierSection tier="tier_5" foods={tieredFoods.tier_5} searchQuery={searchQuery} selectedCategory={selectedCategory} />}
              </>
            )}
          </TabsContent>
          
          <TabsContent value="tier_1" className="mt-0 outline-none">
            {tieredFoods && <TierSection tier="tier_1" foods={tieredFoods.tier_1} searchQuery={searchQuery} selectedCategory={selectedCategory} />}
          </TabsContent>
          
          <TabsContent value="tier_2" className="mt-0 outline-none">
            {tieredFoods && <TierSection tier="tier_2" foods={tieredFoods.tier_2} searchQuery={searchQuery} selectedCategory={selectedCategory} />}
          </TabsContent>
          
          <TabsContent value="tier_3" className="mt-0 outline-none">
            {tieredFoods && <TierSection tier="tier_3" foods={tieredFoods.tier_3} searchQuery={searchQuery} selectedCategory={selectedCategory} />}
          </TabsContent>

          <TabsContent value="tier_4" className="mt-0 outline-none">
            {tieredFoods?.tier_4 && <TierSection tier="tier_4" foods={tieredFoods.tier_4} searchQuery={searchQuery} selectedCategory={selectedCategory} />}
          </TabsContent>

          <TabsContent value="tier_5" className="mt-0 outline-none">
            {tieredFoods?.tier_5 && <TierSection tier="tier_5" foods={tieredFoods.tier_5} searchQuery={searchQuery} selectedCategory={selectedCategory} />}
          </TabsContent>
        </Tabs>
        
        {/* Legend */}
        <Card className="mt-12 bg-card/30 backdrop-blur-md border-border/40 rounded-3xl overflow-hidden shadow-sm">
          <CardHeader className="bg-muted/10 p-6">
            <CardTitle className="font-serif text-xl flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" />
              Nutritional Classification Legend
            </CardTitle>
            <CardDescription className="text-base">Understanding how Ayurvedic principles apply to your food choices.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {Object.entries(tierInfo).map(([key, info]) => {
                const Icon = info.icon;
                return (
                  <div key={key} className={`p-4 rounded-2xl ${info.color} border-none shadow-sm flex flex-col gap-3 transition-transform hover:scale-[1.02]`}>
                    <div className="w-10 h-10 rounded-xl bg-background/40 flex items-center justify-center shadow-inner">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-bold block mb-1">{info.label}</span>
                      <p className="text-xs opacity-90 leading-relaxed font-medium">{info.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Mobile FAB for meal plan */}
        <div className="fixed bottom-6 right-6 md:hidden z-40">
           <Button 
            onClick={async () => { await generateMealPlan(); }} 
            disabled={generatingPlan} 
            className="rounded-full w-14 h-14 shadow-2xl shadow-primary/40 p-0"
          >
            {generatingPlan ? (
               <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                <Sparkles className="w-6 h-6" />
              </motion.div>
            ) : (
              <Sparkles className="w-6 h-6" />
            )}
          </Button>
        </div>

        {/* AI Assistant */}
        {tieredFoods && (
          <Chatbot 
            dosha={mode === "goal" ? "Your Custom" : "Balanced"} 
            goal={goalLabel || "General Wellness"} 
            foods={tieredFoods} 
          />
        )}

        {/* Meal plan dialog */}
        <Dialog open={showMealDialog} onOpenChange={setShowMealDialog}>
          <DialogContent className="sm:max-w-4xl bg-background/95 backdrop-blur-2xl border-border/40 p-0 overflow-hidden max-h-[90vh]">
            <div className="p-6 border-b border-border/40 bg-muted/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shadow-inner">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <DialogTitle className="font-serif text-2xl">Your 7-Day Ayurvedic Journey</DialogTitle>
                  <DialogDescription className="text-base">Customized meal architecture using only your optimal food sources.</DialogDescription>
                </div>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] bg-background/40">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {mealPlan?.days?.map((d: any) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={d.day}
                  >
                    <Card className="bg-card/50 backdrop-blur-md border-border/40 shadow-sm overflow-hidden h-full">
                      <div className="bg-primary/5 px-4 py-3 border-b border-border/20 flex items-center justify-between">
                        <h4 className="font-bold text-lg text-primary flex items-center gap-2">
                          Day {d.day}
                          <Badge variant="outline" className="text-[10px] uppercase tracking-tighter">Harmonized</Badge>
                        </h4>
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Planned by AI</div>
                      </div>
                      <div className="p-4 space-y-4">
                        {Object.entries(d.meals).map(([mealKey, recipe]: any) => (
                          <div key={mealKey} className="group">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60">{mealKey}</span>
                              <div className="h-px flex-1 bg-border/40" />
                            </div>
                            <div className="pl-2 border-l-2 border-primary/20 group-hover:border-primary/40 transition-colors">
                              <h5 className="font-bold text-base mb-1">{recipe.title}</h5>
                              <div className="flex flex-wrap gap-1 mb-3">
                                {recipe.ingredients.slice(0, 4).map((ing: string) => (
                                  <Badge key={ing} variant="secondary" className="text-[9px] bg-muted/60 border-none font-medium">{ing}</Badge>
                                ))}
                                {recipe.ingredients.length > 4 && <span className="text-[9px] text-muted-foreground font-medium">+{recipe.ingredients.length - 4} more</span>}
                              </div>
                              <div className="bg-background/40 p-3 rounded-xl border border-border/40">
                                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1">
                                  <ChevronRight className="w-3 h-3" />
                                  Preparation
                                </div>
                                <ol className="space-y-1.5">
                                  {recipe.instructions.map((ins: string, i: number) => (
                                    <li key={i} className="text-xs text-foreground/80 leading-relaxed flex gap-2">
                                      <span className="text-primary/40 font-bold">{i + 1}.</span>
                                      {ins}
                                    </li>
                                  ))}
                                </ol>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
            
            <div className="p-6 border-t border-border/40 bg-muted/20 flex items-center justify-between">
              <div className="text-xs font-medium text-muted-foreground italic flex items-center gap-2">
                <Leaf className="w-3.5 h-3.5" />
                Plan curated using Sattvic principles
              </div>
              <Button onClick={() => setShowMealDialog(false)} variant="secondary" className="rounded-xl px-8">Close Plan</Button>
            </div>
          </DialogContent>
        </Dialog>

      </main>
    </div>
  );
}
