import { useState } from "react";
import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchReportPosts } from "@/lib/api";
import { buildPostsReport } from "@/lib/report";
import { toast } from "sonner";

export function DownloadReportButton() {
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    if (downloading) return;

    setDownloading(true);
    let url: string | null = null;
    try {
      const { posts } = await fetchReportPosts();
      const pdf = await buildPostsReport(posts);
      url = URL.createObjectURL(pdf);

      const link = document.createElement("a");
      link.href = url;
      link.download = `raktsankalp-social-report-${new Date().toISOString().slice(0, 10)}.pdf`;
      link.rel = "noopener";
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      link.remove();

      // Some browsers do not start reading a blob until the current task has
      // finished. Revoking it immediately can result in a zero-byte download.
      window.setTimeout(() => URL.revokeObjectURL(url!), 1000);
      toast.success(`Downloaded report with ${posts.length} post${posts.length === 1 ? "" : "s"}`);
    } catch (error) {
      if (url) URL.revokeObjectURL(url);
      toast.error(error instanceof Error ? error.message : "We couldn't create the report.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => void handleDownload()}
      disabled={downloading}
      aria-busy={downloading}
    >
      <FileDown size={16} />
      {downloading ? "Building report..." : "Download report"}
    </Button>
  );
}
