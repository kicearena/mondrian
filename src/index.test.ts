import { describe, expect, it } from "vitest";
import {
  generateMondrianPattern,
  placeMondrianAttempts,
  mondrianAttemptTone,
  MONDRIAN_COLUMNS,
  MONDRIAN_ROWS,
  type KeyedEntry,
} from "./index";

const attempts = (count: number, offset = 0): KeyedEntry[] =>
  Array.from({ length: count }, (_, index) => ({
    key: `player-${index + offset}:p1:1:${index + offset}`,
    number: 1,
    attempts: 1,
    submittedAt: index + offset,
    verdict: "correct",
  }));

describe("seeded Mondrian partition", () => {
  it("covers the full canvas exactly once with two intact large planes and smaller bands", () => {
    for (let seed = 0; seed < 100; seed++) {
      const panels = generateMondrianPattern(`contest-${seed}`);
      expect(panels).toHaveLength(48);
      const anchors = panels.filter((panel) => panel.accent);
      expect(anchors).toHaveLength(2);
      expect(anchors.map((panel) => panel.accent).sort()).toEqual([
        "blue",
        "red",
      ]);
      for (const anchor of anchors)
        expect(anchor.width * anchor.height).toBeGreaterThanOrEqual(25);
      const coverage = Array.from({ length: MONDRIAN_ROWS }, () =>
        Array<number>(MONDRIAN_COLUMNS).fill(0),
      );
      for (const panel of panels) {
        expect(panel.width).toBeGreaterThanOrEqual(1);
        expect(panel.height).toBeGreaterThanOrEqual(1);
        expect(panel.x + panel.width).toBeLessThanOrEqual(MONDRIAN_COLUMNS);
        expect(panel.y + panel.height).toBeLessThanOrEqual(MONDRIAN_ROWS);
        for (let y = panel.y; y < panel.y + panel.height; y++) {
          for (let x = panel.x; x < panel.x + panel.width; x++)
            coverage[y][x]++;
        }
      }
      expect(coverage.flat().every((count) => count === 1)).toBe(true);
    }
  });
  it("is repeatable for a contest and produces different partitions for other contests", () => {
    expect(generateMondrianPattern("contest-a")).toEqual(
      generateMondrianPattern("contest-a"),
    );
    expect(generateMondrianPattern("contest-a")).not.toEqual(
      generateMondrianPattern("contest-b"),
    );
  });
});

const panels = generateMondrianPattern("contest");
const ordinaryPanel = panels.find((panel) => !panel.accent)!;

describe("reference color balance", () => {
  it("uses paper, primaries and sparse black accents consistently", () => {
    const tones = attempts(200).map((entry) =>
      mondrianAttemptTone("contest", entry.key, ordinaryPanel),
    );
    expect(new Set(tones).size).toBe(5);
    for (const tone of ["paper", "red", "blue", "yellow", "black"])
      expect(tones.filter((value) => value === tone).length).toBeGreaterThan(5);
    expect(tones.filter((tone) => tone === "paper").length).toBeGreaterThan(60);
    expect(tones).toEqual(
      attempts(200).map((entry) =>
        mondrianAttemptTone("contest", entry.key, ordinaryPanel),
      ),
    );
  });
});

describe("spatial color distribution", () => {
  it("distributes actual colored records across all four canvas quadrants", () => {
    const entries = attempts(48);
    const placements = placeMondrianAttempts(
      "contest",
      entries,
      new Map(),
      panels,
    );
    const quadrants = new Set(
      entries.flatMap((entry) => {
        const panel = panels[placements.get(entry.key)!];
        return mondrianAttemptTone("contest", entry.key, panel) === "paper"
          ? []
          : [
              Number(panel.x + panel.width / 2 >= MONDRIAN_COLUMNS / 2) +
                2 * Number(panel.y + panel.height / 2 >= MONDRIAN_ROWS / 2),
            ];
      }),
    );
    expect(quadrants.size).toBe(4);
  });
});

describe("real attempt placement", () => {
  it("never creates records for an empty ledger", () => {
    expect(placeMondrianAttempts("contest", [], new Map(), panels).size).toBe(
      0,
    );
  });
  it("fills both large accent planes using two real records", () => {
    const result = placeMondrianAttempts(
      "contest",
      attempts(2),
      new Map(),
      panels,
    );
    expect(result.size).toBe(2);
    expect([...result.values()].every((slot) => panels[slot].accent)).toBe(
      true,
    );
  });
  it("places all 48 records uniquely and repeatably across the whole pattern", () => {
    const entries = attempts(48);
    const result = placeMondrianAttempts("contest", entries, new Map(), panels);
    expect(result.size).toBe(48);
    expect(new Set(result.values()).size).toBe(48);
    expect([...result.values()].every((slot) => slot >= 0 && slot < 48)).toBe(
      true,
    );
    expect(result).toEqual(
      placeMondrianAttempts("contest", entries, new Map(), panels),
    );
    expect([...result.values()]).not.toEqual(
      Array.from({ length: 48 }, (_, index) => index),
    );
  });
  it("adds a new record without moving retained submissions or changing the input map", () => {
    const previous = placeMondrianAttempts(
      "contest",
      attempts(27),
      new Map(),
      panels,
    );
    const next = placeMondrianAttempts(
      "contest",
      attempts(28),
      previous,
      panels,
    );
    expect(next.size).toBe(28);
    for (const [key, slot] of previous) expect(next.get(key)).toBe(slot);
    expect(previous.size).toBe(27);
    expect(
      placeMondrianAttempts("contest", attempts(28), next, panels),
    ).toEqual(next);
  });
  it("reuses evicted slots and preserves frozen submissions in place", () => {
    const previous = placeMondrianAttempts(
      "contest",
      attempts(48),
      new Map(),
      panels,
    );
    const entries = attempts(48, 1).map((entry) => ({
      ...entry,
      verdict: "hidden" as const,
    }));
    const next = placeMondrianAttempts("contest", entries, previous, panels);
    expect(next.size).toBe(48);
    expect(new Set(next.values()).size).toBe(48);
    expect(next.has(attempts(1)[0].key)).toBe(false);
    for (const entry of entries.slice(0, -1))
      expect(next.get(entry.key)).toBe(previous.get(entry.key));
  });
});
