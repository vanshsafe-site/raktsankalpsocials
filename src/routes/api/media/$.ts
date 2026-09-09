import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/media/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const path = params._splat;
        if (!path) return new Response("Not found", { status: 404 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const signed = await supabaseAdmin.storage.from("social-proof").createSignedUrl(path, 60 * 60);
        if (signed.error || !signed.data?.signedUrl) return new Response("Not found", { status: 404 });
        return Response.redirect(signed.data.signedUrl, 302);
      },
    },
  },
});
