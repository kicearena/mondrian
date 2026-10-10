import {
  generateMondrianPattern,
  placeMondrianAttempts,
  mondrianAttemptTone,
  MONDRIAN_COLUMNS,
  MONDRIAN_ROWS,
  type MondrianPanel,
} from "../src/index";
import "./styles.css";
const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = `<main><nav><span>KICE ARENA / OPEN SOURCE</span><a href="https://github.com/kicearena/mondrian">GitHub ↗</a></nav>
<header><div class="eyebrow">@kicearena/mondrian · MIT</div><h1>A seed. A composition.</h1><p>Deterministic geometry, expressive colour and stable keyed placement.<br />One small engine for browser canvases and server-generated images.</p></header>
<div class="composition"><section class="card"><div class="section-heading"><h2>Pattern playground</h2><small>24 × 16 · 48 panels</small></div><div id="canvas"></div><div class="caption"><code id="seed-label"></code><span id="placement-label" aria-live="polite"></span></div></section>
<aside class="card"><div class="eyebrow">01 / GENERATE</div><h2>Same seed, same pattern.</h2><p>Change the seed to generate a new partition.</p><label for="seed">Seed</label><input id="seed" value="composition-01" maxlength="120" /><div class="actions"><button id="apply">Apply seed</button><button id="next">Next seed</button></div><hr />
<div class="eyebrow">02 / PLACE</div><h2>Keep identities in place.</h2><p>Adding a key fills an empty panel. Existing keys stay where they are.</p><div class="actions"><button id="add">Add entry</button><button id="remove">Remove latest</button></div><hr />
<div class="eyebrow">03 / RENDER</div><h2>Your renderer, your scale.</h2><p>Grid coordinates work with SVG, CSS Grid or a canvas. No runtime dependencies.</p><div class="palette" aria-label="Paper, red, blue, yellow and black palette"><i></i><i></i><i></i><i></i><i></i></div></aside></div>
<footer><span>TypeScript · ESM + types</span><span>Deterministic across browser and server</span><span>MIT licensed</span></footer></main>`;
const colors = {
  paper: "#fffdf1",
  red: "#ce4033",
  blue: "#225ac1",
  yellow: "#edc83d",
  black: "#252725",
};
let seed = "composition-01";
let seedNumber = 1;
let nextKey = 13;
let entries = Array.from({ length: 12 }, (_, i) => ({ key: `item-${i + 1}` }));
let panels = generateMondrianPattern(seed);
let placements = new Map<string, number>();
const canvas = document.querySelector<HTMLDivElement>("#canvas")!;
const input = document.querySelector<HTMLInputElement>("#seed")!;
function shape(panel: MondrianPanel, fill: string, label?: string) {
  const x = panel.x * 30;
  const y = panel.y * 30;
  return `<g><rect x="${x}" y="${y}" width="${panel.width * 30}" height="${panel.height * 30}" fill="${fill}" stroke="#252725" stroke-width="3" />${label ? `<text x="${x + 8}" y="${y + 20}" fill="${fill === colors.black || fill === colors.blue || fill === colors.red ? "#ffffff" : "#252725"}" font-size="12" font-family="monospace">${label}</text>` : ""}</g>`;
}
function render() {
  placements = placeMondrianAttempts(seed, entries, placements, panels);
  const byPanel = new Map([...placements].map(([key, index]) => [index, key]));
  canvas.innerHTML = `<svg viewBox="0 0 ${MONDRIAN_COLUMNS * 30} ${MONDRIAN_ROWS * 30}" role="img" aria-label="Seeded Mondrian composition">${panels
    .map((panel, i) => {
      const key = byPanel.get(i);
      return shape(
        panel,
        colors[
          key
            ? mondrianAttemptTone(seed, key, panel)
            : (panel.accent ?? "paper")
        ],
        key?.replace("item-", ""),
      );
    })
    .join("")}</svg>`;
  document.querySelector("#seed-label")!.textContent = `seed: ${seed}`;
  document.querySelector("#placement-label")!.textContent =
    `${entries.length} / 48 entries`;
  document.querySelector<HTMLButtonElement>("#add")!.disabled =
    entries.length === 48;
  document.querySelector<HTMLButtonElement>("#remove")!.disabled =
    entries.length === 0;
}
function applySeed() {
  seed = input.value.trim() || "composition-01";
  input.value = seed;
  panels = generateMondrianPattern(seed);
  placements = new Map();
  render();
}
document.querySelector("#apply")!.addEventListener("click", applySeed);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") applySeed();
});
document.querySelector("#next")!.addEventListener("click", () => {
  input.value = `composition-${String(++seedNumber).padStart(2, "0")}`;
  applySeed();
});
document.querySelector("#add")!.addEventListener("click", () => {
  if (entries.length < 48) entries = [...entries, { key: `item-${nextKey++}` }];
  render();
});
document.querySelector("#remove")!.addEventListener("click", () => {
  entries = entries.slice(0, -1);
  render();
});
render();
