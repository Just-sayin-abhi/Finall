import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { doshaDescriptions } from "@/lib/doshaQuestions";
import { getBMICategory } from "@/lib/healthCalculations";
import type { UserProfile, DoshaAssessment } from "@shared/schema";
import {
  Leaf,
  Wind,
  Flame,
  Mountain,
  Scale,
  Target,
  Utensils,
  ArrowRight,
  LogOut,
  Activity,
  User,
  Sparkles,
  CheckCircle,
  TrendingUp
} from "lucide-react";

const doshaIcons = {
  vata: Wind,
  pitta: Flame,
  kapha: Mountain,
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1
  }
};

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  
  const { data: profile, isLoading: profileLoading } = useQuery<UserProfile>({
    queryKey: ["/api/profile"],
  });
  
  const { data: assessment, isLoading: assessmentLoading } = useQuery<DoshaAssessment>({
    queryKey: ["/api/dosha-assessment"],
  });
  
  const isLoading = authLoading || profileLoading || assessmentLoading;
  
  const needsOnboarding = !profile?.onboardingComplete;
  const needsAssessment = !assessment;
  
  const bmiCategory = profile?.bmi ? getBMICategory(profile.bmi) : null;
  
  const primaryDosha = assessment?.primaryDosha as keyof typeof doshaDescriptions | undefined;
  const PrimaryIcon = primaryDosha ? doshaIcons[primaryDosha] : null;

  const getProgress = () => {
    let steps = 0;
    if (profile?.onboardingComplete) steps++;
    if (assessment) steps++;
    // Check for health goals if possible, or just use these two major ones
    return (steps / 2) * 100;
  };

  const progress = getProgress();
  
  useEffect(() => {
    if (needsOnboarding && !profileLoading) {
      setLocation("/onboarding");
    }
  }, [needsOnboarding, profileLoading, setLocation]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/60 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Leaf className="h-7 w-7 text-primary" />
              <span className="font-serif text-xl font-semibold tracking-tight">NIVARANA</span>
            </div>
            
            <div className="flex items-center gap-3">
              <ThemeToggle />
              {user && (
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9 border border-border">
                    <AvatarImage src={user.profileImageUrl || undefined} alt={user.firstName || "User"} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {user.firstName?.[0] || user.email?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <a href="/api/logout">
                    <Button variant="ghost" size="sm" className="gap-2 hover:bg-destructive/10 hover:text-destructive transition-colors" data-testid="button-logout">
                      <LogOut className="w-4 h-4" />
                      <span className="hidden sm:inline">Logout</span>
                    </Button>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      
      <motion.main 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto px-4 py-8"
      >
        {/* Welcome Section */}
        <motion.div variants={itemVariants} className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-foreground mb-2">
              {isLoading ? (
                <Skeleton className="h-10 w-64" />
              ) : (
                `Namaste${user?.firstName ? `, ${user.firstName}` : ""}!`
              )}
            </h1>
            <p className="text-muted-foreground text-lg">
              Your path to Ayurvedic balance and harmony.
            </p>
          </div>
          
          {!isLoading && (
            <div className="bg-card/50 backdrop-blur-sm border border-border/40 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
              <div className="relative w-12 h-12 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90">
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    className="text-muted/20"
                  />
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeDasharray={125.6}
                    strokeDashoffset={125.6 - (125.6 * progress) / 100}
                    strokeLinecap="round"
                    className="text-primary transition-all duration-1000 ease-out"
                  />
                </svg>
                <TrendingUp className="absolute w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Setup Progress</div>
                <div className="text-lg font-bold">{Math.round(progress)}% Complete</div>
              </div>
            </div>
          )}
        </motion.div>
        
        {/* Quick Stats */}
        {!isLoading && profile && (
          <motion.div variants={itemVariants} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="bg-card/40 backdrop-blur-md border-border/40 hover:border-primary/40 transition-colors">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shadow-inner">
                  <Scale className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">BMI Index</div>
                  <div className="text-xl font-bold">
                    {profile.bmi?.toFixed(1)}
                    <span className={`text-xs ml-1 px-1.5 py-0.5 rounded-md ${bmiCategory?.color.replace('text-', 'bg-').replace('/10', '/20')} font-medium`}>
                      {bmiCategory?.category}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card/40 backdrop-blur-md border-border/40 hover:border-accent/40 transition-colors">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shadow-inner">
                  <Activity className="w-6 h-6 text-accent-foreground" />
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Daily Goal</div>
                  <div className="text-xl font-bold">{profile.maintenanceCalories} <span className="text-sm font-normal text-muted-foreground">kcal</span></div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card/40 backdrop-blur-md border-border/40 hover:border-primary/40 transition-colors">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shadow-inner">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Metrics</div>
                  <div className="text-xl font-bold">{profile.heightCm}<span className="text-sm font-normal text-muted-foreground">cm</span> / {profile.weightKg}<span className="text-sm font-normal text-muted-foreground">kg</span></div>
                </div>
              </CardContent>
            </Card>
            
            {assessment && PrimaryIcon && (
              <Card className={`bg-card/40 backdrop-blur-md border-border/40 hover:border-${primaryDosha}/40 transition-colors`}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-${primaryDosha}/10 flex items-center justify-center shadow-inner`}>
                    <PrimaryIcon className={`w-6 h-6 text-${primaryDosha}`} />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Dominant Dosha</div>
                    <div className="text-xl font-bold capitalize">
                      {assessment.constitutionType === 'single' 
                        ? assessment.primaryDosha 
                        : `${assessment.primaryDosha}-${assessment.secondaryDosha}`
                      }
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
        
        {/* Main Actions */}
        <motion.div variants={itemVariants} className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Dosha Assessment Card */}
          <Card className={`overflow-hidden relative group ${needsAssessment ? 'border-primary/50 bg-primary/5' : 'bg-card/40 backdrop-blur-md border-border/40'}`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl transition-all group-hover:bg-primary/10" />
            <CardHeader className="relative">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 shadow-sm">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                {!needsAssessment && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Completed
                  </div>
                )}
              </div>
              <CardTitle className="font-serif text-2xl">Dosha Assessment</CardTitle>
              <CardDescription className="text-base">
                {needsAssessment
                  ? "Take the 30-question quiz to discover your unique Ayurvedic constitution"
                  : "Your unique body constitution has been identified"
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="relative">
              {assessment ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-5 p-4 rounded-2xl bg-background/40 border border-border/40">
                    {PrimaryIcon && (
                      <div className={`w-14 h-14 rounded-2xl bg-${primaryDosha}/10 flex items-center justify-center shadow-inner`}>
                        <PrimaryIcon className={`w-8 h-8 text-${primaryDosha}`} />
                      </div>
                    )}
                    <div>
                      <div className="font-serif text-xl font-semibold capitalize flex items-center gap-2">
                        {assessment.constitutionType === 'single' 
                          ? assessment.primaryDosha 
                          : `${assessment.primaryDosha}-${assessment.secondaryDosha}`
                        }
                        <Sparkles className="w-4 h-4 text-primary" />
                      </div>
                      <div className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
                        {assessment.constitutionType === 'single' ? 'Single' : 'Dual'} Dosha Profile
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Link href="/results">
                      <Button variant="default" className="gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all" data-testid="button-view-results">
                        Explore Full Profile
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Link href="/quiz">
                      <Button variant="outline" size="sm" className="bg-transparent border-border/60" data-testid="button-retake-quiz">
                        Retake Assessment
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <Link href="/quiz">
                  <Button className="w-full gap-2 py-6 text-lg shadow-lg shadow-primary/20" data-testid="button-take-quiz">
                    <Sparkles className="w-5 h-5" />
                    Start Assessment
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
          
          {/* Food Recommendations Card */}
          <Card className={`overflow-hidden relative group ${!assessment ? 'opacity-60 bg-muted/5' : 'bg-card/40 backdrop-blur-md border-border/40'}`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full -mr-16 -mt-16 blur-3xl transition-all group-hover:bg-accent/10" />
            <CardHeader className="relative">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 shadow-sm">
                <Utensils className="w-6 h-6 text-accent-foreground" />
              </div>
              <CardTitle className="font-serif text-2xl">Food Wisdom</CardTitle>
              <CardDescription className="text-base">
                Discover nutritional choices perfectly aligned with your body
              </CardDescription>
            </CardHeader>
            <CardContent className="relative">
              {assessment ? (
                <div className="flex flex-col gap-4">
                  <Link href="/foods?mode=balanced">
                    <Button variant="secondary" className="w-full gap-2 py-6 text-lg hover:bg-accent/20 transition-all border border-accent/20" data-testid="button-balanced-diet">
                      <Scale className="w-5 h-5 text-accent-foreground" />
                      Explore Balanced Foods
                    </Button>
                  </Link>
                  <Link href="/health-goals">
                    <Button variant="outline" className="w-full gap-2 py-6 text-lg hover:bg-primary/5 transition-all border-border/60" data-testid="button-health-goals">
                      <Target className="w-5 h-5 text-primary" />
                      Set Health Goals
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="text-center py-6 px-4 bg-background/40 rounded-2xl border border-dashed border-border">
                  <p className="text-muted-foreground leading-relaxed">
                    Complete your profile analysis to unlock a personalized nutritional database specifically for your dosha.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Dosha Info Cards (if assessed) */}
        {assessment && primaryDosha && (
          <motion.div variants={itemVariants} className="mt-12">
            <h2 className="font-serif text-2xl font-bold mb-6 flex items-center gap-3">
              Understanding Your Constitution
              <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
            </h2>
            <Card className="bg-card/40 backdrop-blur-md border-border/40 overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  <div className={`md:w-1/3 p-8 flex flex-col items-center justify-center text-center bg-${primaryDosha}/5 border-b md:border-b-0 md:border-r border-border/40`}>
                    {PrimaryIcon && (
                      <div className={`w-24 h-24 rounded-3xl bg-${primaryDosha}/10 flex items-center justify-center mb-4 shadow-inner ring-1 ring-${primaryDosha}/20`}>
                        <PrimaryIcon className={`w-12 h-12 text-${primaryDosha}`} />
                      </div>
                    )}
                    <h3 className="font-serif text-2xl font-bold capitalize text-foreground">
                      {doshaDescriptions[primaryDosha].name}
                    </h3>
                    <div className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-1">
                      Dominance
                    </div>
                  </div>
                  <div className="md:w-2/3 p-8">
                    <p className="text-lg text-foreground/90 leading-relaxed mb-8 italic font-serif">
                      "{doshaDescriptions[primaryDosha].description}"
                    </p>
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Core Qualities</h4>
                      <div className="flex flex-wrap gap-3">
                        {doshaDescriptions[primaryDosha].qualities.map((quality) => (
                          <div 
                            key={quality}
                            className={`px-4 py-2 rounded-xl text-sm font-medium bg-${primaryDosha}/5 border border-${primaryDosha}/20 text-foreground transition-all hover:bg-${primaryDosha}/10`}
                          >
                            {quality}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.main>
    </div>
  );
}
