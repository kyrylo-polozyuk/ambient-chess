/**
 * Adapter that wraps js-chess-engine and exposes a chess.js-compatible API
 * so the rest of the app (board display, tonematrix, manual moves) works unchanged.
 */

import type { BoardConfig, HistoryEntry } from "js-chess-engine";
import * as jsChessEngine from "js-chess-engine";
import type { PieceSymbol, Square, VerboseMove } from "../chess";

export type { PieceSymbol, Square, VerboseMove } from "../chess";

const { Game } = jsChessEngine;

// Re-export constants for chess-to-pattern (matches chess.js)
export const WHITE = "w";
export const BLACK = "b";
export const PAWN = "p";
export const KNIGHT = "n";
export const BISHOP = "b";
export const ROOK = "r";
export const QUEEN = "q";
export const KING = "k";

// js-chess-engine uses uppercase (K,Q,R,B,N,P) for white, lowercase for black
const FEN_TO_TYPE: Record<string, PieceSymbol> = {
  P: "p",
  N: "n",
  B: "b",
  R: "r",
  Q: "q",
  K: "k",
  p: "p",
  n: "n",
  b: "b",
  r: "r",
  q: "q",
  k: "k",
};

/** Convert js-chess-engine pieces map to 8x8 chess.js board format */
const piecesToBoard = (
  pieces: BoardConfig["pieces"],
): ({ type: PieceSymbol; color: "w" | "b" } | null)[][] => {
  const board: ({ type: PieceSymbol; color: "w" | "b" } | null)[][] =
    Array.from({ length: 8 }, () => Array(8).fill(null));

  if (!pieces) return board;

  for (const [square, piece] of Object.entries(pieces)) {
    const file = square.charCodeAt(0) - 65; // A=0, H=7
    const rank = parseInt(square[1], 10);
    const row = 8 - rank;
    const col = file;
    const color = piece === piece.toUpperCase() ? "w" : "b";
    const type = FEN_TO_TYPE[piece] ?? "p";
    board[row][col] = { type, color };
  }

  return board;
};

/** Get piece at square from board config (for verbose moves) */
const getPieceAt = (config: BoardConfig, square: string): PieceSymbol => {
  const sq = square.toUpperCase();
  const piece = config.pieces?.[sq];
  if (!piece) return "p";
  return (FEN_TO_TYPE[piece] ?? "p") as PieceSymbol;
};

export class Chess {
  private game: jsChessEngine.Game;

  constructor(fen?: string) {
    // js-chess-engine expects full FEN or undefined for new game; "start" is chessboard.js shorthand
    this.game = new Game(!fen || fen === "start" ? undefined : fen);
  }

  fen(): string {
    return this.game.exportFEN();
  }

  board(): ({ type: PieceSymbol; color: "w" | "b" } | null)[][] {
    const config = this.game.exportJson();
    return piecesToBoard(config.pieces);
  }

  turn(): "w" | "b" {
    const config = this.game.exportJson();
    return config.turn === "white" ? "w" : "b";
  }

  move(
    move: string | { from: string; to: string; promotion?: string },
  ): VerboseMove | null {
    const from = typeof move === "string" ? move.slice(0, 2) : move.from;
    const to = typeof move === "string" ? move.slice(2, 4) : move.to;
    const config = this.game.exportJson();
    const piece = getPieceAt(config, from);

    try {
      this.game.move(from, to);
      const capturedPiece = getCapturedPiece(config.pieces, to);
      return {
        from: from.toLowerCase(),
        to: to.toLowerCase(),
        piece,
        color: config.turn === "white" ? "w" : "b",
        captured: capturedPiece,
        flags: "",
      };
    } catch {
      return null;
    }
  }

  undo(): VerboseMove | null {
    return null; // js-chess-engine doesn't expose undo; we'd need to track history
  }

  isCheckmate(): boolean {
    return this.game.exportJson().checkMate ?? false;
  }

  isDraw(): boolean {
    const config = this.game.exportJson();
    return (
      (config.isFinished && !config.checkMate && !config.staleMate) ?? false
    );
  }

  isCheck(): boolean {
    return this.game.exportJson().check ?? false;
  }

  isThreefoldRepetition(): boolean {
    return false; // js-chess-engine doesn't expose this
  }

  isStalemate(): boolean {
    return this.game.exportJson().staleMate ?? false;
  }

  isGameOver(): boolean {
    return this.game.exportJson().isFinished ?? false;
  }

  moves(options?: {
    square?: Square;
    verbose?: boolean;
  }): string[] | VerboseMove[] {
    const movesMap = options?.square
      ? this.game.moves(options.square.toUpperCase())
      : this.game.moves();
    const color = this.turn();

    if (options?.verbose) {
      const verbose: VerboseMove[] = [];
      const config = this.game.exportJson();
      for (const [from, toSquares] of Object.entries(movesMap)) {
        const piece = getPieceAt(config, from);
        for (const to of toSquares) {
          verbose.push({
            from: from.toLowerCase(),
            to: to.toLowerCase(),
            piece,
            color,
            flags: "",
          });
        }
      }
      return verbose;
    }

    const result: string[] = [];
    for (const toSquares of Object.values(movesMap)) {
      result.push(...toSquares.map((t) => t.toLowerCase()));
    }
    return result;
  }

  /**
   * Get AI move using js-chess-engine. Returns move in chess.js format.
   * Does not apply the move; call move() to apply it.
   * Uses level 4 (Advanced) by default for stronger play.
   */
  getAiMove(level: number = 4): VerboseMove | null {
    const result = this.game.ai({ level, play: false, randomness: 30 });
    if (!result?.move) return null;

    const move = result.move as HistoryEntry;
    const [from, to] = Object.entries(move)[0] ?? [];
    if (!from || !to) return null;

    const config = this.game.exportJson();
    const piece = getPieceAt(config, from);

    return {
      from: from.toLowerCase(),
      to: to.toLowerCase(),
      piece,
      color: config.turn === "white" ? "w" : "b",
      flags: "",
    };
  }
}

const getCapturedPiece = (
  pieces: BoardConfig["pieces"] | undefined,
  square: string,
): PieceSymbol | undefined => {
  if (!pieces) return undefined;
  const sq =
    square.length === 2
      ? square[0].toUpperCase() + square[1]
      : square.toUpperCase();
  const piece = pieces[sq];
  if (!piece) return undefined;
  return FEN_TO_TYPE[piece] as PieceSymbol;
};
