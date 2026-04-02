import { Router } from "express";
import { galleryStorage } from "./gallery-storage";
import { isAuthenticated, isContentAdmin } from "./auth";
import { insertGalleryItemSchema } from "../shared/schema";

const router = Router();

// Public routes
router.get("/", async (req, res) => {
  try {
    const items = await galleryStorage.getPublishedGalleryItems();
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch gallery items" });
  }
});

// Admin routes
router.get("/admin", isAuthenticated, isContentAdmin, async (req, res) => {
  try {
    const items = await galleryStorage.getGalleryItems();
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch all gallery items" });
  }
});

router.post("/admin", isAuthenticated, isContentAdmin, async (req, res) => {
  try {
    const result = insertGalleryItemSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Invalid input", details: result.error.errors });
    }
    const newItem = await galleryStorage.createGalleryItem(result.data);
    res.status(201).json(newItem);
  } catch (error) {
    console.error("Error creating gallery item:", error);
    res.status(500).json({ message: "Failed to create gallery item" });
  }
});

router.patch("/admin/:id", isAuthenticated, isContentAdmin, async (req, res) => {
  try {
    const result = insertGalleryItemSchema.partial().safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Invalid input", details: result.error.errors });
    }
    const updatedItem = await galleryStorage.updateGalleryItem(req.params.id, result.data);
    if (!updatedItem) {
      return res.status(404).json({ message: "Gallery item not found" });
    }
    res.json(updatedItem);
  } catch (error) {
    console.error("Error updating gallery item:", error);
    res.status(500).json({ message: "Failed to update gallery item" });
  }
});

router.delete("/admin/:id", isAuthenticated, isContentAdmin, async (req, res) => {
  try {
    const success = await galleryStorage.deleteGalleryItem(req.params.id);
    if (!success) {
      return res.status(404).json({ message: "Gallery item not found" });
    }
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting gallery item:", error);
    res.status(500).json({ message: "Failed to delete gallery item" });
  }
});

export default router;
