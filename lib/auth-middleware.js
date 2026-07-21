import { auth as adminAuth, db } from "@/lib/firebase-admin";
import logger from "@/lib/logger";

/**
 * API authentication middleware for Next.js API routes.
 * Verifies Firebase ID token and attaches user profile to req.
 *
 * Flutter equivalent: canManageSite() + FirebaseAuth check
 */
export async function authenticate(req, res) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized", message: "Missing or invalid authorization header" });
    return null;
  }

  const idToken = authHeader.split("Bearer ")[1];

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Fetch user profile from Firestore
    const usersSnapshot = await db.collection("users").where("email", "==", decodedToken.email).limit(1).get();

    let userProfile = null;

    if (usersSnapshot.empty) {
      console.log("user not found");
      // User authenticated but no profile in Firestore yet — allow with defaults
      userProfile = {
        id: uid,
        email: decodedToken.email || "",
        name: decodedToken.name || decodedToken.email?.split("@")[0] || "",
        role: "not assigned",
        assignedSite: "",
      };
    } else {
      const doc = usersSnapshot.docs[0];
      userProfile = { id: doc.id, ...doc.data() };
    }

    // Attach to request
    req.user = userProfile;
    req.uid = uid;
    return userProfile;
  } catch (error) {
    logger.error("Auth middleware error", { error: error.message, ip: req.ip });
    res.status(401).json({ error: "Unauthorized", message: "Invalid or expired token" });
    return null;
  }
}

/**
 * Check if user is admin.
 */
export function isAdmin(user) {
  return user && user.role === "admin";
}

/**
 * Check if user can manage a specific site.
 * - Admins can manage all sites
 * - Site supervisors / foremen can manage assigned sites
 * - Workers have read-only access
 *
 * Flutter equivalent: canManageSite() in AppState
 */
export function canManageSite(user, siteId) {
  if (!user) return false;
  if (isAdmin(user)) return true;

  // Non-admin: can only manage their assigned site
  if (user.assignedSite && user.assignedSite === siteId) return true;

  // For tasks, expenses, materials — check if user is assigned to them
  return false;
}

/**
 * Check if user can read a specific site.
 * More permissive than manage — all authenticated users can read assigned sites.
 */
export function canReadSite(user, siteId) {
  if (!user) return false;
  if (isAdmin(user)) return true;
  if (user.assignedSite && user.assignedSite === siteId) return true;
  return false;
}

/**
 * Middleware wrapper for API routes that require admin access.
 */
export function withAdmin(handler) {
  return async (req, res) => {
    const user = await authenticate(req, res);
    if (!user) return;

    if (!isAdmin(user)) {
      logger.warn("Non-admin access attempt", { userId: user.id, role: user.role, url: req.url, ip: req.ip });
      res.status(403).json({ error: "Forbidden", message: "Admin access required" });
      return;
    }

    return handler(req, res);
  };
}

/**
 * Middleware wrapper for API routes that require authentication.
 */
export function withAuth(handler) {
  return async (req, res) => {
    const user = await authenticate(req, res);
    if (!user) return;
    return handler(req, res);
  };
}

/**
 * Middleware wrapper for API routes that require site-scoped authorization.
 * Reads siteId from query params (GET) or body (POST/PUT/DELETE).
 */
export function withSiteAuth(handler) {
  return async (req, res) => {
    const user = await authenticate(req, res);
    if (!user) return;

    const siteId = req.method === "GET"
      ? req.query.siteId
      : req.body?.siteId;

    // Admins can access everything
    if (isAdmin(user)) {
      req.canManage = true;
      return handler(req, res);
    }

    // Non-admin: check site access
    if (siteId && canReadSite(user, siteId)) {
      req.canManage = canManageSite(user, siteId);
      return handler(req, res);
    }

    // No siteId specified — allow but mark as read-only for non-admins
    if (!siteId) {
      req.canManage = false;
      return handler(req, res);
    }

    logger.warn("Unauthorized site access attempt", {
      userId: user.id,
      role: user.role,
      siteId,
      url: req.url,
      ip: req.ip,
    });
    res.status(403).json({ error: "Forbidden", message: "You don't have access to this site" });
  };
}
