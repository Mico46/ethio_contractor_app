import { getAuth } from "firebase/auth";

/**
 * Get the current user's Firebase ID token for API calls.
 * Returns null if not authenticated.
 */
export async function getIdToken() {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) return null;
  try {
    return await user.getIdToken();
  } catch (error) {
    console.error("Error getting ID token:", error);
    return null;
  }
}

/**
 * Authenticated fetch wrapper — adds Authorization header automatically.
 */
export async function authFetch(url, options = {}) {
  const token = await getIdToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(!isFormData && { "Content-Type": "application/json" }),
    Authorization: `Bearer ${token}`,
    ...options.headers,
  };

  return fetch(url, { ...options, headers });
}
