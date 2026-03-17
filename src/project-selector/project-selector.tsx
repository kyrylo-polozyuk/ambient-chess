import { createAudiotoolClient, type AudiotoolClient } from "@audiotool/nexus";
import { useCallback, useEffect, useState } from "react";
import { extractProjectId } from "../auth/state-persistence";
import { setupNewProject } from "../nexus/new-project-setup";
import type { ProjectSelectorProps } from "../types/project-selector";
import { ProjectList } from "./project-list";
import "./project-selector.css";

export const ProjectSelector = ({
  loginStatus,
  onProjectConnected,
  onProjectUrlChange,
  projectUrl,
}: ProjectSelectorProps) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [client, setClient] = useState<AudiotoolClient | undefined>(undefined);
  const [showProjectList, setShowProjectList] = useState<boolean>(false);

  const connectToProject = useCallback(
    async (urlToUse: string, isNewProject = false) => {
      if (!urlToUse || urlToUse.trim().length === 0) {
        setError("Project URL is required");
        return;
      }
      const currentUrl = urlToUse;

      if (!client) {
        setError("Client not initialized");
        return;
      }

      setLoading(true);
      setError(undefined);

      const projectId = extractProjectId(currentUrl);

      const params = new URLSearchParams(window.location.search);
      params.set("projectUrl", currentUrl.trim());
      window.history.replaceState(
        {},
        "",
        `${window.location.pathname}?${params.toString()}`
      );

      try {
        const syncedDocument = await client.createSyncedDocument({
          project: projectId,
        });

        await syncedDocument.start();

        if (isNewProject) {
          await setupNewProject(syncedDocument);
        }

        onProjectConnected(client, syncedDocument, currentUrl.trim());
        setLoading(false);
      } catch (e) {
        setLoading(false);
        if (typeof e === "string") {
          setError(e);
        } else if (e instanceof Error) {
          setError(e.message);
        }
      }
    },
    [client, onProjectConnected]
  );

  useEffect(() => {
    if (!loginStatus || loginStatus.loggedIn === false) {
      return;
    }

    const initializeClient = async () => {
      try {
        const audiotoolClient = await createAudiotoolClient({
          authorization: loginStatus,
        });
        setClient(audiotoolClient);
      } catch (e) {
        if (typeof e === "string") {
          setError(e);
        } else if (e instanceof Error) {
          setError(e.message);
        }
      }
    };

    void initializeClient();
  }, [loginStatus]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlParam = params.get("projectUrl");
    if (urlParam === projectUrl && client !== undefined && urlParam) {
      void connectToProject(urlParam);
    }
  }, [client, projectUrl, connectToProject]);

  const createNewProject = async () => {
    setLoading(true);
    setError(undefined);

    const now = new Date();
    const dd = String(now.getDate()).padStart(2, "0");
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const yyyy = now.getFullYear();
    const hh = String(now.getHours()).padStart(2, "0");
    const min = String(now.getMinutes()).padStart(2, "0");
    const displayName = `Ambient Chess ${dd}/${mm}/${yyyy} ${hh}:${min}`;

    const response = await client?.api.projectService.createProject({
      project: {
        displayName,
      },
    });

    if (response instanceof Error) {
      setError(response.message);
      setLoading(false);
      return;
    }

    if (response?.project === undefined) {
      setLoading(false);
      return;
    }

    const projectId = response.project.name.replace("projects/", "");
    const newProjectUrl = `https://beta.audiotool.com/studio?project=${projectId}`;
    window.open(
      `https://beta.audiotool.com/studio?project=${projectId}`,
      "_blank"
    );
    void connectToProject(newProjectUrl, true);
  };

  const handleProjectSelected = (projectId: string) => {
    const url = `https://beta.audiotool.com/studio?project=${projectId}`;
    window.open(url, "_blank");
    void connectToProject(url);
  };

  return (
    <div className="column grow center project-selector-container">
      <h2>Connect to a Project</h2>
      <blockquote className="project-selector-intro">
        To use this app, you need to connect it to an Audiotool project. An
        empty project is recommended for the best experience.

        Once connected, you can start playing chess and the app will automatically update the tonematrix based on the chess game.
        Press <span className="material-symbols">play_arrow</span> in Audiotool App to start the music.
      </blockquote>

      <div className="column grow full-width">
        <div className="column full-width small-gap">
          <button
            className={`primary ${loading ? "loading" : ""}`}
            onClick={() => {
              void createNewProject();
            }}
            disabled={loading || !client}
          >
            <span className="material-symbols">
              {loading ? "progress_activity" : "add"}
            </span>
            {loading ? "Connecting" : "New Project"}
          </button>
          {!showProjectList && (
            <button
              className="secondary"
              onClick={() => setShowProjectList(true)}
              disabled={loading || !client}
            >
              <span className="material-symbols">arrow_forward</span>
              Existing project
            </button>
          )}
        </div>

        {client && showProjectList && !loading && (
          <ProjectList
            client={client}
            onSelected={handleProjectSelected}
            disabled={loading}
          />
        )}
      </div>

      {error && <p className="error">{error}</p>}
    </div>
  );
};
