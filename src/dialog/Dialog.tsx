import { useEffect, useRef } from "react"
import { Icons } from "../components/Icon"
import "./Dialog.css"

export type DialogButton = {
  label: string
  onClick: () => void
  variant?: "primary" | "default" | "warning" | "tertiary"
}

export type DialogConfig = {
  id: string
  title?: string
  content: React.ReactNode
  dismissible?: boolean
  onClose?: () => void
  buttons?: DialogButton[]
  closeOnBackdropClick?: boolean
}

type DialogProps = {
  config: DialogConfig
  onClose: () => void
}

export const Dialog = ({ config, onClose }: DialogProps) => {
  const dialogRef = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && config.dismissible !== false) {
        onClose()
      }
    }

    document.addEventListener("keydown", handleEscape)
    return () => {
      document.removeEventListener("keydown", handleEscape)
    }
  }, [config.dismissible, onClose])

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (
      config.closeOnBackdropClick !== false &&
      config.dismissible !== false &&
      e.target === backdropRef.current
    ) {
      onClose()
    }
  }

  const handleCloseClick = () => {
    if (config.dismissible !== false) {
      onClose()
    }
  }

  return (
    <div
      ref={backdropRef}
      className="dialog-backdrop"
      onClick={handleBackdropClick}
    >
      <div ref={dialogRef} className="dialog-container">
        {(config.title || config.dismissible !== false) && (
          <div className="dialog-header">
            {config.title && <h3 className="dialog-title">{config.title}</h3>}
            {config.dismissible !== false && (
              <button
                className="dialog-close-button tertiary"
                onClick={handleCloseClick}
                aria-label="Close dialog"
              >
                <Icons.Close />
              </button>
            )}
          </div>
        )}
        <div className="dialog-content">{config.content}</div>
        {config.buttons && config.buttons.length > 0 && (
          <div className="dialog-footer">
            {config.buttons.map((button, index) => (
              <button
                key={index}
                className={`hug ${button.variant !== undefined ? button.variant : "tertiary"}`}
                onClick={button.onClick}
              >
                {button.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

