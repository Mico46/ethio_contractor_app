import { db } from "@/lib/firebase-admin";
import { authenticate, isAdmin, canManageSite } from "@/lib/auth-middleware";

// Flutter Site model: { id, name, clientName, locationName, budget, startDate, targetEndDate, assignedTo, status, progress, syncStatus }
export default async function handler(req, res) {
  const user = await authenticate(req, res);
  if (!user) return;

  switch (req.method) {
    case "GET":
      try {
        let query = db.collection("sites");
        if (req.query.assignedTo) {
          query = query.where("assignedTo", "==", req.query.assignedTo);
        }
        const snapshot = await query.get();
        let sites = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        // Non-admin: only show assigned sites
        if (!isAdmin(user)) {
          sites = sites.filter((s) => s.assignedTo === user.id || s.id === user.assignedSite);
        }

        res.status(200).json(sites);
      } catch (error) {
        console.error("Error fetching sites:", error);
        res.status(500).json({ error: "Failed to fetch sites" });
      }
      break;

    case "POST":
      if (!isAdmin(user)) {
        return res.status(403).json({ error: "Admin access required" });
      }
      try {
        const data = req.body;
        const docRef = await db.collection("sites").add({
          name: data.name || "", clientName: data.clientName || "",
          locationName: data.locationName || "", budget: Number(data.budget) || 0,
          startDate: data.startDate || new Date().toISOString(),
          targetEndDate: data.targetEndDate || new Date().toISOString(),
          assignedTo: data.assignedTo || "", status: data.status || "active",
          progress: Number(data.progress) || 0, syncStatus: "synced",
          createdAt: new Date().toISOString(),
        });
        res.status(201).json({ id: docRef.id, ...data, syncStatus: "synced" });
      } catch (error) {
        console.error("Error creating site:", error);
        res.status(500).json({ error: "Failed to create site" });
      }
      break;

    case "PUT":
      try {
        const { id, ...updates } = req.body;
        if (!isAdmin(user) && !canManageSite(user, id)) {
          return res.status(403).json({ error: "You don't have permission to edit this site" });
        }
        updates.syncStatus = "synced";
        await db.collection("sites").doc(id).update(updates);
        res.status(200).json({ id, ...updates });
      } catch (error) {
        console.error("Error updating site:", error);
        res.status(500).json({ error: "Failed to update site" });
      }
      break;

    case "DELETE":
      if (!isAdmin(user)) {
        return res.status(403).json({ error: "Admin access required" });
      }
      try {
        const { id } = req.body;
        await db.collection("sites").doc(id).delete();
        res.status(200).json({ id });
      } catch (error) {
        console.error("Error deleting site:", error);
        res.status(500).json({ error: "Failed to delete site" });
      }
      break;

    default:
      res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
      res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
