import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import { galleryItems, type GalleryItem, type InsertGalleryItem } from "../shared/schema";

export class GalleryStorage {
  async getGalleryItems(): Promise<GalleryItem[]> {
    return db.select().from(galleryItems).orderBy(desc(galleryItems.createdAt));
  }

  async getPublishedGalleryItems(): Promise<GalleryItem[]> {
    return db.select()
      .from(galleryItems)
      .where(eq(galleryItems.isPublished, true))
      .orderBy(desc(galleryItems.createdAt));
  }

  async getGalleryItemById(id: string): Promise<GalleryItem | undefined> {
    const [item] = await db.select().from(galleryItems).where(eq(galleryItems.id, id));
    return item;
  }

  async createGalleryItem(item: InsertGalleryItem): Promise<GalleryItem> {
    const [newItem] = await db.insert(galleryItems).values(item).returning();
    return newItem;
  }

  async updateGalleryItem(id: string, item: Partial<InsertGalleryItem>): Promise<GalleryItem | undefined> {
    const [updatedItem] = await db
      .update(galleryItems)
      .set({ ...item, updatedAt: new Date() })
      .where(eq(galleryItems.id, id))
      .returning();
    return updatedItem;
  }

  async deleteGalleryItem(id: string): Promise<boolean> {
    const result = await db.delete(galleryItems).where(eq(galleryItems.id, id)).returning();
    return result.length > 0;
  }
}

export const galleryStorage = new GalleryStorage();
