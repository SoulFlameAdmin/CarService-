import { loginGoogle } from "./auth.js";
import { upsertUserProfile } from "../firestore/users.js";

export function bindLoginButton(btnId, role, nextUrl){
  const btn = document.getElementById(btnId);
  if(!btn){ console.warn("bindLoginButton: missing", btnId); return; }

    try{
      btn.disabled = true;
      btn.style.opacity = "0.7";

      const u = await loginGoogle();
      await upsertUserProfile(u, role);

      window.location.href = nextUrl;
    }catch(e){
      alert("Login error: " + (e?.message 
      btn.disabled = false;
      btn.style.opacity = "1";
    }
  });
}
