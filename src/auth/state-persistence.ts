/**
 * Extracts project ID from projectUrl
 * Handles various URL formats:
 * - Query parameter: ?project=PROJECT_ID
 * - Path segments: /studio/PROJECT_ID or /project/PROJECT_ID
 * - Already just an ID
 */
export const extractProjectId = (projectUrl: string): string => {
  const trimmed = projectUrl.trim();

  if (
    !trimmed.includes("://") &&
    !trimmed.includes("/") &&
    !trimmed.includes("?")
  ) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    const projectParam = url.searchParams.get("project");
    if (projectParam) {
      return projectParam;
    }

    const pathParts = url.pathname.split("/").filter(Boolean);
    const projectIndex = pathParts.findIndex(
      (part) => part === "studio" || part === "project"
    );
    if (projectIndex !== -1 && pathParts[projectIndex + 1]) {
      return pathParts[projectIndex + 1];
    }

    if (pathParts.length > 0) {
      return pathParts[pathParts.length - 1];
    }
  } catch {
    return trimmed;
  }

  return trimmed;
};
