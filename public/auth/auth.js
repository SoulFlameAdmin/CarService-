import { auth, provider } from "./firebase.js";
import { onAuthStateChanged, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

export function watchAuth(cb){ return onAuthStateChanged(auth, cb); }

export async function loginGoogle(){
  const res = await signInWithPopup(auth, provider);
  return res.user;
}

export async function logout(){ await signOut(auth); }
