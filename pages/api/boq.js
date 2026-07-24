import { db } from "@/lib/firebase-admin";
import { authenticate, isAdmin, canManageSite } from "@/lib/auth-middleware";

export default async function handler(req, res) {
  const user = await authenticate(req, res);
  if (!user) return;

  switch (req.method) {
    case "GET":
      try {
        let query = db.collection("boq_items");
        if (req.query.siteId && req.query.siteId !== "all") {
          query = query.where("siteId", "==", req.query.siteId);
        }
        const snapshot = await query.get();
        let items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        if (!isAdmin(user)) {
          items = items.filter((i) => !i.siteId || canManageSite(user, i.siteId));
        }

        res.status(200).json(items);
      } catch (error) {
        console.error("Error fetching BOQ items:", error);
        res.status(500).json({ error: "Failed to fetch BOQ items" });
      }
      break;

    case "POST":
      try {
        const data = req.body;
        if (data.siteId && !isAdmin(user) && !canManageSite(user, data.siteId)) {
          return res.status(403).json({ error: "No access to this site" });
        }
        const docRef = await db.collection("boq_items").add({
          itemNo: data.itemNo || "1.1",
          category: data.category || "Substructure",
          description: data.description || "",
          unit: data.unit || "m³",
          length: data.length !== undefined ? Number(data.length) : null,
          width: data.width !== undefined ? Number(data.width) : null,
          height: data.height !== undefined ? Number(data.height) : null,
          noOfMembers: Number(data.noOfMembers) || 1.0,
          quantity: Number(data.quantity) || 0.0,
          rate: Number(data.rate) || 0.0,
          wastageFactor: Number(data.wastageFactor) || 5.0,
          siteId: data.siteId || "",
          syncStatus: "synced",
          createdAt: new Date().toISOString(),
        });
        res.status(201).json({ id: docRef.id, ...data, syncStatus: "synced" });
      } catch (error) {
        console.error("Error creating BOQ item:", error);
        res.status(500).json({ error: "Failed to create BOQ item" });
      }
      break;

    case "PUT":
      try {
        const { id, ...updates } = req.body;
        updates.syncStatus = "synced";
        await db.collection("boq_items").doc(id).update(updates);
        res.status(200).json({ id, ...updates });
      } catch (error) {
        console.error("Error updating BOQ item:", error);
        res.status(500).json({ error: "Failed to update BOQ item" });
      }
      break;

    case "DELETE":
      try {
        const { id } = req.body;
        await db.collection("boq_items").doc(id).delete();
        res.status(200).json({ id });
      } catch (error) {
        console.error("Error deleting BOQ item:", error);
        res.status(500).json({ error: "Failed to delete BOQ item" });
      }
      break;

    default:
      res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
      res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
