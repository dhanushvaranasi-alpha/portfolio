export type GameProgress = {
  visited: string[];
  collected: string[];
};

export const emptyProgress: GameProgress = { visited: [], collected: [] };

export function markVisited(
  progress: GameProgress,
  sectionId: string,
): GameProgress {
  if (progress.visited.includes(sectionId)) return progress;
  return { ...progress, visited: [...progress.visited, sectionId] };
}

export function collectOrb(
  progress: GameProgress,
  orbId: string,
): GameProgress {
  if (progress.collected.includes(orbId)) return progress;
  return { ...progress, collected: [...progress.collected, orbId] };
}

export function isComplete(
  progress: GameProgress,
  sectionIds: string[],
  orbIds: string[],
): boolean {
  return (
    sectionIds.every((id) => progress.visited.includes(id)) &&
    orbIds.every((id) => progress.collected.includes(id))
  );
}
