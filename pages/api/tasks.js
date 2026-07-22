import { db } from "@/lib/firebase-admin";
import { authenticate, isAdmin, canManageSite } from "@/lib/auth-middleware";

// Flutter SiteTask model: { id, siteId, title, assignedTo, dueDate, priority, status, syncStatus }
export default async function handler(req, res) {
  const user = await authenticate(req, res);
  if (!user) return;

  switch (req.method) {
    case "GET":
      try {
        let query = db.collection("tasks");
        if (req.query.siteId) {
          query = query.where("siteId", "==", req.query.siteId);
        }
        const snapshot = await query.get();
        let tasks = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        // Non-admin: only show tasks for assigned sites
        if (!isAdmin(user)) {
          tasks = tasks.filter((t) => t.assignedTo === user.id || canManageSite(user, t.siteId));
        }

        res.status(200).json(tasks);
      } catch (error) {
        console.error("Error fetching tasks:", error);
        res.status(500).json({ error: "Failed to fetch tasks" });
      }
      break;

    case "POST":
      try {
        const data = req.body;
        if (data.siteId && !isAdmin(user) && !canManageSite(user, data.siteId)) {
          return res.status(403).json({ error: "No access to this site" });
        }
        const docRef = await db.collection("tasks").add({
          siteId: data.siteId || "", title: data.title || "",
          assignedTo: data.assignedTo || "", dueDate: data.dueDate || new Date().toISOString(),
          priority: data.priority || "medium", status: data.status || "pending",
          createdAt: new Date().toISOString(),
        });
        res.status(201).json({ id: docRef.id, ...data });
      } catch (error) {
        console.error("Error creating task:", error);
        res.status(500).json({ error: "Failed to create task" });
      }
      break;

    case "PUT":
      try {
        const { id, ...updates } = req.body;
        updates.syncStatus = "synced";
        await db.collection("tasks").doc(id).update(updates);
        res.status(200).json({ id, ...updates });
      } catch (error) {
        console.error("Error updating task:", error);
        res.status(500).json({ error: "Failed to update task" });
      }
      break;

    case "DELETE":
      try {
        const { id } = req.body;
        await db.collection("tasks").doc(id).delete();
        res.status(200).json({ id });
      } catch (error) {
        console.error("Error deleting task:", error);
        res.status(500).json({ error: "Failed to delete task" });
      }
      break;

    default:
      res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
      res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
