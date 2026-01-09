import { type Express, type RequestHandler } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import bcrypt from "bcrypt";
import { db } from "./db";
import { users, members, loginSchema, registerSchema } from "@shared/schema";
import { eq } from "drizzle-orm";

const SALT_ROUNDS = 12;

export function setupSession(app: Express) {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  
  // Trust proxy for Replit environment (required for secure cookies behind proxy)
  app.set("trust proxy", 1);
  
  // Detect if running in Replit's HTTPS environment (REPL_SLUG indicates Replit)
  const isReplitProduction = !!process.env.REPL_SLUG || !!process.env.REPLIT_DEPLOYMENT;
  
  app.use(session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isReplitProduction,
      maxAge: sessionTtl,
      sameSite: isReplitProduction ? "none" : "lax",
    },
  }));
}

export function registerAuthRoutes(app: Express) {
  // Register new admin user
  app.post("/api/auth/register", async (req, res) => {
    try {
      const result = registerSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid input", details: result.error.issues });
      }

      const { email, password, firstName, lastName } = result.data;

      // Check if user already exists
      const [existingUser] = await db.select().from(users).where(eq(users.email, email));
      if (existingUser) {
        return res.status(409).json({ error: "Email already registered" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      // Create user
      const [newUser] = await db.insert(users).values({
        email,
        password: hashedPassword,
        firstName: firstName || null,
        lastName: lastName || null,
      }).returning();

      // Set session and save it explicitly
      (req.session as any).userId = newUser.id;
      req.session.save((err) => {
        if (err) {
          console.error("Error saving session:", err);
          return res.status(500).json({ error: "Failed to register user" });
        }
        res.status(201).json({
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
        });
      });
    } catch (error) {
      console.error("Error registering user:", error);
      res.status(500).json({ error: "Failed to register user" });
    }
  });

  // Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const result = loginSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid input", details: result.error.issues });
      }

      const { email, password } = result.data;

      // Find user
      const [user] = await db.select().from(users).where(eq(users.email, email));
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Verify password
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Set session and save it explicitly
      (req.session as any).userId = user.id;
      req.session.save((err) => {
        if (err) {
          console.error("Error saving session:", err);
          return res.status(500).json({ error: "Failed to log in" });
        }
        res.json({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        });
      });
    } catch (error) {
      console.error("Error logging in:", error);
      res.status(500).json({ error: "Failed to log in" });
    }
  });

  // Get current user
  app.get("/api/auth/user", async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.clearCookie("connect.sid");
      res.json({ success: true });
    });
  });
}

// Authentication middleware for admin
export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const userId = (req.session as any).userId;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  (req as any).user = user;
  next();
};

// Authentication middleware for members
export const isMemberAuthenticated: RequestHandler = async (req, res, next) => {
  const memberId = (req.session as any).memberId;
  if (!memberId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const [member] = await db.select().from(members).where(eq(members.id, memberId));
  if (!member) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  (req as any).member = member;
  next();
};

// Check if member has active subscription (non-bronze tier with valid expiry)
function hasActiveSubscription(member: typeof members.$inferSelect): boolean {
  if (!member.membershipTier || member.membershipTier === "bronze") {
    return false;
  }
  if (member.membershipExpiresAt) {
    return new Date(member.membershipExpiresAt) > new Date();
  }
  return true;
}

// Subscription validation middleware - requires active membership
export const requireActiveMembership: RequestHandler = async (req, res, next) => {
  const memberId = (req.session as any).memberId;
  if (!memberId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const [member] = await db.select().from(members).where(eq(members.id, memberId));
  if (!member) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!hasActiveSubscription(member)) {
    return res.status(403).json({ error: "Subscription required", code: "SUBSCRIPTION_REQUIRED" });
  }

  (req as any).member = member;
  next();
};

// Role-based access control middleware factory
export const requireRole = (...allowedRoles: string[]): RequestHandler => {
  return async (req, res, next) => {
    const userId = (req.session as any).userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: "Forbidden - Insufficient permissions" });
    }

    (req as any).user = user;
    next();
  };
};

// Super Admin only middleware
export const isSuperAdmin: RequestHandler = async (req, res, next) => {
  const userId = (req.session as any).userId;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user || user.role !== "super_admin") {
    return res.status(403).json({ error: "Forbidden - Super Admin access required" });
  }

  (req as any).user = user;
  next();
};

// Content Admin or above middleware
export const isContentAdmin: RequestHandler = async (req, res, next) => {
  const userId = (req.session as any).userId;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user || !["super_admin", "content_admin"].includes(user.role)) {
    return res.status(403).json({ error: "Forbidden - Content Admin access required" });
  }

  (req as any).user = user;
  next();
};

// Member (regular user) routes
export function registerMemberRoutes(app: Express) {
  // Register new member
  app.post("/api/members/register", async (req, res) => {
    try {
      const result = registerSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid input", details: result.error.issues });
      }

      const { email, password, firstName, lastName } = result.data;

      // Check if member already exists
      const [existingMember] = await db.select().from(members).where(eq(members.email, email));
      if (existingMember) {
        return res.status(409).json({ error: "Email already registered" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      // Create member
      const [newMember] = await db.insert(members).values({
        email,
        password: hashedPassword,
        firstName: firstName || null,
        lastName: lastName || null,
      }).returning();

      // Set session and save it explicitly
      (req.session as any).memberId = newMember.id;
      req.session.save((err) => {
        if (err) {
          console.error("Error saving session:", err);
          return res.status(500).json({ error: "Failed to register" });
        }
        res.status(201).json({
          id: newMember.id,
          email: newMember.email,
          firstName: newMember.firstName,
          lastName: newMember.lastName,
          membershipTier: newMember.membershipTier,
          membershipExpiresAt: newMember.membershipExpiresAt,
        });
      });
    } catch (error) {
      console.error("Error registering member:", error);
      res.status(500).json({ error: "Failed to register" });
    }
  });

  // Member login
  app.post("/api/members/login", async (req, res) => {
    try {
      const result = loginSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid input", details: result.error.issues });
      }

      const { email, password } = result.data;

      // Find member
      const [member] = await db.select().from(members).where(eq(members.email, email));
      if (!member) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Verify password
      const isValid = await bcrypt.compare(password, member.password);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Set session and save it explicitly
      (req.session as any).memberId = member.id;
      req.session.save((err) => {
        if (err) {
          console.error("Error saving session:", err);
          return res.status(500).json({ error: "Failed to log in" });
        }
        res.json({
          id: member.id,
          email: member.email,
          firstName: member.firstName,
          lastName: member.lastName,
          membershipTier: member.membershipTier,
          membershipExpiresAt: member.membershipExpiresAt,
        });
      });
    } catch (error) {
      console.error("Error logging in:", error);
      res.status(500).json({ error: "Failed to log in" });
    }
  });

  // Get current member
  app.get("/api/members/me", async (req, res) => {
    try {
      const memberId = (req.session as any).memberId;
      if (!memberId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const [member] = await db.select().from(members).where(eq(members.id, memberId));
      if (!member) {
        return res.status(401).json({ error: "User not found" });
      }

      res.json({
        id: member.id,
        email: member.email,
        firstName: member.firstName,
        lastName: member.lastName,
        membershipTier: member.membershipTier,
        membershipExpiresAt: member.membershipExpiresAt,
      });
    } catch (error) {
      console.error("Error fetching member:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Member logout
  app.post("/api/members/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.clearCookie("connect.sid");
      res.json({ success: true });
    });
  });
}
