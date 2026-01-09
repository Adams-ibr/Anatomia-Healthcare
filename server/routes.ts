import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import { 
  contactMessages, 
  newsletterSubscriptions, 
  articles, 
  teamMembers, 
  products, 
  faqItems, 
  careers,
  insertContactMessageSchema, 
  insertNewsletterSubscriptionSchema,
  insertArticleSchema,
  insertTeamMemberSchema,
  insertProductSchema,
  insertFaqItemSchema,
  insertCareerSchema
} from "@shared/schema";
import { setupSession, registerAuthRoutes, registerMemberRoutes, isAuthenticated, isMemberAuthenticated } from "./auth";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import lmsRoutes from "./lms-routes";
import paymentRoutes from "./payment-routes";
import interactionRoutes from "./interaction-routes";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Set up session and auth routes FIRST
  setupSession(app);
  registerAuthRoutes(app);
  registerMemberRoutes(app);
  registerObjectStorageRoutes(app);
  
  // LMS routes
  app.use("/api/lms", lmsRoutes);
  
  // Payment routes (with member auth middleware)
  app.use("/api/payments", paymentRoutes);
  
  // Chat and interaction routes (comments, discussions, messages)
  app.use("/api/interactions", interactionRoutes);

  // Public routes
  app.post("/api/contact", async (req, res) => {
    try {
      const result = insertContactMessageSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid contact form data", details: result.error.issues });
      }
      
      const [message] = await db.insert(contactMessages).values(result.data).returning();
      res.status(201).json({ success: true, message: "Message sent successfully", id: message.id });
    } catch (error) {
      console.error("Error creating contact message:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  app.post("/api/newsletter", async (req, res) => {
    try {
      const result = insertNewsletterSubscriptionSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid email address", details: result.error.issues });
      }
      
      const [existing] = await db.select().from(newsletterSubscriptions).where(eq(newsletterSubscriptions.email, result.data.email));
      if (existing) {
        return res.status(409).json({ error: "Email already subscribed" });
      }
      
      const [subscription] = await db.insert(newsletterSubscriptions).values(result.data).returning();
      res.status(201).json({ success: true, message: "Subscribed successfully", id: subscription.id });
    } catch (error) {
      console.error("Error creating newsletter subscription:", error);
      res.status(500).json({ error: "Failed to subscribe" });
    }
  });

  // Public API for frontend pages
  app.get("/api/articles", async (req, res) => {
    try {
      const allArticles = await db.select().from(articles).where(eq(articles.isPublished, true)).orderBy(desc(articles.createdAt));
      res.json(allArticles);
    } catch (error) {
      console.error("Error fetching articles:", error);
      res.status(500).json({ error: "Failed to fetch articles" });
    }
  });

  app.get("/api/articles/:slug", async (req, res) => {
    try {
      const [article] = await db.select().from(articles).where(eq(articles.slug, req.params.slug));
      if (!article) {
        return res.status(404).json({ error: "Article not found" });
      }
      res.json(article);
    } catch (error) {
      console.error("Error fetching article:", error);
      res.status(500).json({ error: "Failed to fetch article" });
    }
  });

  app.get("/api/team", async (req, res) => {
    try {
      const team = await db.select().from(teamMembers).where(eq(teamMembers.isActive, true)).orderBy(teamMembers.order);
      res.json(team);
    } catch (error) {
      console.error("Error fetching team:", error);
      res.status(500).json({ error: "Failed to fetch team" });
    }
  });

  app.get("/api/products", async (req, res) => {
    try {
      const allProducts = await db.select().from(products).where(eq(products.isActive, true)).orderBy(products.order);
      res.json(allProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.get("/api/faq", async (req, res) => {
    try {
      const faqs = await db.select().from(faqItems).where(eq(faqItems.isActive, true)).orderBy(faqItems.order);
      res.json(faqs);
    } catch (error) {
      console.error("Error fetching FAQs:", error);
      res.status(500).json({ error: "Failed to fetch FAQs" });
    }
  });

  app.get("/api/careers", async (req, res) => {
    try {
      const allCareers = await db.select().from(careers).where(eq(careers.isActive, true)).orderBy(desc(careers.createdAt));
      res.json(allCareers);
    } catch (error) {
      console.error("Error fetching careers:", error);
      res.status(500).json({ error: "Failed to fetch careers" });
    }
  });

  // Admin routes (protected)
  app.get("/api/admin/stats", isAuthenticated, async (req, res) => {
    try {
      const [contactCount] = await db.select({ count: contactMessages.id }).from(contactMessages);
      const [newsletterCount] = await db.select({ count: newsletterSubscriptions.id }).from(newsletterSubscriptions);
      const [articleCount] = await db.select({ count: articles.id }).from(articles);
      const [productCount] = await db.select({ count: products.id }).from(products);
      
      res.json({
        contacts: contactCount?.count || 0,
        subscribers: newsletterCount?.count || 0,
        articles: articleCount?.count || 0,
        products: productCount?.count || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Admin Contact Messages
  app.get("/api/admin/contacts", isAuthenticated, async (req, res) => {
    try {
      const messages = await db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt));
      res.json(messages);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      res.status(500).json({ error: "Failed to fetch contacts" });
    }
  });

  app.patch("/api/admin/contacts/:id/read", isAuthenticated, async (req, res) => {
    try {
      const [updated] = await db.update(contactMessages).set({ isRead: true }).where(eq(contactMessages.id, req.params.id)).returning();
      res.json(updated);
    } catch (error) {
      console.error("Error updating contact:", error);
      res.status(500).json({ error: "Failed to update contact" });
    }
  });

  app.delete("/api/admin/contacts/:id", isAuthenticated, async (req, res) => {
    try {
      await db.delete(contactMessages).where(eq(contactMessages.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting contact:", error);
      res.status(500).json({ error: "Failed to delete contact" });
    }
  });

  // Admin Newsletter
  app.get("/api/admin/newsletter", isAuthenticated, async (req, res) => {
    try {
      const subscriptions = await db.select().from(newsletterSubscriptions).orderBy(desc(newsletterSubscriptions.createdAt));
      res.json(subscriptions);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      res.status(500).json({ error: "Failed to fetch subscriptions" });
    }
  });

  app.delete("/api/admin/newsletter/:id", isAuthenticated, async (req, res) => {
    try {
      await db.delete(newsletterSubscriptions).where(eq(newsletterSubscriptions.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting subscription:", error);
      res.status(500).json({ error: "Failed to delete subscription" });
    }
  });

  // Admin Articles CRUD
  app.get("/api/admin/articles", isAuthenticated, async (req, res) => {
    try {
      const allArticles = await db.select().from(articles).orderBy(desc(articles.createdAt));
      res.json(allArticles);
    } catch (error) {
      console.error("Error fetching articles:", error);
      res.status(500).json({ error: "Failed to fetch articles" });
    }
  });

  app.post("/api/admin/articles", isAuthenticated, async (req, res) => {
    try {
      const result = insertArticleSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid article data", details: result.error.issues });
      }
      const [article] = await db.insert(articles).values(result.data).returning();
      res.status(201).json(article);
    } catch (error) {
      console.error("Error creating article:", error);
      res.status(500).json({ error: "Failed to create article" });
    }
  });

  app.patch("/api/admin/articles/:id", isAuthenticated, async (req, res) => {
    try {
      const [article] = await db.update(articles).set({ ...req.body, updatedAt: new Date() }).where(eq(articles.id, req.params.id)).returning();
      res.json(article);
    } catch (error) {
      console.error("Error updating article:", error);
      res.status(500).json({ error: "Failed to update article" });
    }
  });

  app.delete("/api/admin/articles/:id", isAuthenticated, async (req, res) => {
    try {
      await db.delete(articles).where(eq(articles.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting article:", error);
      res.status(500).json({ error: "Failed to delete article" });
    }
  });

  // Admin Team CRUD
  app.get("/api/admin/team", isAuthenticated, async (req, res) => {
    try {
      const team = await db.select().from(teamMembers).orderBy(teamMembers.order);
      res.json(team);
    } catch (error) {
      console.error("Error fetching team:", error);
      res.status(500).json({ error: "Failed to fetch team" });
    }
  });

  app.post("/api/admin/team", isAuthenticated, async (req, res) => {
    try {
      const result = insertTeamMemberSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid team member data", details: result.error.issues });
      }
      const [member] = await db.insert(teamMembers).values(result.data).returning();
      res.status(201).json(member);
    } catch (error) {
      console.error("Error creating team member:", error);
      res.status(500).json({ error: "Failed to create team member" });
    }
  });

  app.patch("/api/admin/team/:id", isAuthenticated, async (req, res) => {
    try {
      const [member] = await db.update(teamMembers).set(req.body).where(eq(teamMembers.id, req.params.id)).returning();
      res.json(member);
    } catch (error) {
      console.error("Error updating team member:", error);
      res.status(500).json({ error: "Failed to update team member" });
    }
  });

  app.delete("/api/admin/team/:id", isAuthenticated, async (req, res) => {
    try {
      await db.delete(teamMembers).where(eq(teamMembers.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting team member:", error);
      res.status(500).json({ error: "Failed to delete team member" });
    }
  });

  // Admin Products CRUD
  app.get("/api/admin/products", isAuthenticated, async (req, res) => {
    try {
      const allProducts = await db.select().from(products).orderBy(products.order);
      res.json(allProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.post("/api/admin/products", isAuthenticated, async (req, res) => {
    try {
      const result = insertProductSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid product data", details: result.error.issues });
      }
      const [product] = await db.insert(products).values(result.data).returning();
      res.status(201).json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ error: "Failed to create product" });
    }
  });

  app.patch("/api/admin/products/:id", isAuthenticated, async (req, res) => {
    try {
      const [product] = await db.update(products).set(req.body).where(eq(products.id, req.params.id)).returning();
      res.json(product);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ error: "Failed to update product" });
    }
  });

  app.delete("/api/admin/products/:id", isAuthenticated, async (req, res) => {
    try {
      await db.delete(products).where(eq(products.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  // Admin FAQ CRUD
  app.get("/api/admin/faq", isAuthenticated, async (req, res) => {
    try {
      const faqs = await db.select().from(faqItems).orderBy(faqItems.order);
      res.json(faqs);
    } catch (error) {
      console.error("Error fetching FAQs:", error);
      res.status(500).json({ error: "Failed to fetch FAQs" });
    }
  });

  app.post("/api/admin/faq", isAuthenticated, async (req, res) => {
    try {
      const result = insertFaqItemSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid FAQ data", details: result.error.issues });
      }
      const [faq] = await db.insert(faqItems).values(result.data).returning();
      res.status(201).json(faq);
    } catch (error) {
      console.error("Error creating FAQ:", error);
      res.status(500).json({ error: "Failed to create FAQ" });
    }
  });

  app.patch("/api/admin/faq/:id", isAuthenticated, async (req, res) => {
    try {
      const [faq] = await db.update(faqItems).set(req.body).where(eq(faqItems.id, req.params.id)).returning();
      res.json(faq);
    } catch (error) {
      console.error("Error updating FAQ:", error);
      res.status(500).json({ error: "Failed to update FAQ" });
    }
  });

  app.delete("/api/admin/faq/:id", isAuthenticated, async (req, res) => {
    try {
      await db.delete(faqItems).where(eq(faqItems.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting FAQ:", error);
      res.status(500).json({ error: "Failed to delete FAQ" });
    }
  });

  // Admin Careers CRUD
  app.get("/api/admin/careers", isAuthenticated, async (req, res) => {
    try {
      const allCareers = await db.select().from(careers).orderBy(desc(careers.createdAt));
      res.json(allCareers);
    } catch (error) {
      console.error("Error fetching careers:", error);
      res.status(500).json({ error: "Failed to fetch careers" });
    }
  });

  app.post("/api/admin/careers", isAuthenticated, async (req, res) => {
    try {
      const result = insertCareerSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid career data", details: result.error.issues });
      }
      const [career] = await db.insert(careers).values(result.data).returning();
      res.status(201).json(career);
    } catch (error) {
      console.error("Error creating career:", error);
      res.status(500).json({ error: "Failed to create career" });
    }
  });

  app.patch("/api/admin/careers/:id", isAuthenticated, async (req, res) => {
    try {
      const [career] = await db.update(careers).set(req.body).where(eq(careers.id, req.params.id)).returning();
      res.json(career);
    } catch (error) {
      console.error("Error updating career:", error);
      res.status(500).json({ error: "Failed to update career" });
    }
  });

  app.delete("/api/admin/careers/:id", isAuthenticated, async (req, res) => {
    try {
      await db.delete(careers).where(eq(careers.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting career:", error);
      res.status(500).json({ error: "Failed to delete career" });
    }
  });

  return httpServer;
}
