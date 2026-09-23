import type { AsmrCategory } from "@/types/catalog";
import { z } from "zod";

const categorySchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  artwork: z.string().startsWith("/"),
});

export const categories: AsmrCategory[] = z.array(categorySchema).parse([
  {
    id: "sleep",
    slug: "sleep",
    name: "Sleep",
    description: "Slow down and drift gently",
    artwork: "/images/art/category-sleep.svg",
  },
  {
    id: "whispering",
    slug: "whispering",
    name: "Whispering",
    description: "Close, calm voices",
    artwork: "/images/art/category-whisper.svg",
  },
  {
    id: "roleplay",
    slug: "roleplay",
    name: "Roleplay",
    description: "Step into a softer world",
    artwork: "/images/art/category-roleplay.svg",
  },
  {
    id: "binaural",
    slug: "binaural",
    name: "Binaural",
    description: "Immersive three-dimensional sound",
    artwork: "/images/art/category-binaural.svg",
  },
  {
    id: "ear-cleaning",
    slug: "ear-cleaning",
    name: "Ear Cleaning",
    description: "Detailed and delicate textures",
    artwork: "/images/art/category-ear.svg",
  },
  {
    id: "tapping",
    slug: "tapping",
    name: "Tapping",
    description: "Rhythms for a quiet mind",
    artwork: "/images/art/category-tapping.svg",
  },
  {
    id: "no-talking",
    slug: "no-talking",
    name: "No Talking",
    description: "Pure sound, no words",
    artwork: "/images/art/category-notalking.svg",
  },
  {
    id: "personal-attention",
    slug: "personal-attention",
    name: "Personal Attention",
    description: "A little time just for you",
    artwork: "/images/art/category-attention.svg",
  },
  {
    id: "soft-spoken",
    slug: "soft-spoken",
    name: "Soft Spoken",
    description: "Gentle stories and reflections",
    artwork: "/images/art/category-soft.svg",
  },
  {
    id: "ambient",
    slug: "ambient",
    name: "Ambient",
    description: "Atmospheres without edges",
    artwork: "/images/art/category-ambient.svg",
  },
]);
