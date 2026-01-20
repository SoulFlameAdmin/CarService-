// public/login/googlelogin/auth.js (ESM)
import { googleLogin, handleRedirectResult, friendlyAuthError } from "./google-auth.js";
import { auth } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

/**
 * Работи на Vercel + локален server (python http.server от /public)
 * Ако си на file:// без server — /login/... няма да работи.
 */
const PROFILE_URL = "/login/profil/profil.html?intro=1";
const SESSION_FLAG = "sf_login_success_v1";

let busy = false;
let redirected = false;

function hardGoProfile() {
  if (redirected) return;
  redirected = true;
  window.location.replace(PROFILE_URL);
}

/**
 * 3s “black hole dive” ако portal-а е наличен (registraciq.js)
 * иначе fallback към директен redirect.
 */
function portalGoProfile() {
  if (redirected) return;
  redirected = true;

  // 1) директно през функцията (ако registraciq.js я е сложил)
  if (typeof window.SF_PORTAL_DIVE === "function") {
    window.SF_PORTAL_DIVE(PROFILE_URL);
    return;
  }

  // 2) през event (ако registraciq.js слуша за sf:login-success)
  window.dispatchEvent(
    new CustomEvent("sf:login-success", { detail: { url: PROFILE_URL } })
  );

  // 3) fallback — ако до 200ms не е стартирал dive, пращаме директно
  setTimeout(() => {
    const startedDive = document.body?.classList?.contains("sf-dive");
    if (!startedDive) hardGoProfile();
  }, 200);
}

async function doGoogle(e) {
  e?.preventDefault?.();
  if (busy) return;
  busy = true;

  // маркираме, че user е натиснал login (за да не дайваме без причина)
  sessionStorage.setItem(SESSION_FLAG, "1");

  try {
    const user = await googleLogin(); // popup (fallback redirect вътре)
    if (user) portalGoProfile();
    // ако е redirect flow -> няма да има user тук, ще се довърши в handleRedirectResult()
  } catch (err) {
    console.error("[GoogleAuth]", err);
    sessionStorage.removeItem(SESSION_FLAG);
    alert(friendlyAuthError(err));
  } finally {
    busy = false;
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  // 0) Вържи “G” бутоните от registraciq.html
  const btnSignin = document.getElementById("googleSignin");
  const btnSignup = document.getElementById("googleSignup");
  if (btnSignin) btnSignin.addEventListener("click", doGoogle);
  if (btnSignup) btnSignup.addEventListener("click", doGoogle);

  // 1) Ако е минал redirect flow (popup blocked) -> довърши и прати към профил
  try {
    const user = await handleRedirectResult();
    if (user) {
      // това е истински login success
      sessionStorage.setItem(SESSION_FLAG, "1");
      portalGoProfile();
      return;
    }
  } catch (err) {
    console.error("[RedirectResult]", err);
    // нормално е да няма redirect result -> не алъртваме
  }

  // 2) Ако вече има сесия:
  // - ако току-що е логнат (flag set) -> дайв
  // - иначе -> директно към профил (без ефект)
  onAuthStateChanged(auth, (user) => {
    if (!user) return;

    const justLogged = sessionStorage.getItem(SESSION_FLAG) === "1";
    if (justLogged) {
      sessionStorage.removeItem(SESSION_FLAG);
      portalGoProfile();
    } else {
      hardGoProfile();
    }
  });
});
