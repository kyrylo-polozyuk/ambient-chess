export type ChessboardInstance = {
  setPosition: (fen: string, animated?: boolean) => Promise<void>
  destroy: () => void
}

export type ChessboardFactory = (
  id: string | HTMLElement,
  config: Record<string, unknown>,
) => ChessboardInstance

import type { NexusEntity } from "@audiotool/nexus/document"

export type ChessboardProps = {
  tonematrix: NexusEntity<"tonematrix">
  autoPlay: boolean
  onStatusChange: (status: string) => void
  computerPlaysAs?: "w" | "b"
  /** When set, user can only move pieces of this color (e.g. vsCollaborator mode). */
  userPlaysAs?: "w" | "b"
  /** Display names for white/black (e.g. in vsCollaborator mode). Format: "name (white)" / "name (black)". */
  whitePlayerName?: string
  blackPlayerName?: string
}

export type ChessboardRef = {
  restart: () => void
}
