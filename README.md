# शब्द जोड़ो (Shabd Jodo)

A daily Hindi word-grouping puzzle. You get 16 Hindi words and have to sort them into 4 hidden groups of 4.

It's a plain static web page with no framework, no build step, no tracking and no ads.

## How to play

- Pick 4 words that you think share something, then press **जमा करें** (submit).
- You can make **4 mistakes**.
- **"बस एक शब्द गलत!"** means 3 of your 4 words belong to the same group.
- Group colours show difficulty: 🟨 easy → 🟩 → 🟦 → 🟪 trickiest (wordplay, synonyms, compound words).
- You get one **संकेत** (hint) per puzzle. It highlights one word from the easiest unsolved group.

There's a new puzzle every day, and everyone gets the same one on the same date. The calendar button lets you play past puzzles, and **अभ्यास पहेली** gives a random practice puzzle.

Progress, streaks and settings are saved in your browser's localStorage. Nothing is sent to a server.

## Run locally

Open `index.html` in a browser.

If your browser blocks local files, serve the folder instead:

```bash
npx serve .
```

## Project layout

```
index.html              the whole game (HTML, CSS, JS)
puzzles.js              GENERATED puzzle list: window.PUZZLES = [...]
tools/
  bank/level0.mjs       easy categories
  bank/level1.mjs       medium categories
  bank/level2.mjs       hard categories (general knowledge, culture)
  bank/level3.mjs       trickiest categories (wordplay)
  build-puzzles.mjs     validates the bank and builds puzzles.js
```

## Adding or fixing puzzles

Don't edit `puzzles.js` by hand. Edit the category bank in `tools/bank/`.

Each entry looks like this:

```js
{ name: "कमल के पर्यायवाची", family: "synonym", words: ["पंकज", "जलज", "नीरज", "सरोज", "अंबुज"] }
```

- **`words`**: 4–6 words. The builder picks 4 that fit on a tile (at most 2 words and 10 letters).
- **`family`**: a broad theme. Two groups from the same family never appear in the same puzzle.

Then rebuild (needs Node.js 18 or newer):

```bash
node tools/build-puzzles.mjs
```

The builder stops with a list of problems if anything is wrong:
- a malformed entry
- duplicate names
- non-Devanagari text
- too few groups in a level

It also keeps apart any two groups that share a word, so every word has exactly one right answer. Output is reproducible because it uses a fixed seed.

> **Note:** rebuilding reshuffles every puzzle, which changes what each date shows. After the game is live, add new groups carefully, or change the puzzle count only at the start of a new cycle.

## Deploying

It's a static site, so any static host works.

On Vercel:
1. Import the repo.
2. Set Framework Preset to **Other**.
3. Leave the build command empty and set the output directory to `.`.

`.vercelignore` keeps `tools/` off the website.

## Contributing

Corrections to words or categories are very welcome, especially from native speakers. Please open an issue or a pull request that edits the bank files, and rebuild `puzzles.js` in the same PR.

## License

[MIT](LICENSE)
