// Language switching and the language dialog.
function applyI18n() {
  document.documentElement.lang = LANGS[lang].htmlLang;
  document.title = t.title;
  $("title").textContent = t.title;
  document.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t[el.dataset.i18n]; });
  document.querySelectorAll("[data-i18n-label]").forEach((el) => {
    el.setAttribute("aria-label", t[el.dataset.i18nLabel]);
    el.title = t[el.dataset.i18nLabel];
  });
  $("helpList").innerHTML = t.help.map((line) => `<li>${line}</li>`).join("");
  fitTitle();
}
async function setLang(code, { remember = true } = {}) {
  lang = code;
  t = I18N[lang];
  if (remember) { settings.lang = code; saveRaw("settings", settings); }
  const url = new URL(location.href);
  url.searchParams.set("lang", code);
  history.replaceState(null, "", url);
  loadFont(code);
  applyI18n();
  $("langSelect").value = code;
  state = null;
  $("board").className = "board loading";
  $("board").textContent = t.loading;
  for (const id of ["controls", "mistakesWrap", "result"]) $(id).classList.add("hidden");
  $("sub").textContent = "";
  try {
    PUZZLES = await loadPuzzles(code);
  } catch {
    $("board").textContent = t.loadFailed;
    return;
  }
  if (code !== lang) return; // switched again while loading
  $("board").className = "board";
  startDaily();
}
function openLangs() {
  const list = $("langList");
  list.innerHTML = "";
  for (const [code, info] of Object.entries(LANGS)) {
    const b = document.createElement("button");
    b.className = code === lang ? "cur" : "";
    b.innerHTML = `<span></span><small></small>`;
    b.querySelector("span").textContent = info.name;
    b.querySelector("small").textContent = info.latin;
    b.onclick = () => { $("langDlg").close(); if (code !== lang) setLang(code); };
    list.appendChild(b);
  }
  $("langDlg").showModal();
}
