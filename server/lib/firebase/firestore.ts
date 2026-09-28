import {
  Firestore,
  CollectionReference,
  DocumentReference,
  Query,
  WhereFilterOp,
  OrderByDirection,
  DocumentData,
  DocumentSnapshot,
  QuerySnapshot,
  FieldValue,
  Timestamp,
  WriteBatch,
} from "firebase-admin/firestore";
import { getFirebaseAdminFirestore } from "./admin";

export type FirestoreFilterOperator = WhereFilterOp;

export interface QueryOptions {
  filters?: Array<{ field: string; operator: FirestoreFilterOperator; value: unknown }>;
  orderBy?: Array<{ field: string; direction: OrderByDirection }>;
  limit?: number;
  offset?: number;
  startAfter?: DocumentSnapshot;
}

export function buildQuery<T extends DocumentData>(
  collection: CollectionReference<T>,
  options: QueryOptions
): Query<T> {
  let query: Query<T> = collection;

  if (options.filters) {
    for (const { field, operator, value } of options.filters) {
      query = query.where(field, operator, value);
    }
  }

  if (options.orderBy) {
    for (const { field, direction } of options.orderBy) {
      query = query.orderBy(field, direction);
    }
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  if (options.offset) {
    query = query.offset(options.offset);
  }

  if (options.startAfter) {
    query = query.startAfter(options.startAfter);
  }

  return query;
}

export async function getDocuments<T extends DocumentData>(
  collection: CollectionReference<T>,
  options: QueryOptions = {}
): Promise<Array<T & { id: string }>> {
  const query = buildQuery(collection, options);
  const snapshot = await query.get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T & { id: string }));
}

export async function getDocument<T extends DocumentData>(
  ref: DocumentReference<T>
): Promise<(T & { id: string }) | null> {
  const snapshot = await ref.get();
  if (!snapshot.exists) return null;
  return { id: snapshot.id, ...snapshot.data() } as T & { id: string };
}

export async function getDocumentById<T extends DocumentData>(
  collection: CollectionReference<T>,
  id: string
): Promise<(T & { id: string }) | null> {
  return getDocument(collection.doc(id));
}

export async function createDocument<T extends DocumentData>(
  collection: CollectionReference<T>,
  data: Omit<T, "id" | "createdAt" | "updatedAt">,
  customId?: string
): Promise<T & { id: string }> {
  const now = Timestamp.now();
  const docData = {
    ...data,
    createdAt: now,
    updatedAt: now,
  } as unknown as T;

  let ref: DocumentReference<T>;
  if (customId) {
    ref = collection.doc(customId);
    await ref.set(docData);
  } else {
    const docRef = await collection.add(docData);
    ref = docRef;
  }

  const snapshot = await ref.get();
  return { id: ref.id, ...snapshot.data()! } as T & { id: string };
}

export async function updateDocument<T extends DocumentData>(
  ref: DocumentReference<T>,
  data: Partial<Omit<T, "id" | "createdAt" | "updatedAt">>
): Promise<T & { id: string }> {
  const updateData = {
    ...data,
    updatedAt: Timestamp.now(),
  };
  await ref.update(updateData);
  const snapshot = await ref.get();
  return { id: ref.id, ...snapshot.data()! } as T & { id: string };
}

export async function deleteDocument(ref: DocumentReference): Promise<void> {
  await ref.delete();
}

export async function deleteDocumentById(
  collection: CollectionReference,
  id: string
): Promise<void> {
  await collection.doc(id).delete();
}

export function getBatch(): WriteBatch {
  const db = getFirebaseAdminFirestore();
  return db.batch();
}

export async function commitBatch(batch: WriteBatch): Promise<void> {
  await batch.commit();
}

export function collectionRef<T extends DocumentData>(
  db: Firestore,
  path: string
): CollectionReference<T> {
  return db.collection(path) as CollectionReference<T>;
}

export function docRef<T extends DocumentData>(
  db: Firestore,
  path: string
): DocumentReference<T> {
  return db.doc(path) as DocumentReference<T>;
}

export function serverTimestamp(): FieldValue {
  return FieldValue.serverTimestamp();
}

export function increment(n: number): FieldValue {
  return FieldValue.increment(n);
}

export function arrayUnion(...elements: unknown[]): FieldValue {
  return FieldValue.arrayUnion(...elements);
}

export function arrayRemove(...elements: unknown[]): FieldValue {
  return FieldValue.arrayRemove(...elements);
}

export function deleteField(): FieldValue {
  return FieldValue.delete();
}