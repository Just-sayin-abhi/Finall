import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import memorystore from "memorystore";
import { storage } from "./storage";

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

  // Simple login endpoint - just email-based
  app.post("/api/login", async (req, res) => {
    try {
      const { email, firstName = "User", lastName = "" } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Create or get user
      const user = await storage.upsertUser({
        id: email, // Use email as ID for simplicity
        email,
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
