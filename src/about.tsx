import { useCallback } from "react"
import { useDialog } from "./dialog/useDialog"

const ABOUT_DIALOG_ID = "about"

export const useShowAboutDialog = () => {
  const { showDialog, closeDialog } = useDialog()

  return useCallback(() => {
    showDialog({
      id: ABOUT_DIALOG_ID,
      title: "About Ambient Chess",
      content: (
        <div>
          <p>
            Created by{" "}
            <a
              href="https://www.audiotool.com/user/kepz"
              target="_blank"
              rel="noreferrer"
            >
              Kyrylo Polozyuk
            </a>
          </p>
          <p>
            Powered by:
          </p>
          <ul>
            <li>
              <a
                href="https://developer.audiotool.com/"
                target="_blank"
                rel="noreferrer"
              >
                Audiotool SDK
              </a>
              : Enabling the connection between the chessboard and the Audiotool DAW
            </li>
            <li>
              <a
                href="https://github.com/Clariity/react-chessboard"
                target="_blank"
                rel="noreferrer"
              >
                react-chessboard
              </a>
              : React UI library with a chessboard component
            </li>
            <li>
              <a
                href="https://chess-api.com/"
                target="_blank"
                rel="noreferrer"
              >
                chess-api.com
              </a>
              : Providing an API endpoint for Stockfish chess engine
            </li>
            <li>
              <a
                href="https://github.com/josefjadrny/js-chess-engine"
                target="_blank"
                rel="noreferrer"
              >
                js-chess-engine
              </a>
              : Fallback chess engine for when the API endpoint is not available
            </li>
          </ul>
        </div>
      ),
      buttons: [
        {
          label: "Close",
          variant: "default",
          onClick: () => closeDialog(ABOUT_DIALOG_ID),
        },
      ],
    })
  }, [showDialog, closeDialog])
}
