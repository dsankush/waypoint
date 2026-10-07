import { errorResponse, HttpError, requireUser } from "@/lib/auth";
import { removeResume, storeResume } from "@/lib/db";

export const maxDuration = 60;
const MAX_BYTES = 5 * 1024 * 1024;

const TYPES: Record<string, { mime: string; magic: (b: Buffer) => boolean }> = {
  pdf: { mime: "application/pdf", magic: (b) => b.subarray(0, 4).toString() === "%PDF" },
  doc: { mime: "application/msword", magic: (b) => b[0] === 0xd0 && b[1] === 0xcf && b[2] === 0x11 && b[3] === 0xe0 },
  docx: {
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    magic: (b) => b[0] === 0x50 && b[1] === 0x4b,
  },
};

function cleanText(t: string) {
  return t
    .replace(/\r/g, "")
    .split("\n")
    .filter((l) => !/^\s*(page\s*)?\d+(\s*(of|\/)\s*\d+)?\s*$/i.test(l))
    .join("\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 20000);
}

async function extractText(ext: string, buf: Buffer): Promise<string | null> {
  try {
    if (ext === "pdf") {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: new Uint8Array(buf) });
      try {
        const r = await parser.getText();
        return cleanText(r.text ?? "") || null;
      } finally {
        await parser.destroy().catch(() => {});
      }
    }
    if (ext === "docx") {
      const mammoth = await import("mammoth");
      const r = await mammoth.extractRawText({ buffer: buf });
      return cleanText(r.value ?? "") || null;
    }
  } catch {
    /* unreadable file: stored without text */
  }
  return null; // legacy .doc is stored but not read
}

export async function POST(req: Request) {
  try {
    const u = await requireUser();
    const form = await req.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File)) throw new HttpError(400, "No file was sent.");
    if (file.size > MAX_BYTES) throw new HttpError(413, "That file is larger than 5 MB.");
    if (file.size === 0) throw new HttpError(400, "That file is empty.");
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    const t = TYPES[ext];
    if (!t) throw new HttpError(415, "Please upload a PDF, DOC or DOCX file.");
    const buf = Buffer.from(await file.arrayBuffer());
    if (!t.magic(buf)) throw new HttpError(415, "That file does not look like a valid " + ext.toUpperCase() + ".");

    const text = await extractText(ext, buf);
    const saved = await storeResume(u.id, file.name.slice(0, 120), t.mime, buf, text);
    return Response.json({
      file_name: saved.fileName,
      signed_url: saved.signedUrl,
      readable: ext === "doc" ? null : !!text,
    });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE() {
  try {
    const u = await requireUser();
    await removeResume(u.id);
    return Response.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
