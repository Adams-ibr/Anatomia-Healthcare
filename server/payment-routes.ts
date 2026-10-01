import { Router, Request, Response } from "express";
import { 
  getDocuments, 
  getDocumentById,
  createDocument,
  updateDocument,
  serverTimestamp,
  collections,
} from "./lib/firebase";
import crypto from "crypto";
import { isMemberAuthenticated } from "./auth";
import { sendErrorResponse } from "./errorHandler";

const router = Router();

// Valid membership tier values
const VALID_TIERS = ["bronze", "silver", "gold", "diamond"] as const;
type MembershipTier = typeof VALID_TIERS[number];

// Payment reference regex validation
const PAYMENT_REFERENCE_REGEX = /^(ps_|fw_)[a-zA-Z0-9_]+$/;

// Track processed webhook IDs to prevent duplicate processing
const processedWebhookIds = new Set<string>();

// Helper to validate and extract tier from plan description
function extractTierFromPlan(tierDescription: string): MembershipTier {
  const normalized = tierDescription.toLowerCase().split(" ")[0];
  if (!VALID_TIERS.includes(normalized as MembershipTier)) {
    throw new Error(`Invalid membership tier in plan: "${tierDescription}". Expected one of: ${VALID_TIERS.join(", ")}`);
  }
  return normalized as MembershipTier;
}

// Helper to validate payment reference format
function validatePaymentReference(reference: string): boolean {
  if (!reference || reference.length > 200) return false;
  return PAYMENT_REFERENCE_REGEX.test(reference);
}

// Helper to generate deterministic webhook ID for idempotency
function generateWebhookId(provider: string, eventId: string): string {
  return `${provider}:${eventId}`;
}

// Get membership plans
router.get("/plans", async (req: Request, res: Response) => {
  try {
    const plans = await getDocuments(collections.membershipPlans, {
      orderBy: [{ field: "order", direction: "asc" }],
    });

    res.json(plans);
  } catch (error) {
    console.error("Error fetching membership plans:", error);
    sendErrorResponse(res, 500, "Failed to fetch membership plans", error);
  }
});

// Get member's payment history
router.get("/history", isMemberAuthenticated, async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      sendErrorResponse(res, 401, "Not authenticated");
      return;
    }

    const payments = await getDocuments(collections.payments, {
      filters: [{ field: "memberId", operator: "==", value: req.user.id }],
      orderBy: [{ field: "createdAt", direction: "desc" }],
    });

    res.json(payments);
  } catch (error) {
    console.error("Error fetching payment history:", error);
    sendErrorResponse(res, 500, "Failed to fetch payment history", error);
  }
});

// Create payment intent
router.post("/create-intent", isMemberAuthenticated, async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      sendErrorResponse(res, 401, "Not authenticated");
      return;
    }

    const { planId, paymentMethod } = req.body;

    if (!planId || !paymentMethod) {
      return res.status(400).json({ error: "planId and paymentMethod are required" });
    }

    // Get the plan
    const plan = await getDocumentById(collections.membershipPlans, planId);
    if (!plan) {
      return res.status(404).json({ error: "Plan not found" });
    }

    // Create payment transaction
    const paymentData = {
      memberId: req.user.id,
      planId,
      planName: (plan as any).name,
      amount: (plan as any).price,
      currency: (plan as any).currency || "USD",
      paymentMethod,
      status: "pending",
      metadata: {
        userAgent: req.headers["user-agent"],
        ipAddress: req.ip,
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const paymentId = await createDocument(collections.payments, paymentData as any);

    res.json({
      paymentId,
      amount: (plan as any).price,
      currency: (plan as any).currency || "USD",
      description: `Anatomia Healthcare - ${(plan as any).name} Plan`,
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    sendErrorResponse(res, 500, "Failed to create payment intent", error);
  }
});

// Confirm payment
router.post("/confirm", isMemberAuthenticated, async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      sendErrorResponse(res, 401, "Not authenticated");
      return;
    }

    const { paymentId, transactionId } = req.body;

    if (!paymentId || !transactionId) {
      return res.status(400).json({ error: "paymentId and transactionId are required" });
    }

    // Get the payment
    const payment = await getDocumentById(collections.payments, paymentId);
    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    // Verify payment belongs to authenticated user
    if ((payment as any).memberId !== req.user.id) {
      sendErrorResponse(res, 403, "Unauthorized");
      return;
    }

    // Update payment status
    await updateDocument(collections.payments.doc(paymentId), {
      status: "success",
      transactionId,
      updatedAt: serverTimestamp(),
    });

    // Update member subscription
    const member = await getDocumentById(collections.members, req.user.id);
    if (member) {
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1); // Add 1 month

      await updateDocument(collections.members.doc(req.user.id), {
        membershipTier: (payment as any).planName?.toLowerCase().split(" ")[0] || "bronze",
        membershipExpiresAt: expiresAt,
        updatedAt: serverTimestamp(),
      });
    }

    res.json({
      success: true,
      message: "Payment confirmed successfully",
      paymentId,
    });
  } catch (error) {
    console.error("Error confirming payment:", error);
    sendErrorResponse(res, 500, "Failed to confirm payment", error);
  }
});

// Webhook handler for payment provider (Paystack, Flutterwave, etc.)
router.post("/webhook", async (req: Request, res: Response) => {
  try {
    const signature = req.headers["x-paystack-signature"] || req.headers["x-flutterwave-signature"];
    const provider = req.headers["x-payment-provider"] as string;

    if (!signature || !provider) {
      return res.status(400).json({ error: "Missing signature or provider" });
    }

    // Verify webhook signature (implementation depends on provider)
    // This is a simplified example - implement actual signature verification

    const { data } = req.body;
    if (!data || !data.reference) {
      return res.status(400).json({ error: "Invalid webhook payload" });
    }

    // Generate idempotency key
    const webhookId = generateWebhookId(provider, data.reference);
    if (processedWebhookIds.has(webhookId)) {
      return res.json({ success: true, message: "Webhook already processed" });
    }

    // Mark as processed
    processedWebhookIds.add(webhookId);

    // Find payment by reference
    const payments = await getDocuments(collections.payments, {
      filters: [{ field: "transactionId", operator: "==", value: data.reference }],
      limit: 1,
    });

    if (payments.length === 0) {
      console.warn(`Webhook received for unknown transaction: ${data.reference}`);
      return res.status(404).json({ error: "Transaction not found" });
    }

    const payment = payments[0];

    if (data.status === "success" || data.event === "charge.success") {
      // Update payment status
      await updateDocument(collections.payments.doc(payment.id), {
        status: "success",
        transactionId: data.reference,
        metadata: data,
        updatedAt: serverTimestamp(),
      });

      // Update member membership
      if ((payment as any).memberId) {
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1);

        await updateDocument(collections.members.doc((payment as any).memberId), {
          membershipTier: (payment as any).planName?.toLowerCase().split(" ")[0] || "bronze",
          membershipExpiresAt: expiresAt,
          updatedAt: serverTimestamp(),
        });
      }
    } else if (data.status === "failed" || data.event === "charge.failed") {
      await updateDocument(collections.payments.doc(payment.id), {
        status: "failed",
        metadata: data,
        updatedAt: serverTimestamp(),
      });
    }

    res.json({ success: true, message: "Webhook processed" });
  } catch (error) {
    console.error("Error processing webhook:", error);
    sendErrorResponse(res, 500, "Failed to process webhook", error);
  }
});

// Health check
router.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok" });
});

export default router;
