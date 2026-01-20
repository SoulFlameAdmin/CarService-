// E:\SOULFLAME_v1\CarService\public\googlelogin\google-auth.js
import { auth, db, googleProvider } from "./firebase.js";

import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";

import {
  doc,
  setDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

// users/{uid}.profile + timestamps
export async function upsertUserProfile(user) {
  if (!db || !user?.uid) return;

  const payload = {
    uid: user.uid,
    email: user.email || null,
    displayName: user.displayName || null,
    photoURL: user.photoURL || null,
    providerId: user.providerData?.[0]?.providerId || "google.com",
    lastLoginAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(
    doc(db, "users", user.uid),
    { profile: payload, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

// users/{uid}.lastLocation
export async function upsertUserLocation(uid, loc) {
  if (!db || !uid || !loc) return;

  await setDoc(
    doc(db, "users", uid),
    {
      lastLocation: loc,
      lastLocationAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

// Popup + fallback redirect
export async function googleLogin() {
  try {
    const cred = await signInWithPopup(auth, googleProvider);
    await upsertUserProfile(cred.user);
    return cred.user;
  } catch (err) {
    const code = err?.code || "";
    if (code === "auth/popup-blocked" || code === "auth/popup-closed-by-user") {
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    throw err;
  }
}

// Ако е минало през redirect flow
export async function handleRedirectResult() {
  const res = await getRedirectResult(auth);
  if (res?.user) {
    await upsertUserProfile(res.user);
    return res.user;
  }
  return null;
}

export function friendlyAuthError(err) {
  const code = err?.code || "";
  const msg = err?.message || "Unknown error";

  if (code === "auth/unauthorized-domain") {
    return "Unauthorized domain. Добави домейна в Firebase → Authentication → Settings → Authorized domains.";
  }
  if (code === "auth/operation-not-allowed") {
    return "Google Sign-in не е включен. Firebase → Authentication → Sign-in providers → Google → Enable.";
  }
  if (code === "permission-denied") {
    return "Firestore rules блокират записа. Провери Firestore Rules за users/{uid}.";
  }
  if (code === "auth/network-request-failed") {
    return "Network error (интернет/браузър/Firewall).";
  }

  return `Firebase error: ${code}\n${msg}`;
}
