// Theme and the settings dialog.
function applyTheme(th) {
  if (th === "system") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.dataset.theme = th;
  backdropTheme();
}
applyTheme(settings.theme);
$("langSelect").innerHTML = Object.entries(LANGS).map(([c, i]) => `<option value="${c}">${i.name}</option>`).join("");
$("soundToggle").checked = settings.sound;
$("themeSelect").value = settings.theme;
$("langSelect").onchange = (e) => { $("settingsDlg").close(); setLang(e.target.value); };
$("soundToggle").onchange = (e) => { settings.sound = e.target.checked; saveRaw("settings", settings); sound("tap"); };
$("themeSelect").onchange = (e) => { settings.theme = e.target.value; saveRaw("settings", settings); applyTheme(settings.theme); };
$("resetBtn").onclick = () => {
  if (!confirm(t.resetConfirm)) return;
  try { Object.keys(localStorage).filter((k) => k.startsWith(STORE + lang + ":")).forEach((k) => localStorage.removeItem(k)); } catch {}
  $("settingsDlg").close();
  if (PUZZLES) startDaily();
  toast(t.resetDone);
};
