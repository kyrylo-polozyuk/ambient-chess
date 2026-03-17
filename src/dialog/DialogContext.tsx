import { useCallback, useState } from "react"
import type { DialogConfig } from "./Dialog"
import { Dialog } from "./Dialog"
import { DialogContext } from "./useDialogContext"




type DialogProviderProps = {
  children: React.ReactNode
}

export const DialogProvider = ({ children }: DialogProviderProps) => {
  const [dialogs, setDialogs] = useState<DialogConfig[]>([])

  const showDialog = useCallback((config: DialogConfig) => {
    setDialogs((prev) => {
      // Prevent duplicate dialogs with same ID
      const filtered = prev.filter((d) => d.id !== config.id)
      return [...filtered, config]
    })
  }, [])

  const closeDialog = useCallback((id: string) => {
    setDialogs((prev) => {
      const dialog = prev.find((d) => d.id === id)
      // Prevent closing non-dismissible dialogs
      if (dialog && dialog.dismissible === false) {
        return prev
      }
      if (dialog?.onClose) {
        dialog.onClose()
      }
      return prev.filter((d) => d.id !== id)
    })
  }, [])

  const closeAllDialogs = useCallback(() => {
    setDialogs((prev) => {
      // Only close dismissible dialogs
      const dismissibleDialogs = prev.filter((d) => d.dismissible !== false)
      const nonDismissibleDialogs = prev.filter((d) => d.dismissible === false)

      dismissibleDialogs.forEach((dialog) => {
        if (dialog.onClose) {
          dialog.onClose()
        }
      })

      return nonDismissibleDialogs
    })
  }, [])

  return (
    <DialogContext.Provider value={{ showDialog, closeDialog, closeAllDialogs }}>
      {children}
      {dialogs.map((dialog) => (
        <Dialog
          key={dialog.id}
          config={dialog}
          onClose={() => closeDialog(dialog.id)}
        />
      ))}
    </DialogContext.Provider>
  )
}

