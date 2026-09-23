import { z } from "zod";
import { permissionActions, systemCapabilityNames } from "@/types/platform";

export const firestoreIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(150)
  .regex(/^[^/]+$/, "IDs cannot contain slashes.");

const nullableUrlSchema = z.union([z.url(), z.literal(""), z.null()]);

export const createArtistSchema = z.object({
  name: z.string().trim().min(2).max(80),
  displayName: z.string().trim().min(2).max(80).optional(),
  biography: z.string().trim().max(4000).optional().default(""),
});

export const updateArtistSchema = z.object({
  name: z.string().trim().min(2).max(80),
  displayName: z.string().trim().min(2).max(80),
  biography: z.string().trim().max(4000),
  categoryIds: z.array(firestoreIdSchema).max(20),
  links: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(40),
        url: z.url(),
      }),
    )
    .max(12),
  avatarUrl: nullableUrlSchema.optional(),
  avatarStoragePath: z.string().max(500).nullable().optional(),
  bannerUrl: nullableUrlSchema.optional(),
  bannerStoragePath: z.string().max(500).nullable().optional(),
});

export const createLabelSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(4000).optional().default(""),
  websiteUrl: z
    .union([z.url(), z.literal("")])
    .optional()
    .default(""),
});

export const updateLabelSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(4000),
  websiteUrl: z.union([z.url(), z.literal("")]),
});

export const releaseTypeSchema = z.enum(["single", "ep", "album"]);

export const createReleaseSchema = z.object({
  title: z.string().trim().min(1).max(160),
  type: releaseTypeSchema,
  releaseDate: z.iso.date(),
  description: z.string().trim().max(4000).optional().default(""),
  copyright: z.string().trim().max(240).optional().default(""),
  explicit: z.boolean().optional().default(false),
  primaryArtistIds: z.array(firestoreIdSchema).min(1).max(12),
  featuredArtistIds: z.array(firestoreIdSchema).max(24).default([]),
});

export const updateReleaseSchema = createReleaseSchema;

export const releaseArtworkSchema = z.object({
  coverUrl: z.url(),
  coverStoragePath: z.string().min(1).max(500),
});

export const trackArtworkSchema = z.object({
  coverUrl: z.url(),
  coverStoragePath: z.string().min(1).max(500),
});

export const createTrackSchema = z.object({
  trackId: firestoreIdSchema,
  releaseId: firestoreIdSchema,
  title: z.string().trim().min(1).max(160),
  primaryArtistIds: z.array(firestoreIdSchema).min(1).max(12),
  featuredArtistIds: z.array(firestoreIdSchema).max(24).default([]),
  durationSeconds: z
    .number()
    .int()
    .min(1)
    .max(12 * 60 * 60),
  trackNumber: z.number().int().min(1).max(999),
  explicit: z.boolean().optional().default(false),
  categoryIds: z.array(firestoreIdSchema).max(20).default([]),
  tags: z.array(z.string().trim().min(1).max(40)).max(30).default([]),
  audioUrl: z.url(),
  audioStoragePath: z.string().min(1).max(500),
});

export const updateTrackSchema = createTrackSchema.pick({
  title: true,
  primaryArtistIds: true,
  featuredArtistIds: true,
  explicit: true,
  categoryIds: true,
  tags: true,
});

export const reorderTracksSchema = z
  .object({
    orderedTrackIds: z.array(firestoreIdSchema).min(1).max(999),
  })
  .refine(
    ({ orderedTrackIds }) =>
      new Set(orderedTrackIds).size === orderedTrackIds.length,
    { message: "Track identifiers must be unique." },
  );

export const userCapabilitiesSchema = z.object({
  capabilities: z.object({
    artist: z.boolean(),
    label: z.boolean(),
    admin: z.boolean(),
  }),
});

export const accountStatusSchema = z.object({
  accountStatus: z.enum(["active", "suspended"]),
});

export const subscriptionSchema = z.object({
  subscriptionPlan: z.enum(["free", "premium"]),
  subscriptionStatus: z.enum([
    "active",
    "inactive",
    "trialing",
    "past_due",
    "cancelled",
  ]),
});

export const permissionActionSchema = z.enum(permissionActions);
export const systemCapabilitySchema = z.enum(systemCapabilityNames);

export function toSlug(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
