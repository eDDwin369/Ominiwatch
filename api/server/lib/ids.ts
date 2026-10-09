import { randomUUID } from 'node:crypto';

/** UUID v4 — sufficient for these volumes and keeps IDs opaque. */
export const newId = (): string => randomUUID();

export const now = (): Date => new Date();

/** Normalises an email for storage/comparison: trimmed and lowercased. */
export const normalizeEmail = (email: string): string => email.trim().toLowerCase();
