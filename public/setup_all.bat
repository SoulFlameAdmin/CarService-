@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM =========================================
REM SoulFlame CarService - Firebase Auth+Firestore Setup (NO PowerShell)
REM Path: E:\SOULFLAME_v1\CarService\public
REM =========================================

cd /d "E:\SOULFLAME_v1\CarService\public" || (echo ❌ Грешен път. & pause & exit /b 1)

REM 0) Folders
if not exist "auth" mkdir "auth"
if not exist "firestore" mkdir "firestore"

REM 1) Fix typo filename if exists
if exist "access_loccation_business.html" (
  echo 🔧 Fix: access_loccation_business.html -> access_location_business.html
  ren "access_loccation_business.html" "access_location_business.html"
)

REM 2) firebase-config.js (keep your existing, create only if missing)
if not exist "firebase-config.js" (
  echo 🧩 Creating firebase-config.js
  (
    echo // ПЕЙСТВАШ тук реалния Firebase Web config (по-късно)
    echo export const firebaseConfig = ^{
    echo   apiKey: "PASTE_API_KEY",
    echo   authDomain: "PASTE_AUTH_DOMAIN",
    echo   projectId: "PASTE_PROJECT_ID",
    echo   storageBucket: "PASTE_STORAGE_BUCKET",
    echo   messagingSenderId: "PASTE_MESSAGING_SENDER_ID",
    echo   appId: "PASTE_APP_ID"
    echo ^};
  ) > "firebase-config.js"
)

REM 3) auth/firebase.js (create only if missing)
if not exist "auth\firebase.js" (
  echo 🧩 Creating auth\firebase.js
  (
    echo import { firebaseConfig } from "../firebase-config.js";
    echo import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
    echo import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
    echo import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
    echo.
    echo export const app = initializeApp(firebaseConfig);
    echo export const auth = getAuth(app);
    echo export const db = getFirestore(app);
    echo export const provider = new GoogleAuthProvider();
  ) > "auth\firebase.js"
)

REM 4) auth/auth.js (create only if missing)
if not exist "auth\auth.js" (
  echo 🧩 Creating auth\auth.js
  (
    echo import { auth, provider } from "./firebase.js";
    echo import { onAuthStateChanged, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
    echo.
    echo export function watchAuth(cb){ return onAuthStateChanged(auth, cb); }
    echo.
    echo export async function loginGoogle(){
    echo   const res = await signInWithPopup(auth, provider);
    echo   return res.user;
    echo }
    echo.
    echo export async function logout(){ await signOut(auth); }
  ) > "auth\auth.js"
)

REM 5) auth/guard.js (create only if missing)
if not exist "auth\guard.js" (
  echo 🧩 Creating auth\guard.js
  (
    echo import { watchAuth } from "./auth.js";
    echo.
    echo export function requireAuthOrRedirect(loginPage){
    echo   watchAuth((u) => { if(!u) window.location.href = loginPage; });
    echo }
    echo.
    echo export function redirectIfLoggedIn(nextPage){
    echo   watchAuth((u) => { if(u) window.location.href = nextPage; });
    echo }
  ) > "auth\guard.js"
)

REM 6) auth/login-bind.js (create only if missing)
if not exist "auth\login-bind.js" (
  echo 🧩 Creating auth\login-bind.js
  (
    echo import { loginGoogle } from "./auth.js";
    echo import { upsertUserProfile } from "../firestore/users.js";
    echo.
    echo export function bindLoginButton(btnId, role, nextUrl){
    echo   const btn = document.getElementById(btnId);
    echo   if(!btn){ console.warn("bindLoginButton: missing", btnId); return; }
    echo.
    echo   btn.addEventListener("click", async () => ^{
    echo     try{
    echo       btn.disabled = true;
    echo       btn.style.opacity = "0.7";
    echo.
    echo       const u = await loginGoogle();
    echo       await upsertUserProfile(u, role);
    echo.
    echo       window.location.href = nextUrl;
    echo     }catch(e){
    echo       alert("Login error: " + (e?.message || e));
    echo       btn.disabled = false;
    echo       btn.style.opacity = "1";
    echo     }
    echo   ^});
    echo }
  ) > "auth\login-bind.js"
)

REM 7) auth/ui-profile.js (create only if missing)
if not exist "auth\ui-profile.js" (
  echo 🧩 Creating auth\ui-profile.js
  (
    echo import { watchAuth, logout } from "./auth.js";
    echo.
    echo export function mountUserChip(options){
    echo   const { mountId, role, onSwitchProfileUrl, onLogoutUrl } = options;
    echo   const host = document.getElementById(mountId);
    echo   if(!host){ console.warn("mountUserChip: missing mountId", mountId); return; }
    echo.
    echo   host.innerHTML = `
    echo     ^<div id="sfUserChip" style="display:flex;align-items:center;gap:10px;cursor:pointer;padding:8px 10px;border-radius:14px;background:rgba(255,255,255,.9);border:1px solid rgba(17,24,39,.12);box-shadow:0 10px 26px rgba(0,0,0,.10)"^>
    echo       ^<img id="sfUserImg" src="" alt="" style="width:34px;height:34px;border-radius:12px;object-fit:cover;display:none" /^>
    echo       ^<div style="display:flex;flex-direction:column;line-height:1.1"^>
    echo         ^<div id="sfUserName" style="font-weight:900;font-size:12px;color:#111827"^>Guest^</div^>
    echo         ^<div id="sfUserRole" style="font-size:11px;opacity:.7"^>^</div^>
    echo       ^</div^>
    echo     ^</div^>
    echo.
    echo     ^<div id="sfSlidePanel" style="position:fixed;top:0;right:-360px;width:360px;max-width:92vw;height:100vh;background:rgba(255,255,255,.96);backdrop-filter:blur(12px);border-left:1px solid rgba(17,24,39,.12);box-shadow:-20px 0 60px rgba(0,0,0,.16);transition:right .22s ease;z-index:999999;padding:14px;display:flex;flex-direction:column;gap:12px"^>
    echo       ^<div style="display:flex;align-items:center;justify-content:space-between"^>
    echo         ^<div style="font-weight:900"^>Options^</div^>
    echo         ^<button id="sfClosePanel" style="border:none;background:#111827;color:#fff;border-radius:10px;padding:8px 10px;cursor:pointer"^>✕^</button^>
    echo       ^</div^>
    echo       ^<button id="sfSwitch" style="border:none;cursor:pointer;border-radius:12px;padding:12px 12px;font-weight:900;background:#fff;border:1px solid rgba(17,24,39,.14)"^>Смени профил^</button^>
    echo       ^<button id="sfLogout" style="border:none;cursor:pointer;border-radius:12px;padding:12px 12px;font-weight:900;background:#111827;color:#fff"^>Изход^</button^>
    echo     ^</div^>
    echo   `;
    echo.
    echo   const chip = document.getElementById("sfUserChip");
    echo   const panel = document.getElementById("sfSlidePanel");
    echo   const closeBtn = document.getElementById("sfClosePanel");
    echo   const btnSwitch = document.getElementById("sfSwitch");
    echo   const btnLogout = document.getElementById("sfLogout");
    echo.
    echo   function openPanel(){ panel.style.right = "0px"; }
    echo   function closePanel(){ panel.style.right = "-360px"; }
    echo.
    echo   chip.addEventListener("click", openPanel);
    echo   closeBtn.addEventListener("click", closePanel);
    echo.
    echo   btnSwitch.addEventListener("click", () => ^{
    echo     closePanel();
    echo     window.location.href = onSwitchProfileUrl;
    echo   ^});
    echo.
    echo   btnLogout.addEventListener("click", async () => ^{
    echo     await logout();
    echo     closePanel();
    echo     window.location.href = onLogoutUrl;
    echo   ^});
    echo.
    echo   watchAuth((u) => ^{
    echo     const img = document.getElementById("sfUserImg");
    echo     const nm = document.getElementById("sfUserName");
    echo     const rl = document.getElementById("sfUserRole");
    echo.
    echo     if(!u){
    echo       nm.textContent = "Guest";
    echo       rl.textContent = "";
    echo       img.style.display = "none";
    echo       return;
    echo     }
    echo.
    echo     nm.textContent = u.displayName ^|^| (u.email ^|^| "User");
    echo     rl.textContent = role === "business" ? "BUSINESS" : "USER";
    echo.
    echo     if(u.photoURL){
    echo       img.src = u.photoURL;
    echo       img.style.display = "block";
    echo     } else {
    echo       img.style.display = "none";
    echo     }
    echo   ^});
    echo }
  ) > "auth\ui-profile.js"
)

REM 8) firestore/users.js (ALWAYS write - because yours is missing)
echo 🧩 Writing firestore\users.js
(
  echo import { db } from "../auth/firebase.js";
  echo import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
  echo.
  echo export async function upsertUserProfile(user, role){
  echo   if(!user) return;
  echo   const ref = doc(db, role === "business" ? "businesses" : "users", user.uid);
  echo.
  echo   await setDoc(ref, ^{
  echo     uid: user.uid,
  echo     role: role,
  echo     email: user.email ^|^| null,
  echo     displayName: user.displayName ^|^| null,
  echo     photoURL: user.photoURL ^|^| null,
  echo     lastLoginAt: serverTimestamp(),
  echo     createdAt: serverTimestamp()
  echo   ^}, ^{ merge: true ^});
  echo }
) > "firestore\users.js"

REM 9) firestore/sessions.js (ALWAYS write - because yours is missing)
echo 🧩 Writing firestore\sessions.js
(
  echo import { db } from "../auth/firebase.js";
  echo import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
  echo.
  echo export async function saveLastLocation(uid, role){
  echo   try{
  echo     const raw = localStorage.getItem("sf_cs_location");
  echo     if(!raw) return;
  echo.
  echo     const loc = JSON.parse(raw);
  echo     if(!loc ^|^| typeof loc.lat !== "number" ^|^| typeof loc.lng !== "number") return;
  echo.
  echo     const col = role === "business" ? "businesses" : "users";
  echo     await setDoc(doc(db, col, uid), ^{
  echo       lastSeenAt: serverTimestamp(),
  echo       lastLocation: ^{
  echo         lat: loc.lat,
  echo         lng: loc.lng,
  echo         accuracy_m: loc.accuracy_m ?? null,
  echo         mode: loc.mode ^|^| role,
  echo         ts: loc.ts ^|^| null,
  echo         fallback: !!loc.fallback
  echo       ^}
  echo     ^}, ^{ merge: true ^});
  echo.
  echo   ^}catch(e){
  echo     console.warn("saveLastLocation error", e);
  echo   ^}
  echo }
) > "firestore\sessions.js"

REM 10) Create user_login.html if missing
if not exist "user_login.html" (
  echo 🧩 Creating user_login.html
  (
    echo ^<!doctype html^>
    echo ^<html lang="bg"^>
    echo ^<head^>
    echo   ^<meta charset="utf-8" /^>
    echo   ^<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" /^>
    echo   ^<title^>User Login^</title^>
    echo   ^<style^>
    echo     body^{margin:0;min-height:100svh;display:grid;place-items:center;font-family:Arial;background:#0b0b0d;color:#fff^}
    echo     .card^{width:min(520px,92vw);background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);border-radius:18px;padding:18px;backdrop-filter:blur(10px)^}
    echo     .h^{font-weight:900;letter-spacing:1px^}
    echo     .btn^{margin-top:14px;width:100%%;border:none;cursor:pointer;border-radius:14px;padding:14px;font-weight:900;background:#fff;color:#0b0b0d^}
    echo     .s^{margin-top:10px;font-size:12px;opacity:.8^}
    echo   ^</style^>
    echo ^</head^>
    echo ^<body^>
    echo   ^<div class="card"^>
    echo     ^<div class="h"^>USER — Google Login^</div^>
    echo     ^<button id="btnLogin" class="btn"^>Вход с Google^</button^>
    echo     ^<div class="s"^>След вход: access_location_user.html^</div^>
    echo   ^</div^>
    echo.
    echo   ^<script type="module"^>
    echo     import ^{ bindLoginButton ^} from "./auth/login-bind.js";
    echo     import ^{ redirectIfLoggedIn ^} from "./auth/guard.js";
    echo     redirectIfLoggedIn("access_location_user.html");
    echo     bindLoginButton("btnLogin", "user", "access_location_user.html");
    echo   ^</script^>
    echo ^</body^>
    echo ^</html^>
  ) > "user_login.html"
)

REM 11) business_login.html already exists - keep it

echo.
echo ✅ DONE. Check:
echo   - firestore\users.js
echo   - firestore\sessions.js
echo   - user_login.html
echo.

REM 12) Start localhost server
echo 🚀 Starting localhost: http://localhost:5500/
echo (Stop with CTRL+C)
echo.

py -m http.server 5500
pause
