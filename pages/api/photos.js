import { db } from "@/lib/firebase-admin";
import { authenticate, isAdmin, canManageSite } from "@/lib/auth-middleware";

// Flutter SitePhoto model: { id, siteId, caption, takenAt, syncStatus, url (List<String>) }
export default async function handler(req, res) {
  const user = await authenticate(req, res);
  if (!user) return;

  switch (req.method) {
    case "GET":
      try {
        let query = db.collection("photos");
        if (req.query.siteId) {
          query = query.where("siteId", "==", req.query.siteId);
        }
        const snapshot = await query.get();
        let photos = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        if (!isAdmin(user)) {
          photos = photos.filter((p) => canManageSite(user, p.siteId));
        }

        res.status(200).json(photos);
      } catch (error) {
        console.error("Error fetching photos:", error);
        res.status(500).json({ error: "Failed to fetch photos" });
      }
      break;

    case "POST":
      try {
        const data = req.body;
        if (data.siteId && !isAdmin(user) && !canManageSite(user, data.siteId)) {
          return res.status(403).json({ error: "No access to this site" });
        }
        const docRef = await db.collection("photos").add({
          siteId: data.siteId || "", caption: data.caption || "",
          takenAt: data.takenAt || new Date().toISOString(),
          url: Array.isArray(data.url) ? data.url : data.url ? [data.url] : [],
          syncStatus: "synced", createdAt: new Date().toISOString(),
        });
        res.status(201).json({ id: docRef.id, ...data, syncStatus: "synced" });
      } catch (error) {
        console.error("Error creating photo:", error);
        res.status(500).json({ error: "Failed to create photo" });
      }
      break;

    case "PUT":
      try {
        const { id, ...updates } = req.body;
        updates.syncStatus = "synced";
        await db.collection("photos").doc(id).update(updates);
        res.status(200).json({ id, ...updates });
      } catch (error) {
        console.error("Error updating photo:", error);
        res.status(500).json({ error: "Failed to update photo" });
      }
      break;

    case "DELETE":
      try {
        const { id } = req.body;
        await db.collection("photos").doc(id).delete();
        res.status(200).json({ id });
      } catch (error) {
        console.error("Error deleting photo:", error);
        res.status(500).json({ error: "Failed to delete photo" });
      }
      break;

    default:
      res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
      res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
