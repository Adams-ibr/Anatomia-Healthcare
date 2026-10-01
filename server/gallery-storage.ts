import { getFirebaseAdminFirestore, serverTimestamp, getDocuments, getDocumentById, createDocument, updateDocument, deleteDocument, collections } from "./lib/firebase";
import { type GalleryItem, type InsertGalleryItem } from "../shared/schema";

export class GalleryStorage {
  private db = getFirebaseAdminFirestore();
  private collection = collections.galleryItems;

  async getGalleryItems(): Promise<GalleryItem[]> {
    const items = await getDocuments(this.collection, {
      orderBy: [{ field: "createdAt", direction: "desc" }],
    });
    return items as GalleryItem[];
  }

  async getPublishedGalleryItems(): Promise<GalleryItem[]> {
    const items = await getDocuments(this.collection, {
      filters: [{ field: "isPublished", operator: "==", value: true }],
      orderBy: [{ field: "createdAt", direction: "desc" }],
    });
    return items as GalleryItem[];
  }

  async getGalleryItemById(id: string): Promise<GalleryItem | undefined> {
    const item = await getDocumentById(this.collection, id);
    return item as GalleryItem | undefined;
  }

  async createGalleryItem(item: InsertGalleryItem): Promise<GalleryItem> {
    const created = await createDocument(this.collection, item as any);
    return created as GalleryItem;
  }

  async updateGalleryItem(id: string, item: Partial<InsertGalleryItem>): Promise<GalleryItem | undefined> {
    const ref = this.collection.doc(id);
    await updateDocument(ref, { ...item, updatedAt: serverTimestamp() } as any);
    const updated = await getDocumentById(this.collection, id);
    return updated as GalleryItem | undefined;
  }

  async deleteGalleryItem(id: string): Promise<boolean> {
    await deleteDocument(this.collection.doc(id));
    return true;
  }
}

export const galleryStorage = new GalleryStorage();