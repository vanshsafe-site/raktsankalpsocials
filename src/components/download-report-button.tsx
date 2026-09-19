import { useRef, useState } from "react";
import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchReportPosts } from "@/lib/api";
import { buildPostsReport } from "@/lib/report";
import { toast } from "sonner";

const DOWNLOAD_CLEANUP_DELAY = 10_000;

export function DownloadReportButton() {
  const [downloading, setDownloading] = useState(false);
  const downloadInProgress = useRef(false);

  async function handleDownload() {
    // The state update is asynchronous, so use a ref as well to prevent two
    // reports being generated when the button is clicked twice in one tick.
    if (downloadInProgress.current) return;

    downloadInProgress.current = true;
    setDownloading(true);

    let url: string | null = null;
    let link: HTMLAnchorElement | null = null;
    let cleanupTimer: number | null = null;

    const cleanup = () => {
      if (cleanupTimer !== null) window.clearTimeout(cleanupTimer);
      link?.remove();
      if (url) URL.revokeObjectURL(url);
      link = null;
      url = null;
    };

    try {
      const { posts } = await fetchReportPosts();
      const pdf = await buildPostsReport(posts);
      url = URL.createObjectURL(pdf);

      link = document.createElement("a");
      link.href = url;
      link.download = `raktsankalp-social-report-${new Date().toISOString().slice(0, 10)}.pdf`;
      link.rel = "noopener";
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();

      // Keep the anchor and object URL alive while the browser starts the
      // download. Removing either immediately can produce an empty PDF in
      // Safari and some Chromium versions, especially for larger reports.
      cleanupTimer = window.setTimeout(cleanup, DOWNLOAD_CLEANUP_DELAY);

      toast.success(`Downloaded report with ${posts.length} post${posts.length === 1 ? "" : "s"}`);
    } catch (error) {
      cleanup();
      toast.error(error instanceof Error ? error.message : "We couldn't create the report.");
    } finally {
      downloadInProgress.current = false;
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
