// Shrinks the title and tile text so words fit.
// Shrinks the title until it fits beside the header icons (Tamil/Telugu titles are wider than Hindi).
function fitTitle() {
  const h = $("title");
  h.style.fontSize = "";
  let size = parseFloat(getComputedStyle(h).fontSize);
  while (h.scrollWidth > h.clientWidth + 1 && size > 12) { size -= 1; h.style.fontSize = size + "px"; }
}
// Shrinks a tile's text until its longest word fits on one line, so words never break mid-letter.
function fitTiles() {
  document.querySelectorAll(".tile").forEach((el) => {
    el.style.fontSize = "";
    el.style.overflowWrap = "";
    let size = parseFloat(getComputedStyle(el).fontSize);
    while (el.scrollWidth > el.clientWidth + 1 && size > 11.5) { size -= 0.5; el.style.fontSize = size + "px"; }
    // Still too wide at the smallest readable size: allow a break between letters.
    if (el.scrollWidth > el.clientWidth + 1) el.style.overflowWrap = "anywhere";
  });
}
addEventListener("resize", () => { fitTitle(); fitTiles(); });
document.fonts && document.fonts.ready.then(fitTitle);
