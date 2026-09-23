import { FirebaseError } from "firebase/app";

const messages: Record<string, string> = {
  "auth/email-already-in-use":
    "An account already exists for this email address.",
  "auth/invalid-credential": "The email address or password is incorrect.",
  "auth/invalid-email": "Enter a valid email address.",
  "auth/popup-blocked": "Your browser blocked the Google sign-in window.",
  "auth/popup-closed-by-user": "Google sign-in was cancelled.",
  "auth/too-many-requests":
    "Too many attempts. Please wait a moment and try again.",
  "auth/user-disabled": "This account is currently unavailable.",
  "auth/weak-password": "Choose a stronger password.",
  "auth/network-request-failed":
    "Check your internet connection and try again.",
};

export function getFriendlyAuthError(error: unknown) {
  if (error instanceof FirebaseError) {
    return (
      messages[error.code] ??
      "Authentication could not be completed. Please try again."
    );
  }

  return error instanceof Error
    ? error.message
    : "Authentication could not be completed. Please try again.";
}
