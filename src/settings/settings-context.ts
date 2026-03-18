import { createContext } from "react"

export type Settings = {
  piecesSoundAfterMoveOnly: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  piecesSoundAfterMoveOnly: true,
}

export type SettingsContextType = Settings & {
  setPiecesSoundAfterMoveOnly: (value: boolean) => void
}

export const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined,
)
