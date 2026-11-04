// Shared mutable game state.
let lang = initialLang();
let t = I18N[lang];
let PUZZLES = null;
let state = null;   // see newState()
let selected = [];
let busy = false;   // true while a solve animation plays
let freshLevel = null;
let dealNext = true; // next render() deals the tiles in with a flip
let backdropTheme = () => {}; // replaced once the Three.js backdrop starts
