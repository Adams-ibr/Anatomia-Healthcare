import { type Express, type RequestHandler } from "express";
import session from "express-session";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { supabase } from "./db";
import { users, members, loginSchema, registerSchema, type User, type Member } from "../shared/schema";
import { sessionStore } from "./session";

const SALT_ROUNDS = 12;

const updateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

export function setupSession(app: Express) {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week

  // Trust proxy for Replit environment (required for secure cookies behind proxy)
  app.set("trust proxy", 1);

  // Check if we're in production
  const isProduction = process.env.NODE_ENV === "production";

  console.log(`Session config: NODE_ENV=${process.env.NODE_ENV}, isProduction=${isProduction}`);

  app.use(session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    name: "anatomia.sid",
    cookie: {
      httpOnly: true,
      secure: isProduction,
      maxAge: sessionTtl,
      sameSite: "lax",
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
      const { data: existingUser } = await supabase
        .from("users")
        .select()
        .eq("email", email)
        .single();

      if (existingUser) {
        return res.status(409).json({ error: "Email already registered" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      // Create user
      const { data: newUser, error: createError } = await supabase
        .from("users")
        .insert({
          email,
          password: hashedPassword,
          first_name: firstName || null,
          last_name: lastName || null,
          role: "content_admin", // Default role
          is_active: true,
        })
        .select()
        .single();

      if (createError || !newUser) {
        console.error("Error creating user:", createError);
        return res.status(500).json({ error: "Failed to register user" });
      }

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
          firstName: newUser.first_name,
          lastName: newUser.last_name,
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
      console.log(`Admin login attempt for: ${email}`);

      // Find user
      const { data: user } = await supabase
        .from("users")
        .select()
        .eq("email", email)
        .single();

      if (!user) {
        console.log(`Admin login failed: user not found for ${email}`);
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Verify password
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        console.log(`Admin login failed: invalid password for ${email}`);
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Set session and save it explicitly
      (req.session as any).userId = user.id;
      console.log(`Admin login: setting userId in session: ${user.id}`);

      req.session.save((err) => {
        if (err) {
          console.error("Error saving admin session:", err);
          return res.status(500).json({ error: "Failed to log in" });
        }
        console.log(`Admin login successful for ${email}, session ID: ${req.sessionID}`);
        res.json({
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
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

      const { data: user } = await supabase
        .from("users")
        .select()
        .eq("id", userId)
        .single();

      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      res.json({
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
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
      res.clearCookie("anatomia.sid");
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

  const { data: user } = await supabase.from("users").select().eq("id", userId).single();
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

  const { data: member } = await supabase.from("members").select().eq("id", memberId).single();
  if (!member) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  (req as any).member = member;
  next();
};

// Check if member has active subscription (non-bronze tier with valid expiry)
function hasActiveSubscription(member: any): boolean {
  if (!member.membership_tier || member.membership_tier === "bronze") {
    return false;
  }
  if (member.membership_expires_at) {
    return new Date(member.membership_expires_at) > new Date();
  }
  return true;
}

// Subscription validation middleware - requires active membership
export const requireActiveMembership: RequestHandler = async (req, res, next) => {
  const memberId = (req.session as any).memberId;
  if (!memberId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { data: member } = await supabase.from("members").select().eq("id", memberId).single();
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

    const { data: user } = await supabase.from("users").select().eq("id", userId).single();
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

  const { data: user } = await supabase.from("users").select().eq("id", userId).single();
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

  const { data: user } = await supabase.from("users").select().eq("id", userId).single();
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
      const { data: existingMember } = await supabase
        .from("members")
        .select()
        .eq("email", email)
        .single();

      if (existingMember) {
        return res.status(409).json({ error: "Email already registered" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      // Create member
      const { data: newMember, error: createError } = await supabase
        .from("members")
        .insert({
          email,
          password: hashedPassword,
          first_name: firstName || null,
          last_name: lastName || null,
          membership_tier: "bronze",
        })
        .select()
        .single();

      if (createError || !newMember) {
        console.error("Error creating member:", createError);
        return res.status(500).json({ error: "Failed to register" });
      }

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
          firstName: newMember.first_name,
          lastName: newMember.last_name,
          membershipTier: newMember.membership_tier,
          membershipExpiresAt: newMember.membership_expires_at,
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
      const { data: member } = await supabase
        .from("members")
        .select()
        .eq("email", email)
        .single();

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
          firstName: member.first_name,
          lastName: member.last_name,
          membershipTier: member.membership_tier,
          membershipExpiresAt: member.membership_expires_at,
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

      const { data: member } = await supabase.from("members").select().eq("id", memberId).single();
      if (!member) {
        return res.status(401).json({ error: "User not found" });
      }

      res.json({
        id: member.id,
        email: member.email,
        firstName: member.first_name,
        lastName: member.last_name,
        membershipTier: member.membership_tier,
        membershipExpiresAt: member.membership_expires_at,
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
      res.clearCookie("anatomia.sid");
      res.json({ success: true });
    });
  });

  // Update member profile
  app.patch("/api/members/me", async (req, res) => {
    try {
      const memberId = (req.session as any).memberId;
      if (!memberId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const result = updateProfileSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid input", details: result.error.issues });
      }

      const { firstName, lastName } = result.data;

      const updateData: any = {};
      if (firstName !== undefined) updateData.first_name = firstName;
      if (lastName !== undefined) updateData.last_name = lastName;

      const { data: updatedMember, error: updateError } = await supabase
        .from("members")
        .update(updateData)
        .eq("id", memberId)
        .select()
        .single();

      if (updateError || !updatedMember) {
        throw updateError || new Error("Failed to update");
      }

      res.json({
        id: updatedMember.id,
        email: updatedMember.email,
        firstName: updatedMember.first_name,
        lastName: updatedMember.last_name,
        membershipTier: updatedMember.membership_tier,
        membershipExpiresAt: updatedMember.membership_expires_at,
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Change member password
  app.post("/api/members/change-password", async (req, res) => {
    try {
      const memberId = (req.session as any).memberId;
      if (!memberId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const result = changePasswordSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid input", details: result.error.issues });
      }

      const { currentPassword, newPassword } = result.data;

      const { data: member } = await supabase.from("members").select().eq("id", memberId).single();
      if (!member) {
        return res.status(401).json({ error: "User not found" });
      }

      // Verify current password
      const isValid = await bcrypt.compare(currentPassword, member.password);
      if (!isValid) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

      await supabase
        .from("members")
        .update({ password: hashedPassword })
        .eq("id", memberId);

      res.json({ success: true, message: "Password changed successfully" });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ error: "Failed to change password" });
    }
  });
}
