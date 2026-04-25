import {
  users,
  userProfiles,
  doshaAssessments,
  userHealthGoals,
  wellnessCheckins,
  mealPlans,
  type User,
  type UpsertUser,
  type UserProfile,
  type InsertUserProfile,
  type DoshaAssessment,
  type InsertDoshaAssessment,
  type UserHealthGoal,
  type InsertUserHealthGoal,
  type WellnessCheckin,
  type InsertWellnessCheckin,
} from "@shared/schema";
import { db } from "./db";
import { eq, asc, and } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  getProfile(userId: string): Promise<UserProfile | undefined>;
  createProfile(profile: InsertUserProfile): Promise<UserProfile>;
  updateProfile(userId: string, profile: Partial<InsertUserProfile>): Promise<UserProfile | undefined>;
  
  getDoshaAssessment(userId: string): Promise<DoshaAssessment | undefined>;
  createDoshaAssessment(assessment: InsertDoshaAssessment): Promise<DoshaAssessment>;
  
  getHealthGoal(userId: string): Promise<UserHealthGoal | undefined>;
  upsertHealthGoal(goal: InsertUserHealthGoal): Promise<UserHealthGoal>;

  getWellnessCheckins(userId: string): Promise<WellnessCheckin[]>;
  createWellnessCheckin(checkin: InsertWellnessCheckin): Promise<WellnessCheckin>;

  getMealPlan(userId: string, goal: string): Promise<any | undefined>;
  saveMealPlan(userId: string, goal: string, planData: any): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getProfile(userId: string): Promise<UserProfile | undefined> {
    const result = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId));
    return result[0];
  }

  async createProfile(profile: InsertUserProfile): Promise<UserProfile> {
    const [newProfile] = await db.insert(userProfiles).values({
      ...profile,
      onboardingComplete: 1,
    }).returning();
    return newProfile;
  }

  async updateProfile(userId: string, profile: Partial<InsertUserProfile>): Promise<UserProfile | undefined> {
    const [updated] = await db
      .update(userProfiles)
      .set({ ...profile, updatedAt: new Date() })
      .where(eq(userProfiles.userId, userId))
      .returning();
    return updated;
  }

  async getDoshaAssessment(userId: string): Promise<DoshaAssessment | undefined> {
    const result = await db
      .select()
      .from(doshaAssessments)
      .where(eq(doshaAssessments.userId, userId))
      .orderBy(doshaAssessments.createdAt);
    return result[result.length - 1];
  }

  async createDoshaAssessment(assessment: InsertDoshaAssessment): Promise<DoshaAssessment> {
    const [newAssessment] = await db.insert(doshaAssessments).values(assessment).returning();
    return newAssessment;
  }

  async getHealthGoal(userId: string): Promise<UserHealthGoal | undefined> {
    const result = await db.select().from(userHealthGoals).where(eq(userHealthGoals.userId, userId));
    return result[0];
  }

  async upsertHealthGoal(goal: InsertUserHealthGoal): Promise<UserHealthGoal> {
    const existing = await this.getHealthGoal(goal.userId);
    
    if (existing) {
      const [updated] = await db
        .update(userHealthGoals)
        .set({ ...goal, updatedAt: new Date() })
        .where(eq(userHealthGoals.userId, goal.userId))
        .returning();
      return updated;
    }
    
    const [newGoal] = await db.insert(userHealthGoals).values(goal).returning();
    return newGoal;
  }

  async getWellnessCheckins(userId: string): Promise<WellnessCheckin[]> {
    return await db
      .select()
      .from(wellnessCheckins)
      .where(eq(wellnessCheckins.userId, userId))
      .orderBy(asc(wellnessCheckins.createdAt));
  }

  async createWellnessCheckin(checkin: InsertWellnessCheckin): Promise<WellnessCheckin> {
    const existing = await this.getWellnessCheckins(checkin.userId);
    const checkinNumber = existing.length + 1;
    const overallScore =
      checkin.energy +
      checkin.digestion +
      checkin.sleep +
      checkin.mood +
      checkin.mentalClarity +
      checkin.skinHealth +
      checkin.immunity +
      checkin.calmness;

    const [newCheckin] = await db
      .insert(wellnessCheckins)
      .values({ ...checkin, checkinNumber, overallScore })
      .returning();
    return newCheckin;
  }

  async getMealPlan(userId: string, goal: string): Promise<any | undefined> {
    const result = await db.select().from(mealPlans)
      .where(and(eq(mealPlans.userId, userId), eq(mealPlans.goal, goal)));
    return result[0]?.planData;
  }

  async saveMealPlan(userId: string, goal: string, planData: any): Promise<void> {
    const existing = await db.select({ id: mealPlans.id }).from(mealPlans)
      .where(and(eq(mealPlans.userId, userId), eq(mealPlans.goal, goal)));
    if (existing.length > 0) {
      await db.update(mealPlans)
        .set({ planData, generatedAt: new Date() })
        .where(and(eq(mealPlans.userId, userId), eq(mealPlans.goal, goal)));
    } else {
      await db.insert(mealPlans).values({ userId, goal, planData });
    }
  }
}

export const storage = new DatabaseStorage();
