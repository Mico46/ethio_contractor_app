import { db } from "@/lib/firebase-admin";
import { authenticate, isAdmin, canManageSite } from "@/lib/auth-middleware";

// Flutter MaterialEntry model: { id, siteId, name, quantity, unit, type, syncStatus, date }
export default async function handler(req, res) {
  const user = await authenticate(req, res);
  if (!user) return;

  switch (req.method) {
    case "GET":
      try {
        let query = db.collection("materials");
        if (req.query.siteId) {
          query = query.where("siteId", "==", req.query.siteId);
        }
        const snapshot = await query.get();
        let materials = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        if (!isAdmin(user)) {
          materials = materials.filter((m) => canManageSite(user, m.siteId));
        }

        res.status(200).json(materials);
      } catch (error) {
        console.error("Error fetching materials:", error);
        res.status(500).json({ error: "Failed to fetch materials" });
      }
      break;

    case "POST":
      try {
        const data = req.body;
        if (data.siteId && !isAdmin(user) && !canManageSite(user, data.siteId)) {
          return res.status(403).json({ error: "No access to this site" });
        }
        const docRef = await db.collection("materials").add({
          siteId: data.siteId || "", name: data.name || "",
          quantity: Number(data.quantity) || 0, unit: data.unit || "",
          type: data.type || "", date: data.date || new Date().toISOString(),
          syncStatus: "synced", createdAt: new Date().toISOString(),
        });
        res.status(201).json({ id: docRef.id, ...data, syncStatus: "synced" });
      } catch (error) {
        console.error("Error creating material:", error);
        res.status(500).json({ error: "Failed to create material" });
      }
      break;

    case "PUT":
      try {
        const { id, ...updates } = req.body;
        updates.syncStatus = "synced";
        await db.collection("materials").doc(id).update(updates);
        res.status(200).json({ id, ...updates });
      } catch (error) {
        console.error("Error updating material:", error);
        res.status(500).json({ error: "Failed to update material" });
      }
      break;

    case "DELETE":
      try {
        const { id } = req.body;
        await db.collection("materials").doc(id).delete();
        res.status(200).json({ id });
      } catch (error) {
        console.error("Error deleting material:", error);
        res.status(500).json({ error: "Failed to delete material" });
      }
      break;

    default:
      res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
      res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
