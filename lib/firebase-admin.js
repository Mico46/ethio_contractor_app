import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

let db;
let auth;

try {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    : null;

  const apps = getApps();
  const app =
    apps.length > 0
      ? apps[0]
      : initializeApp({
          credential: serviceAccount ? cert(serviceAccount) : undefined,
        });

  db = getFirestore(app);
  auth = getAuth(app);
} catch (error) {
  console.error("Firebase admin initialization error:", error);
}

export { db, auth };
