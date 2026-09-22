import { supabase, toSnakeCase } from "./db";
import { type GalleryItem, type InsertGalleryItem } from "../shared/schema";

const GALLERY_SELECT = "id, title, description, imageUrl:image_url, category, isPublished:is_published, createdAt:created_at, updatedAt:updated_at";

export class GalleryStorage {
  async getGalleryItems(): Promise<GalleryItem[]> {
    const { data, error } = await supabase
      .from("gallery_items")
      .select(GALLERY_SELECT)
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async getPublishedGalleryItems(): Promise<GalleryItem[]> {
    const { data, error } = await supabase
      .from("gallery_items")
      .select(GALLERY_SELECT)
      .eq("is_published", true)
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async getGalleryItemById(id: string): Promise<GalleryItem | undefined> {
    const { data, error } = await supabase
      .from("gallery_items")
      .select(GALLERY_SELECT)
      .eq("id", id)
      .single();
    
    if (error) return undefined;
    return data;
  }

  async createGalleryItem(item: InsertGalleryItem): Promise<GalleryItem> {
    const { data, error } = await supabase
      .from("gallery_items")
      .insert(toSnakeCase(item))
      .select(GALLERY_SELECT)
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateGalleryItem(id: string, item: Partial<InsertGalleryItem>): Promise<GalleryItem | undefined> {
    const { data, error } = await supabase
      .from("gallery_items")
      .update({ ...toSnakeCase(item), updated_at: new Date() })
      .eq("id", id)
      .select(GALLERY_SELECT)
      .single();
    
    if (error) return undefined;
    return data;
  }

  async deleteGalleryItem(id: string): Promise<boolean> {
    const { error } = await supabase
      .from("gallery_items")
      .delete()
      .eq("id", id);
    
    return !error;
  }
}

export const galleryStorage = new GalleryStorage();
