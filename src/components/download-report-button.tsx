import { useRef, useState } from "react";
import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchReportPosts } from "@/lib/api";
import { buildPostsReport } from "@/lib/report";
import { toast } from "sonner";

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

      // Keep both the anchor and object URL alive while the browser starts the
      // download. Removing either immediately can produce an empty PDF in
      // Safari and some Chromium versions, especially for larger reports.
      const downloadUrl = url;
      const downloadLink = link;
      window.setTimeout(() => {
        downloadLink.remove();
        URL.revokeObjectURL(downloadUrl);
      }, 10_000);

      toast.success(`Downloaded report with ${posts.length} post${posts.length === 1 ? "" : "s"}`);
    } catch (error) {
      link?.remove();
      if (url) URL.revokeObjectURL(url);
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
