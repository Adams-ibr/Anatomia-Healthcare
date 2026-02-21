import { Router, Request, Response } from "express";
import { supabase } from "./db";
import { PaymentTransaction } from "../shared/schema";
import crypto from "crypto";
import { isMemberAuthenticated } from "./auth";

const router = Router();

function getDurationMonths(period?: string): number {
  if (!period) return 1;
  switch (period.toLowerCase()) {
    case 'yearly': return 12;
    case 'biannually': return 6;
    case 'quarterly': return 3;
    case 'monthly':
    default: return 1;
  }
}

// Fetch dynamic DB pricing for a specific tier and user type
async function fetchPlanPriceData(planName: string, userType: string, period: string) {
  const durationMonths = getDurationMonths(period);

  // Note: Using a joined query matching the membership_plans table by name.
  // Because the generated supabase JS client doesn't natively do named inner joins cleanly sometimes,
  // we do two simple queries:
  const { data: plan } = await supabase.from("membership_plans").select("id, name, access_level").ilike("name", planName).single();

  if (!plan) return null;

  const { data: pricing } = await supabase
    .from("plan_pricing")
    .select("monthly_price, yearly_price")
    .eq("plan_id", plan.id)
    .eq("user_type", userType)
    .single();

  if (!pricing) return null;

  const amountKobo = (durationMonths === 12 && pricing.yearly_price) ? pricing.yearly_price : pricing.monthly_price * durationMonths;
  return { amountKobo, durationMonths, planDescription: `${plan.name} (${userType}) - ${durationMonths} Months` };
}

async function createTransaction(
  memberId: string,
  tier: string,
  provider: string,
  reference: string,
  amount: number,
  durationMonths: number
): Promise<PaymentTransaction> {
  const { data, error } = await supabase
    .from("payment_transactions")
    .insert({
      member_id: memberId,
      amount: amount,
      currency: "NGN",
      membership_tier: tier,
      duration_months: durationMonths || 1,
      payment_provider: provider,
      provider_reference: reference,
      status: "pending",
    })
    .select("id, memberId:member_id, amount, currency, status, paymentProvider:payment_provider, providerReference:provider_reference, providerTransactionId:provider_transaction_id, membershipTier:membership_tier, durationMonths:duration_months, createdAt:created_at, updatedAt:updated_at")
    .single();

  if (error) throw error;
  return data;
}

// Function utilized by webhooks to extend membership expiry duration properly
async function updateMembershipTier(memberId: string, tier: string, durationMonths: number = 1) {
  const { data: member } = await supabase
    .from("members")
    .select("membership_expires_at")
    .eq("id", memberId)
    .single();

  let expiresAt = new Date();

  // If member already has an active subscription, append to it
  if (member?.membership_expires_at && new Date(member.membership_expires_at) > new Date()) {
    expiresAt = new Date(member.membership_expires_at);
  }

  expiresAt.setMonth(expiresAt.getMonth() + durationMonths);

  await supabase
    .from("members")
    .update({
      membership_tier: tier, // Upgrades to the new tier name
      membership_expires_at: expiresAt,
    })
    .eq("id", memberId);
}

router.post("/initialize-paystack", isMemberAuthenticated, async (req: Request, res: Response) => {
  try {
    const member = (req as any).member; // Attached by isMemberAuthenticated
    if (!member) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { period, tier } = req.body; // Removed 'audience', it's fetched directly from member.user_type
    if (!tier) {
      return res.status(400).json({ error: "Missing membership tier" });
    }

    const pricingInfo = await fetchPlanPriceData(tier, member.user_type || 'student', period || 'monthly');
    if (!pricingInfo) {
      return res.status(400).json({ error: "Invalid pricing configuration for this tier and user type." });
    }

    const { amountKobo, durationMonths, planDescription } = pricingInfo;

    const reference = `ps_${Date.now()}_${crypto.randomBytes(8).toString("hex")}`;
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecretKey) return res.status(500).json({ error: "Paystack not configured" });

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: member.email,
        amount: amountKobo, // Paystack requires smallest denomination
        reference,
        callback_url: `${process.env.APP_URL || req.headers.origin}/payment/verify`,
        metadata: {
          member_id: member.id,
          period: period || "monthly",
          user_type: member.user_type,
          tier: tier,
          duration_months: durationMonths,
        },
      }),
    });

    const data = await response.json();
    if (!data.status) {
      return res.status(400).json({ error: data.message || "Failed to initialize payment" });
    }

    await createTransaction(member.id, planDescription, "paystack", reference, amountKobo, durationMonths);

    res.json({
      authorization_url: data.data.authorization_url,
      reference: data.data.reference,
    });
  } catch (error) {
    console.error("Paystack initialization error:", error);
    res.status(500).json({ error: "Payment initialization failed" });
  }
});

router.post("/initialize-flutterwave", isMemberAuthenticated, async (req: Request, res: Response) => {
  try {
    const member = (req as any).member;
    if (!member) return res.status(401).json({ error: "Not authenticated" });

    const { period, tier } = req.body;
    if (!tier) return res.status(400).json({ error: "Missing membership tier" });

    const pricingInfo = await fetchPlanPriceData(tier, member.user_type || 'student', period || 'monthly');
    if (!pricingInfo) {
      return res.status(400).json({ error: "Invalid pricing configuration for this tier and user type." });
    }

    const { amountKobo, durationMonths, planDescription } = pricingInfo;
    const amount = amountKobo / 100; // Flutterwave expects standard currency format
    const reference = `fw_${Date.now()}_${crypto.randomBytes(8).toString("hex")}`;

    const flutterwaveSecretKey = process.env.FLUTTERWAVE_SECRET_KEY;
    if (!flutterwaveSecretKey) return res.status(500).json({ error: "Flutterwave not configured" });

    const response = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${flutterwaveSecretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tx_ref: reference,
        amount,
        currency: "NGN",
        redirect_url: `${process.env.APP_URL || req.headers.origin}/payment/verify`,
        customer: {
          email: member.email,
          name: `${member.first_name || ""} ${member.last_name || ""}`.trim() || member.email,
        },
        meta: {
          member_id: member.id,
          period: period || "monthly",
          user_type: member.user_type,
          tier: tier,
          duration_months: durationMonths,
        },
        customizations: {
          title: "Anatomia Membership",
          description: planDescription,
        },
      }),
    });

    const data = await response.json();
    if (data.status !== "success") {
      return res.status(400).json({ error: data.message || "Failed to initialize payment" });
    }

    await createTransaction(member.id, planDescription, "flutterwave", reference, amountKobo, durationMonths);

    res.json({
      authorization_url: data.data.link,
      reference,
    });
  } catch (error) {
    console.error("Flutterwave initialization error:", error);
    res.status(500).json({ error: "Payment initialization failed" });
  }
});

router.get("/verify-paystack/:reference", async (req: Request, res: Response) => {
  try {
    const { reference } = req.params;
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecretKey) return res.status(500).json({ error: "Paystack not configured" });

    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${paystackSecretKey}` },
    });
    const data = await response.json();

    if (!data.status || data.data.status !== "success") {
      return res.status(400).json({ error: "Payment verification failed", status: data.data?.status });
    }

    const { data: transaction } = await supabase
      .from("payment_transactions")
      .select("id, memberId:member_id, amount, currency, status, paymentProvider:payment_provider, providerReference:provider_reference, providerTransactionId:provider_transaction_id, membershipTier:membership_tier, durationMonths:duration_months, createdAt:created_at, updatedAt:updated_at")
      .eq("provider_reference", reference)
      .single();

    if (!transaction) return res.status(404).json({ error: "Transaction not found" });
    if (transaction.status === "success") return res.json({ message: "Payment already verified", status: "success" });

    // Extract raw tier name (format is typically "Gold (student) - X Months")
    const inferredTier = transaction.membershipTier.split(" ")[0] || "Gold";

    await supabase.from("payment_transactions").update({
      status: "success",
      provider_transaction_id: String(data.data.id),
      updated_at: new Date(),
    }).eq("id", transaction.id);

    await updateMembershipTier(transaction.memberId, inferredTier, transaction.durationMonths || 1);
    res.json({ message: "Payment verified successfully", status: "success" });
  } catch (error) {
    console.error("Paystack verification error:", error);
    res.status(500).json({ error: "Payment verification failed" });
  }
});

router.get("/verify-flutterwave/:reference", async (req: Request, res: Response) => {
  try {
    const { reference } = req.params;
    const flutterwaveSecretKey = process.env.FLUTTERWAVE_SECRET_KEY;
    if (!flutterwaveSecretKey) return res.status(500).json({ error: "Flutterwave not configured" });

    const response = await fetch(`https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${reference}`, {
      headers: { Authorization: `Bearer ${flutterwaveSecretKey}` },
    });
    const data = await response.json();

    if (data.status !== "success" || data.data.status !== "successful") {
      return res.status(400).json({ error: "Payment verification failed", status: data.data?.status });
    }

    const { data: transaction } = await supabase
      .from("payment_transactions")
      .select("id, memberId:member_id, amount, currency, status, paymentProvider:payment_provider, providerReference:provider_reference, providerTransactionId:provider_transaction_id, membershipTier:membership_tier, durationMonths:duration_months, createdAt:created_at, updatedAt:updated_at")
      .eq("provider_reference", reference)
      .single();

    if (!transaction) return res.status(404).json({ error: "Transaction not found" });
    if (transaction.status === "success") return res.json({ message: "Payment already verified", status: "success" });

    const inferredTier = transaction.membershipTier.split(" ")[0] || "Gold";

    await supabase.from("payment_transactions").update({
      status: "success",
      provider_transaction_id: String(data.data.id),
      updated_at: new Date(),
    }).eq("id", transaction.id);

    await updateMembershipTier(transaction.memberId, inferredTier, transaction.durationMonths || 1);
    res.json({ message: "Payment verified successfully", status: "success" });
  } catch (error) {
    console.error("Flutterwave verification error:", error);
    res.status(500).json({ error: "Payment verification failed" });
  }
});

router.post("/webhook/paystack", async (req: Request, res: Response) => {
  try {
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecretKey) return res.status(500).json({ error: "Paystack not configured" });

    const hash = crypto.createHmac("sha512", paystackSecretKey).update(JSON.stringify(req.body)).digest("hex");
    if (hash !== req.headers["x-paystack-signature"]) return res.status(401).json({ error: "Invalid signature" });

    const { event, data } = req.body;

    if (event === "charge.success") {
      const { data: transaction } = await supabase
        .from("payment_transactions")
        .select("id, memberId:member_id, status, membershipTier:membership_tier, durationMonths:duration_months")
        .eq("provider_reference", data.reference)
        .single();

      if (transaction && transaction.status !== "success") {
        await supabase.from("payment_transactions").update({
          status: "success",
          provider_transaction_id: String(data.id),
          updated_at: new Date(),
        }).eq("id", transaction.id);

        const inferredTier = transaction.membershipTier.split(" ")[0] || "Gold";
        await updateMembershipTier(transaction.memberId, inferredTier, transaction.durationMonths || 1);
      }
    }
    res.sendStatus(200);
  } catch (error) {
    console.error("Paystack webhook error:", error);
    res.sendStatus(500);
  }
});

router.post("/webhook/flutterwave", async (req: Request, res: Response) => {
  try {
    const flutterwaveSecretHash = process.env.FLUTTERWAVE_SECRET_HASH;
    if (flutterwaveSecretHash && req.headers["verif-hash"] !== flutterwaveSecretHash) {
      return res.status(401).json({ error: "Invalid signature" });
    }

    const { event, data } = req.body;
    if (event === "charge.completed" && data.status === "successful") {
      const { data: transaction } = await supabase
        .from("payment_transactions")
        .select("id, memberId:member_id, status, membershipTier:membership_tier, durationMonths:duration_months")
        .eq("provider_reference", data.tx_ref)
        .single();

      if (transaction && transaction.status !== "success") {
        await supabase.from("payment_transactions").update({
          status: "success",
          provider_transaction_id: String(data.id),
          updated_at: new Date(),
        }).eq("id", transaction.id);

        const inferredTier = transaction.membershipTier.split(" ")[0] || "Gold";
        await updateMembershipTier(transaction.memberId, inferredTier, transaction.durationMonths || 1);
      }
    }
    res.sendStatus(200);
  } catch (error) {
    console.error("Flutterwave webhook error:", error);
    res.sendStatus(500);
  }
});

router.get("/transactions", isMemberAuthenticated, async (req: Request, res: Response) => {
  try {
    const member = (req as any).member;
    if (!member) return res.status(401).json({ error: "Not authenticated" });

    const { data: transactions, error } = await supabase
      .from("payment_transactions")
      .select("id, memberId:member_id, amount, currency, status, paymentProvider:payment_provider, providerReference:provider_reference, providerTransactionId:provider_transaction_id, membershipTier:membership_tier, durationMonths:duration_months, createdAt:created_at, updatedAt:updated_at")
      .eq("member_id", member.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

export default router;
