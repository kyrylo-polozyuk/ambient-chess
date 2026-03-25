export type ChessboardInstance = {
  setPosition: (fen: string, animated?: boolean) => Promise<void>
  destroy: () => void
}

export type ChessboardFactory = (
  id: string | HTMLElement,
  config: Record<string, unknown>,
) => ChessboardInstance

import type { NexusEntity } from "@audiotool/nexus/document"

import type { PieceSymbol } from "./chess"

export type GameStatusPhase = "ongoing" | "finished"

export type GameStatus = {
  phase: GameStatusPhase
  /** Side to move while ongoing; null when the game has ended. */
  turnToMove: "w" | "b" | null
  whiteLabel: string
  blackLabel: string
  /** White material minus black (pawn 1, knight/bishop 3, rook 5, queen 9). */
  materialLeadWhite: number
  /** Black piece types White has captured (in display order: Q,R,B,N,P). */
  capturedByWhite: PieceSymbol[]
  /** White piece types Black has captured. */
  capturedByBlack: PieceSymbol[]
  /** Terminal outcome text (checkmate, draw, …); empty while ongoing. */
  resultMessage: string
}

export type ChessboardProps = {
  tonematrix: NexusEntity<"tonematrix">
  autoPlay: boolean
  onStatusChange: (status: GameStatus) => void
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
