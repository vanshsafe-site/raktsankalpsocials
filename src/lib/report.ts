import { formatLongDate } from "./date-utils";
import { getPlatform, type SocialPost } from "./platforms";

type PdfImage = { bytes: Uint8Array; width: number; height: number };

function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)").replace(/[\r\n]/g, " ");
}

async function loadScreenshot(post: SocialPost): Promise<PdfImage | null> {
  if (!post.screenshot_path) return null;
  const response = await fetch(`/api/media/${post.screenshot_path.replace("social-proof/", "")}`);
  if (!response.ok) return null;
  const blob = await response.blob();
  const bitmap = await createImageBitmap(blob);
  const scale = Math.min(1, 1200 / bitmap.width, 780 / bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const base64 = canvas.toDataURL("image/jpeg", 0.82).split(",")[1] ?? "";
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return { bytes, width: canvas.width, height: canvas.height };
}

function joinBytes(chunks: Uint8Array[]) {
  const result = new Uint8Array(chunks.reduce((total, chunk) => total + chunk.length, 0));
  let offset = 0;
  for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.length; }
  return result;
}

function textBytes(value: string) { return new TextEncoder().encode(value); }

export async function buildPostsReport(posts: SocialPost[]) {
  const sorted = [...posts].sort((a, b) => a.date.localeCompare(b.date) || a.platform.localeCompare(b.platform));
  const pages: { content: string; image: PdfImage | null }[] = [];
  for (const post of sorted) {
    const platform = getPlatform(post.platform)?.label ?? post.platform;
    const image = await loadScreenshot(post).catch(() => null);
    const lines = [
      `Raktsankalp Social Media Report`,
      `${platform}  |  ${formatLongDate(post.date)}`,
      `Status: ${post.posted ? "Posted" : "Not posted"}`,
      post.post_url ? `Link: ${post.post_url}` : "Link: —",
      post.notes ? `Notes: ${post.notes}` : "Notes: —",
    ];
    let content = "BT\n/F1 20 Tf\n50 760 Td\n";
    lines.forEach((line, index) => { content += `(${escapePdfText(line)}) Tj\n${index === 0 ? "0 -34 Td\n/F1 13 Tf\n" : "0 -24 Td\n"}`; });
    if (image) content += `q\n500 0 0 ${Math.min(390, 500 * image.height / image.width)} 50 150 cm\n/Im1 Do\nQ\n`;
    content += "ET\n";
    pages.push({ content, image });
  }
  if (!pages.length) pages.push({ content: "BT\n/F1 20 Tf\n50 760 Td\n(No posts found) Tj\nET\n", image: null });

  const objects: Uint8Array[] = [];
  const add = (value: string | Uint8Array) => { objects.push(typeof value === "string" ? textBytes(value) : value); return objects.length; };
  const catalog = add("");
  const pagesObject = add("");
  const font = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const pageRefs: number[] = [];
  for (const page of pages) {
    const imageRef = page.image ? add(`<< /Type /XObject /Subtype /Image /Width ${page.image.width} /Height ${page.image.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${page.image.bytes.length} >>\nstream\n`) : 0;
    if (imageRef) objects[imageRef - 1] = joinBytes([objects[imageRef - 1], page.image!.bytes, textBytes("\nendstream")]);
    const resources = imageRef ? `<< /Font << /F1 ${font} 0 R >> /XObject << /Im1 ${imageRef} 0 R >> >>` : `<< /Font << /F1 ${font} 0 R >> >>`;
    const contentRef = add(`<< /Length ${page.content.length} >>\nstream\n${page.content}endstream`);
    pageRefs.push(add(`<< /Type /Page /Parent ${pagesObject} 0 R /MediaBox [0 0 600 842] /Resources ${resources} /Contents ${contentRef} 0 R >>`));
  }
  objects[catalog - 1] = textBytes(`<< /Type /Catalog /Pages ${pagesObject} 0 R >>`);
  objects[pagesObject - 1] = textBytes(`<< /Type /Pages /Kids [${pageRefs.map((ref) => `${ref} 0 R`).join(" ")}] /Count ${pageRefs.length} >>`);
  const header = textBytes("%PDF-1.4\n%\xFF\xFF\xFF\xFF\n");
  const chunks = [header];
  const offsets = [0];
  let position = header.length;
  objects.forEach((object, index) => { offsets.push(position); const chunk = joinBytes([textBytes(`${index + 1} 0 obj\n`), object, textBytes("\nendobj\n")]); chunks.push(chunk); position += chunk.length; });
  const xref = position;
  chunks.push(textBytes(`xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("")}trailer\n<< /Size ${objects.length + 1} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF`));
  return new Blob([joinBytes(chunks)], { type: "application/pdf" });
}
