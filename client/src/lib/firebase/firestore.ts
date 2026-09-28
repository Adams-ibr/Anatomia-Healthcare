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
  Timestamp,
  WriteBatch,
  writeBatch,
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  QueryConstraint,
  serverTimestamp as fbServerTimestamp,
  increment as fbIncrement,
  arrayUnion as fbArrayUnion,
  arrayRemove as fbArrayRemove,
  deleteField as fbDeleteField,
} from "firebase/firestore";
import { getFirebaseClientFirestore } from "./index";

export type FirestoreFilterOperator = WhereFilterOp;

export interface QueryOptions {
  filters?: Array<{ field: string; operator: FirestoreFilterOperator; value: unknown }>;
  orderBy?: Array<{ field: string; direction: OrderByDirection }>;
  limit?: number;
  offset?: number;
  startAfter?: DocumentSnapshot;
}

function buildQueryConstraints(options: QueryOptions): QueryConstraint[] {
  const constraints: QueryConstraint[] = [];

  if (options.filters) {
    for (const { field, operator, value } of options.filters) {
      constraints.push(where(field, operator, value));
    }
  }

  if (options.orderBy) {
    for (const { field, direction } of options.orderBy) {
      constraints.push(orderBy(field, direction));
    }
  }

  if (options.limit) {
    constraints.push(limit(options.limit));
  }

  if (options.startAfter) {
    constraints.push(startAfter(options.startAfter));
  }

  return constraints;
}

export async function getDocuments<T extends DocumentData>(
  collectionRef: CollectionReference<T>,
  options: QueryOptions = {}
): Promise<Array<T & { id: string }>> {
  const constraints = buildQueryConstraints(options);
  const q = query(collectionRef, ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T & { id: string }));
}

export async function getDocument<T extends DocumentData>(
  ref: DocumentReference<T>
): Promise<(T & { id: string }) | null> {
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as T & { id: string };
}

export async function getDocumentById<T extends DocumentData>(
  collectionRef: CollectionReference<T>,
  id: string
): Promise<(T & { id: string }) | null> {
  return getDocument(doc(collectionRef, id));
}

export async function createDocument<T extends DocumentData>(
  collectionRef: CollectionReference<T>,
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
    ref = doc(collectionRef, customId);
    await setDoc(ref, docData);
  } else {
    const docRef = await addDoc(collectionRef, docData);
    ref = docRef;
  }

  const snapshot = await getDoc(ref);
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
  await updateDoc(ref, updateData);
  const snapshot = await getDoc(ref);
  return { id: ref.id, ...snapshot.data()! } as T & { id: string };
}

export async function deleteDocument(ref: DocumentReference): Promise<void> {
  await deleteDoc(ref);
}

export async function deleteDocumentById(
  collectionRef: CollectionReference,
  id: string
): Promise<void> {
  await deleteDoc(doc(collectionRef, id));
}

export function getBatch(): WriteBatch {
  const db = getFirebaseClientFirestore();
  return writeBatch(db);
}

export async function commitBatch(batch: WriteBatch): Promise<void> {
  await batch.commit();
}

export function collectionRef<T extends DocumentData>(
  db: Firestore,
  path: string
): CollectionReference<T> {
  return collection(db, path) as CollectionReference<T>;
}

export function docRef<T extends DocumentData>(
  db: Firestore,
  path: string
): DocumentReference<T> {
  return doc(db, path) as DocumentReference<T>;
}

export function getServerTimestamp() {
  return fbServerTimestamp();
}

export function getIncrement(n: number) {
  return fbIncrement(n);
}

export function getArrayUnion(...elements: unknown[]) {
  return fbArrayUnion(...elements);
}

export function getArrayRemove(...elements: unknown[]) {
  return fbArrayRemove(...elements);
}

export function getDeleteField() {
  return fbDeleteField();
}