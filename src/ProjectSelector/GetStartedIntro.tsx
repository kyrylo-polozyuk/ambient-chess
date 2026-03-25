import { Icons } from "../components/Icon"

export const GetStartedIntro = () => (
  <>
    <p className="intro-tagline">
      <strong>Play chess → Generate ambient music.</strong> Each move you make
      shapes the soundscape in real time on Audiotool!
    </p>
    <blockquote>
      <ol>
        <li>
          Click below to open a project in Audiotool where the soundscape will
          be generated.
        </li>
        <li>
          Press <Icons.Play /> in Audiotool to start the music.
        </li>
        <li>
          Come back to this tab to play chess and hear your game come to life.
        </li>
      </ol>
    </blockquote>
  </>
)
