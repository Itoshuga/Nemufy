import { z } from "zod";
import { firestoreIdSchema } from "@/lib/validation/platform";

const optionalUrl = z.union([z.url(), z.literal("")]).optional();
const socialUrls = z.array(z.url()).max(8).default([]);
const optionalMessage = z.string().trim().max(4000).optional().default("");

export const artistClaimApplicationSchema = z.object({
  type: z.literal("artist_claim"),
  artistId: firestoreIdSchema,
  websiteUrl: optionalUrl,
  socialUrls,
  contactEmail: z.union([z.email(), z.literal("")]).optional(),
  message: optionalMessage,
});

export const artistCreationApplicationSchema = z.object({
  type: z.literal("artist_creation"),
  name: z.string().trim().min(2).max(80),
  biography: z.string().trim().max(4000).optional().default(""),
  websiteUrl: optionalUrl,
  socialUrls,
  categoryIds: z.array(firestoreIdSchema).max(20).default([]),
  message: optionalMessage,
});

export const labelCreationApplicationSchema = z.object({
  type: z.literal("label_creation"),
  name: z.string().trim().min(2).max(120),
  websiteUrl: optionalUrl,
  socialUrls,
  description: z.string().trim().max(4000).optional().default(""),
  representativeRole: z.string().trim().max(120).optional().default(""),
  message: optionalMessage,
});

export const submitApplicationSchema = z.discriminatedUnion("type", [
  artistClaimApplicationSchema,
  artistCreationApplicationSchema,
  labelCreationApplicationSchema,
]);

export const applicantApplicationActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("cancel") }),
  z.object({
    action: z.literal("respond"),
    message: z.string().trim().min(2).max(4000),
  }),
]);

export const rejectionReasonSchema = z.enum([
  "unable_to_verify_ownership",
  "duplicate_artist_profile",
  "insufficient_information",
  "invalid_label_request",
  "other",
]);

export const adminApplicationActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("start_review") }),
  z.object({ action: z.literal("approve") }),
  z.object({
    action: z.literal("request_information"),
    message: z.string().trim().min(2).max(4000),
  }),
  z.object({
    action: z.literal("reject"),
    reason: rejectionReasonSchema,
    message: z.string().trim().min(2).max(4000),
    adminNote: z.string().trim().max(4000).optional().default(""),
  }),
  z.object({
    action: z.literal("link_existing"),
    artistId: firestoreIdSchema,
  }),
]);

export type SubmitApplicationInput = z.infer<typeof submitApplicationSchema>;
