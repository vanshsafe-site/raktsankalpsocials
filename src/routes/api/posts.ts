import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { requireAdmin } from "@/lib/session.server";
import type { SocialPost } from "@/lib/platforms";

const platformSchema = z.enum(["youtube", "instagram", "facebook", "twitter", "linkedin"]);
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

function publicClient() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Cloud connection is not available.");
  return import("@supabase/supabase-js").then(({ createClient }) => createClient(url, key, { auth: { persistSession: false } }));
}

export const Route = createFileRoute("/api/posts")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const from = url.searchParams.get("from");
        const to = url.searchParams.get("to");
        const date = url.searchParams.get("date");
        const client = await publicClient();
        let query = client.from("social_posts").select("*").order("date").order("platform");
        if (date && dateSchema.safeParse(date).success) query = query.eq("date", date);
        else if (from && to && dateSchema.safeParse(from).success && dateSchema.safeParse(to).success) query = query.gte("date", from).lte("date", to);
        else return Response.json({ error: "A valid date range is required." }, { status: 400 });
        const { data, error } = await query;
        if (error) return Response.json({ error: "We couldn't load posting activity." }, { status: 500 });
        const posts = (data ?? []) as SocialPost[];
        return Response.json({ posts });
      },
      POST: async ({ request }) => {
        requireAdmin(request);
        const form = await request.formData();
        const date = String(form.get("date") ?? "");
        const platform = String(form.get("platform") ?? "");
        const parsedPlatform = platformSchema.safeParse(platform);
        if (!dateSchema.safeParse(date).success || !parsedPlatform.success) return Response.json({ error: "Please provide a valid date and platform." }, { status: 400 });
        const screenshot = form.get("screenshot");
        if (screenshot instanceof File && screenshot.size > 5 * 1024 * 1024) return Response.json({ error: "Images must be 5 MB or smaller." }, { status: 400 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const existing = await supabaseAdmin.from("social_posts").select("screenshot_path, screenshot_url").eq("date", date).eq("platform", platform).maybeSingle();
        let screenshotPath = existing.data?.screenshot_path ?? null;
        let screenshotUrl = existing.data?.screenshot_url ?? null;
        if (screenshot instanceof File && screenshot.size > 0) {
          const extension = (screenshot.name.split(".").pop() ?? "png").toLowerCase();
          if (!["jpg", "jpeg", "png", "webp"].includes(extension)) return Response.json({ error: "Use JPG, PNG, or WEBP images." }, { status: 400 });
          screenshotPath = `social-proof/${date.replaceAll("-", "/")}/${platform}-${crypto.randomUUID()}.${extension}`;
          const bytes = await screenshot.arrayBuffer();
          const uploaded = await supabaseAdmin.storage.from("social-proof").upload(screenshotPath, bytes, { contentType: screenshot.type || "image/png", upsert: false });
          if (uploaded.error) return Response.json({ error: "The screenshot could not be uploaded." }, { status: 500 });
          screenshotUrl = screenshotPath;
          if (existing.data?.screenshot_path) await supabaseAdmin.storage.from("social-proof").remove([existing.data.screenshot_path]);
        } else if (form.get("removeScreenshot") === "true" && screenshotPath) {
          await supabaseAdmin.storage.from("social-proof").remove([screenshotPath]);
          screenshotPath = null;
          screenshotUrl = null;
        }
        const payload = { date, platform, posted: form.get("posted") === "true", post_url: String(form.get("postUrl") ?? "").trim() || null, notes: String(form.get("notes") ?? "").trim() || null, screenshot_path: screenshotPath, screenshot_url: screenshotUrl };
        const { data, error } = await supabaseAdmin.from("social_posts").upsert(payload, { onConflict: "date,platform" }).select("*").single();
        if (error) return Response.json({ error: "The post could not be saved." }, { status: 500 });
        return Response.json({ post: data });
      },
    },
  },
});
