/**
 * Extracts project ID from projectUrl
 * Handles various URL formats:
 * - Query parameter: ?project=PROJECT_ID
 * - Path segments: /studio/PROJECT_ID or /project/PROJECT_ID
 * - Already just an ID
 */
export const extractProjectId = (projectUrl: string): string => {
  const trimmed = projectUrl.trim()

  // If it's already just an ID (no URL structure), return as-is
  if (
    !trimmed.includes("://") &&
    !trimmed.includes("/") &&
    !trimmed.includes("?")
  ) {
    return trimmed
  }

  try {
    const url = new URL(trimmed)
    // Check for project parameter in query string
    const projectParam = url.searchParams.get("project")
    if (projectParam) {
      return projectParam
    }

    // Check if the pathname contains a project ID (e.g., /studio/PROJECT_ID or /project/PROJECT_ID)
    const pathParts = url.pathname.split("/").filter(Boolean)
    const projectIndex = pathParts.findIndex(
      (part) => part === "studio" || part === "project",
    )
    if (projectIndex !== -1 && pathParts[projectIndex + 1]) {
      return pathParts[projectIndex + 1]
    }

    // If no project found in URL, return the last path segment as fallback
    if (pathParts.length > 0) {
      return pathParts[pathParts.length - 1]
    }
  } catch {
    // If URL parsing fails, assume it's already a project ID
    return trimmed
  }

  // Fallback: return trimmed input
  return trimmed
}
