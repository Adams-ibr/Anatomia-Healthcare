import * as dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';
import * as schema from '../shared/schema';

// This script expects that the billing_migration.sql has been executed
// on the Supabase instance to create the underlying tables.

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Cannot seed database.");
    process.exit(1);
}

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seed() {
    console.log("Seeding Membership Plans, Pricing, and Features...");

    // 1. Core Plans
    const plans = [
        { name: "Bronze", description: "Free trial and entry-level access.", access_level: 1, is_active: true },
        { name: "Silver", description: "Standard models and basic clinical features.", access_level: 2, is_active: true },
        { name: "Gold", description: "Professional access to advanced models and analytics.", access_level: 3, is_active: true },
        { name: "Diamond", description: "Total access, offline mode, and 3D simulations.", access_level: 4, is_active: true }
    ];

    const planIds: Record<string, string> = {};

    for (const plan of plans) {
        // Check if exists
        const { data: existing } = await supabase.from('membership_plans').select('id').eq('name', plan.name).maybeSingle();
        let planId;
        if (existing) {
            planId = existing.id;
            // Update definition if needed
            await supabase.from('membership_plans').update(plan).eq('id', planId);
        } else {
            const { data: created, error } = await supabase.from('membership_plans').insert(plan).select('id').single();
            if (error) throw error;
            planId = created.id;
        }
        planIds[plan.name] = planId;
        console.log(`Plan [${plan.name}] ready (ID: ${planId})`);
    }

    // 2. Pricing Matrices (in Kobo: 1 NGN = 100 kobo)
    // Converting the user's USD assumptions to local kobo equivalents for Paystack/Flutterwave
    // Assuming nominal $5 = ~5000 NGN = 500,000 kobo for this demo context.
    // Bronze is $0.
    const pricingMatrix = [
        // Bronze
        { plan_id: planIds["Bronze"], user_type: "student", monthly_price: 0 },
        { plan_id: planIds["Bronze"], user_type: "professional", monthly_price: 0 },
        // Silver (Student: $5/mo, Pro: $10/mo) -> e.g 500k vs 1m kobo
        { plan_id: planIds["Silver"], user_type: "student", monthly_price: 500000 },
        { plan_id: planIds["Silver"], user_type: "professional", monthly_price: 1000000 },
        // Gold (Student: $8/mo, Pro: $15/mo)
        { plan_id: planIds["Gold"], user_type: "student", monthly_price: 800000 },
        { plan_id: planIds["Gold"], user_type: "professional", monthly_price: 1500000 },
        // Diamond (Student: $10/mo, Pro: $20/mo)
        { plan_id: planIds["Diamond"], user_type: "student", monthly_price: 1000000 },
        { plan_id: planIds["Diamond"], user_type: "professional", monthly_price: 2000000 },
    ];

    // Cleanup old pricing structure
    await supabase.from('plan_pricing').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    console.log("Inserting new Pricing Matrix...");
    const { error: priceError } = await supabase.from('plan_pricing').insert(pricingMatrix);
    if (priceError) throw priceError;


    // 3. Feature Matrix
    const featureMatrix = [
        { plan: "Bronze", keys: ["preview_models", "limited_courses", "quiz_attempt_limit_5"] },
        { plan: "Silver", keys: ["full_basic_models", "all_basic_courses", "unlimited_basic_quizzes", "progress_tracking", "watermarked_certificates"] },
        { plan: "Gold", keys: ["advanced_models", "clinical_case_studies", "advanced_question_banks", "mock_exams", "downloadable_certificates", "performance_analytics"] },
        { plan: "Diamond", keys: ["all_3d_anatomy", "advanced_simulations", "osce_exam_prep", "ai_quiz_generator", "unlimited_mock_exams", "premium_certificates", "offline_access", "priority_support"] }
    ];

    // Cleanup old features
    await supabase.from('feature_access').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log("Inserting new Feature Matrix...");

    for (const mapping of featureMatrix) {
        const planId = planIds[mapping.plan];
        for (const key of mapping.keys) {
            await supabase.from('feature_access').insert({
                plan_id: planId,
                feature_key: key,
                is_enabled: true
            });
        }
        // Cumulative logic: Higher tiers inherit lower tier features
        if (mapping.plan === "Silver" || mapping.plan === "Gold" || mapping.plan === "Diamond") {
            for (const key of featureMatrix[0].keys) if (!key.includes("limit")) await supabase.from('feature_access').insert({ plan_id: planId, feature_key: key });
        }
        if (mapping.plan === "Gold" || mapping.plan === "Diamond") {
            for (const key of featureMatrix[1].keys) await supabase.from('feature_access').insert({ plan_id: planId, feature_key: key });
        }
        if (mapping.plan === "Diamond") {
            for (const key of featureMatrix[2].keys) await supabase.from('feature_access').insert({ plan_id: planId, feature_key: key });
        }
    }

    console.log("Seeding complete! The dynamic plan and feature tables are ready.");
}

seed().catch(err => {
    console.error("Seed error:", err);
    process.exit(1);
});
