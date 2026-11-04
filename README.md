# शब्द जोड़ो (Shabd Jodo)

A daily word-grouping puzzle in five language modes: **Hindi, Hinglish, Kannada, Telugu and Tamil**. You get 16 words and sort them into 4 hidden groups of 4.

It's a plain static web page with no framework, no build step, no tracking and no ads. Each language has **730 puzzles**, so the daily puzzle doesn't repeat for two years.

## How to play

- Pick 4 words you think share something, then press submit.
- You can make **4 mistakes**.
- The "one away" message means 3 of your 4 words belong to the same group.
- Group colours show difficulty: 🟨 easy → 🟩 → 🟦 → 🟪 trickiest (wordplay, synonyms, compound words).
- One hint per puzzle highlights a word from the easiest unsolved group.

Everyone gets the same puzzle on the same date. The calendar button lets you play past puzzles, and the practice button gives a random one. Switch language with the translate icon, or open `?lang=kn` (also `hi`, `hinglish`, `te`, `ta`).

Progress, streaks and settings are saved in your browser's localStorage, separately for each language. Nothing is sent to a server.

## Run locally

Open `index.html` in a browser. If your browser blocks local files, serve the folder:

```bash
npx serve .
```

## Project layout

```
index.html                 the whole game (HTML, CSS, JS, all interface text)
puzzles/<lang>.js          GENERATED puzzle lists, loaded on demand
tools/
  build-puzzles.mjs        validates the banks and builds puzzles/*.js
  bank/<lang>/level0*.mjs  easy categories (everyday things)
  bank/<lang>/level1*.mjs  medium categories
  bank/<lang>/level2*.mjs  hard categories (general knowledge, culture)
  bank/<lang>/level3*.mjs  trickiest categories (wordplay: synonyms, compounds, idioms)
  bank/<lang>/doubts/      notes on words a native speaker should double-check
```

Each language was written natively, not translated from another, so wordplay and cultural categories fit that language.

## Rebuilding puzzles

Don't edit `puzzles/*.js` by hand. Edit the category banks, then rebuild (needs Node.js 18 or newer):

```bash
node tools/build-puzzles.mjs all        # every language
node tools/build-puzzles.mjs ta         # one language
node tools/build-puzzles.mjs hi 365     # a different puzzle count
```

A bank entry looks like this:

```js
{ name: "கதிரவன் பெயர்கள்", family: "synonym", words: ["கதிரவன்", "ஞாயிறு", "பகலவன்", "ஆதவன்", "பரிதி"] }
```

- **`words`**: 4–6 words. The builder picks 4 that fit on a tile (at most 2 words, and 10–12 letters).
- **`family`**: a broad theme. Two groups from the same family never share a puzzle.

The builder stops with a list of problems if anything is wrong: a malformed entry, a duplicate name, text outside the language's script, or too few groups in a level. It also:

- keeps apart any two groups that share a word, so every word has one right answer
- uses each category name at most once per language
- produces identical output on every run, because it uses a fixed seed

> **Warning:** rebuilding reshuffles every puzzle, which changes what each date shows. Don't rebuild a language once people are playing it. To add content to a live language, add new groups only at the start of a new cycle.

## Help check the words

The categories were written fast and **have not been proofread by native speakers**. Check `tools/bank/<lang>/doubts/*.md` for the specific words and facts the writers were unsure about. Corrections are very welcome, especially for Kannada, Telugu and Tamil. Open an issue or a pull request that edits the bank files, and rebuild the affected `puzzles/<lang>.js` in the same PR.

## Deploying

It's a static site, so any static host works. On Vercel: import the repo, set Framework Preset to **Other**, leave the build command empty and set the output directory to `.`. `.vercelignore` keeps `tools/` off the website.

## License

[MIT](LICENSE)
