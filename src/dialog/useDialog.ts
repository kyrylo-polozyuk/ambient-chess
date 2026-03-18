import React, { useCallback } from "react"
import type { DialogButton, DialogConfig } from "./Dialog"
import { useDialogContext } from "./useDialogContext"

export type ConfirmationOptions = {
  id: string
  title: string
  content?: React.ReactNode
  confirmLabel: string
  cancelLabel?: string
  confirmVariant?: DialogButton["variant"]
  onConfirm: () => void | Promise<void>
}

export type UseDialogReturn = {
  showDialog: (config: Omit<DialogConfig, "id"> & { id?: string }) => string
  closeDialog: (id: string) => void
  closeAllDialogs: () => void
  showConfirmation: (options: ConfirmationOptions) => void
}

export const useDialog = (): UseDialogReturn => {
  const { showDialog, closeDialog, closeAllDialogs } = useDialogContext()

  const show = useCallback(
    (config: Omit<DialogConfig, "id"> & { id?: string }) => {
      const id = config.id || `dialog-${Date.now()}-${Math.random()}`
      showDialog({ ...config, id })
      return id
    },
    [showDialog],
  )

  const close = useCallback(
    (id: string) => {
      closeDialog(id)
    },
    [closeDialog],
  )

  const showConfirmation = useCallback(
    (options: ConfirmationOptions): void => {
      const id = options.id
      const buttons: DialogButton[] = [
        {
          label: options.cancelLabel ?? "Cancel",
          onClick: () => closeDialog(id),
        },
        {
          label: options.confirmLabel,
          variant: options.confirmVariant ?? "primary",
          onClick: () => {
            closeDialog(id)
            void Promise.resolve(options.onConfirm())
          },
        },
      ]
      showDialog({
        id,
        title: options.title,
        content: options.content ?? React.createElement("p", null, "Are you sure?"),
        buttons,
      })
    },
    [showDialog, closeDialog],
  )

  return {
    showDialog: show,
    closeDialog: close,
    closeAllDialogs,
    showConfirmation,
  }
}
