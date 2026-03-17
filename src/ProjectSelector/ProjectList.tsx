import type { AudiotoolClient } from "@audiotool/nexus"
import { useCallback, useEffect, useState } from "react"
import { ProjectListItem } from "./ProjectListItem"

export type ProjectListItemType = {
  id: string
  displayName: string
  description: string
  userNames: string[]
}

type ProjectListProps = {
  client: AudiotoolClient | undefined
  onSelected: (projectId: string) => void
  disabled?: boolean
}

export const ProjectList = ({
  client,
  onSelected,
  disabled = false,
}: ProjectListProps) => {
  const [projects, setProjects] = useState<ProjectListItemType[]>([])
  const [nextPageToken, setNextPageToken] = useState<string>("")
  const [loading, setLoading] = useState(true)

  const fetchProjects = useCallback(
    async (pageToken: string = "") => {
      if (!client) return

      if (!pageToken) setLoading(true)
      try {
        const request = {
          pageSize: 10,
          pageToken: pageToken,
          orderBy: "project.update_time desc",
        }

        const response = await client.api.projectService.listProjects(request)

        if (response instanceof Error) {
          throw response
        }

        const projectList: ProjectListItemType[] = (
          response.projects || []
        ).map(
          (project: {
            name: string
            displayName?: string
            description?: string
            userNames?: string[]
          }) => {
            const projectId = project.name.replace("projects/", "")
            const userNames = project.userNames ?? []
            return {
              id: projectId,
              displayName: project.displayName || "Untitled Project",
              description: project.description || "",
              userNames,
            }
          },
        )

        setProjects((prev) =>
          pageToken ? [...prev, ...projectList] : projectList,
        )
        setNextPageToken(response.nextPageToken || "")
      } catch (e) {
        console.error("Failed to fetch projects:", e)
      } finally {
        if (!pageToken) setLoading(false)
      }
    },
    [client],
  )

  useEffect(() => {
    if (client) {
      void fetchProjects()
    }
  }, [client, fetchProjects])

  const loadMore = () => {
    if (nextPageToken) {
      void fetchProjects(nextPageToken)
    }
  }

  return (
    <div className="column grow full-width small-gap overflow-hidden">
      {projects.length > 0 ? (
        <>
          <p>Existing Projects:</p>
          <div className="column grow scrollable full-width project-list-container">
            {projects.map((project) => (
              <ProjectListItem
                key={project.id}
                project={project}
                onClick={() => onSelected(project.id)}
                disabled={disabled}
              />
            ))}
            {nextPageToken && (
              <button
                className="hug secondary"
                onClick={loadMore}
                disabled={disabled}
              >
                Load More
              </button>
            )}
          </div>
        </>
      ) : loading ? (
        <p className="secondary-text">Loading…</p>
      ) : (
        <p className="secondary-text">No projects found</p>
      )}
    </div>
  )
}
