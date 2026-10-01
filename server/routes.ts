import type { Express } from "express";
import { createServer, type Server } from "http";
import { 
  getDocuments, 
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
  serverTimestamp,
  collections,
} from "./lib/firebase";
import { sendErrorResponse } from "./errorHandler";
import { rateLimit } from "./rateLimit";
import { setupSession, registerAuthRoutes, registerMemberRoutes } from "./auth";
import lmsRoutes from "./lms-routes";
import paymentRoutes from "./payment-routes";
import interactionRoutes from "./interaction-routes";
import galleryRoutes from "./gallery-routes";
import { getUploadSignedUrl } from "./lib/firebase/storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Set up session and auth routes FIRST
  setupSession(app);
  registerAuthRoutes(app);
  registerMemberRoutes(app);

  // LMS routes
  app.use("/api/lms", lmsRoutes);

  // Payment routes (with member auth middleware)
  app.use("/api/payments", paymentRoutes);

  // Chat and interaction routes (comments, discussions, messages)
  app.use("/api/interactions", interactionRoutes);

  // Gallery routes
  app.use("/api/gallery", galleryRoutes);

  // Upload routes (protected)
  app.post("/api/uploads/request-url", async (req, res) => {
    try {
      const { name, size, contentType } = req.body;
      if (!name || !contentType) {
        return res.status(400).json({ error: "Name and contentType are required" });
      }

      console.log(`[Upload] Request for ${name} (${contentType}, ${size} bytes)`);

      // Generate signed URL for Firebase Storage
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const fileName = `${timestamp}-${randomStr}-${name}`;
      const filePath = `uploads/items/${fileName}`;

      const uploadUrl = await getUploadSignedUrl(filePath, contentType, 15 * 60); // 15 minutes

      const publicUrl = `https://storage.googleapis.com/${process.env.FIREBASE_STORAGE_BUCKET}/${filePath}`;

      console.log(`[Upload] Successfully generated signed URL for ${filePath}`);

      res.json({
        uploadURL: uploadUrl,
        objectPath: publicUrl,
        metadata: { name, size, contentType }
      });
    } catch (error: any) {
      console.error("[Upload] Error:", error);
      sendErrorResponse(res, 500, "Failed to create upload URL", error);
    }
  });

  // Debug route for Firestore connection
  app.get("/api/health-db", async (req, res) => {
    try {
      const doc = await getDocuments(collections.contactMessages, { limit: 1 });
      res.json({ status: "ok", time: new Date().toISOString(), dataCount: doc.length });
    } catch (error) {
      console.error("Health check failed:", error);
      res.status(500).json({ status: "error", message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Debug route for Storage connection
  app.get("/api/health-storage", async (req, res) => {
    try {
      const bucket = process.env.FIREBASE_STORAGE_BUCKET;
      res.json({ 
        status: "ok", 
        bucket,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error("Storage health check failed:", error);
      res.status(500).json({ 
        status: "error", 
        message: error.message || "Unknown error"
      });
    }
  });

  // Public routes with rate limiting
  app.post(
    "/api/contact",
    rateLimit(60000, 5, "Too many contact form submissions. Please try again in 1 minute."),
    async (req, res) => {
      try {
        const { name, email, topic, message } = req.body;
        
        if (!name || !email || !topic || !message) {
          return res.status(400).json({ error: "All fields are required" });
        }

        const contactData = {
          name,
          email,
          topic,
          message,
          isRead: false,
          createdAt: serverTimestamp(),
        };

        const docId = await createDocument(collections.contactMessages, contactData as any);

        res.status(201).json({ 
          success: true, 
          message: "Message sent successfully", 
          id: docId 
        });
      } catch (error) {
        console.error("Error creating contact message:", error);
        res.status(500).json({ error: "Failed to send message" });
      }
    }
  );

  app.post(
    "/api/newsletter",
    rateLimit(60000, 3, "Too many newsletter signup attempts. Please try again in 1 minute."),
    async (req, res) => {
      try {
        const { email } = req.body;
        
        if (!email) {
          return res.status(400).json({ error: "Email is required" });
        }

        // Check if email already exists
        const existing = await getDocuments(collections.newsletterSubscriptions, {
          filters: [{ field: "email", operator: "==", value: email }],
          limit: 1,
        });

        if (existing.length > 0) {
          return res.status(409).json({ error: "Email already subscribed" });
        }

        const subscriptionData = {
          email,
          createdAt: serverTimestamp(),
        };

        const docId = await createDocument(collections.newsletterSubscriptions, subscriptionData as any);

        res.status(201).json({ 
          success: true, 
          message: "Subscribed successfully", 
          id: docId 
        });
      } catch (error) {
        console.error("Error creating newsletter subscription:", error);
        res.status(500).json({ error: "Failed to subscribe" });
      }
    }
  );

  app.post(
    "/api/waitlist",
    rateLimit(60000, 3, "Too many waitlist signup attempts. Please try again in 1 minute."),
    async (req, res) => {
      try {
        const { name, email, interest } = req.body;
        
        if (!name || !email) {
          return res.status(400).json({ error: "Name and email are required" });
        }

        // Check if email already in waitlist
        const existing = await getDocuments(collections.waitlist, {
          filters: [{ field: "email", operator: "==", value: email }],
          limit: 1,
        });

        if (existing.length > 0) {
          return res.status(409).json({ error: "Email already on waitlist" });
        }

        const waitlistData = {
          name,
          email,
          interest: interest || "3d_beta",
          createdAt: serverTimestamp(),
        };

        const docId = await createDocument(collections.waitlist, waitlistData as any);

        res.status(201).json({ 
          success: true, 
          message: "Added to waitlist successfully", 
          id: docId 
        });
      } catch (error) {
        console.error("Error creating waitlist entry:", error);
        res.status(500).json({ error: "Failed to add to waitlist" });
      }
    }
  );

  // Get articles
  app.get("/api/articles", async (req, res) => {
    try {
      const articles = await getDocuments(collections.articles, {
        filters: [{ field: "isPublished", operator: "==", value: true }],
        orderBy: [{ field: "createdAt", direction: "desc" }],
      });

      res.json(articles);
    } catch (error) {
      console.error("Error fetching articles:", error);
      res.status(500).json({ error: "Failed to fetch articles" });
    }
  });

  // Get single article
  app.get("/api/articles/:id", async (req, res) => {
    try {
      const article = await getDocumentById(collections.articles, req.params.id);
      
      if (!article) {
        return res.status(404).json({ error: "Article not found" });
      }

      res.json(article);
    } catch (error) {
      console.error("Error fetching article:", error);
      res.status(500).json({ error: "Failed to fetch article" });
    }
  });

  // Get gallery items
  app.get("/api/gallery", async (req, res) => {
    try {
      const items = await getDocuments(collections.galleryItems, {
        filters: [{ field: "isPublished", operator: "==", value: true }],
        orderBy: [{ field: "createdAt", direction: "desc" }],
      });

      res.json(items);
    } catch (error) {
      console.error("Error fetching gallery items:", error);
      res.status(500).json({ error: "Failed to fetch gallery items" });
    }
  });

  // Get partners
  app.get("/api/partners", async (req, res) => {
    try {
      const partners = await getDocuments(collections.partners, {
        orderBy: [{ field: "order", direction: "asc" }],
      });

      res.json(partners);
    } catch (error) {
      console.error("Error fetching partners:", error);
      res.status(500).json({ error: "Failed to fetch partners" });
    }
  });

  // Get team members
  app.get("/api/team", async (req, res) => {
    try {
      const members = await getDocuments(collections.teamMembers, {
        filters: [{ field: "isActive", operator: "==", value: true }],
        orderBy: [{ field: "order", direction: "asc" }],
      });

      res.json(members);
    } catch (error) {
      console.error("Error fetching team members:", error);
      res.status(500).json({ error: "Failed to fetch team members" });
    }
  });

  // Get single team member
  app.get("/api/team/:slug", async (req, res) => {
    try {
      const members = await getDocuments(collections.teamMembers, {
        filters: [{ field: "slug", operator: "==", value: req.params.slug }],
        limit: 1,
      });

      if (members.length === 0) {
        return res.status(404).json({ error: "Team member not found" });
      }

      res.json(members[0]);
    } catch (error) {
      console.error("Error fetching team member:", error);
      res.status(500).json({ error: "Failed to fetch team member" });
    }
  });

  // Get products
  app.get("/api/products", async (req, res) => {
    try {
      const products = await getDocuments(collections.products, {
        filters: [{ field: "isActive", operator: "==", value: true }],
        orderBy: [{ field: "order", direction: "asc" }],
      });

      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  // Get FAQs
  app.get("/api/faqs", async (req, res) => {
    try {
      const faqs = await getDocuments(collections.faqItems, {
        filters: [{ field: "isActive", operator: "==", value: true }],
        orderBy: [{ field: "order", direction: "asc" }],
      });

      res.json(faqs);
    } catch (error) {
      console.error("Error fetching FAQs:", error);
      res.status(500).json({ error: "Failed to fetch FAQs" });
    }
  });

  // Get careers
  app.get("/api/careers", async (req, res) => {
    try {
      const careers = await getDocuments(collections.careers, {
        filters: [{ field: "isActive", operator: "==", value: true }],
      });

      res.json(careers);
    } catch (error) {
      console.error("Error fetching careers:", error);
      res.status(500).json({ error: "Failed to fetch careers" });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  return httpServer;
}
