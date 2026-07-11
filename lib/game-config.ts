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
  { id: "skills" },
  { id: "education" },
];

export const CHARACTER_URL = "/character.glb";
export const CHARACTER_MODEL_HEIGHT = 4.5; // world units, from asset bbox
export const CHARACTER_HEIGHT_PX = { desktop: 110, mobile: 64 };

export const DEFAULT_CLIP = "Idle";
export const WALK_CLIP = "Walking";
export const JUMP_CLIP = "Jump";
export const VICTORY_CLIP = "Dance";

export const GROUND_MARGIN_PX = 48;
export const WALK_SPEED_PX = 260;
export const JUMP_VELOCITY_PX = 800;
export const GRAVITY_PX = 2000;

export const ORB_DIAMETER_PX = 26;
export const ORB_MIN_HEIGHT_PX = 40;
export const ORB_MAX_HEIGHT_PX = 200;
export const COLLECT_RADIUS_PX = 80;

export const HIDDEN_STORAGE_KEY = "game-hidden";
export const HELP_SEEN_STORAGE_KEY = "game-help-seen";
