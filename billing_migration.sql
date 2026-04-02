-- Execute this script in your Supabase SQL Editor to apply the membership pricing updates

-- 1. Create the new membership tables
CREATE TABLE IF NOT EXISTS "membership_plans" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"access_level" integer DEFAULT 1,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "membership_plans_name_unique" UNIQUE("name")
);

CREATE TABLE IF NOT EXISTS "plan_pricing" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" varchar NOT NULL,
	"user_type" varchar NOT NULL,
	"monthly_price" integer NOT NULL,
	"yearly_price" integer,
	"currency" varchar DEFAULT 'NGN',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "feature_access" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" varchar NOT NULL,
	"feature_key" varchar NOT NULL,
	"is_enabled" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);

-- 2. Add foreign key constraints
ALTER TABLE "feature_access" ADD CONSTRAINT "feature_access_plan_id_membership_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."membership_plans"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "plan_pricing" ADD CONSTRAINT "plan_pricing_plan_id_membership_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."membership_plans"("id") ON DELETE cascade ON UPDATE no action;

-- 3. Update the existing members table
ALTER TABLE "members" ADD COLUMN IF NOT EXISTS "user_type" varchar DEFAULT 'student' NOT NULL;
