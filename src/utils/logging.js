import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { auth } from "../firebase";

// Log types
export const LOG_TYPES = {
  USER_ACTION: "user_action",
  SYSTEM_EVENT: "system_event",
  ERROR: "error",
};

// Log severity levels
export const LOG_SEVERITY = {
  INFO: "info",
  WARNING: "warning",
  ERROR: "error",
  CRITICAL: "critical",
};

// Core logging function
export async function logToFirestore(
  type,
  message,
  severity = LOG_SEVERITY.INFO,
  details = {}
) {
  try {
    const userId = auth.currentUser ? auth.currentUser.uid : "anonymous";

    await addDoc(collection(db, "logs"), {
      type,
      message,
      severity,
      details,
      userId,
      userEmail: auth.currentUser?.email || "anonymous",
      timestamp: serverTimestamp(),
      userAgent: navigator.userAgent,
      path: window.location.pathname,
    });
  } catch (error) {
    // Fallback to console if Firestore logging fails
    console.error("Logging to Firestore failed:", error);
    console.log(`[${type}] ${message}`, details);
  }
}

// User action logging
export function logUserAction(action, details = {}) {
  return logToFirestore(
    LOG_TYPES.USER_ACTION,
    action,
    LOG_SEVERITY.INFO,
    details
  );
}

// System event logging
export function logSystemEvent(
  event,
  severity = LOG_SEVERITY.INFO,
  details = {}
) {
  return logToFirestore(LOG_TYPES.SYSTEM_EVENT, event, severity, details);
}

// Error logging
export async function logError(error, context = {}) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  console.log("LOGGING ERROR:", errorMessage);

  try {
        const docRef = await logToFirestore(LOG_TYPES.ERROR, errorMessage, LOG_SEVERITY.ERROR, {
            stack: errorStack,
            ...context,
        });
        console.log(
            "✅ Error successfully logged to Firestore with ID:",
            docRef.id
        );
        return docRef;
    } catch (loggingError) {
        console.error("❌ Failed to log error to Firestore:", loggingError);
    }
}
