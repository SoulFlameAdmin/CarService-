import { db } from "../auth/firebase.js";
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

export async function upsertUserProfile(user, role){
  if(!user) return;

  const col = role === "business" ? "businesses" : "users";
  const ref = doc(db, col, user.uid);

  await setDoc(ref, {
    uid: user.uid,
    role,
    email: user.email || null,
    displayName: user.displayName || null,
    photoURL: user.photoURL || null,
    lastLoginAt: serverTimestamp(),
    createdAt: serverTimestamp()
  }, { merge: true });
}
