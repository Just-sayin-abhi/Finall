import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import memorystore from "memorystore";
import crypto from "node:crypto";
import { storage } from "./storage";

function normalizeEmail(input: unknown): string {
  if (typeof input !== "string") return "";
  return input.trim().toLowerCase();
}

function hashPassword(password: string, saltBase64: string): string {
  const salt = Buffer.from(saltBase64, "base64");
  const hash = crypto.scryptSync(password, salt, 64);
  return hash.toString("base64");
}

function verifyPassword(password: string, saltBase64: string, expectedHashBase64: string): boolean {
  const actual = Buffer.from(hashPassword(password, saltBase64), "base64");
  const expected = Buffer.from(expectedHashBase64, "base64");
  if (actual.length !== expected.length) return false;
  return crypto.timingSafeEqual(actual, expected);
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  
  // Use in-memory store (no database dependency)
  const MemoryStore = memorystore(session);
  const sessionStore = new MemoryStore({
    checkPeriod: 86400000, // prune expired entries every 24h
  });
  
  return session({
    secret: process.env.SESSION_SECRET || "dev_secret_key",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // localhost doesn't support secure cookies
      maxAge: sessionTtl,
      sameSite: "lax",
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());

  // Password signup endpoint
  app.post("/api/signup", async (req, res) => {
    try {
      const email = normalizeEmail(req.body?.email);
      const password = typeof req.body?.password === "string" ? req.body.password : "";
      const firstName = typeof req.body?.firstName === "string" ? req.body.firstName : "User";
      const lastName = typeof req.body?.lastName === "string" ? req.body.lastName : "";

      if (!email) return res.status(400).json({ message: "Email is required" });
      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }

      const existing = await storage.getUserByEmail(email);
      if (existing?.passwordHash) {
        return res.status(409).json({ message: "Account already exists. Please log in." });
      }

      const salt = crypto.randomBytes(16).toString("base64");
      const passwordHash = hashPassword(password, salt);
      const userId = existing?.id ?? email;
      const user = await storage.upsertUser({
        id: userId,
        email,
        firstName,
        lastName,
        profileImageUrl: existing?.profileImageUrl ?? null,
        authProvider: "password",
        passwordSalt: salt,
        passwordHash,
      });

      (req.session as any).userId = user.id;
      (req.session as any).user = user;
      req.session?.save((err) => {
        if (err) return res.status(500).json({ message: "Session save failed" });
        res.json({ success: true, user });
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ message: "Signup failed" });
    }
  });

  // Password login endpoint
  app.post("/api/login/password", async (req, res) => {
    try {
      const email = normalizeEmail(req.body?.email);
      const password = typeof req.body?.password === "string" ? req.body.password : "";

      if (!email) return res.status(400).json({ message: "Email is required" });
      if (!password) return res.status(400).json({ message: "Password is required" });

      const user = await storage.getUserByEmail(email);
      if (!user?.passwordHash || !user.passwordSalt) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      if (!verifyPassword(password, user.passwordSalt, user.passwordHash)) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      (req.session as any).userId = user.id;
      (req.session as any).user = user;
      req.session?.save((err) => {
        if (err) return res.status(500).json({ message: "Session save failed" });
        res.json({ success: true, user });
      });
    } catch (error) {
      console.error("Password login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Simple login endpoint - just email-based
  app.post("/api/login", async (req, res) => {
    try {
      const { email, firstName = "User", lastName = "" } = req.body;
      const normalizedEmail = normalizeEmail(email);

      if (!normalizedEmail) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Create or get user
      const user = await storage.upsertUser({
        id: normalizedEmail, // Use email as ID for simplicity
        email: normalizedEmail,
        firstName,
        lastName,
        profileImageUrl: null,
      });

      // Set user in session
      (req.session as any).userId = user.id;
      (req.session as any).user = user;

      req.session?.save((err) => {
        if (err) {
          return res.status(500).json({ message: "Session save failed" });
        }
        res.json({ success: true, user });
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Logout endpoint
  app.get("/api/logout", (req, res) => {
    req.session?.destroy((err) => {
      if (err) {
        return res.redirect("/");
      }
      res.redirect("/");
    });
  });

  // Get current user
  app.get("/api/auth/user", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
}

// Middleware to check if user is authenticated
export const isAuthenticated: RequestHandler = (req, res, next) => {
  const userId = (req.session as any)?.userId;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Attach userId to request for use in route handlers
  (req as any).userId = userId;
  next();
};
