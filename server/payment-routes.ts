import { Router, Request, Response } from "express";
import { db } from "./db";
import { paymentTransactions, members } from "@shared/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { isMemberAuthenticated } from "./auth";

const router = Router();

const MEMBERSHIP_PRICES: Record<string, number> = {
  silver: 1500000,
  gold: 3000000,
  diamond: 5000000,
};

const TIER_DURATION_MONTHS = 1;

async function createTransaction(
  memberId: string,
  tier: string,
  provider: string,
  reference: string
) {
  const amount = MEMBERSHIP_PRICES[tier];
  if (!amount) throw new Error("Invalid membership tier");

  const [transaction] = await db
    .insert(paymentTransactions)
    .values({
      memberId,
      amount,
      currency: "NGN",
      membershipTier: tier,
      durationMonths: TIER_DURATION_MONTHS,
      paymentProvider: provider,
      providerReference: reference,
      status: "pending",
    })
    .returning();

  return transaction;
}

async function updateMembershipTier(memberId: string, tier: string) {
  const [member] = await db
    .select()
    .from(members)
    .where(eq(members.id, memberId));

  let expiresAt = new Date();
  
  if (member?.membershipExpiresAt && new Date(member.membershipExpiresAt) > new Date()) {
    expiresAt = new Date(member.membershipExpiresAt);
  }
  
  expiresAt.setMonth(expiresAt.getMonth() + TIER_DURATION_MONTHS);

  await db
    .update(members)
    .set({
      membershipTier: tier,
      membershipExpiresAt: expiresAt,
    })
    .where(eq(members.id, memberId));
}

router.post("/initialize-paystack", isMemberAuthenticated, async (req: Request, res: Response) => {
  try {
    const member = (req as any).member;
    if (!member) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { tier } = req.body;
    if (!tier || !MEMBERSHIP_PRICES[tier]) {
      return res.status(400).json({ error: "Invalid membership tier" });
    }

    const amount = MEMBERSHIP_PRICES[tier];
    const reference = `ps_${Date.now()}_${crypto.randomBytes(8).toString("hex")}`;

    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecretKey) {
      return res.status(500).json({ error: "Paystack not configured" });
    }

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: member.email,
        amount,
        reference,
        callback_url: `${process.env.REPLIT_DEV_DOMAIN || req.headers.origin}/payment/verify`,
        metadata: {
          member_id: member.id,
          tier,
        },
      }),
    });

    const data = await response.json();

    if (!data.status) {
      return res.status(400).json({ error: data.message || "Failed to initialize payment" });
    }

    await createTransaction(member.id, tier, "paystack", reference);

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
    if (!member) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { tier } = req.body;
    if (!tier || !MEMBERSHIP_PRICES[tier]) {
      return res.status(400).json({ error: "Invalid membership tier" });
    }

    const amount = MEMBERSHIP_PRICES[tier] / 100;
    const reference = `fw_${Date.now()}_${crypto.randomBytes(8).toString("hex")}`;

    const flutterwaveSecretKey = process.env.FLUTTERWAVE_SECRET_KEY;
    if (!flutterwaveSecretKey) {
      return res.status(500).json({ error: "Flutterwave not configured" });
    }

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
        redirect_url: `${process.env.REPLIT_DEV_DOMAIN || req.headers.origin}/payment/verify`,
        customer: {
          email: member.email,
          name: `${member.firstName || ""} ${member.lastName || ""}`.trim() || member.email,
        },
        meta: {
          member_id: member.id,
          tier,
        },
        customizations: {
          title: "Anatomia Membership",
          description: `${tier.charAt(0).toUpperCase() + tier.slice(1)} Membership Subscription`,
        },
      }),
    });

    const data = await response.json();

    if (data.status !== "success") {
      return res.status(400).json({ error: data.message || "Failed to initialize payment" });
    }

    await createTransaction(member.id, tier, "flutterwave", reference);

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
    if (!paystackSecretKey) {
      return res.status(500).json({ error: "Paystack not configured" });
    }

    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
      },
    });

    const data = await response.json();

    if (!data.status || data.data.status !== "success") {
      return res.status(400).json({ error: "Payment verification failed", status: data.data?.status });
    }

    const [transaction] = await db
      .select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.providerReference, reference));

    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    if (transaction.status === "success") {
      return res.json({ message: "Payment already verified", status: "success" });
    }

    await db
      .update(paymentTransactions)
      .set({
        status: "success",
        providerTransactionId: String(data.data.id),
        updatedAt: new Date(),
      })
      .where(eq(paymentTransactions.id, transaction.id));

    await updateMembershipTier(transaction.memberId, transaction.membershipTier);

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
    if (!flutterwaveSecretKey) {
      return res.status(500).json({ error: "Flutterwave not configured" });
    }

    const response = await fetch(
      `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${reference}`,
      {
        headers: {
          Authorization: `Bearer ${flutterwaveSecretKey}`,
        },
      }
    );

    const data = await response.json();

    if (data.status !== "success" || data.data.status !== "successful") {
      return res.status(400).json({ error: "Payment verification failed", status: data.data?.status });
    }

    const [transaction] = await db
      .select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.providerReference, reference));

    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    if (transaction.status === "success") {
      return res.json({ message: "Payment already verified", status: "success" });
    }

    await db
      .update(paymentTransactions)
      .set({
        status: "success",
        providerTransactionId: String(data.data.id),
        updatedAt: new Date(),
      })
      .where(eq(paymentTransactions.id, transaction.id));

    await updateMembershipTier(transaction.memberId, transaction.membershipTier);

    res.json({ message: "Payment verified successfully", status: "success" });
  } catch (error) {
    console.error("Flutterwave verification error:", error);
    res.status(500).json({ error: "Payment verification failed" });
  }
});

router.post("/webhook/paystack", async (req: Request, res: Response) => {
  try {
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecretKey) {
      return res.status(500).json({ error: "Paystack not configured" });
    }

    const hash = crypto
      .createHmac("sha512", paystackSecretKey)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (hash !== req.headers["x-paystack-signature"]) {
      return res.status(401).json({ error: "Invalid signature" });
    }

    const { event, data } = req.body;

    if (event === "charge.success") {
      const reference = data.reference;

      const [transaction] = await db
        .select()
        .from(paymentTransactions)
        .where(eq(paymentTransactions.providerReference, reference));

      if (transaction && transaction.status !== "success") {
        await db
          .update(paymentTransactions)
          .set({
            status: "success",
            providerTransactionId: String(data.id),
            updatedAt: new Date(),
          })
          .where(eq(paymentTransactions.id, transaction.id));

        await updateMembershipTier(transaction.memberId, transaction.membershipTier);
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
      const reference = data.tx_ref;

      const [transaction] = await db
        .select()
        .from(paymentTransactions)
        .where(eq(paymentTransactions.providerReference, reference));

      if (transaction && transaction.status !== "success") {
        await db
          .update(paymentTransactions)
          .set({
            status: "success",
            providerTransactionId: String(data.id),
            updatedAt: new Date(),
          })
          .where(eq(paymentTransactions.id, transaction.id));

        await updateMembershipTier(transaction.memberId, transaction.membershipTier);
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
    if (!member) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const transactions = await db
      .select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.memberId, member.id))
      .orderBy(paymentTransactions.createdAt);

    res.json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

export default router;
