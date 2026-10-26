/* ---------- Start ---------- */
/* Zurück-Taste der Android-App: "exit" schließt die App, "stay" bleibt im Spiel */
function libBack(){
  const vis = id => !$(id).hidden;
  if (vis("#scr-start") || vis("#scr-handover") || vis("#scr-menu")) return "exit";
  if (vis("#scr-match")){ if (M && !M.done) return "stay"; afterMatch(); return "stay"; }
  show(S ? "menu" : "start");
  return "stay";
}
window.libBack = libBack;
document.addEventListener("pointerdown", () => SFX.unlock(), {passive:true});
loadOpts();
migrateLegacy();
buildBackground();
renderSegs();
show("start");
drawIdle("LIBERO '91");
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { buildBackground(M ? M.mine.h : undefined); if (!M || !M.busy) drawIdle(M ? null : "LIBERO '91"); });
