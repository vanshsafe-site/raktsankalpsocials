import { Facebook, Linkedin, PlaySquare, Twitter, Instagram } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type PlatformKey = "youtube" | "instagram" | "facebook" | "twitter" | "linkedin";

export type SocialPost = {
  id?: string;
  date: string;
  platform: PlatformKey;
  posted: boolean;
  post_url: string | null;
  screenshot_url: string | null;
  screenshot_path: string | null;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
};

export type PlatformConfig = {
  key: PlatformKey;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  tint: string;
};

export const PLATFORMS: PlatformConfig[] = [
  { key: "youtube", label: "YouTube", shortLabel: "YT", icon: PlaySquare, tint: "platform-youtube" },
  { key: "instagram", label: "Instagram", shortLabel: "IG", icon: Instagram, tint: "platform-instagram" },
  { key: "facebook", label: "Facebook", shortLabel: "FB", icon: Facebook, tint: "platform-facebook" },
  { key: "twitter", label: "X / Twitter", shortLabel: "X", icon: Twitter, tint: "platform-twitter" },
  { key: "linkedin", label: "LinkedIn", shortLabel: "IN", icon: Linkedin, tint: "platform-linkedin" },
];

export const PLATFORM_KEYS = PLATFORMS.map((platform) => platform.key);

export function getPlatform(key: string) {
  return PLATFORMS.find((platform) => platform.key === key);
}
