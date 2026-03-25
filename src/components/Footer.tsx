import { LuGlobe } from "react-icons/lu"
import { SiBandcamp, SiGithub, SiInstagram, SiSoundcloud } from "react-icons/si"
import { useShowAboutDialog } from "../about"
import "./Footer.css"

const SOCIAL_ICON_SIZE = "1.125rem"

export const Footer = () => {
  const showAboutDialog = useShowAboutDialog()

  return (
    <div className="full-width footer">
      <div className="footer-credit">
        Created by{" "}
        <a
          href="https://github.com/kyrylo-polozyuk"
          target="_blank"
          rel="noreferrer"
        >
          Kyrylo Polozyuk
        </a>
      </div>
      <div className="footer-social">
        <a
          href="https://www.instagram.com/kooscha.music"
          target="_blank"
          rel="noreferrer"
          title="Instagram"
        >
          <SiInstagram size={SOCIAL_ICON_SIZE} className="icon" />
        </a>
        <a
          href="https://www.soundcloud.com/kooscha"
          target="_blank"
          rel="noreferrer"
          title="Soundcloud"
        >
          <SiSoundcloud size={SOCIAL_ICON_SIZE} className="icon" />
        </a>
        <a
          href="https://kooscha.bandcamp.com"
          target="_blank"
          rel="noreferrer"
          title="Bandcamp"
        >
          <SiBandcamp size={SOCIAL_ICON_SIZE} className="icon" />
        </a>
        <a
          href="https://www.audiotool.com/user/kepz/music"
          target="_blank"
          rel="noreferrer"
          title="Audiotool"
        >
          <LuGlobe size={SOCIAL_ICON_SIZE} className="icon" />
        </a>
        <a
          href="https://github.com/kyrylo-polozyuk"
          target="_blank"
          rel="noreferrer"
          title="GitHub"
        >
          <SiGithub size={SOCIAL_ICON_SIZE} className="icon" />
        </a>
      </div>
      <button
        type="button"
        className="hug footer-link"
        onClick={() => showAboutDialog()}
      >
        About
      </button>
    </div>
  )
}
