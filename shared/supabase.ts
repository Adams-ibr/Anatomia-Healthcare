import type { PostgrestError } from "@supabase/supabase-js";

export interface SupabaseError {
  message: string;
  code: string;
  details: string;
  hint?: string;
}

export function isPostgrestError(error: unknown): error is PostgrestError {
  return (
    error !== null &&
    typeof error === "object" &&
    "message" in error &&
    "code" in error &&
    "details" in error
  );
}

export interface SupabaseResponse<T> {
  data: T | null;
  error: SupabaseError | null;
  count?: number | null;
  status: number;
  statusText: string;
}

export function isSupabaseError(error: unknown): error is SupabaseError {
  return (
    error !== null &&
    typeof error === "object" &&
    "message" in error &&
    "code" in error &&
    "details" in error
  );
}

export function handleSupabaseError(error: unknown, context?: string): never {
  const message = context ? `${context}: ` : "";
  if (isSupabaseError(error)) {
    throw new Error(`${message}${error.message} (code: ${error.code})`);
  }
  if (error instanceof Error) {
    throw new Error(`${message}${error.message}`);
  }
  throw new Error(`${message}Unknown error occurred`);
}

export function toSnakeCase<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  if (!obj || typeof obj !== "object" || Array.isArray(obj) || obj instanceof Date) {
    return obj as Record<string, unknown>;
  }
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    result[snakeKey] = value;
  }
  return result;
}

export function toCamelCase<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  if (!obj || typeof obj !== "object" || Array.isArray(obj) || obj instanceof Date) {
    return obj as Record<string, unknown>;
  }
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = value;
  }
  return result;
}

export type SupabaseFilterOperator =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "like"
  | "ilike"
  | "is"
  | "in"
  | "contains"
  | "containedBy"
  | "rangeGt"
  | "rangeGte"
  | "rangeLt"
  | "rangeLte"
  | "rangeAdjacent"
  | "overlaps"
  | "textSearch"
  | "match"
  | "not";

export interface QueryOptions {
  select?: string;
  filters?: Record<string, { operator: SupabaseFilterOperator; value: unknown }>;
  orderBy?: { column: string; ascending?: boolean }[];
  limit?: number;
  offset?: number;
  count?: "exact" | "planned" | "estimated";
}