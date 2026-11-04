// localStorage access, saved settings and the starting language.
const loadRaw = (k, d) => { try { const v = localStorage.getItem(STORE + k); return v == null ? d : JSON.parse(v); } catch { return d; } };
const saveRaw = (k, v) => { try { localStorage.setItem(STORE + k, JSON.stringify(v)); } catch {} };
// Games, results and stats are kept per language; settings are shared.
const load = (k, d) => loadRaw(lang + ":" + k, d);
const save = (k, v) => saveRaw(lang + ":" + k, v);
// Players from before languages existed kept Hindi data without a language prefix.
(function migrateLegacy() {
  try {
    if (localStorage.getItem(STORE + "migrated")) return;
    for (const k of Object.keys(localStorage)) {
      const rest = k.slice(STORE.length);
      if (k.startsWith(STORE) && /^(game-\d+|result-\d+|stats)$/.test(rest)) {
        localStorage.setItem(STORE + "hi:" + rest, localStorage.getItem(k));
        localStorage.removeItem(k);
      }
    }
    localStorage.setItem(STORE + "migrated", "1");
  } catch {}
})();
const settings = { sound: false, theme: "system", ...loadRaw("settings", {}) };
function initialLang() {
  const fromUrl = new URLSearchParams(location.search).get("lang");
  if (fromUrl && LANGS[fromUrl]) return fromUrl;
  if (settings.lang && LANGS[settings.lang]) return settings.lang;
  for (const l of navigator.languages || []) {
    const code = l.toLowerCase().split("-")[0];
    if (["kn", "te", "ta", "hi"].includes(code)) return code;
  }
  return "hi";
}
