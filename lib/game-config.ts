export type GameSection = {
  id: string;
  clip?: string;
};

export type Emote = { clip: string; key: number };

// Section ids must match the DOM ids on the page sections. `clip` is a
// one-shot animation played when the section becomes active; sections
// without one fall back to the idle loop, so future sections need no
// game-code changes.
export const gameSections: GameSection[] = [
  { id: "top", clip: "Wave" },
  { id: "about", clip: "Yes" },
  { id: "project", clip: "ThumbsUp" },
  { id: "experience", clip: "Punch" },
  { id: "skills", clip: "Jump" },
  { id: "education", clip: "Dance" },
];

export const CHARACTER_URL = "/character.glb";
export const CHARACTER_MODEL_HEIGHT = 4.5; // world units, from asset bbox
export const CHARACTER_HEIGHT_PX = { desktop: 110, mobile: 64 };

export const DEFAULT_CLIP = "Idle";

// Padding between the mascot and the viewport edge.
export const EDGE_OFFSET_PX = 24;
// Vertical anchor on desktop, as a fraction of viewport height.
export const DESKTOP_ANCHOR_Y = 0.55;

export const HIDDEN_STORAGE_KEY = "game-hidden";
