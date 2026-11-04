// On-demand loading of puzzle lists and language fonts.
const loaded = {};
function loadPuzzles(code) {
  if (window.PUZZLES_BY_LANG && window.PUZZLES_BY_LANG[code]) return Promise.resolve(window.PUZZLES_BY_LANG[code]);
  if (!loaded[code]) loaded[code] = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = `puzzles/${code}.js`;
    s.onload = () => (window.PUZZLES_BY_LANG && window.PUZZLES_BY_LANG[code]) ? resolve(window.PUZZLES_BY_LANG[code]) : reject();
    s.onerror = () => { delete loaded[code]; reject(); };
    document.head.appendChild(s);
  });
  return loaded[code];
}
function loadFont(code) {
  const f = LANGS[code].font;
  if (!f || document.getElementById("font-" + code)) return;
  const link = document.createElement("link");
  link.id = "font-" + code;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${f}:wght@400;600;800&display=swap`;
  document.head.appendChild(link);
}
