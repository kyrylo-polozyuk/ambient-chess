import type { GameMode } from "./gameMode.types"

export const GAME_MODE_LABELS: Record<GameMode, string> = {
  autoplay: "AI vs AI",
  vsComputer: "Player vs AI",
  vsLocal: "Player vs Local Player",
  vsCollaborator: "Player vs Collaborator",
}

export const GAME_MODES: GameMode[] = [
  "autoplay",
  "vsComputer",
  "vsLocal",
  "vsCollaborator",
]
