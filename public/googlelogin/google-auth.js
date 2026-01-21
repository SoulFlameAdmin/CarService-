// E:\SOULFLAME_v1\CarService\public\googlelogin\google-auth.js
import { auth, db, googleProvider } from "./firebase.js";

import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

/**
 * Взима preview/live режим от:
 * - ?preview=1
 * - localStorage.SF_PREVIEW === "1"
 */
function getAppMode() {
  try {
    const url = new URL(window.location.href);
    const qp = url.searchParams.get("preview");
    const ls = localStorage.getItem("SF_PREVIEW");
    const isPreview = qp === "1" || ls === "1";
    return isPreview ? "preview" : "live";
  } catch {
    // ако сме в среда без window (рядко)
    return "live";
  }
}

/**
 * “Златният минимум” users/{uid}
 * - createdAt: само ако doc е нов
 * - lastLoginAt: винаги
 * - providerIds: масив
 * - app: appId/role/mode/locale/tz
 *
 * Връща резултат за UI:
 * { ok:true, created:true/false, path:"users/{uid}" }
 */
export async function upsertUserProfile(user, extra = {}) {
  if (!db || !user?.uid) {
    return { ok: false, created: false, path: null, reason: "missing-db-or-user" };
  }

  const uid = user.uid;

  // provider ids (масив)
  const providerIds = Array.isArray(user.providerData)
    ? user.providerData.map(p => p?.providerId).filter(Boolean)
    : [];
  if (providerIds.length === 0) providerIds.push("google.com");

  // app mode (live/preview)
  const mode = extra.mode || getAppMode();

  // locale/tz (световен стандарт)
  const locale = extra.locale || (typeof navigator !== "undefined" ? (navigator.language || "en") : "en");
  const tz = extra.tz || (typeof Intl !== "undefined"
    ? (Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC")
    : "UTC"
  );

  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  const isNew = !snap.exists();

  const baseProfile = {
    uid,
    email: user.email || null,
    displayName: user.displayName || null,
    photoURL: user.photoURL || null,
    providerIds,

    // app contract
    app: {
      appId: "carservice",
      role: "user",
      mode,
      locale,
      tz,
    },

    // timestamps
    lastLoginAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  // createdAt само ако е нов
  if (isNew) {
    baseProfile.createdAt = serverTimestamp();
  }

  // Ако искаш да държиш profile в под-обект (както досега) — запазваме структурата:
  // users/{uid} -> profile:{...} + updatedAt
  const docPayload = {
    profile: baseProfile,
    updatedAt: serverTimestamp(),
  };

  // merge true: не трие други полета (пример: lastLocation)
  await setDoc(userRef, docPayload, { merge: true });

  return { ok: true, created: isNew, path: `users/${uid}` };
}

// users/{uid}.lastLocation (без точни координати ако не искаш — тук ти решаваш какво подаваш)
export async function upsertUserLocation(uid, loc) {
  if (!db || !uid || !loc) return { ok: false };

  await setDoc(
    doc(db, "users", uid),
    {
      lastLocation: loc,
      lastLocationAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return { ok: true };
}

// Popup + fallback redirect
export async function googleLogin(extra = {}) {
  try {
    const cred = await signInWithPopup(auth, googleProvider);

    // 1) Firestore upsert (реално)
    await upsertUserProfile(cred.user, extra);

    return cred.user;
  } catch (err) {
    const code = err?.code || "";

    // popup blocked / closed => redirect
    if (code === "auth/popup-blocked" || code === "auth/popup-closed-by-user") {
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    throw err;
  }
}

// Ако е минало през redirect flow
export async function handleRedirectResult(extra = {}) {
  const res = await getRedirectResult(auth);
  if (res?.user) {
    await upsertUserProfile(res.user, extra);
    return res.user;
  }
  return null;
}

export function friendlyAuthError(err) {
  const code = err?.code || "";
  const msg = err?.message || "Unknown error";

  if (code === "auth/unauthorized-domain") {
    return "Unauthorized domain. Добави домейна във Firebase → Authentication → Settings → Authorized domains.";
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
