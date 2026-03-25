import { useCallback } from "react"
import { LuGlobe } from "react-icons/lu"
import { SiBandcamp, SiGithub, SiInstagram, SiSoundcloud } from "react-icons/si"
import { useDialog } from "./dialog/useDialog"

const SOCIAL_ICON_SIZE = "1.25rem"

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
          <p>Powered by</p>
          <ul>
            <li>
              <a
                href="https://developer.audiotool.com/"
                target="_blank"
                rel="noreferrer"
              >
                Audiotool SDK
              </a>
              : Enabling the connection between the chessboard and the Audiotool
              DAW
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
              <a href="https://chess-api.com/" target="_blank" rel="noreferrer">
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
          <br></br>
          <p>You can find, connect and show support for my work here:</p>
          <ul className="social-links">
            <li>
              <a
                href="https://www.instagram.com/kooscha.music"
                target="_blank"
                rel="noreferrer"
              >
                <SiInstagram size={SOCIAL_ICON_SIZE} className="icon" />
                Instagram
              </a>
            </li>
            <li>
              <a
                href="https://www.soundcloud.com/kooscha"
                target="_blank"
                rel="noreferrer"
              >
                <SiSoundcloud size={SOCIAL_ICON_SIZE} className="icon" />
                Soundcloud
              </a>
            </li>
            <li>
              <a
                href="https://kooscha.bandcamp.com"
                target="_blank"
                rel="noreferrer"
              >
                <SiBandcamp size={SOCIAL_ICON_SIZE} className="icon" />
                Bandcamp
              </a>
            </li>
            <li>
              <a
                href="https://www.audiotool.com/user/kepz/music"
                target="_blank"
                rel="noreferrer"
              >
                <LuGlobe size={SOCIAL_ICON_SIZE} className="icon" />
                Audiotool
              </a>
            </li>
            <li>
              <a
                href="https://github.com/kyrylo-polozyuk"
                target="_blank"
                rel="noreferrer"
              >
                <SiGithub size={SOCIAL_ICON_SIZE} className="icon" />
                GitHub
              </a>
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
