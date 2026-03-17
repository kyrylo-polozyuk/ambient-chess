import { createContext, useContext } from "react"
import type { DialogConfig } from "./Dialog"

export type DialogContextValue = {
  showDialog: (config: DialogConfig) => void
  closeDialog: (id: string) => void
  closeAllDialogs: () => void
}

export const DialogContext = createContext<DialogContextValue | undefined>(
  undefined,
)

export const useDialogContext = () => {
  const context = useContext(DialogContext)
  if (!context) {
    throw new Error("useDialogContext must be used within DialogProvider")
  }
  return context
}
