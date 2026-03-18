export const AUDIOTOOL_STUDIO_BASE =
  "https://beta.audiotool.com/studio?project="

/** Opens an Audiotool URL in a smaller popup window instead of a new tab */
export const openAudiotoolInWindow: (url: string) => void = (url) => {
  const width = Math.round(window.innerWidth * 0.85)
  const height = Math.round(window.innerHeight * 0.85)
  const left = Math.round((window.innerWidth - width) / 2)
  const top = Math.round((window.innerHeight - height) / 2)
  const features = `width=${width},height=${height},left=${left},top=${top},noopener,noreferrer`
  window.open(url, "_blank", features)
}

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
