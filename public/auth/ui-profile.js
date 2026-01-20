import { watchAuth, logout } from "./auth.js";

export function mountUserChip(opts){
  const host = document.getElementById(opts.mountId);
  if(!host){ console.warn("mountUserChip: missing mountId", opts.mountId); return; }

  host.innerHTML = ''
