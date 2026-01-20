import { db } from "../auth/firebase.js";
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

export async function saveLastLocation(uid, role){
  const raw = localStorage.getItem("sf_cs_location");
  if(!raw) return;

  const loc = JSON.parse(raw);
  if(!loc || typeof loc.lat !== "number" || typeof loc.lng !== "number") return;

  const col = role === "business" ? "businesses" : "users";

  await setDoc(doc(db, col, uid), {
    lastSeenAt: serverTimestamp(),
    lastLocation: {
      lat: loc.lat,
      lng: loc.lng,
      accuracy_m: loc.accuracy_m || null,
      fallback: !!loc.fallback
    }
  }, { merge: true });
}
