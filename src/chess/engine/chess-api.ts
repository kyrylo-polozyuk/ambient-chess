/**
 * Chess-API.com (Stockfish) integration.
 * @see https://chess-api.com/
 */

import type { ChessApiResponse } from "../chess";
import type { PieceSymbol, VerboseMove } from "./chess-adapter";

const CHESS_API_URL = "https://chess-api.com/v1";

/**
 * Fetch best move from Stockfish via Chess-API.com.
 * Returns null on error or invalid response.
 */
export const getStockfishMove = async (
  fen: string,
): Promise<VerboseMove | null> => {
  try {
    const res = await fetch(CHESS_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fen, depth: 12 }),
    });

    if (!res.ok) return null;

    const data = (await res.json()) as ChessApiResponse;
    if (!data.move || !data.from || !data.to || !data.piece || !data.turn) {
      return null;
    }

    const piece = data.piece as PieceSymbol;
    const validPieces: PieceSymbol[] = ["p", "n", "b", "r", "q", "k"];
    if (!validPieces.includes(piece)) return null;

    const move: VerboseMove = {
      from: data.from,
      to: data.to,
      piece,
      color: data.turn,
      flags: data.flags ?? "",
    };

    if (data.promotion) {
      const promotion = data.promotion as PieceSymbol;
      if (validPieces.includes(promotion)) {
        move.promotion = promotion;
      }
    }

    if (data.captured) {
      const captured = data.captured as PieceSymbol;
      if (validPieces.includes(captured)) {
        move.captured = captured;
      }
    }

    return move;
  } catch {
    return null;
  }
};
