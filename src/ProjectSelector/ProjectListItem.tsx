import type { ProjectListItemType } from "./ProjectList"
import { Icons } from "../components/Icon"
import { trimUsername } from "../utils/username"
import "./ProjectListItem.css"

type ProjectListItemProps = {
  project: ProjectListItemType
  onClick: () => void
  disabled?: boolean
}

export const ProjectListItem = ({
  project,
  onClick,
  disabled = false,
}: ProjectListItemProps) => {
  const userNames = project.userNames ?? []
  const hasMultipleUsers = userNames.length > 1
  const collaboratorNames = userNames.map(trimUsername).join(", ")

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="project-list-item secondary"
    >
      <span className="project-list-item-content">
        {project.displayName}
        {hasMultipleUsers && collaboratorNames && (
          <span className="project-list-item-collaborators">
            {" "}
            ({collaboratorNames})
          </span>
        )}
      </span>
      {hasMultipleUsers && (
        <span
          className="project-list-item-icon"
          title={
            collaboratorNames
              ? `Multiple collaborators: ${collaboratorNames}`
              : "Multiple collaborators"
          }
        >
          <Icons.Users />
        </span>
      )}
    </button>
  )
}
