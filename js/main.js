// Button wiring and startup.
$("shuffleBtn").onclick = () => { state.order = shuffled(state.order); persist(); render(); };
$("clearBtn").onclick = () => { selected = []; render(); };
$("submitBtn").onclick = submit;
$("hintBtn").onclick = useHint;
$("shareBtn").onclick = share;
$("practiceBtn").onclick = startPractice;
$("todayBtn").onclick = startDaily;
$("langBtn").onclick = openLangs;
$("helpBtn").onclick = () => $("help").showModal();
$("statsBtn").onclick = openStats;
$("resultStatsBtn").onclick = openStats;
$("archiveBtn").onclick = openArchive;
$("settingsBtn").onclick = () => $("settingsDlg").showModal();
setLang(lang, { remember: false });
loadBackdrop();
if (!loadRaw("seenHelp", false)) { $("help").showModal(); saveRaw("seenHelp", true); }
