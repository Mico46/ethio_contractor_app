import { put } from "@vercel/blob";

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { authenticate } = await import("@/lib/auth-middleware");
  const user = await authenticate(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") return res.status(400).json({ error: "No file provided" });

    const ext = file.name?.split(".").pop() || "jpg";
    const path = `photos/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const blob = await put(path, file, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    return res.status(200).json({ url: blob.url });
  } catch (err) {
    console.error("Blob upload error:", err);
    return res.status(500).json({ error: "Upload failed" });
  }
}
