import { useState } from "react";
import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchReportPosts } from "@/lib/api";
import { buildPostsReport } from "@/lib/report";
import { toast } from "sonner";

export function DownloadReportButton() {
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    try {
      const { posts } = await fetchReportPosts();
      const pdf = await buildPostsReport(posts);
      const url = URL.createObjectURL(pdf);
      const link = document.createElement("a");
      link.href = url;
      link.download = `raktsankalp-social-report-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success(`Downloaded report with ${posts.length} post${posts.length === 1 ? "" : "s"}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "We couldn't create the report.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Button type="button" variant="outline" onClick={() => void handleDownload()} disabled={downloading}>
      <FileDown size={16} />
      {downloading ? "Building report..." : "Download report"}
    </Button>
  );
}
