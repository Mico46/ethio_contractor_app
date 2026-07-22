import { put } from "@vercel/blob";
import formidable from "formidable";
import fs from "fs";

export const config = { api: { bodyParser: false } };

function parseForm(req) {
  return new Promise((resolve, reject) => {
    const form = formidable({
      multiples: true,
      maxFileSize: 10 * 1024 * 1024,
      filter: ({ mimetype }) => mimetype && mimetype.startsWith("image/"),
    });
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { authenticate } = await import("@/lib/auth-middleware");
  const user = await authenticate(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  try {
    const { files } = await parseForm(req);
    const raw = files.file;
    if (!raw) return res.status(400).json({ error: "No file provided" });

    const fileList = Array.isArray(raw) ? raw : [raw];
    const urls = [];

    for (const file of fileList) {
      const filePath = file.filepath || file.path;
      const buffer = fs.readFileSync(filePath);
      const ext = file.originalFilename?.split(".").pop() || "jpg";
      const path = `photos/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const blob = await put(path, buffer, {
        access: "public",
        token: process.env.BLOB_READ_WRITE_TOKEN,
        contentType: file.mimetype || "image/jpeg",
      });

      fs.unlinkSync(filePath);
      urls.push(blob.url);
    }

    return res.status(200).json({ urls });
  } catch (err) {
    console.error("Blob upload error:", err);
    return res.status(500).json({ error: "Upload failed" });
  }
}
