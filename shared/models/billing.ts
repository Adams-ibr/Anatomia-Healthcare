import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User types for differentiated pricing
export const userTypes = ["student", "professional"] as const;
export type UserType = typeof userTypes[number];

// Core Membership Plans (e.g. Bronze, Silver, Gold, Diamond)
export const membershipPlans = pgTable("membership_plans", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    name: varchar("name").notNull().unique(), // Basic, Pro, etc.
    description: text("description"),
    accessLevel: integer("access_level").default(1), // 1=Bronze, 2=Silver, 3=Gold, 4=Diamond
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMembershipPlanSchema = createInsertSchema(membershipPlans).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});

export type InsertMembershipPlan = z.infer<typeof insertMembershipPlanSchema>;
export type MembershipPlan = typeof membershipPlans.$inferSelect;

// Dynamic Pricing per Plan and User Type
export const planPricing = pgTable("plan_pricing", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    planId: varchar("plan_id").references(() => membershipPlans.id).notNull(),
    userType: varchar("user_type", { enum: ["student", "professional"] }).notNull(),
    monthlyPrice: integer("monthly_price").notNull(), // Stored in lowest denominator (kobo/cents)
    yearlyPrice: integer("yearly_price"), // Optional yearly discount
    currency: varchar("currency").default("NGN"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPlanPricingSchema = createInsertSchema(planPricing).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});

export type InsertPlanPricing = z.infer<typeof insertPlanPricingSchema>;
export type PlanPricing = typeof planPricing.$inferSelect;

// Granular Feature Gating
export const featureAccess = pgTable("feature_access", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    planId: varchar("plan_id").references(() => membershipPlans.id).notNull(),
    featureKey: varchar("feature_key").notNull(), // e.g., 'access_advanced_models'
    isEnabled: boolean("is_enabled").default(true),
    createdAt: timestamp("created_at").defaultNow(),
});

export const insertFeatureAccessSchema = createInsertSchema(featureAccess).omit({
    id: true,
    createdAt: true,
});

export type InsertFeatureAccess = z.infer<typeof insertFeatureAccessSchema>;
export type FeatureAccess = typeof featureAccess.$inferSelect;
