import { describe, expect, test } from "bun:test";
import {
  collectOrb,
  emptyProgress,
  isComplete,
  markVisited,
} from "@/lib/game-state";

describe("markVisited", () => {
  test("adds a section once", () => {
    const p = markVisited(emptyProgress, "about");
    expect(p.visited).toEqual(["about"]);
    expect(emptyProgress.visited).toEqual([]);
  });

  test("is idempotent and returns the same reference", () => {
    const p = markVisited(emptyProgress, "about");
    expect(markVisited(p, "about")).toBe(p);
  });
});

describe("collectOrb", () => {
  test("adds an orb once", () => {
    const p = collectOrb(emptyProgress, "skills-1");
    expect(p.collected).toEqual(["skills-1"]);
    expect(emptyProgress.collected).toEqual([]);
  });

  test("is idempotent and returns the same reference", () => {
    const p = collectOrb(emptyProgress, "skills-1");
    expect(collectOrb(p, "skills-1")).toBe(p);
  });
});

describe("isComplete", () => {
  const sections = ["top", "about"];
  const orbs = ["top-1", "about-1"];

  test("false when sections or orbs are missing", () => {
    let p = markVisited(emptyProgress, "top");
    p = collectOrb(p, "top-1");
    expect(isComplete(p, sections, orbs)).toBe(false);
  });

  test("true when everything is visited and collected", () => {
    let p = emptyProgress;
    p = markVisited(p, "top");
    p = markVisited(p, "about");
    p = collectOrb(p, "top-1");
    p = collectOrb(p, "about-1");
    expect(isComplete(p, sections, orbs)).toBe(true);
  });
});
