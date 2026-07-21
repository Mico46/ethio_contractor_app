import { db } from "@/lib/firebase-admin";
import { authenticate, isAdmin, canManageSite } from "@/lib/auth-middleware";

// Flutter DailyLog model: { id, siteId, date, workDone, workerCount, weather, issues, nextPlan, syncStatus }
export default async function handler(req, res) {
  const user = await authenticate(req, res);
  if (!user) return;

  switch (req.method) {
    case "GET":
      try {
        let query = db.collection("daily_logs");
        if (req.query.siteId) {
          query = query.where("siteId", "==", req.query.siteId);
        }
        const snapshot = await query.get();
        let logs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        if (!isAdmin(user)) {
          logs = logs.filter((l) => canManageSite(user, l.siteId));
        }

        res.status(200).json(logs);
      } catch (error) {
        console.error("Error fetching logs:", error);
        res.status(500).json({ error: "Failed to fetch logs" });
      }
      break;

    case "POST":
      try {
        const data = req.body;
        if (data.siteId && !isAdmin(user) && !canManageSite(user, data.siteId)) {
          return res.status(403).json({ error: "No access to this site" });
        }
        const docRef = await db.collection("daily_logs").add({
          siteId: data.siteId || "", date: data.date || new Date().toISOString(),
          workDone: data.workDone || "", workerCount: Number(data.workerCount) || 0,
          weather: data.weather || "", issues: data.issues || "",
          nextPlan: data.nextPlan || "", syncStatus: "synced",
          createdAt: new Date().toISOString(),
        });
        res.status(201).json({ id: docRef.id, ...data, syncStatus: "synced" });
      } catch (error) {
        console.error("Error creating log:", error);
        res.status(500).json({ error: "Failed to create log" });
      }
      break;

    case "PUT":
      try {
        const { id, ...updates } = req.body;
        updates.syncStatus = "synced";
        await db.collection("daily_logs").doc(id).update(updates);
        res.status(200).json({ id, ...updates });
      } catch (error) {
        console.error("Error updating log:", error);
        res.status(500).json({ error: "Failed to update log" });
      }
      break;

    case "DELETE":
      try {
        const { id } = req.body;
        await db.collection("daily_logs").doc(id).delete();
        res.status(200).json({ id });
      } catch (error) {
        console.error("Error deleting log:", error);
        res.status(500).json({ error: "Failed to delete log" });
      }
      break;

    default:
      res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
      res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
