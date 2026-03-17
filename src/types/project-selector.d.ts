import type {
  AudiotoolClient,
  LoginStatus,
  SyncedDocument,
} from "@audiotool/nexus";

export type ProjectListItemType = {
  id: string;
  displayName: string;
  description: string;
  hasMultipleUsers?: boolean;
  userNames?: string[];
};

export type ProjectListProps = {
  client: AudiotoolClient | undefined;
  onSelected: (projectId: string) => void;
  disabled?: boolean;
};

export type ProjectListItemProps = {
  project: ProjectListItemType;
  onClick: () => void;
  disabled?: boolean;
};

export type ProjectSelectorProps = {
  loginStatus: LoginStatus | undefined;
  onProjectConnected: (
    client: AudiotoolClient,
    syncedDocument: SyncedDocument,
    projectUrl: string,
  ) => void;
  projectUrl?: string;
};
