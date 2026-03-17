import type { NexusEntity } from "@audiotool/nexus/document"
import { useContext, useEffect, useState } from "react"
import { AudiotoolContext } from "./context"
import { Game } from "./Game"
import { setupProject } from "./nexus/projectSetup"

export const ProjectSyncedComponent = (props: {
  projectUrl: string
}) => {
  const context = useContext(AudiotoolContext)
  const [tonematrix, setTonematrix] = useState<
    NexusEntity<"tonematrix"> | undefined
  >(undefined)

  useEffect(() => {
    if (props.projectUrl && context.nexus) {
      setupProject(context.nexus).then(setTonematrix)
    }
  }, [context.nexus, props.projectUrl])

  if (!tonematrix) return null

  return (
    <div className="column grow full-width">
      <Game projectUrl={props.projectUrl} tonematrix={tonematrix} />
    </div>
  )
}
