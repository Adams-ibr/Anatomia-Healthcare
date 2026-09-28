import { getStorage, Storage } from "firebase-admin/storage";
import { getFirebaseAdminStorage } from "./admin";

export interface UploadResult {
  file: any;
  publicUrl: string;
  metadata: {
    name: string;
    bucket: string;
    contentType: string;
    size: number;
    md5Hash: string | null;
    crc32c: string | null;
    etag: string;
    generation: string;
    metageneration: string;
    timeCreated: string;
    updated: string;
  };
}

export interface SignedUrlOptions {
  action: "read" | "write" | "delete" | "resumable";
  expires: Date | number | string;
  contentType?: string;
  version?: string;
}

export async function uploadFile(
  bucketName: string,
  filePath: string,
  content: Buffer | Uint8Array | string,
  options?: any
): Promise<UploadResult> {
  const storage = getFirebaseAdminStorage();
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(filePath);

  await file.save(content, {
    resumable: false,
    validation: "md5",
    ...options,
  });

  const [metadata] = await file.getMetadata();
  const publicUrl = `https://storage.googleapis.com/${bucketName}/${filePath}`;

  return { file, publicUrl, metadata: metadata as UploadResult["metadata"] };
}

export async function uploadFileFromPath(
  bucketName: string,
  filePath: string,
  localFilePath: string,
  options?: any
): Promise<UploadResult> {
  const storage = getFirebaseAdminStorage();
  const bucket = storage.bucket(bucketName);

  await bucket.upload(localFilePath, {
    destination: filePath,
    resumable: false,
    validation: "md5",
    ...options,
  });

  const file = bucket.file(filePath);
  const [metadata] = await file.getMetadata();
  const publicUrl = `https://storage.googleapis.com/${bucketName}/${filePath}`;

  return { file, publicUrl, metadata: metadata as UploadResult["metadata"] };
}

export async function deleteFile(bucketName: string, filePath: string): Promise<void> {
  const storage = getFirebaseAdminStorage();
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(filePath);
  await file.delete();
}

export async function getFileMetadata(bucketName: string, filePath: string) {
  const storage = getFirebaseAdminStorage();
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(filePath);
  const [metadata] = await file.getMetadata();
  return metadata;
}

export async function getSignedUrl(
  bucketName: string,
  filePath: string,
  options: SignedUrlOptions
): Promise<string> {
  const storage = getFirebaseAdminStorage();
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(filePath);

  const config: any = {
    action: options.action,
    expires: options.expires,
  };

  if (options.contentType) {
    config.contentType = options.contentType;
  }
  if (options.version) {
    config.version = options.version;
  }

  const [url] = await file.getSignedUrl(config);
  return url;
}

export async function getUploadSignedUrl(
  bucketName: string,
  filePath: string,
  expires: Date | number | string,
  contentType?: string
): Promise<string> {
  return getSignedUrl(bucketName, filePath, {
    action: "write",
    expires,
    contentType,
  });
}

export async function getDownloadSignedUrl(
  bucketName: string,
  filePath: string,
  expires: Date | number | string,
  version?: string
): Promise<string> {
  return getSignedUrl(bucketName, filePath, {
    action: "read",
    expires,
    version,
  });
}

export async function makeFilePublic(bucketName: string, filePath: string): Promise<void> {
  const storage = getFirebaseAdminStorage();
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(filePath);
  await file.makePublic();
}

export async function makeFilePrivate(bucketName: string, filePath: string): Promise<void> {
  const storage = getFirebaseAdminStorage();
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(filePath);
  await file.makePrivate();
}

export async function copyFile(
  sourceBucketName: string,
  sourceFilePath: string,
  destBucketName: string,
  destFilePath: string
): Promise<UploadResult> {
  const storage = getFirebaseAdminStorage();
  const sourceBucket = storage.bucket(sourceBucketName);
  const destBucket = storage.bucket(destBucketName);
  const sourceFile = sourceBucket.file(sourceFilePath);

  await sourceFile.copy(destBucket.file(destFilePath));

  const destFile = destBucket.file(destFilePath);
  const [metadata] = await destFile.getMetadata();
  const publicUrl = `https://storage.googleapis.com/${destBucketName}/${destFilePath}`;

  return { file: destFile, publicUrl, metadata: metadata as UploadResult["metadata"] };
}

export async function moveFile(
  sourceBucketName: string,
  sourceFilePath: string,
  destBucketName: string,
  destFilePath: string
): Promise<UploadResult> {
  const result = await copyFile(sourceBucketName, sourceFilePath, destBucketName, destFilePath);
  await deleteFile(sourceBucketName, sourceFilePath);
  return result;
}

export async function listFiles(
  bucketName: string,
  prefix?: string,
  delimiter?: string
): Promise<any[]> {
  const storage = getFirebaseAdminStorage();
  const bucket = storage.bucket(bucketName);
  const [files] = await bucket.getFiles({ prefix, delimiter });
  return files;
}

export async function getBucket(bucketName: string): Promise<any> {
  const storage = getFirebaseAdminStorage();
  return storage.bucket(bucketName);
}

export function getStorageInstance(): Storage {
  return getFirebaseAdminStorage();
}

export const DEFAULT_BUCKET = process.env.FIREBASE_STORAGE_BUCKET || "";