import { type Express, type RequestHandler } from "express";
import session from "express-session";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getFirebaseAdminFirestore, getFirebaseAdminAuth, serverTimestamp } from "./lib/firebase";
import { users, members, loginSchema, registerSchema, type User, type Member } from "../shared/schema";
import { sessionStore } from "./session";
import { sendErrorResponse } from "./errorHandler";

declare global {
  namespace Express {
    interface Request {
      user?: User;
      member?: Member;
    }
  }
}

declare module "express-session" {
  interface SessionData {
    userId?: string;
    memberId?: string;
  }
}

const SALT_ROUNDS = 12;

const updateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
});

const passwordValidation = z.string()
  .min(12, "Password must be at least 12 characters")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/\d/, "Password must contain at least one number")
  .regex(/[@$!%*?&_\-#]/, "Password must contain at least one special character (@$!%*?&_-#)");

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordValidation,
});

function toCamelCase<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  if (!obj || typeof obj !== "object" || Array.isArray(obj) || obj instanceof Date) {
    return obj as Record<string, unknown>;
  }
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = value;
  }
  return result;
}

export function setupSession(app: Express) {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000;

  app.set("trust proxy", 1);

  const isProduction = process.env.NODE_ENV === "production";

  console.log(`Session config: NODE_ENV=${process.env.NODE_ENV}, isProduction=${isProduction}`);

  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    const message = "SESSION_SECRET environment variable is required and must be set to a secure random string";
    console.error(message);
    throw new Error(message);
  }

  if (secret.includes("fallback") || secret.includes("development")) {
    const message = "SESSION_SECRET must not contain 'fallback' or 'development'. Set a secure random string for production.";
    console.error(message);
    throw new Error(message);
  }

  if (secret.length < 32) {
    const message = `SESSION_SECRET must be at least 32 characters long for security (current length: ${secret.length})`;
    console.error(message);
    throw new Error(message);
  }

  app.use(session({
    secret: secret,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    proxy: true,
    name: "anatomia.sid",
    cookie: {
      httpOnly: true,
      secure: isProduction ? "auto" : false,
      maxAge: sessionTtl,
      sameSite: "lax",
    },
  }));
}

export function registerAuthRoutes(app: Express) {
  const db = getFirebaseAdminFirestore();
  const auth = getFirebaseAdminAuth();

  app.post("/api/auth/register", async (req, res) => {
    try {
      const result = registerSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid input", details: result.error.issues });
      }

      const { email, password, firstName, lastName } = result.data;

      const userSnap = await db.collection("users").where("email", "==", email).limit(1).get();
      if (!userSnap.empty) {
        return res.status(409).json({ error: "Email already registered" });
      }

      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      const now = serverTimestamp();
      const userRef = db.collection("users").doc();
      await userRef.set({
        email,
        password: hashedPassword,
        firstName: firstName || null,
        lastName: lastName || null,
        role: "content_admin",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });

      const newUser = await userRef.get();
      const userData = { id: newUser.id, ...newUser.data() } as User;

      req.session.userId = userData.id;
      req.session.save((err) => {
        if (err) {
          console.error("Error saving session:", err);
          return res.status(500).json({ error: "Failed to register user" });
        }
        res.status(201).json({
          id: userData.id,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
        });
      });
    } catch (error) {
      console.error("Error registering user:", error);
      sendErrorResponse(res, 500, "Failed to register user", error);
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const result = loginSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid input", details: result.error.issues });
      }

      const { email, password } = result.data;
      console.log(`Admin login attempt for: ${email}`);

      const userSnap = await db.collection("users").where("email", "==", email).limit(1).get();
      if (userSnap.empty) {
        console.log(`Admin login failed: user not found for ${email}`);
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const userDoc = userSnap.docs[0];
      const user = { id: userDoc.id, ...userDoc.data() } as User;

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        console.log(`Admin login failed: invalid password for ${email}`);
        return res.status(401).json({ error: "Invalid email or password" });
      }

      req.session.userId = user.id;
      console.log(`Admin login: setting userId in session: ${user.id}`);

      req.session.save((err) => {
        if (err) {
          console.error("Error saving admin session:", err);
          return res.status(500).json({
            error: "Failed to log in",
            details: err instanceof Error ? err.message : String(err)
          });
        }
        console.log(`Admin login successful for ${email}, session ID: ${req.sessionID}`);
        res.json({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        });
      });
    } catch (error) {
      console.error("Error logging in:", error);
      sendErrorResponse(res, 500, "Failed to log in", error);
    }
  });

  app.get("/api/auth/user", async (req, res) => {
    try {
      console.log("[Auth] Checking session for user:", req.session.userId);
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const userSnap = await db.collection("users").doc(userId).get();
      if (!userSnap.exists) {
        console.warn("[Auth] Session active but user not found in DB:", userId);
        return res.status(401).json({ error: "User not found" });
      }

      const user = { id: userSnap.id, ...userSnap.data() } as User;

      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      });
    } catch (error) {
      console.error("[Auth] Detailed error fetching user:", error);
      sendErrorResponse(res, 500, "Failed to fetch user", error);
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    try {
      req.session.destroy((err) => {
        if (err) {
          console.error("Error destroying session:", err);
          return res.status(500).json({ error: "Failed to logout" });
        }
        res.clearCookie("anatomia.sid");
        res.json({ success: true });
      });
    } catch (error) {
      console.error("Error in logout handler:", error);
      res.status(500).json({ error: "Internal logout error" });
    }
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const userId = req.session?.userId;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const db = getFirebaseAdminFirestore();
  const userSnap = await db.collection("users").doc(userId).get();
  if (!userSnap.exists) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  req.user = { id: userSnap.id, ...userSnap.data() } as User;
  next();
};

export const isMemberAuthenticated: RequestHandler = async (req, res, next) => {
  const memberId = req.session?.memberId;
  if (!memberId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const db = getFirebaseAdminFirestore();
  const memberSnap = await db.collection("members").doc(memberId).get();
  if (!memberSnap.exists) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  req.member = { id: memberSnap.id, ...memberSnap.data() } as Member;
  next();
};

function hasActiveSubscription(member: Member): boolean {
  if (!member.membershipTier || member.membershipTier === "bronze") {
    return false;
  }
  if (member.membershipExpiresAt) {
    return new Date(member.membershipExpiresAt) > new Date();
  }
  return true;
}

export const requireActiveMembership: RequestHandler = async (req, res, next) => {
  const memberId = req.session?.memberId;
  if (!memberId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const db = getFirebaseAdminFirestore();
  const memberSnap = await db.collection("members").doc(memberId).get();
  if (!memberSnap.exists) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const member = { id: memberSnap.id, ...memberSnap.data() } as Member;

  if (!hasActiveSubscription(member)) {
    return res.status(403).json({ error: "Subscription required", code: "SUBSCRIPTION_REQUIRED" });
  }

  req.member = member;
  next();
};

export const isSuperAdmin: RequestHandler = async (req, res, next) => {
  const userId = req.session?.userId;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const db = getFirebaseAdminFirestore();
  const userSnap = await db.collection("users").doc(userId).get();
  if (!userSnap.exists) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const user = { id: userSnap.id, ...userSnap.data() } as User;
  if (user.role !== "super_admin") {
    return res.status(403).json({ error: "Forbidden - Super Admin access required" });
  }

  req.user = user;
  next();
};

export const isContentAdmin: RequestHandler = async (req, res, next) => {
  const userId = req.session?.userId;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const db = getFirebaseAdminFirestore();
  const userSnap = await db.collection("users").doc(userId).get();
  if (!userSnap.exists) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const user = { id: userSnap.id, ...userSnap.data() } as User;
  if (!["super_admin", "content_admin"].includes(user.role)) {
    return res.status(403).json({ error: "Forbidden - Content Admin access required" });
  }

  req.user = user;
  next();
};

export function registerMemberRoutes(app: Express) {
  const db = getFirebaseAdminFirestore();

  app.post("/api/members/register", async (req, res) => {
    try {
      const result = registerSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid input", details: result.error.issues });
      }

      const { email, password, firstName, lastName } = result.data;

      const memberSnap = await db.collection("members").where("email", "==", email).limit(1).get();
      if (!memberSnap.empty) {
        return res.status(409).json({ error: "Email already registered" });
      }

      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      const now = serverTimestamp();
      const memberRef = db.collection("members").doc();
      await memberRef.set({
        email,
        password: hashedPassword,
        firstName: firstName || null,
        lastName: lastName || null,
        membershipTier: "bronze",
        createdAt: now,
        updatedAt: now,
      });

      const newMember = await memberRef.get();
      const memberData = { id: newMember.id, ...newMember.data() } as Member;

      req.session.memberId = memberData.id;
      req.session.save((err) => {
        if (err) {
          console.error("Error saving session:", err);
          return res.status(500).json({ error: "Failed to register" });
        }
        res.status(201).json({
          id: memberData.id,
          email: memberData.email,
          firstName: memberData.firstName,
          lastName: memberData.lastName,
          membershipTier: memberData.membershipTier,
          membershipExpiresAt: memberData.membershipExpiresAt,
        });
      });
    } catch (error) {
      console.error("Error fetching member:", error);
      res.status(500).json({
        error: "Failed to fetch user",
        details: error instanceof Error ? error.message : String(error),
        stack: process.env.NODE_ENV !== 'production' ? (error instanceof Error ? error.stack : undefined) : undefined
      });
    }
  });

  app.post("/api/members/login", async (req, res) => {
    try {
      const result = loginSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid input", details: result.error.issues });
      }

      const { email, password } = result.data;

      const memberSnap = await db.collection("members").where("email", "==", email).limit(1).get();
      if (memberSnap.empty) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const memberDoc = memberSnap.docs[0];
      const member = { id: memberDoc.id, ...memberDoc.data() } as Member;

      const isValid = await bcrypt.compare(password, member.password);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      req.session.memberId = member.id;
      req.session.save((err) => {
        if (err) {
          console.error("Error saving session:", err);
          return res.status(500).json({
            error: "Failed to log in",
            details: err instanceof Error ? err.message : String(err)
          });
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
      sendErrorResponse(res, 500, "Failed to log in", error);
    }
  });

  app.get("/api/members/me", async (req, res) => {
    try {
      const memberId = req.session?.memberId;
      if (!memberId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const memberSnap = await db.collection("members").doc(memberId).get();
      if (!memberSnap.exists) {
        return res.status(401).json({ error: "User not found" });
      }

      const member = { id: memberSnap.id, ...memberSnap.data() } as Member;

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
      sendErrorResponse(res, 500, "Failed to fetch user", error);
    }
  });

  app.post("/api/members/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.clearCookie("anatomia.sid");
      res.json({ success: true });
    });
  });

  app.patch("/api/members/me", async (req, res) => {
    try {
      const memberId = req.session?.memberId;
      if (!memberId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const result = updateProfileSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid input", details: result.error.issues });
      }

      const { firstName, lastName } = result.data;

      const updateData: Record<string, unknown> = {};
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      updateData.updatedAt = serverTimestamp();

      const memberRef = db.collection("members").doc(memberId);
      await memberRef.update(updateData);

      const updatedMemberSnap = await memberRef.get();
      const updatedMember = { id: updatedMemberSnap.id, ...updatedMemberSnap.data() } as Member;

      res.json({
        id: updatedMember.id,
        email: updatedMember.email,
        firstName: updatedMember.firstName,
        lastName: updatedMember.lastName,
        membershipTier: updatedMember.membershipTier,
        membershipExpiresAt: updatedMember.membershipExpiresAt,
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      sendErrorResponse(res, 500, "Failed to update profile", error);
    }
  });

  app.post("/api/members/change-password", async (req, res) => {
    try {
      const memberId = req.session?.memberId;
      if (!memberId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const result = changePasswordSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid input", details: result.error.issues });
      }

      const { currentPassword, newPassword } = result.data;

      const memberSnap = await db.collection("members").doc(memberId).get();
      if (!memberSnap.exists) {
        return res.status(401).json({ error: "User not found" });
      }

      const member = { id: memberSnap.id, ...memberSnap.data() } as Member;

      const isValid = await bcrypt.compare(currentPassword, member.password);
      if (!isValid) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

      await db.collection("members").doc(memberId).update({
        password: hashedPassword,
        updatedAt: serverTimestamp(),
      });

      res.json({ success: true, message: "Password changed successfully" });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ error: "Failed to change password" });
    }
  });
}