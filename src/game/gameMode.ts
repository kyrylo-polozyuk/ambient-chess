export type GameMode = "autoplay" | "vsComputer" | "vsLocal" | "vsCollaborator"

export const DEFAULT_GAME_MODE: GameMode = "vsComputer"

export type GameModeIconKey = "Bot" | "Users" | "Globe" | "User"

export const GAME_MODE_LABELS: Record<GameMode, string> = {
  autoplay: "Bot vs Bot",
  vsComputer: "Player vs Bot",
  vsLocal: "Local Mutliplayer",
  vsCollaborator: "Online Multiplayer",
}

export const GAME_MODE_ICONS: Record<GameMode, GameModeIconKey> = {
  autoplay: "Bot",
  vsComputer: "User",
  vsLocal: "Users",
  vsCollaborator: "Globe",
}

export const GAME_MODES: GameMode[] = [
  "autoplay",
  "vsComputer",
  "vsLocal",
  "vsCollaborator",
]
