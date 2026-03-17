import type { SyncedDocument } from "@audiotool/nexus";
import "cm-chessboard/assets/chessboard.css";
import "cm-chessboard/assets/extensions/markers/markers.css";
import {
  BORDER_TYPE,
  Chessboard as CmChessboard,
  COLOR,
  FEN,
} from "cm-chessboard/src/Chessboard.js";
import { MARKER_TYPE, Markers } from "cm-chessboard/src/extensions/markers/Markers.js";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import {
  getStoredFen,
  updateTonematrixFromChessBoard,
} from "../../nexus/update-tonematrix-from-chess";
import { useBpm } from "../../nexus/use-bpm";
import { useCreateTonematrix } from "../../nexus/use-create-tonematrix";
import { useFenSyncFromNexus } from "../../nexus/use-fen-sync-from-nexus";
import type { ChessboardProps, ChessboardRef } from "../chessboard";
import { Chess, type Square } from "../engine/chess-adapter";
import { getStockfishMove } from "../engine/chess-api";

export const Chessboard = forwardRef<ChessboardRef, ChessboardProps>(
  (
    {
      autoPlay,
      computerPlaysAs,
      useStockfish = true,
      syncedDocument,
      userPlaysAs,
      whitePlayerName,
      blackPlayerName,
    },
    ref
  ) => {
    const boardRef = useRef<HTMLDivElement>(null);
    const boardInstanceRef = useRef<InstanceType<typeof CmChessboard> | null>(null);
    const gameRef = useRef(new Chess());
    const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
    const autoPlayRef = useRef(autoPlay);
    const hasLoadedFromStoredRef = useRef(false);
    const lastSyncedDocumentRef = useRef<SyncedDocument | undefined>(undefined);
    const [status, setStatus] = useState("White to move");
    const [ready, setReady] = useState(false);
    const [fenPatternsReady, setFenPatternsReady] = useState(false);

    const bpm = useBpm(syncedDocument);
    const tonematrix = useCreateTonematrix(syncedDocument);
    const moveDelayMs = 60000 / bpm;

    autoPlayRef.current = autoPlay;

    const syncBoardToTonematrix = useCallback(() => {
      if (syncedDocument) {
        return updateTonematrixFromChessBoard(
          syncedDocument,
          gameRef.current.board(),
          gameRef.current.fen(),
        );
      }
      return Promise.resolve();
    }, [syncedDocument]);

    const whiteLabel = whitePlayerName
      ? `${whitePlayerName} (white)`
      : "White";
    const blackLabel = blackPlayerName
      ? `${blackPlayerName} (black)`
      : "Black";

    const updateStatus = useCallback(() => {
      const game = gameRef.current;
      if (game.isCheckmate()) {
        setStatus(
          game.turn() === "w"
            ? `${blackLabel} wins by checkmate!`
            : `${whiteLabel} wins by checkmate!`,
        );
      } else if (game.isDraw()) {
        setStatus("Game drawn!");
      } else if (game.isStalemate()) {
        setStatus("Stalemate!");
      } else {
        setStatus(`${game.turn() === "w" ? whiteLabel : blackLabel} to move`);
      }
    }, [whiteLabel, blackLabel]);

    const handleFenChangeFromNexus = useCallback(
      (fen: string | null) => {
        if (!fen) return;
        if (gameRef.current.fen() === fen) return; // avoid redundant update when we're the source
        try {
          gameRef.current = new Chess(fen);
          boardInstanceRef.current?.setPosition(fen, true);
          updateStatus();
        } catch (e) {
          console.error("Invalid FEN from Nexus:", e);
        }
      },
      [updateStatus]
    );

    useFenSyncFromNexus(syncedDocument, handleFenChangeFromNexus, {
      patternsReady: fenPatternsReady,
    });

    const restart = useCallback(() => {
      gameRef.current = new Chess();
      boardInstanceRef.current?.setPosition(FEN.start);
      updateStatus();
      syncBoardToTonematrix();
    }, [updateStatus, syncBoardToTonematrix]);

    const makeAiMove = useCallback(
      async (delayMs: number) => {
        const game = gameRef.current;
        const board = boardInstanceRef.current;
        if (!board || game.isGameOver()) {
          updateStatus();
          return;
        }

        let bestMove: import("../engine/chess-adapter").VerboseMove | null;

        if (useStockfish) {
          bestMove = await getStockfishMove(game.fen());
          if (!bestMove) {
            bestMove = game.getAiMove(4);
          }
        } else {
          bestMove = game.getAiMove(4);
        }

        if (!bestMove) {
          updateStatus();
          return;
        }

        game.move(bestMove);

        void board.setPosition(game.fen(), true);
        updateStatus();
        syncBoardToTonematrix();

        if (autoPlayRef.current) {
          timerRef.current = setTimeout(() => void makeAiMove(delayMs), delayMs);
        }
      },
      [updateStatus, syncBoardToTonematrix, useStockfish]
    );

    useImperativeHandle(ref, () => ({ restart }), [restart]);

    useEffect(() => {
      if (!boardRef.current) return;

      const game = gameRef.current;
      const initialFen = game.fen();
      const board = new CmChessboard(boardRef.current, {
        position: initialFen,
        assetsUrl: `${import.meta.env.BASE_URL}chessboard-assets/`,
        orientation: userPlaysAs === "b" ? COLOR.black : COLOR.white,
        style: {
          borderType: BORDER_TYPE.none,
          pieces: { file: "pieces/standard.svg" },
          animationDuration: 300,
          cssClass: "ambient",
        },
        extensions: [{ class: Markers }],
      });
      boardInstanceRef.current = board;

      updateStatus();
      setReady(true);

      return () => {
        board.destroy();
        boardInstanceRef.current = null;
        clearTimeout(timerRef.current);
      };
    }, [updateStatus, userPlaysAs]);

    useEffect(() => {
      if (!ready || !syncedDocument || !tonematrix) return;

      if (lastSyncedDocumentRef.current !== syncedDocument) {
        lastSyncedDocumentRef.current = syncedDocument;
        hasLoadedFromStoredRef.current = false;
        setFenPatternsReady(false);
      }
      if (hasLoadedFromStoredRef.current) return;

      const initFromStored = async () => {
        const storedFen = await getStoredFen(syncedDocument);
        if (storedFen) {
          try {
            gameRef.current = new Chess(storedFen);
            boardInstanceRef.current?.setPosition(storedFen);
            updateStatus();
          } catch (e) {
            console.error("Invalid stored FEN:", e);
          }
        }
        hasLoadedFromStoredRef.current = true;
        await syncBoardToTonematrix();
        setFenPatternsReady(true);
      };

      void initFromStored();
    }, [ready, syncedDocument, tonematrix, syncBoardToTonematrix, updateStatus]);

    useEffect(() => {
      if (ready && autoPlay) {
        timerRef.current = setTimeout(
          () => void makeAiMove(moveDelayMs),
          moveDelayMs
        );
      } else {
        clearTimeout(timerRef.current);
      }
      return () => clearTimeout(timerRef.current);
    }, [ready, autoPlay, makeAiMove, moveDelayMs]);

    useEffect(() => {
      if (!ready || !computerPlaysAs || autoPlay) return;
      const game = gameRef.current;
      if (game.isGameOver()) return;
      if (game.turn() === computerPlaysAs) {
        const t = setTimeout(() => void makeAiMove(moveDelayMs), moveDelayMs);
        return () => clearTimeout(t);
      }
    }, [ready, autoPlay, computerPlaysAs, makeAiMove, moveDelayMs]);

    // When not autoplay: our own click handling (avoids cm-chessboard movePiece race)
    useEffect(() => {
      if (!ready || autoPlay || !boardRef.current || !boardInstanceRef.current) return;

      const container = boardRef.current;
      const board = boardInstanceRef.current;
      let selectedSquare: string | null = null;

      const clearMarkers = () => {
        board.removeLegalMovesMarkers();
        board.removeMarkers(MARKER_TYPE.square);
        selectedSquare = null;
      };

      const handleClick = (evt: MouseEvent) => {
        const game = gameRef.current;
        const squareEl = (evt.target as Element).closest?.(
          "[data-square]"
        ) as HTMLElement | null;
        if (!squareEl) return;

        const square = squareEl.getAttribute("data-square");
        if (!square || !/^[a-h][1-8]$/.test(square)) return;

        if (game.isGameOver()) return;
        if (computerPlaysAs && game.turn() === computerPlaysAs) return;
        if (userPlaysAs && game.turn() !== userPlaysAs) return;

        const position = game.board();
        const row = 8 - parseInt(square[1], 10);
        const col = square.charCodeAt(0) - 97;
        const piece = position[row]?.[col];

        // Click on legal move destination: make the move
        const legalMoves = game.moves({
          square: selectedSquare as Square,
          verbose: true,
        }) as { from: string; to: string }[];
        const moveToLegal = legalMoves.find((m) => m.to === square);
        if (moveToLegal && selectedSquare) {
          game.move({ from: selectedSquare, to: square });
          void board.setPosition(gameRef.current.fen(), true);
          updateStatus();
          syncBoardToTonematrix();
          clearMarkers();
          if (computerPlaysAs && game.turn() === computerPlaysAs) {
            setTimeout(() => void makeAiMove(moveDelayMs), moveDelayMs);
          }
          return;
        }

        clearMarkers();

        if (!piece) return;
        const pieceColor = piece.color === "w" ? "w" : "b";
        if (pieceColor !== game.turn()) return;
        if (userPlaysAs && pieceColor !== userPlaysAs) return;

        selectedSquare = square;
        board.addMarker(MARKER_TYPE.square, square);
        const moves = game.moves({
          square: square as Square,
          verbose: true,
        }) as { from: string; to: string }[];
        board.addLegalMovesMarkers(moves);
      };

      container.addEventListener("click", handleClick);
      return () => {
        container.removeEventListener("click", handleClick);
        // Only clear markers if board is still active (not destroyed by userPlaysAs change)
        if (boardInstanceRef.current === board) {
          try {
            clearMarkers();
          } catch (e) {
            console.error("Error clearing markers:", e);
          }
        }
      };
    }, [ready, autoPlay, computerPlaysAs, userPlaysAs, updateStatus, syncBoardToTonematrix, makeAiMove, moveDelayMs]);

    return (
      <>
        <div ref={boardRef} className="board-container" />
        <div className="game-status">{status}</div>
      </>
    );
  }
);
