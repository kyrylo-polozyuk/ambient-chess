import type { NexusEntity } from "@audiotool/nexus/document"
import { useContext, useEffect, useState } from "react"
import { AudiotoolContext } from "./context"
import { Game } from "./game/Game"
import { setupProject } from "./nexus/projectSetup"

export const ProjectSyncedComponent = (props: {
  projectUrl: string
  onClose: () => void | Promise<void>
}) => {
  const context = useContext(AudiotoolContext)
  const [tonematrix, setTonematrix] = useState<
    NexusEntity<"tonematrix"> | undefined
  >(undefined)
  const [fenTonematrix, setFenTonematrix] = useState<
    NexusEntity<"tonematrix"> | undefined
  >(undefined)

  useEffect(() => {
    if (props.projectUrl && context.nexus) {
      setupProject(context.nexus).then(({ tonematrix, fenTonematrix }) => {
        setTonematrix(tonematrix)
        setFenTonematrix(fenTonematrix)
      })
    }
  }, [context.nexus, props.projectUrl])

  if (!tonematrix || !fenTonematrix) return null

  return (
    <div className="column grow full-width">
      <Game
        projectUrl={props.projectUrl}
        tonematrix={tonematrix}
        fenTonematrix={fenTonematrix}
        onExit={props.onClose}
      />
    </div>
  )
}
