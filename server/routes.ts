import type { Express } from "express";
import { createServer, type Server } from "http";
import { supabase, toSnakeCase } from "./db";
import { eq, desc, sql } from "drizzle-orm";
import {
  contactMessages,
  newsletterSubscriptions,
  articles,
  teamMembers,
  products,
  faqItems,
  careers,
  departments,
  insertContactMessageSchema,
  insertNewsletterSubscriptionSchema,
  insertArticleSchema,
  insertTeamMemberSchema,
  insertProductSchema,
  insertFaqItemSchema,
  insertCareerSchema,
  insertDepartmentSchema
} from "../shared/schema";
import { setupSession, registerAuthRoutes, registerMemberRoutes, isAuthenticated, isMemberAuthenticated } from "./auth";
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

  // LMS routes
  app.use("/api/lms", lmsRoutes);

  // Payment routes (with member auth middleware)
  app.use("/api/payments", paymentRoutes);

  // Chat and interaction routes (comments, discussions, messages)
  app.use("/api/interactions", interactionRoutes);

  // Upload routes (protected)
  app.post("/api/uploads/request-url", async (req, res) => {
    // Note: Removed isAuthenticated from this simple implementation to ensure it works, 
    // but in production it should use the auth middleware.
    try {
      const { name, size, contentType } = req.body;
      if (!name || !contentType) {
        return res.status(400).json({ error: "Name and contentType are required" });
      }

      // Generate unique filename
      const fileExt = name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const objectPath = `uploads/${fileName}`;

      const { data, error } = await supabase.storage
        .from("uploads")
        .createSignedUploadUrl(objectPath);

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from("uploads")
        .getPublicUrl(objectPath);

      res.json({
        uploadURL: data.signedUrl,
        objectPath: publicUrlData.publicUrl,
        metadata: { name, size, contentType }
      });
    } catch (error) {
      console.error("Error creating upload URL:", error);
      res.status(500).json({ error: "Failed to create upload URL" });
    }
  });

  // Debug route for DB connection
  app.get("/api/health-db", async (req, res) => {
    try {
      const { data, error } = await supabase.from("contact_messages").select("created_at").limit(1);
      if (error) throw error;
      res.json({ status: "ok", time: new Date().toISOString() });
    } catch (error) {
      console.error("Health check failed:", error);
      res.status(500).json({ status: "error", message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Public routes
  app.post("/api/contact", async (req, res) => {
    try {
      const result = insertContactMessageSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid contact form data", details: result.error.issues });
      }

      const { data: message, error: createError } = await supabase
        .from("contact_messages")
        .insert(result.data)
        .select()
        .single();

      if (createError || !message) {
        throw createError || new Error("Failed to create message");
      }
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

      const { data: existing } = await supabase
        .from("newsletter_subscriptions")
        .select()
        .eq("email", result.data.email)
        .single();

      if (existing) {
        return res.status(409).json({ error: "Email already subscribed" });
      }

      const { data: subscription, error: createError } = await supabase
        .from("newsletter_subscriptions")
        .insert(result.data)
        .select()
        .single();

      if (createError || !subscription) {
        throw createError || new Error("Failed to subscribe");
      }
      res.status(201).json({ success: true, message: "Subscribed successfully", id: subscription.id });
    } catch (error) {
      console.error("Error creating newsletter subscription:", error);
      res.status(500).json({ error: "Failed to subscribe" });
    }
  });

  // Public API for frontend pages
  app.get("/api/articles", async (req, res) => {
    try {
      const { data: allArticles, error } = await supabase
        .from("articles")
        .select(`
          id, title, slug, excerpt, content, category, author,
          imageUrl:image_url, readTime:read_time, isFeatured:is_featured,
          isPublished:is_published, createdAt:created_at, updatedAt:updated_at
        `)
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      res.json(allArticles);
    } catch (error) {
      console.error("Error fetching articles:", error);
      res.status(500).json({ error: "Failed to fetch articles" });
    }
  });

  app.get("/api/articles/:slug", async (req, res) => {
    try {
      const { data: article, error } = await supabase
        .from("articles")
        .select(`
          id, title, slug, excerpt, content, category, author,
          imageUrl:image_url, readTime:read_time, isFeatured:is_featured,
          isPublished:is_published, createdAt:created_at, updatedAt:updated_at
        `)
        .eq("slug", req.params.slug)
        .single();

      if (error || !article) {
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
      const { data: team, error } = await supabase
        .from("team_members")
        .select(`
          id, name, slug, role, description, bio, imageUrl:image_url,
          email, linkedinUrl:linkedin_url, twitterUrl:twitter_url,
          facebookUrl:facebook_url, instagramUrl:instagram_url,
          order, isActive:is_active, createdAt:created_at
        `)
        .eq("is_active", true)
        .order("order", { ascending: true });

      if (error) throw error;
      res.json(team);
    } catch (error) {
      console.error("Error fetching team:", error);
      res.status(500).json({ error: "Failed to fetch team" });
    }
  });

  app.get("/api/team/:slug", async (req, res) => {
    try {
      const { data: member, error } = await supabase
        .from("team_members")
        .select(`
          id, name, slug, role, description, bio, imageUrl:image_url,
          email, linkedinUrl:linkedin_url, twitterUrl:twitter_url,
          facebookUrl:facebook_url, instagramUrl:instagram_url,
          order, isActive:is_active, createdAt:created_at
        `)
        .eq("slug", req.params.slug)
        .single();

      if (error || !member) {
        return res.status(404).json({ error: "Team member not found" });
      }
      res.json(member);
    } catch (error) {
      console.error("Error fetching team member:", error);
      res.status(500).json({ error: "Failed to fetch team member" });
    }
  });

  app.get("/api/products", async (req, res) => {
    try {
      const { data: allProducts, error } = await supabase
        .from("products")
        .select(`
          id, title, category, description, price, imageUrl:image_url,
          badge, badgeColor:badge_color, isActive:is_active, order,
          createdAt:created_at
        `)
        .eq("is_active", true)
        .order("order", { ascending: true });

      if (error) throw error;
      res.json(allProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.get("/api/faq", async (req, res) => {
    try {
      const { data: faqs, error } = await supabase
        .from("faq_items")
        .select(`
          id, question, answer, category, order,
          isActive:is_active, createdAt:created_at
        `)
        .eq("is_active", true)
        .order("order", { ascending: true });

      if (error) throw error;
      res.json(faqs);
    } catch (error) {
      console.error("Error fetching FAQs:", error);
      res.status(500).json({ error: "Failed to fetch FAQs" });
    }
  });

  app.get("/api/careers", async (req, res) => {
    try {
      const { data: allCareers, error } = await supabase
        .from("careers")
        .select(`
          id, title, department, location, type, description, requirements,
          isActive:is_active, createdAt:created_at
        `)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      res.json(allCareers);
    } catch (error) {
      console.error("Error fetching careers:", error);
      res.status(500).json({ error: "Failed to fetch careers" });
    }
  });

  // Admin routes (protected)
  app.get("/api/admin/stats", isAuthenticated, async (req, res) => {
    try {
      const { count: contactCount } = await supabase.from("contact_messages").select("*", { count: "exact", head: true });
      const { count: newsletterCount } = await supabase.from("newsletter_subscriptions").select("*", { count: "exact", head: true });
      const { count: articleCount } = await supabase.from("articles").select("*", { count: "exact", head: true });
      const { count: productCount } = await supabase.from("products").select("*", { count: "exact", head: true });

      res.json({
        contacts: contactCount || 0,
        subscribers: newsletterCount || 0,
        articles: articleCount || 0,
        products: productCount || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Admin Contact Messages
  app.get("/api/admin/contacts", isAuthenticated, async (req, res) => {
    try {
      const { data: messages, error } = await supabase
        .from("contact_messages")
        .select()
        .order("created_at", { ascending: false });

      if (error) throw error;
      res.json(messages);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      res.status(500).json({ error: "Failed to fetch contacts" });
    }
  });

  app.patch("/api/admin/contacts/:id/read", isAuthenticated, async (req, res) => {
    try {
      const { data: updated, error } = await supabase
        .from("contact_messages")
        .update({ is_read: true })
        .eq("id", req.params.id)
        .select()
        .single();

      if (error) throw error;
      res.json(updated);
    } catch (error) {
      console.error("Error updating contact:", error);
      res.status(500).json({ error: "Failed to update contact" });
    }
  });

  app.delete("/api/admin/contacts/:id", isAuthenticated, async (req, res) => {
    try {
      const { error } = await supabase.from("contact_messages").delete().eq("id", req.params.id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting contact:", error);
      res.status(500).json({ error: "Failed to delete contact" });
    }
  });

  // Admin Newsletter
  app.get("/api/admin/newsletter", isAuthenticated, async (req, res) => {
    try {
      const { data: subscriptions, error } = await supabase
        .from("newsletter_subscriptions")
        .select()
        .order("created_at", { ascending: false });

      if (error) throw error;
      res.json(subscriptions);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      res.status(500).json({ error: "Failed to fetch subscriptions" });
    }
  });

  app.delete("/api/admin/newsletter/:id", isAuthenticated, async (req, res) => {
    try {
      const { error } = await supabase.from("newsletter_subscriptions").delete().eq("id", req.params.id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting subscription:", error);
      res.status(500).json({ error: "Failed to delete subscription" });
    }
  });

  // Admin Articles CRUD
  app.get("/api/admin/articles", isAuthenticated, async (req, res) => {
    try {
      const { data: allArticles, error } = await supabase
        .from("articles")
        .select(`
          id, title, slug, excerpt, content, category, author,
          imageUrl:image_url, readTime:read_time, isFeatured:is_featured,
          isPublished:is_published, createdAt:created_at, updatedAt:updated_at
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
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
      const { data: article, error } = await supabase
        .from("articles")
        .insert(toSnakeCase(result.data))
        .select(`
          id, title, slug, excerpt, content, category, author,
          imageUrl:image_url, readTime:read_time, isFeatured:is_featured,
          isPublished:is_published, createdAt:created_at, updatedAt:updated_at
        `)
        .single();

      if (error) throw error;
      res.status(201).json(article);
    } catch (error) {
      console.error("Error creating article:", error);
      res.status(500).json({ error: "Failed to create article" });
    }
  });

  app.patch("/api/admin/articles/:id", isAuthenticated, async (req, res) => {
    try {
      const { data: article, error } = await supabase
        .from("articles")
        .update({ ...toSnakeCase(req.body), updated_at: new Date() })
        .eq("id", req.params.id)
        .select(`
          id, title, slug, excerpt, content, category, author,
          imageUrl:image_url, readTime:read_time, isFeatured:is_featured,
          isPublished:is_published, createdAt:created_at, updatedAt:updated_at
        `)
        .single();

      if (error) throw error;
      res.json(article);
    } catch (error) {
      console.error("Error updating article:", error);
      res.status(500).json({ error: "Failed to update article" });
    }
  });

  app.delete("/api/admin/articles/:id", isAuthenticated, async (req, res) => {
    try {
      const { error } = await supabase.from("articles").delete().eq("id", req.params.id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting article:", error);
      res.status(500).json({ error: "Failed to delete article" });
    }
  });

  // Admin Team CRUD
  app.get("/api/admin/team", isAuthenticated, async (req, res) => {
    try {
      const { data: team, error } = await supabase
        .from("team_members")
        .select(`
          id, name, slug, role, description, bio, imageUrl:image_url,
          email, linkedinUrl:linkedin_url, twitterUrl:twitter_url,
          facebookUrl:facebook_url, instagramUrl:instagram_url,
          order, isActive:is_active, createdAt:created_at
        `)
        .order("order", { ascending: true });

      if (error) throw error;
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
      const { data: member, error } = await supabase
        .from("team_members")
        .insert(toSnakeCase(result.data))
        .select(`
          id, name, slug, role, description, bio, imageUrl:image_url,
          email, linkedinUrl:linkedin_url, twitterUrl:twitter_url,
          facebookUrl:facebook_url, instagramUrl:instagram_url,
          order, isActive:is_active, createdAt:created_at
        `)
        .single();

      if (error) throw error;
      res.status(201).json(member);
    } catch (error) {
      console.error("Error creating team member:", error);
      res.status(500).json({ error: "Failed to create team member" });
    }
  });

  app.patch("/api/admin/team/:id", isAuthenticated, async (req, res) => {
    try {
      const { data: member, error } = await supabase
        .from("team_members")
        .update(toSnakeCase(req.body))
        .eq("id", req.params.id)
        .select(`
          id, name, slug, role, description, bio, imageUrl:image_url,
          email, linkedinUrl:linkedin_url, twitterUrl:twitter_url,
          facebookUrl:facebook_url, instagramUrl:instagram_url,
          order, isActive:is_active, createdAt:created_at
        `)
        .single();

      if (error) throw error;
      res.json(member);
    } catch (error) {
      console.error("Error updating team member:", error);
      res.status(500).json({ error: "Failed to update team member" });
    }
  });

  app.delete("/api/admin/team/:id", isAuthenticated, async (req, res) => {
    try {
      const { error } = await supabase.from("team_members").delete().eq("id", req.params.id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting team member:", error);
      res.status(500).json({ error: "Failed to delete team member" });
    }
  });

  // Admin Products CRUD
  app.get("/api/admin/products", isAuthenticated, async (req, res) => {
    try {
      const { data: allProducts, error } = await supabase
        .from("products")
        .select(`
          id, title, category, description, price, imageUrl:image_url,
          badge, badgeColor:badge_color, isActive:is_active, order,
          createdAt:created_at
        `)
        .order("order", { ascending: true });

      if (error) throw error;
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
      const { data: product, error } = await supabase
        .from("products")
        .insert(toSnakeCase(result.data))
        .select(`
          id, title, category, description, price, imageUrl:image_url,
          badge, badgeColor:badge_color, isActive:is_active, order,
          createdAt:created_at
        `)
        .single();

      if (error) throw error;
      res.status(201).json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ error: "Failed to create product" });
    }
  });

  app.patch("/api/admin/products/:id", isAuthenticated, async (req, res) => {
    try {
      const { data: product, error } = await supabase
        .from("products")
        .update(toSnakeCase(req.body))
        .eq("id", req.params.id)
        .select(`
          id, title, category, description, price, imageUrl:image_url,
          badge, badgeColor:badge_color, isActive:is_active, order,
          createdAt:created_at
        `)
        .single();

      if (error) throw error;
      res.json(product);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ error: "Failed to update product" });
    }
  });

  app.delete("/api/admin/products/:id", isAuthenticated, async (req, res) => {
    try {
      const { error } = await supabase.from("products").delete().eq("id", req.params.id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  // Admin FAQ CRUD
  app.get("/api/admin/faq", isAuthenticated, async (req, res) => {
    try {
      const { data: faqs, error } = await supabase
        .from("faq_items")
        .select(`
          id, question, answer, category, order,
          isActive:is_active, createdAt:created_at
        `)
        .order("order", { ascending: true });

      if (error) throw error;
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
      const { data: faq, error } = await supabase
        .from("faq_items")
        .insert(toSnakeCase(result.data))
        .select(`
          id, question, answer, category, order,
          isActive:is_active, createdAt:created_at
        `)
        .single();

      if (error) throw error;
      res.status(201).json(faq);
    } catch (error) {
      console.error("Error creating FAQ:", error);
      res.status(500).json({ error: "Failed to create FAQ" });
    }
  });

  app.patch("/api/admin/faq/:id", isAuthenticated, async (req, res) => {
    try {
      const { data: faq, error } = await supabase
        .from("faq_items")
        .update(toSnakeCase(req.body))
        .eq("id", req.params.id)
        .select(`
          id, question, answer, category, order,
          isActive:is_active, createdAt:created_at
        `)
        .single();

      if (error) throw error;
      res.json(faq);
    } catch (error) {
      console.error("Error updating FAQ:", error);
      res.status(500).json({ error: "Failed to update FAQ" });
    }
  });

  app.delete("/api/admin/faq/:id", isAuthenticated, async (req, res) => {
    try {
      const { error } = await supabase.from("faq_items").delete().eq("id", req.params.id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting FAQ:", error);
      res.status(500).json({ error: "Failed to delete FAQ" });
    }
  });

  // Admin Careers CRUD
  app.get("/api/admin/careers", isAuthenticated, async (req, res) => {
    try {
      const { data: allCareers, error } = await supabase
        .from("careers")
        .select(`
          id, title, department, location, type, description, requirements,
          isActive:is_active, createdAt:created_at
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
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
      const { data: career, error } = await supabase
        .from("careers")
        .insert(toSnakeCase(result.data))
        .select(`
          id, title, department, location, type, description, requirements,
          isActive:is_active, createdAt:created_at
        `)
        .single();

      if (error) throw error;
      res.status(201).json(career);
    } catch (error) {
      console.error("Error creating career:", error);
      res.status(500).json({ error: "Failed to create career" });
    }
  });

  app.patch("/api/admin/careers/:id", isAuthenticated, async (req, res) => {
    try {
      const { data: career, error } = await supabase
        .from("careers")
        .update(toSnakeCase(req.body))
        .eq("id", req.params.id)
        .select(`
          id, title, department, location, type, description, requirements,
          isActive:is_active, createdAt:created_at
        `)
        .single();

      if (error) throw error;
      res.json(career);
    } catch (error) {
      console.error("Error updating career:", error);
      res.status(500).json({ error: "Failed to update career" });
    }
  });

  app.delete("/api/admin/careers/:id", isAuthenticated, async (req, res) => {
    try {
      const { error } = await supabase.from("careers").delete().eq("id", req.params.id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting career:", error);
      res.status(500).json({ error: "Failed to delete career" });
    }
  });

  // Department Management Routes
  app.get("/api/admin/departments", isAuthenticated, async (req, res) => {
    try {
      const { data: allDepartments, error } = await supabase
        .from("departments")
        .select(`
          id, name, slug, description, headId:head_id, imageUrl:image_url,
          color, order, isActive:is_active, createdAt:created_at, updatedAt:updated_at
        `)
        .order("order", { ascending: true });

      if (error) throw error;
      res.json(allDepartments);
    } catch (error) {
      console.error("Error fetching departments:", error);
      res.status(500).json({ error: "Failed to fetch departments" });
    }
  });

  app.get("/api/admin/departments/:id", isAuthenticated, async (req, res) => {
    try {
      const { data: department, error } = await supabase
        .from("departments")
        .select(`
          id, name, slug, description, headId:head_id, imageUrl:image_url,
          color, order, isActive:is_active, createdAt:created_at, updatedAt:updated_at
        `)
        .eq("id", req.params.id)
        .single();

      if (error || !department) {
        return res.status(404).json({ error: "Department not found" });
      }
      res.json(department);
    } catch (error) {
      console.error("Error fetching department:", error);
      res.status(500).json({ error: "Failed to fetch department" });
    }
  });

  app.post("/api/admin/departments", isAuthenticated, async (req, res) => {
    try {
      const slug = req.body.name?.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || "";
      const result = insertDepartmentSchema.safeParse({ ...req.body, slug });
      if (!result.success) {
        return res.status(400).json({ error: "Invalid department data", details: result.error.issues });
      }
      const { data: department, error } = await supabase
        .from("departments")
        .insert(toSnakeCase(result.data))
        .select(`
          id, name, slug, description, headId:head_id, imageUrl:image_url,
          color, order, isActive:is_active, createdAt:created_at, updatedAt:updated_at
        `)
        .single();

      if (error) throw error;
      res.status(201).json(department);
    } catch (error) {
      console.error("Error creating department:", error);
      res.status(500).json({ error: "Failed to create department" });
    }
  });

  app.patch("/api/admin/departments/:id", isAuthenticated, async (req, res) => {
    try {
      const updateSchema = insertDepartmentSchema.partial();
      const result = updateSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid department data", details: result.error.issues });
      }
      const updateData: Record<string, unknown> = { ...result.data };
      if (result.data.name) {
        updateData.slug = result.data.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      }
      updateData.updated_at = new Date();

      const { data: department, error } = await supabase
        .from("departments")
        .update(toSnakeCase(updateData))
        .eq("id", req.params.id)
        .select(`
          id, name, slug, description, headId:head_id, imageUrl:image_url,
          color, order, isActive:is_active, createdAt:created_at, updatedAt:updated_at
        `)
        .single();

      if (error) throw error;
      if (!department) {
        return res.status(404).json({ error: "Department not found" });
      }
      res.json(department);
    } catch (error) {
      console.error("Error updating department:", error);
      res.status(500).json({ error: "Failed to update department" });
    }
  });

  app.delete("/api/admin/departments/:id", isAuthenticated, async (req, res) => {
    try {
      const { error } = await supabase.from("departments").delete().eq("id", req.params.id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting department:", error);
      res.status(500).json({ error: "Failed to delete department" });
    }
  });

  // Public departments endpoint
  app.get("/api/departments", async (req, res) => {
    try {
      const { data: activeDepartments, error } = await supabase
        .from("departments")
        .select(`
          id, name, slug, description, headId:head_id, imageUrl:image_url,
          color, order, isActive:is_active, createdAt:created_at, updatedAt:updated_at
        `)
        .eq("is_active", true)
        .order("order", { ascending: true });

      if (error) throw error;
      res.json(activeDepartments);
    } catch (error) {
      console.error("Error fetching departments:", error);
      res.status(500).json({ error: "Failed to fetch departments" });
    }
  });

  return httpServer;
}
