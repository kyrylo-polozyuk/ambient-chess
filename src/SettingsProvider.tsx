import { useCallback, useContext, useEffect, useState } from "react"
import { AudiotoolContext } from "./context"
import {
  DEFAULT_SETTINGS,
  type Settings,
  SettingsContext,
} from "./settings-context"
import {
  getStoredSettings,
  updateStoredSettings,
} from "./nexus/updateTonematrixFromChess"

export const SettingsProvider = (props: { children: React.ReactNode }) => {
  const { nexus } = useContext(AudiotoolContext)
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)

  useEffect(() => {
    if (!nexus) {
      setSettings(DEFAULT_SETTINGS)
      return
    }
    const loadSettings = async () => {
      const stored = await getStoredSettings(nexus)
      if (stored !== null) {
        setSettings(stored)
      }
    }
    void loadSettings()
  }, [nexus])

  const setPiecesSoundAfterMoveOnly = useCallback(
    (value: boolean) => {
      setSettings((prev) => {
        const next: Settings = { ...prev, piecesSoundAfterMoveOnly: value }
        if (nexus !== undefined) {
          void updateStoredSettings(nexus, next)
        }
        return next
      })
    },
    [nexus],
  )

  const value = {
    ...settings,
    setPiecesSoundAfterMoveOnly,
  }

  return (
    <SettingsContext.Provider value={value}>
      {props.children}
    </SettingsContext.Provider>
  )
}
