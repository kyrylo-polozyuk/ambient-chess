import type { ProjectListItemProps } from "../types/project-selector";
import { trimUsername } from "../utils/username";

export const ProjectListItem = ({
  project,
  onClick,
  disabled = false,
}: ProjectListItemProps) => {
  const collaboratorNames =
    project.userNames?.map(trimUsername).join(", ") ?? "";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="project-list-item secondary"
    >
      <span className="project-list-item-content">
        {project.displayName}
        {project.hasMultipleUsers && collaboratorNames && (
          <span className="project-list-item-collaborators">
            {" "}
            ({collaboratorNames})
          </span>
        )}
      </span>
      {project.hasMultipleUsers && (
        <span
          className="material-symbols project-list-item-icon"
          title={
            collaboratorNames
              ? `Multiple collaborators: ${collaboratorNames}`
              : "Multiple collaborators"
          }
        >
          group
        </span>
      )}
    </button>
  );
};
