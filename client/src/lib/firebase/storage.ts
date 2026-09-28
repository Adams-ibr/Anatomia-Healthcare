import {
  getStorage,
  FirebaseStorage,
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  getMetadata,
  updateMetadata,
  listAll,
  UploadMetadata,
  SettableMetadata,
  UploadTask,
  UploadTaskSnapshot,
} from "firebase/storage";
import { getFirebaseClientStorage } from "./index";

export interface UploadResult {
  ref: ReturnType<typeof ref>;
  downloadURL: string;
  metadata: {
    name: string;
    bucket: string;
    contentType: string;
    size: number;
    md5Hash: string | null;
    customMetadata: Record<string, string>;
  };
}

export async function uploadFile(
  path: string,
  data: Blob | Uint8Array | ArrayBuffer,
  metadata?: UploadMetadata
): Promise<UploadResult> {
  const storage = getFirebaseClientStorage();
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, data, metadata);
  const downloadURL = await getDownloadURL(snapshot.ref);
  const meta = await getMetadata(snapshot.ref);

  return {
    ref: snapshot.ref,
    downloadURL,
    metadata: {
      name: meta.name,
      bucket: meta.bucket,
      contentType: meta.contentType ?? "",
      size: meta.size,
      md5Hash: meta.md5Hash ?? null,
      customMetadata: meta.customMetadata || {},
    },
  };
}

export function uploadFileResumable(
  path: string,
  data: Blob | Uint8Array | ArrayBuffer,
  metadata?: UploadMetadata,
  onProgress?: (progress: number) => void
): UploadTask {
  const storage = getFirebaseClientStorage();
  const storageRef = ref(storage, path);
  const uploadTask = uploadBytesResumable(storageRef, data, metadata);

  if (onProgress) {
    uploadTask.on("state_changed", snapshot => {
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      onProgress(progress);
    });
  }

  return uploadTask;
}

export async function getUploadTaskResult(uploadTask: UploadTask): Promise<UploadResult> {
  const snapshot = await uploadTask;
  const downloadURL = await getDownloadURL(snapshot.ref);
  const meta = await getMetadata(snapshot.ref);

  return {
    ref: snapshot.ref,
    downloadURL,
    metadata: {
      name: meta.name,
      bucket: meta.bucket,
      contentType: meta.contentType ?? "",
      size: meta.size,
      md5Hash: meta.md5Hash ?? null,
      customMetadata: meta.customMetadata || {},
    },
  };
}

export async function deleteFile(path: string): Promise<void> {
  const storage = getFirebaseClientStorage();
  const storageRef = ref(storage, path);
  await deleteObject(storageRef);
}

export async function getFileMetadata(path: string) {
  const storage = getFirebaseClientStorage();
  const storageRef = ref(storage, path);
  return getMetadata(storageRef);
}

export async function updateFileMetadata(path: string, metadata: SettableMetadata) {
  const storage = getFirebaseClientStorage();
  const storageRef = ref(storage, path);
  return updateMetadata(storageRef, metadata);
}

export async function getDownloadUrl(path: string): Promise<string> {
  const storage = getFirebaseClientStorage();
  const storageRef = ref(storage, path);
  return getDownloadURL(storageRef);
}

export async function listFiles(path: string) {
  const storage = getFirebaseClientStorage();
  const storageRef = ref(storage, path);
  return listAll(storageRef);
}

export function getStorageInstance(): FirebaseStorage {
  return getFirebaseClientStorage();
}

export function getStorageRef(path: string) {
  const storage = getFirebaseClientStorage();
  return ref(storage, path);
}