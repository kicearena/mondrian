export type MondrianPanel = {
  x: number;
  y: number;
  width: number;
  height: number;
  accent?: "red" | "blue";
};
export type KeyedEntry = { key: string };
export const MONDRIAN_COLUMNS = 24;
export const MONDRIAN_ROWS = 16;
export const MONDRIAN_PANEL_COUNT = 48;

function randomFor(seed: string) {
  let value = 2166136261;
  for (const character of seed)
    value = Math.imul(value ^ character.charCodeAt(0), 16777619);
  value = Math.imul(value ^ (value >>> 16), 0x85ebca6b);
  value = Math.imul(value ^ (value >>> 13), 0xc2b2ae35);
  value = (value ^ (value >>> 16)) >>> 0 || 1;
  return () => {
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    return (value >>> 0) / 4294967296;
  };
}

/** Two large offset planes, framed by bands that subdivide into smaller rectangles. */
export function generateMondrianPattern(contestId: string): MondrianPanel[] {
  const random = randomFor(`pattern:${contestId}`);
  const middle = 11 + Math.floor(random() * 3);
  const panels: MondrianPanel[] = [];
  for (let side = 0; side < 2; side++) {
    const x = side === 0 ? 0 : middle;
    const width = side === 0 ? middle : MONDRIAN_COLUMNS - middle;
    const anchorWidth = 5 + Math.floor(random() * 3);
    const anchorHeight = 5 + Math.floor(random() * 3);
    const insetX = 1 + Math.floor(random() * 2);
    const insetY = 1 + Math.floor(random() * 2);
    const left = side === 0 ? insetX : width - anchorWidth - insetX;
    const top = side === 0 ? insetY : MONDRIAN_ROWS - anchorHeight - insetY;
    panels.push(
      { x, y: 0, width, height: top },
      { x, y: top, width: left, height: anchorHeight },
      {
        x: x + left,
        y: top,
        width: anchorWidth,
        height: anchorHeight,
        accent: side === 0 ? "red" : "blue",
      },
      {
        x: x + left + anchorWidth,
        y: top,
        width: width - left - anchorWidth,
        height: anchorHeight,
      },
      {
        x,
        y: top + anchorHeight,
        width,
        height: MONDRIAN_ROWS - top - anchorHeight,
      },
    );
  }
  while (panels.length < MONDRIAN_PANEL_COUNT) {
    const candidates = panels
      .map((panel, index) => ({ panel, index }))
      .filter(
        ({ panel }) => !panel.accent && (panel.width >= 2 || panel.height >= 2),
      )
      .sort(
        (a, b) =>
          b.panel.width * b.panel.height - a.panel.width * a.panel.height,
      );
    const { panel, index } =
      candidates[Math.floor(random() * Math.min(4, candidates.length))];
    const vertical =
      panel.height < 2 ||
      (panel.width >= 2 && panel.width > panel.height * (0.9 + random() * 0.6));
    const length = vertical ? panel.width : panel.height;
    const cut = Math.max(
      1,
      Math.min(length - 1, Math.round(length * (0.3 + random() * 0.4))),
    );
    const first = {
      ...panel,
      ...(vertical ? { width: cut } : { height: cut }),
    };
    const second = {
      ...panel,
      ...(vertical
        ? { x: panel.x + cut, width: panel.width - cut }
        : { y: panel.y + cut, height: panel.height - cut }),
    };
    panels.splice(index, 1, first, second);
  }
  return panels;
}

/** The reference's accent planes remain coherent; smaller colors follow record identity. */
export function mondrianAttemptTone(
  contestId: string,
  attemptKey: string,
  panel: MondrianPanel,
): "paper" | "red" | "blue" | "yellow" | "black" {
  if (panel.accent) return panel.accent;
  const value = randomFor(`color:${contestId}:${attemptKey}`)();
  return value < 0.45
    ? "paper"
    : value < 0.6
      ? "red"
      : value < 0.74
        ? "blue"
        : value < 0.93
          ? "yellow"
          : "black";
}

/** Keep retained records in place and randomly allocate only new records. */
export function placeMondrianAttempts(
  contestId: string,
  entries: readonly KeyedEntry[],
  previous: ReadonlyMap<string, number>,
  panels: readonly MondrianPanel[],
): Map<string, number> {
  const keys = new Set(entries.map((entry) => entry.key));
  const placements = new Map([...previous].filter(([key]) => keys.has(key)));
  const occupied = new Set(placements.values());
  for (const entry of entries) {
    if (placements.has(entry.key)) continue;
    const random = randomFor(`attempt:${contestId}:${entry.key}`);
    const available = Array.from(
      { length: MONDRIAN_PANEL_COUNT },
      (_, slot) => slot,
    ).filter((slot) => !occupied.has(slot));
    const anchors = available.filter((slot) => panels[slot].accent);
    const candidates = anchors.length ? anchors : available;
    const slot = candidates[Math.floor(random() * candidates.length)];
    placements.set(entry.key, slot);
    occupied.add(slot);
  }
  return placements;
}
